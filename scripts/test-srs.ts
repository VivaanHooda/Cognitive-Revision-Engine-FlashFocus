import { calculateNextReview } from "../lib/srs.server";

function assertEqual(name: string, actual: any, expected: any) {
  if (actual !== expected) {
    throw new Error(`${name} - expected ${expected} but got ${actual}`);
  }
}

function assertTrue(name: string, cond: boolean) {
  if (!cond) throw new Error(`${name} - assertion failed`);
}

(async () => {
  const FAKE_NOW = Date.parse("2026-01-04T12:00:00Z");
  const originalNow = Date.now;
  // Make Date.now() deterministic for the test
  (Date as any).now = () => FAKE_NOW;

  try {
    console.log("Running SRS tests...");

    // Test 1: New card graded "good"
    const card1: any = { id: "c1", front: "Q1", back: "A1" };
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
    const card2: any = {
      id: "c2",
      front: "Q2",
      back: "A2",
      stability: 2.5,
      difficulty: 5,
      lastReviewed: FAKE_NOW - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      reviewCount: 3,
    };

    const { predictInterval } = await import("../lib/srs.server");
    // Higher target means schedule sooner; hard should have the highest target so intervals follow hard < good < easy
    const TARGET: Record<any, number> = {
      again: 0.5,
      hard: 0.95,
      good: 0.9,
      easy: 0.85,
    };

    const rHard = calculateNextReview(card2, "hard");
    const rGood = calculateNextReview(card2, "good");
    const rEasy = calculateNextReview(card2, "easy");

    const daysHard = rHard.stability
      ? predictInterval(rHard.stability as number, TARGET.hard)
      : 0;
    const daysGood = rGood.stability
      ? predictInterval(rGood.stability as number, TARGET.good)
      : 0;
    const daysEasy = rEasy.stability
      ? predictInterval(rEasy.stability as number, TARGET.easy)
      : 0;

    assertTrue("Test4: hard < good", daysHard < daysGood);
    assertTrue("Test4: good < easy", daysGood < daysEasy);

    console.log("All SRS tests passed ✅");
    process.exit(0);
  } catch (err) {
    console.error("SRS tests failed ❌");
    console.error(err);
    process.exit(1);
  } finally {
    (Date as any).now = originalNow;
  }
})();
