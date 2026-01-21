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

import { createClient } from "./supabase.client";

// Client wrappers that call server API routes. Signatures kept compatible with previous code.
async function parseJsonOrText(res: Response) {
  const text = await res.text();

  // Helper to parse retryDelay strings like "8s" or ISO8601
  function parseRetryDelay(value: any): number | null {
    if (!value) return null;
    // e.g., "8s"
    if (typeof value === "string") {
      const m = value.match(/(\d+)(ms|s|m|h)?/);
      if (m) {
        const n = Number(m[1]);
        const unit = m[2] || "s";
        switch (unit) {
          case "ms":
            return n;
          case "s":
            return n * 1000;
          case "m":
            return n * 60 * 1000;
          case "h":
            return n * 3600 * 1000;
        }
      }
      // try parse as number
      const asNum = Number(value);
      if (!Number.isNaN(asNum)) return asNum * 1000;
    }
    // If object like { seconds: 8 }
    if (typeof value === "object" && value.seconds)
      return Number(value.seconds) * 1000;
    return null;
  }

  // Try parse JSON body
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // not JSON
  }

  // If ok, return parsed JSON or raw text
  if (res.ok) return data ?? text;

  // Not OK -> build a rich error
  let message = text || res.statusText || "AI error";
  let code: number | string = res.status;
  let retryAfterMs: number | null = null;

  if (data) {
    // The server may wrap the provider error. Try to extract nested error info
    const errObj =
      typeof data.error === "string"
        ? (() => {
            try {
              return JSON.parse(data.error);
            } catch {
              return data.error;
            }
          })()
        : data.error ?? data;

    if (errObj) {
      // common fields
      message = errObj.message || errObj.error?.message || message;
      code = errObj.code || errObj.status || code;

      // Look for retry info in details (Google style)
      const details = errObj.details || errObj.error?.details;
      if (Array.isArray(details)) {
        for (const d of details) {
          if (d?.["@type"]?.includes("RetryInfo") && d.retryDelay) {
            const parsed = parseRetryDelay(d.retryDelay);
            if (parsed) retryAfterMs = parsed;
          }
          if (d?.retryDelay) {
            const parsed = parseRetryDelay(d.retryDelay);
            if (parsed) retryAfterMs = parsed;
          }
        }
      }

      // Some providers put retry info in top-level fields
      if (!retryAfterMs && errObj.retryDelay)
        retryAfterMs = parseRetryDelay(errObj.retryDelay);
      if (!retryAfterMs && data.retryAfter)
        retryAfterMs = parseRetryDelay(data.retryAfter);
    }
  }

  // Respect Retry-After HTTP header if present
  if (!retryAfterMs) {
    const ra = res.headers.get("retry-after");
    if (ra) retryAfterMs = parseRetryDelay(ra);
  }

  const err: any = new Error(message);
  err.code = code;
  if (retryAfterMs) err.retryAfterMs = retryAfterMs;
  // include raw body for debugging
  err.raw = data ?? text;
  throw err;
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

  const maxAttempts = 3;
  const baseDelayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch("/api/gemini/deck", {
      method: "POST",
      headers: headers as HeadersInit,
      body: JSON.stringify({ subtopic, parentTopic }),
    });

    try {
      const data = await parseJsonOrText(res);
      return data;
    } catch (err: any) {
      // If provider tells us to wait, honor it
      const retryAfter = err?.retryAfterMs;
      // For RESOURCE_EXHAUSTED / 429, we may want to retry after suggested delay
      if (attempt < maxAttempts) {
        let waitMs = retryAfter ?? baseDelayMs * Math.pow(2, attempt - 1);
        // small jitter
        waitMs = Math.max(
          200,
          Math.floor(waitMs * (0.8 + Math.random() * 0.4))
        );
        // If no retry info and it's not a transient error, bail early
        const transient =
          err?.code === 429 ||
          err?.code === "RESOURCE_EXHAUSTED" ||
          (typeof err?.code === "number" && err.code >= 500);
        if (!transient && !retryAfter) throw err;
        // wait then retry
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      // Exhausted attempts — rethrow with guidance
      if (err?.code === 429 || err?.code === "RESOURCE_EXHAUSTED") {
        const e = new Error(
          `AI quota exceeded. Please try again in ${
            Math.ceil((err?.retryAfterMs ?? 0) / 1000) || "a few"
          } seconds.`
        );
        (e as any).raw = err.raw ?? err;
        (e as any).retryAfterMs = err?.retryAfterMs;
        throw e;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate deck");
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
