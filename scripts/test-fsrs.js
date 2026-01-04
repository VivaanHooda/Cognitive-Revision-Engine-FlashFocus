// JS test for FSRS (uses ts-node to load TypeScript module)
require("ts-node").register();
const assert = require("assert");
const mod = require("../lib/srs.server");
const { calculateNextReview, predictInterval } = mod;

function assertEqual(name, actual, expected) {
  assert.strictEqual(
    actual,
    expected,
    `${name} - expected ${expected} but got ${actual}`
  );
}

function assertTrue(name, cond) {
  assert.ok(cond, `${name} - assertion failed`);
}

(async () => {
  const FAKE_NOW = Date.parse("2026-01-04T12:00:00Z");
  const originalNow = Date.now;
  Date.now = () => FAKE_NOW;

  try {
    console.log("Running FSRS JS tests...");

    // Test 1: New card graded "good"
    const card1 = { id: "c1", front: "Q1", back: "A1" };
    const res1 = calculateNextReview(card1, "good");
    assertEqual("Test1: interval === 1", res1.interval, 1);
    assertEqual("Test1: status === review", res1.status, "review");
    assertTrue(
      "Test1: stability is number",
      typeof res1.stability === "number"
    );
    assertEqual("Test1: reviewCount === 1", res1.reviewCount, 1);
    assertEqual(
      "Test1: lastReviewed === FAKE_NOW",
      res1.lastReviewed,
      FAKE_NOW
    );

    // Test 2: New card graded "again"
    const res2 = calculateNextReview(card1, "again");
    assertEqual("Test2: interval === 0", res2.interval, 0);
    assertEqual("Test2: status === learning", res2.status, "learning");

    // Test 3: Chained updates increment reviewCount and update lastReviewed
    const first = calculateNextReview(card1, "good");
    const updatedCard = { ...card1, ...first };
    const second = calculateNextReview(updatedCard, "good");
    assertEqual("Test3: reviewCount increments", second.reviewCount, 2);
    assertEqual("Test3: lastReviewed updated", second.lastReviewed, FAKE_NOW);

    // Test 4: Interval ordering for grades (hard < good < easy)
    const card2 = {
      id: "c2",
      front: "Q2",
      back: "A2",
      stability: 2.5,
      difficulty: 5,
      lastReviewed: FAKE_NOW - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      reviewCount: 3,
    };

    const TARGET = {
      again: 0.5,
      hard: 0.95,
      good: 0.9,
      easy: 0.85,
    };

    const rHard = calculateNextReview(card2, "hard");
    const rGood = calculateNextReview(card2, "good");
    const rEasy = calculateNextReview(card2, "easy");

    const daysHard = rHard.stability
      ? predictInterval(rHard.stability, TARGET.hard)
      : 0;
    const daysGood = rGood.stability
      ? predictInterval(rGood.stability, TARGET.good)
      : 0;
    const daysEasy = rEasy.stability
      ? predictInterval(rEasy.stability, TARGET.easy)
      : 0;

    assertTrue("Test4: hard < good", daysHard < daysGood);
    assertTrue("Test4: good < easy", daysGood < daysEasy);

    // Simulation: grade a batch of fake cards over time and print intervals
    const DAY_MS = 24 * 60 * 60 * 1000;
    function simulateBatch(cards, gradeSeqPerCard) {
      console.log("SIMULATION: Grading batch of cards and logging outcomes:");
      for (const card of cards) {
        let now = Date.now();
        let work = { ...card };
        for (const grade of gradeSeqPerCard) {
          // Set Date.now to current simulated time
          Date.now = () => now;
          const res = calculateNextReview(work, grade);
          const intervalDays =
            typeof res.interval === "number" ? res.interval : null;
          const dueIso = res.dueDate
            ? new Date(res.dueDate).toISOString()
            : "N/A";
          console.log(
            `[SIM] card=${
              card.id
            } grade=${grade} -> interval=${intervalDays}d status=${
              res.status
            } due=${dueIso} stability=${
              typeof res.stability === "number"
                ? res.stability.toFixed(2)
                : "N/A"
            } difficulty=${
              typeof res.difficulty === "number"
                ? res.difficulty.toFixed(2)
                : "N/A"
            } reviewCount=${res.reviewCount}`
          );
          // Update work card
          work = { ...work, ...res };
          // Advance time to due date or by interval days (use minimum 1 day for non-learning)
          if (res.dueDate) now = res.dueDate;
          else if (intervalDays !== null)
            now += Math.max(1, intervalDays) * DAY_MS;
          else now += 60_000;
        }
      }
      // Restore Date.now to FAKE_NOW for consistent exit behavior
      Date.now = () => FAKE_NOW;
    }

    // Create some fake cards and run the simulation
    const fakeCards = Array.from({ length: 4 }).map((_, i) => ({
      id: `sim${i + 1}`,
      front: `Q${i + 1}`,
      back: `A${i + 1}`,
    }));

    const gradeSequence = ["hard", "hard", "again", "again"];
    simulateBatch(fakeCards, gradeSequence);

    console.log("All FSRS JS tests passed ✅");
    process.exit(0);
  } catch (err) {
    console.error("FSRS JS tests failed ❌");
    console.error(err);
    process.exit(1);
  } finally {
    Date.now = originalNow;
  }
})();
