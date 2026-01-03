export interface SubtopicSuggestion {
  title: string;
  description: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface GradingResult {
  score: number;
  feedback: string;
}

import { supabase } from "./supabase.client";

// Client wrappers that call server API routes. Signatures kept compatible with previous code.
async function parseJsonOrText(res: Response) {
  const text = await res.text();
  // If response has JSON, try parse; otherwise return text for error messages
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.error || text || "AI error");
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || "AI error");
    throw new Error("Invalid JSON response from server");
  }
}

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

export const generateCurriculum = async (
  topic: string
): Promise<SubtopicSuggestion[]> => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/gemini/curriculum", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ topic }),
  });
  const data = await parseJsonOrText(res);
  return data.subtopics;
};

export const generateDeckFromTopic = async (
  subtopic: string,
  parentTopic: string
): Promise<{
  title: string;
  cards: Array<{ front: string; back: string }>;
}> => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/gemini/deck", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ subtopic, parentTopic }),
  });
  const data = await parseJsonOrText(res);
  return data;
};

export const askCardClarification = async (
  question: string,
  cardFront: string,
  cardBack: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/gemini/clarify", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ question, cardFront, cardBack, history }),
  });
  const data = await parseJsonOrText(res);
  return data.answer;
};

export const evaluateAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<GradingResult> => {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader,
  };
  const res = await fetch("/api/gemini/evaluate", {
    method: "POST",
    headers: headers as HeadersInit,
    body: JSON.stringify({ question, correctAnswer, userAnswer }),
  });
  const data = await parseJsonOrText(res);
  return data;
};
