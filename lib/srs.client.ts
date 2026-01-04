import { FlashcardData, StudyGrade } from "./types";
import { supabase } from "./supabase.client";

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

export const calculateNextReview = async (
  card: FlashcardData,
  grade: StudyGrade
) => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/srs/calculate", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ card, grade }),
  });

  if (!res.ok) throw new Error(await res.text());
  const result = await res.json();

  // Persist the updated card if server returned id/fields
  if (result && result.id) {
    try {
      await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(result),
      });
    } catch (e) {
      // ignore write failures (best-effort)
      console.error("Failed to persist card update", e);
    }
  }

  return result;
};

export type SimulationResult = {
  days: number;
  label: string;
  stability?: number;
  difficulty?: number;
};

export const simulateNextReviews = async (card: FlashcardData) => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/srs/simulate", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ card }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Record<StudyGrade, SimulationResult>>;
};
