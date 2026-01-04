#to test behavioural correctness
import torch
from fsrs_trained import (
    train_fsrs,
    retrievability,
    initial_stability,
    FSRSParameters,
    stability_success,
    stability_fail,
    update_difficulty,
    predict_interval,
)

#verifies that training actually updates parameters
def test_weights_change():
    sequences = [
        [(0, 3), (1, 3), (3, 4)],
        [(0, 2), (2, 3), (5, 3)]
    ]

    params_before = FSRSParameters()
    initial_w4 = params_before.w4.item()

    trained_params = train_fsrs(sequences, epochs=5, save_path="tmp.pt")
    trained_w4 = trained_params.w4.item()

    print("w4 before:", initial_w4)
    print("w4 after:", trained_w4)

    assert abs(initial_w4 - trained_w4) > 1e-4

#tests if memory decays with time
def test_retrievability_decay():
    S = torch.tensor(3.0)

    #compute recall probability at increasing delays
    r1 = retrievability(torch.tensor(1.0), S)
    r5 = retrievability(torch.tensor(5.0), S)
    r20 = retrievability(torch.tensor(20.0), S)

    print("R(1d):", r1.item())
    print("R(5d):", r5.item())
    print("R(20d):", r20.item())

    assert r1 > r5 > r20

#tests if successful recall increases stability
def test_stability_increases_on_success():
    params = FSRSParameters()

    S = torch.tensor(2.0)
    D = torch.tensor(5.0)
    R = torch.tensor(0.7)

    S_new = stability_success(S, D, R, params)

    print("Old S:", S.item())
    print("New S:", S_new.item())

    assert S_new > S

#tests that failure makes future recall less likely
def test_failure_reduces_retrievability():
    params = FSRSParameters()

    S = torch.tensor(3.0)
    D = torch.tensor(5.0)
    elapsed = torch.tensor(1.0)

    R_before = retrievability(elapsed, S)
    S_fail = stability_fail(S, D, R_before, params)
    R_after = retrievability(elapsed, S_fail)

    print("R before fail:", R_before.item())
    print("R after fail:", R_after.item())

    assert S_fail <= S

#tests that difficulty behaves logically across grades
def test_difficulty_update():
    params = FSRSParameters()
    D = torch.tensor(5.0)

    D_again = update_difficulty(D, 1, params)  # Again
    D_hard  = update_difficulty(D, 2, params)  # Hard
    D_good  = update_difficulty(D, 3, params)  # Good
    D_easy  = update_difficulty(D, 4, params)  # Easy

    print("D again:", D_again.item())
    print("D hard :", D_hard.item())
    print("D good :", D_good.item())
    print("D easy :", D_easy.item())

    # FSRS-6 invariants
    assert 1.0 <= D_again <= 10.0
    assert 1.0 <= D_hard  <= 10.0
    assert 1.0 <= D_good  <= 10.0
    assert 1.0 <= D_easy  <= 10.0

    # Easy should not reduce difficulty
    assert D_easy >= D

    # Good should keep difficulty approximately the same
    assert torch.isclose(D_good, D, atol=1e-6)

#a sequence to check if S grows if good and easy is pressed
def test_realistic_review_sequence():
    params = FSRSParameters()

    reviews = [
        (0, 3),   # good
        (1, 3),   # good
        (3, 4),   # easy
        (10, 3),  # good
        (30, 3)   # good
    ]

    S = initial_stability(torch.tensor(3), params)
    D = torch.tensor(5.0)

    for elapsed, grade in reviews:
        R = retrievability(torch.tensor(elapsed), S)

        if grade == 1:
            S = stability_fail(S,D, R, params)
        else:
            S = stability_success(S, D, R, params)

        D = update_difficulty(D, grade, params)

        print(f"After {elapsed}d | Grade {grade} | S={S.item():.2f} | D={D.item():.2f}")

    assert S > 5.0

#checks if trained models can be saved and reused (persistence)
def test_weight_loading():
    params1 = train_fsrs(
        [[(0, 3), (1, 3)]],
        epochs=3,
        save_path="fsrs_weights.pt"
    )

    params2 = FSRSParameters()
    params2.load_state_dict(torch.load("fsrs_weights.pt"))

    assert torch.allclose(params1.w4, params2.w4)
    print("Weights loaded correctly")

#tests that more stable memories get longer intervals
def test_interval_increases_with_stability():
    S1 = torch.tensor(2.0)
    S2 = torch.tensor(5.0)

    i1 = predict_interval(S1)
    i2 = predict_interval(S2)

    print("Interval S=2:", i1.item())
    print("Interval S=5:", i2.item())

    assert i2 > i1

#stricter recall targets shorten intervals
def test_target_recall_effect():
    S = torch.tensor(5.0)

    i_high = predict_interval(S, target_retrievability=0.9)
    i_low  = predict_interval(S, target_retrievability=0.7)

    print("Interval R=0.9:", i_high.item())
    print("Interval R=0.7:", i_low.item())

    assert i_high < i_low

#tests one full loop
def test_full_scheduling():
    params = FSRSParameters()

    S = initial_stability(torch.tensor(3), params)
    D = torch.tensor(5.0)

    reviews = [
        (0, 3),
        (1, 3),
        (3, 4),
        (10, 3),
    ]

    for elapsed, grade in reviews:
        R = retrievability(torch.tensor(elapsed), S)

        if grade == 1:
            S = stability_fail(S, D, R, params)
        else:
            S = stability_success(S, D, R, params)

        D = update_difficulty(D, grade, params)

        interval = predict_interval(S)
        print(f"S={S.item():.2f}, next interval={interval.item():.1f} days")

    assert interval > 10

if __name__ == "__main__":
    test_weights_change()
    test_retrievability_decay()
    test_stability_increases_on_success()
    test_failure_reduces_retrievability()
    test_difficulty_update()
    test_realistic_review_sequence()
    test_weight_loading()
    test_interval_increases_with_stability()
    test_target_recall_effect()
    test_full_scheduling()