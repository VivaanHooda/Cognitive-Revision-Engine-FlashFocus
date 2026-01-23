import torch
import torch.nn as nn

# =========================
# FSRS PARAMETERS
# =========================

class FSRSParameters(nn.Module):
    def __init__(self):
        super().__init__()

        # Core FSRS weights (trainable)
        self.w0 = nn.Parameter(torch.tensor(0.4))   # difficulty feedback
        self.w1 = nn.Parameter(torch.tensor(0.6))   # mean reversion / failure scale
        self.w2 = nn.Parameter(torch.tensor(0.9))   # difficulty exponent
        self.w3 = nn.Parameter(torch.tensor(0.2))   # retrievability exponent
        self.w4 = nn.Parameter(torch.tensor(0.8))   # success growth bias
        self.w5 = nn.Parameter(torch.tensor(0.1))   # stability exponent
        self.w6 = nn.Parameter(torch.tensor(1.4))   # forgetting sensitivity
        self.w7 = nn.Parameter(torch.tensor(0.2))

        # Initial stability per first rating
        self.init_s_again = nn.Parameter(torch.tensor(0.5))
        self.init_s_hard  = nn.Parameter(torch.tensor(1.0))
        self.init_s_good  = nn.Parameter(torch.tensor(2.5))
        self.init_s_easy  = nn.Parameter(torch.tensor(4.0))


# =========================
# CONSTANTS
# =========================

DECAY = -0.5
EPS = 1e-6
MAX_STABILITY = 200
FAILURE_R_PENALTY = 0.6


# =========================
# FSRS CORE FUNCTIONS
# =========================
'''
def retrievability(elapsed_days, stability):
    """
    Exponential forgetting curve
    R = exp(DECAY * t / S)
    """
    return torch.exp(
        DECAY * elapsed_days / torch.clamp(stability, min=EPS)
    )
'''
def retrievability(elapsed_days, stability, failed=False):
    R = torch.exp(-elapsed_days / torch.clamp(stability, min=EPS))

    if failed:
        R = R * FAILURE_R_PENALTY

    return torch.clamp(R, min=EPS, max=1.0)


def initial_stability(grade, p):
    return torch.where(
        grade == 1, p.init_s_again,
        torch.where(
            grade == 2, p.init_s_hard,
            torch.where(
                grade == 3, p.init_s_good,
                p.init_s_easy
            )
        )
    )


def update_difficulty(D, grade, p):
    """
    FSRS-style difficulty update with mean reversion
    """
    delta = p.w0 * (3.0 - grade)        # grade feedback
    mean_reversion = p.w1 * (5.0 - D)   # pull toward 5
    D_new = D + delta + mean_reversion
    return torch.clamp(D_new, 1.0, 10.0)

'''
def stability_fail(S, D, R, p):
    """
    Failure always reduces stability
    No success growth allowed

    S_new = S * p.w1 * (D ** p.w2) * (R ** p.w3)
    return torch.clamp(S_new, min=EPS, max=S)
    """
    S_new = S * p.w1 * (D ** -p.w2) * (torch.exp(p.w3 * (1 - R)))
    return torch.clamp(S_new, min=0.1, max=S * 0.8)
'''
def stability_fail(S, D, R, p):
    """
    Failure reduces stability proportionally
    Stronger reduction when retrievability was high
    Difficulty does NOT exponentially crush S
    """

    # Base decay factor (learned)
    decay = torch.exp(p.w1)

    # Forgetting penalty increases when R was high
    retrievability_penalty = torch.exp(p.w2 * (R - 1))

    S_new = S * decay * retrievability_penalty

    return torch.clamp(
        S_new,
        min=0.3 * S,   # 🔑 no collapse
        max=0.9 * S
    )

'''
def stability_success(S, D, R, p):
    """
    Success-only multiplicative growth
    """
    growth = (
        torch.exp(p.w4)
        * (11.0 - D)
        * (S ** p.w5)
        * (torch.exp((1.0 - R) * p.w6) - 1.0)
    )
    growth *= torch.tanh(S / 10)

    return torch.clamp(
        S * (1.0 + growth),
        min=EPS,
        max=MAX_STABILITY
    )
'''
def stability_success(S, D, R, p):
    growth = (
        torch.exp(p.w4)
        * (11 - D)
        * (S ** p.w5)
        * (torch.exp((1 - R) * p.w6) - 1)
    )

    # Soft saturation: growth slows as S increases
    saturation = 1.0 / (1.0 + S / MAX_STABILITY)

    S_new = S * (1 + growth * saturation)

    return torch.clamp(
        S_new,
        min=EPS,
        max=MAX_STABILITY
    )


# =========================
# SEQUENCE LOSS (FIXED)
# =========================

def fsrs_sequence_loss(reviews, params):
    """
    reviews: [(elapsed_days, grade), ...]
    """
    loss = 0.0

    first_grade = torch.tensor(float(reviews[0][1]))
    S = initial_stability(first_grade, params)
    D = torch.tensor(5.0)

    for elapsed_days, grade in reviews[1:]:
        grade_t = torch.tensor(float(grade))

        # 1️⃣ Compute retrievability BEFORE updating memory
        R = retrievability(elapsed_days, S)

        # 2️⃣ Soft recall targets (FSRS-style)
        if grade == 1:
            y = torch.tensor(0.0)
        elif grade == 2:
            y = torch.tensor(0.7)
        elif grade == 3:
            y = torch.tensor(0.9)
        else:
            y = torch.tensor(0.97)

        loss += -(y * torch.log(R + EPS) + (1 - y) * torch.log(1 - R + EPS))

        # 3️⃣ Update difficulty
        D = update_difficulty(D, grade_t, params)

        # 4️⃣ Update stability
        if grade == 1:
            S = stability_fail(S, D, R, params)
            elapsed_days = 0.0   #  RESET CLOCK ON FAILURE
        else:
            S = stability_success(S, D, R, params)

    return loss / len(reviews)


# =========================
# BATCH LOSS
# =========================

def fsrs_batch_loss(batch_sequences, params):
    return sum(
        fsrs_sequence_loss(seq, params) for seq in batch_sequences
    ) / len(batch_sequences)


# =========================
# TRAINING LOOP
# =========================

def train_fsrs(
    sequences,
    epochs=50,
    lr=0.01,
    batch_size=32,
    save_path="fsrs_weights.pt"
):
    params = FSRSParameters()
    optimizer = torch.optim.Adam(params.parameters(), lr=lr)

    n = len(sequences)

    for epoch in range(epochs):
        total_loss = 0.0
        perm = torch.randperm(n)

        for i in range(0, n, batch_size):
            idx = perm[i:i + batch_size]
            batch = [sequences[j] for j in idx]

            optimizer.zero_grad()
            loss = fsrs_batch_loss(batch, params)
            loss.backward()

            torch.nn.utils.clip_grad_norm_(params.parameters(), 5.0)
            optimizer.step()

            total_loss += loss.item()

        print(f"Epoch {epoch + 1}: Loss = {total_loss:.4f}")

    torch.save(params.state_dict(), save_path)
    print(f"FSRS weights saved to {save_path}")
    return params


# =========================
# INTERVAL PREDICTION
# =========================

def predict_interval(stability, target_retrievability=0.9):
    """
    Solve R = exp(DECAY * t / S)
    """
    target_retrievability = torch.clamp(
        torch.tensor(target_retrievability),
        min=EPS,
        max=0.99
    )

    interval = stability * torch.log(target_retrievability) / DECAY
    return torch.clamp(interval, min=1.0)
