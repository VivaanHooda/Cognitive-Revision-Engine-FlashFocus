// ─────────────────────────────────────────────────────────────
// Pretty simulation: single card
// ─────────────────────────────────────────────────────────────

require("ts-node").register();
const assert = require("assert");
const mod = require("../lib/srs.server");
const { calculateNextReview, predictInterval } = mod;

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(str, len) {
  return String(str).padEnd(len);
}

function fmt(num, digits = 2) {
  return typeof num === "number" ? num.toFixed(digits) : "—";
}

function simulateSingleCard(card, gradeSeq) {
  console.log("\n📊 FSRS SIMULATION (Single Card)");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(
    pad("Grade", 8),
    pad("Interval(d)", 12),
    pad("Status", 10),
    pad("Due Date (UTC)", 22),
    pad("Stability", 10),
    // pad("Difficulty", 12),
    pad("Reviews", 8)
  );
  console.log("─────────────────────────────────────────────────────────────");

  let now = Date.now();
  let work = { ...card };

  for (const grade of gradeSeq) {
    Date.now = () => now;

    const res = calculateNextReview(work, grade);

    const intervalDays =
      typeof res.interval === "number" ? res.interval : "—";

    const dueStr = res.dueDate
      ? new Date(res.dueDate).toISOString().slice(0, 19) + "Z"
      : "—";

    console.log(
      pad(grade, 8),
      pad(intervalDays, 12),
      pad(res.status, 10),
      pad(dueStr, 22),
      pad(fmt(res.stability), 10),
    //   pad(fmt(res.difficulty), 12),
      pad(res.reviewCount, 8)
    );

    work = { ...work, ...res };

    if (res.dueDate) now = res.dueDate;
    else if (typeof intervalDays === "number")
      now += Math.max(1, intervalDays) * DAY_MS;
    else now += 60_000;
  }

  console.log("─────────────────────────────────────────────────────────────\n");
  Date.now = () => FAKE_NOW;
}

// Run simulation
const simCard = {
  id: "sim1",
  front: "What is FSRS?",
  back: "A spaced repetition scheduling algorithm",
};

const gradeSequence = ["easy", "easy", "easy", "again", "again", "hard", "good"
];
simulateSingleCard(simCard, gradeSequence);
