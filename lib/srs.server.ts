import { FlashcardData, StudyGrade } from "./types";

/**
 * FSRS port (TypeScript)
 * Ported from scripts/fsrs_trained.py
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DECAY = -0.5;
const EPS = 1e-6;
const MAX_STABILITY = 100.0;

const params = {
  w0: 0.4,
  w1: 0.6,
  w2: 0.9,
  w3: 0.2,
  w4: 1.2,
  w5: 0.1,
  w6: 1.4,
  init_s_again: 0.5,
  init_s_hard: 1.0,
  init_s_good: 2.5,
  init_s_easy: 4.0,
};

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

function retrievability(elapsedDays: number, stability: number) {
  return Math.exp((elapsedDays * DECAY) / Math.max(stability, EPS));
}

function initialStability(gradeNum: number) {
  if (gradeNum === 1) return params.init_s_again;
  if (gradeNum === 2) return params.init_s_hard;
  if (gradeNum === 3) return params.init_s_good;
  return params.init_s_easy;
}

function updateDifficulty(D: number, gradeNum: number) {
  // Easier grades should reduce difficulty; harder grades should increase it.
  const D_new = D + params.w0 * (3 - gradeNum) + params.w1 * (5 - D);
  return clamp(D_new, 1.0, 10.0);
}

function stabilityFail(S: number, D: number, R: number) {
  return clamp(
    S * params.w1 * Math.pow(D, params.w2) * Math.pow(R, params.w3),
    EPS,
    S
  );
}

function stabilitySuccess(S: number, D: number, R: number) {
  const growth =
    Math.exp(params.w4) *
    (11 - D) *
    Math.pow(S, params.w5) *
    (Math.exp((1 - R) * params.w6) - 1);
  return clamp(S * (1 + growth), EPS, MAX_STABILITY);
}

export function predictInterval(stability: number, targetRetrievability = 0.9) {
  const tr = clamp(targetRetrievability, EPS, 0.99);
  const interval = (stability * Math.log(tr)) / DECAY;
  return Math.max(1.0, interval);
}

function gradeToNum(grade: StudyGrade) {
  switch (grade) {
    case "again":
      return 1;
    case "hard":
      return 2;
    case "good":
      return 3;
    case "easy":
      return 4;
  }
}

export const calculateNextReview = (
  card: FlashcardData,
  grade: StudyGrade
): Partial<FlashcardData> => {
  const now = Date.now();
  const gradeNum = gradeToNum(grade);

  // Read existing values or defaults
  let S = typeof card.stability === "number" ? card.stability : undefined;
  let D = typeof card.difficulty === "number" ? card.difficulty : 5.0;
  let reviewCount = card.reviewCount ?? 0;

  // First review handling
  const isNew = S === undefined;

  if (isNew) {
    // initialize stability based on initial rating
    S = initialStability(gradeNum);

    // "Again" on a new card: learning, immediate retry
    if (grade === "again") {
      return {
        interval: 0,
        status: "learning",
        stability: S,
        difficulty: D,
        reviewCount: reviewCount + 1,
        lastReviewed: now,
        dueDate: now + 60_000, // 1 minute
      };
    }

    // For non-failure first review, predict first interval
    const intervalDays = Math.ceil(predictInterval(S));
    const status = intervalDays >= 21 ? "mastered" : "review";

    const dueDate = (() => {
      if (intervalDays < 1) return now + 60_000;
      const d = new Date(now);
      d.setDate(d.getDate() + intervalDays);
      d.setHours(4, 0, 0, 0);
      return d.getTime();
    })();

    return {
      interval: intervalDays,
      status,
      stability: S,
      difficulty: D,
      reviewCount: reviewCount + 1,
      lastReviewed: now,
      dueDate,
    };
  }

  // Existing card path
  const elapsedDays = card.lastReviewed
    ? Math.max(0, (now - card.lastReviewed) / DAY_MS)
    : 0;
  const R = retrievability(elapsedDays, S!);

  // Update difficulty
  const D_new = updateDifficulty(D, gradeNum);

  // Update stability
  let S_new: number;
  if (grade === "again") {
    S_new = stabilityFail(S!, D_new, R);
  } else {
    S_new = stabilitySuccess(S!, D_new, R);
  }

  // Determine interval
  const intervalDays =
    grade === "again" ? 0 : Math.ceil(predictInterval(S_new));

  // Determine status
  let status: FlashcardData["status"] = "review";
  if (grade === "again") status = "learning";
  else if (grade === "easy" && intervalDays >= 21) status = "mastered";

  const dueDate = (() => {
    if (intervalDays < 1) return now + 60_000;
    const d = new Date(now);
    d.setDate(d.getDate() + intervalDays);
    d.setHours(4, 0, 0, 0);
    return d.getTime();
  })();

  return {
    interval: intervalDays,
    status,
    stability: S_new,
    difficulty: D_new,
    reviewCount: reviewCount + 1,
    lastReviewed: now,
    dueDate,
  };
};
