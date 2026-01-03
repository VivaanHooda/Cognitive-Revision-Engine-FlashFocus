import { FlashcardData, StudyGrade } from "./types";

export const calculateNextReview = async (
  card: FlashcardData,
  grade: StudyGrade
) => {
  const res = await fetch("/api/srs/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card, grade }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const simulateNextReviews = async (card: FlashcardData) => {
  const res = await fetch("/api/srs/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Record<StudyGrade, string>>;
};
