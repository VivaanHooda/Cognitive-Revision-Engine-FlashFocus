import torch
import torch.nn as nn


# FSRS PARAMETERS
'''FSRS mmodels human memory using three variables
    S- stability, how long memory lasts
    D- Difficulty, how hard the item is
    R- Retrievability, probability of recall now(Derived)
    elapsed days gives R
    R+grade gives loss
    grade->update D
    (R,D,S)->update S
    S gives next interval
'''

#consists of parameters shared by all cards
class FSRSParameters(nn.Module):
    def __init__(self):
        super().__init__()

        # Core FSRS weights (trainable)
        self.w0 = nn.Parameter(torch.tensor(0.4))   # difficulty shift- controls how much user feedback changes difficulty
        self.w1 = nn.Parameter(torch.tensor(0.6))   # difficulty mean reversion / failure scale essential for stability prevents too easy/too hard forever
        self.w2 = nn.Parameter(torch.tensor(0.9))   # difficulty exponent, Penalizes hard cards more
        self.w3 = nn.Parameter(torch.tensor(0.2))   # retrievability exponent, Failure hurts more if recall probability was high
        self.w4 = nn.Parameter(torch.tensor(1.2))   # success growth bias
        self.w5 = nn.Parameter(torch.tensor(0.1))   # stability exponent, diminishing returns as S grows
        self.w6 = nn.Parameter(torch.tensor(1.4))   # forgetting sensitivity, extra rewards for recalling close to forgetting

        # Initial stability per first rating
        self.init_s_again = nn.Parameter(torch.tensor(0.5))
        self.init_s_hard  = nn.Parameter(torch.tensor(1.0))
        self.init_s_good  = nn.Parameter(torch.tensor(2.5))
        self.init_s_easy  = nn.Parameter(torch.tensor(4.0))



# CONSTANTS

DECAY = -0.5    #defines the forgetting speed, larger decay faster forgetting
EPS = 1e-6      #Numerical stability
MAX_STABILITY = 100.0       #Caps S to prevent runaway intervals



# FSRS CORE FUNCTIONS


def retrievability(elapsed_days, stability):
    """
    Exponential forgetting curve
    High S- slow decay
    Large elapsed days- lower R
    """
    return torch.exp((elapsed_days * DECAY) / torch.clamp(stability, min=EPS))


def initial_stability(grade, p):
    """
    Initial stability depends on first rating
    Initialize S from the grade
    Start D at neutral- 5
    """
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

'''mean reversion- This is a small, automatic adjustment that happens after each review to ensure the difficulty score doesn't drift too far into extreme high or low values permanently.
    If a card's difficulty is very high (you keep pressing "Again"), the mean reversion pulls it slightly back down toward the average, preventing it from getting stuck in tiny intervals forever.
    if a card's difficulty is very low (you keep pressing "Easy"), it's pulled slightly up, preventing it from getting intervals that are too large and leading to eventual forgetting
'''
def update_difficulty(D, grade, p):
    """
    FSRS-6 difficulty update with mean reversion
    term 1- if easy D decreases, again- D increases
    term2- mean reversion, pulls back difficulty back to 5 to prevent collapse
    """
    D_new = D + p.w0 * (grade - 3) + p.w1 * (5 - D)
    return torch.clamp(D_new, 1.0, 10.0) #difficulty is bounded


MAX_STABILITY = 100.0  # choose 60–365; 100 is a good default

def stability_fail(S, D, R, p):
    """
    Stability update after failure (FSRS-6 style)
    S is the past memory strength
    D^w2- Hard cards suffer more
    R^w3-Forgetting hurts more if recall was expected
    """
    return torch.clamp(
        S * p.w1 * (D ** p.w2) * (R ** p.w3),
        min=EPS,
        max=S,
    )


def stability_success(S, D, R, p):
    """
    Stability update after success (FSRS-6 style)
    (11-D)- easy cards grow more
    S^w5- diminishing retruns(memory saturation)
    exp((1-R)*w6)-1- recalling near forgetting gives max boost
    """
    growth = (
        torch.exp(p.w4)
        * (11 - D)
        * (S ** p.w5)
        * (torch.exp((1 - R) * p.w6) - 1)
    )
    return torch.clamp(
        S * (1 + growth),
        min=EPS,
        max=MAX_STABILITY
    )


# SEQUENCE LOSS

def fsrs_sequence_loss(reviews, params):
    """
    reviews: list of (elapsed_days, grade)
    grade: 1=Again, 2=Hard, 3=Good, 4=Easy
    """
    loss = 0.0

    # Initialize from FIRST review (not predicted)
    first_grade = torch.tensor(float(reviews[0][1]))
    S = initial_stability(first_grade, params)
    D = torch.tensor(5.0)

    # Predict from second review onward
    for elapsed_days, grade in reviews[1:]:
        grade_t = torch.tensor(float(grade))

        R = retrievability(elapsed_days, S)

        # Binary recall target
        y = torch.tensor(0.0 if grade == 1 else 1.0)

        # Log loss
        #this is binary cross entropy: predict recall probabilty and compare to actual recall
        loss += -(y * torch.log(R + EPS) + (1 - y) * torch.log(1 - R + EPS))

        # Update difficulty
        D = update_difficulty(D, grade_t, params)

        # Update stability
        if grade == 1:
            S = stability_fail(S, D, R, params)
        else:
            S = stability_success(S, D, R, params)
            interval = predict_interval(S)# not necessary
            print(f"Next review in {interval.item():.1f} days")

    # Normalize to avoid long-sequence dominating and bias towards heavy users
    return loss / len(reviews)

# TRAINING LOOP

import torch

def train_fsrs(
    sequences,
    epochs=50,
    lr=0.01,
    save_path="fsrs_weights.pt"
):
    params = FSRSParameters()
    optimizer = torch.optim.Adam(params.parameters(), lr=lr)

    for epoch in range(epochs):
        total_loss = 0.0

        for seq in sequences:
            optimizer.zero_grad()
            loss = fsrs_sequence_loss(seq, params)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch + 1}: Loss = {total_loss:.4f}")

    # SAVE TRAINED WEIGHTS
    torch.save(params.state_dict(), save_path)
    print(f"FSRS weights saved to {save_path}")

    return params

def predict_interval(stability, target_retrievability=0.9):
    """
    Predict next review interval (in days) using FSRS-6 logic
    """
    target_retrievability = torch.clamp(
        torch.tensor(target_retrievability),
        min=EPS,
        max=0.99
    )
    #inverse forgetting curve, we are solving the equation for t here using the R equation
    interval = stability * torch.log(target_retrievability) / DECAY
    return torch.clamp(interval, min=1.0)

