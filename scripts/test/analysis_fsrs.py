import torch
import matplotlib.pyplot as plt
import numpy as np
from fsrs_trained_batch import (
    FSRSParameters,
    retrievability,
    initial_stability,
    stability_success,
    stability_fail,
    update_difficulty,
    predict_interval
)

# ---------------------------------------------------------
# 1️⃣ Forgetting curve
# ---------------------------------------------------------
def plot_forgetting_curve():
    S = torch.tensor(5.0)
    days = torch.linspace(0, 40, 100)
    R = [retrievability(d, S).item() for d in days]

    plt.figure()
    plt.plot(days, R)
    plt.xlabel("Elapsed days")
    plt.ylabel("Retrievability (R)")
    plt.title("Forgetting Curve")
    plt.show()


# ---------------------------------------------------------
# 2️⃣ Stability growth across reviews
# ---------------------------------------------------------
def plot_stability_growth():
    params = FSRSParameters()

    reviews = [(0, 3), (1, 3), (3, 4), (10, 3), (30, 3)]

    S = initial_stability(torch.tensor(3), params)
    D = torch.tensor(5.0)

    S_values = [S.item()]

    for elapsed, grade in reviews[1:]:
        R = retrievability(torch.tensor(elapsed), S)

        if grade == 1:
            S = stability_fail(S, D, R, params)
        else:
            S = stability_success(S, D, R, params)

        D = update_difficulty(D, grade, params)
        S_values.append(S.item())

    plt.figure()
    plt.plot(range(len(S_values)), S_values, marker="o")
    plt.xlabel("Review number")
    plt.ylabel("Stability (S)")
    plt.title("Stability Growth")
    plt.show()


# ---------------------------------------------------------
# 3️⃣ Effect of failure
# ---------------------------------------------------------
def plot_failure_effect():
    params = FSRSParameters()

    S = torch.tensor(5.0)
    D = torch.tensor(5.0)

    elapsed = torch.tensor(3.0)
    R_before = retrievability(elapsed, S)
    S_after_fail = stability_fail(S, D, R_before, params)

    plt.figure()
    plt.bar(["Before failure", "After failure"], [S.item(), S_after_fail.item()])
    plt.ylabel("Stability (S)")
    plt.title("Stability After Failure (Should Decrease)")
    plt.show()


# ---------------------------------------------------------
# 4️⃣ Interval vs Stability
# ---------------------------------------------------------
def plot_interval_vs_stability():
    stabilities = torch.linspace(1, 100, 20)
    #intervals = [1 / retrievability(torch.tensor(1.0), S).item() for S in stabilities]
    intervals = [predict_interval(S, target_retrievability=0.9).item() for S in stabilities]

    plt.figure()
    plt.plot(stabilities, intervals)
    plt.xlabel("Stability (S)")
    plt.ylabel("Next interval (days)")
    plt.title("Interval vs Stability")
    plt.show()




def plot_unconnected_forgetting_curves(
    review_times=[0, 1, 3, 5, 7, 10],
    initial_stability=0.8,
    stability_growth=1.8,
    decay=-0.5,
    points_per_segment=100
):
    """
    Plots independent forgetting curves after each repetition.
    Curves are NOT connected.
    """

    plt.figure(figsize=(12, 7))

    S = initial_stability

    for i in range(len(review_times) - 1):
        t_start = review_times[i]
        t_end = review_times[i + 1]

        # Local time since review
        t = np.linspace(0, t_end - t_start, points_per_segment)
        R = np.exp(decay * t / S)

        t_global = t + t_start

        # Background faint curves (individual variability)
        for _ in range(12):
            plt.plot(
                t_global,
                np.exp(decay * t / (S * np.random.uniform(0.6, 1.4))),
                color="gray",
                alpha=0.06
            )

        # Main curve (no connection)
        plt.plot(
            t_global,
            R,
            color="black",
            linewidth=2
        )

        # Increase stability AFTER review
        S *= stability_growth

    plt.xlabel("Time (days)")
    plt.ylabel("Percent of information retained")
    plt.title("Rate of Forgetting with Study / Repetition")
    plt.ylim(0.4, 1.02)

    labels = [
        "1st Rep\nwithin 1 day",
        "2nd Rep\nwithin 3 days",
        "3rd Rep\nwithin 5 days",
        "4th Rep\nwithin 7 days",
        "5th Rep\nwithin 10 days",
    ]
    plt.xticks(review_times[:-1], labels)

    plt.grid(alpha=0.3)
    plt.show()

def plot_forgetting_curves_multiple_S():
    days = torch.linspace(0, 60, 200)
    stabilities = [2.0, 5.0, 15.0, 40.0]

    plt.figure()
    for S in stabilities:
        R = [retrievability(d, torch.tensor(S)).item() for d in days]
        plt.plot(days, R, label=f"S={S}")

    plt.xlabel("Elapsed days")
    plt.ylabel("Retrievability (R)")
    plt.title("Forgetting Curves for Different Stabilities")
    plt.legend()
    plt.show()



# ---------------------------------------------------------
# Run all analysis
# ---------------------------------------------------------
if __name__ == "__main__":
    plot_forgetting_curve()
    plot_stability_growth()
    plot_failure_effect()
    plot_interval_vs_stability()
    plot_unconnected_forgetting_curves()
    plot_forgetting_curves_multiple_S()

