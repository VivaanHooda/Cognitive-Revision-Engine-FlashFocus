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

export const generateCurriculum = async (
  topic: string
): Promise<SubtopicSuggestion[]> => {
  const res = await fetch("/api/gemini/curriculum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  const data = await parseJsonOrText(res);
  return data.subtopics;
};

export const generateDeckFromTopic = async (
  subtopic: string,
  parentTopic: string
) => {
  const res = await fetch("/api/gemini/deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch("/api/gemini/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch("/api/gemini/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, correctAnswer, userAnswer }),
  });
  const data = await parseJsonOrText(res);
  return data;
};
