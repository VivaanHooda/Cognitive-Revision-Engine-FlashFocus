import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData } from "./types";

// Lazy getter to avoid throwing at module import time. Throws when called if not configured.
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error("GEMINI_API_KEY environment variable is required");
  return new GoogleGenAI({ apiKey });
};

export interface SubtopicSuggestion {
  title: string;
  description: string;
}

export const generateCurriculum = async (
  topic: string
): Promise<SubtopicSuggestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `You are an expert curriculum designer. Break down the topic "${topic}" into 4-6 logical, ordered subtopics for a student. Start from fundamentals and move to more advanced concepts. Return a JSON list of subtopics, each with a title and a brief 1-sentence description.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subtopics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["subtopics"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  const data = JSON.parse(text);
  return data.subtopics;
};

export const generateDeckFromTopic = async (
  subtopic: string,
  parentTopic: string
) => {
  const ai = getAI();
  const prompt = `Create a high-quality "Atomic" flashcard deck for the subtopic: "${subtopic}". Context: This is part of a course on "${parentTopic}".\n\nSRS DESIGN PRINCIPLES (MUST FOLLOW):\n1. ATOMICITY: Each card must test exactly ONE discrete fact or concept. Do not include lists or multiple steps on one card.\n2. CLARITY: The \"Front\" should be a precise trigger (Question, Definition, or Fill-in-the-blank).\n3. BREVITY: The \"Back\" should be a short, \"punchy\" answer that can be verified in < 2 seconds.\n4. ACTIVE RECALL: Avoid \"True/False\" or \"Multiple Choice\" styles. Use \"What is...\", \"How does...\", \"Define...\".\n\nGenerate 6-10 cards. Return a JSON object with a specific title for this deck and the list of cards.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["title", "cards"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const askCardClarification = async (
  question: string,
  cardFront: string,
  cardBack: string,
  history: ChatMessage[]
): Promise<string> => {
  const ai = getAI();
  const systemContext = `You are a helpful and encouraging tutor. The student is reviewing a flashcard. [Flashcard Question]: "${cardFront}" [Flashcard Answer]: "${cardBack}" The student has a question about this card or answer. Answer clearly and concisely. If they ask something unrelated, politely steer them back to the card's topic.`;

  let promptHistory = "";
  history.forEach((msg) => {
    promptHistory += `${msg.role === "user" ? "Student" : "Tutor"}: ${
      msg.text
    }\n`;
  });

  const fullPrompt = `${systemContext}\n\n${promptHistory}Student: ${question}\nTutor:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: fullPrompt,
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return text;
};

export interface GradingResult {
  score: number; // 1-4
  feedback: string;
}

export const evaluateAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<GradingResult> => {
  const ai = getAI();
  const prompt = `
You are a strict flashcard grader.

IMPORTANT — WORD COUNT RULE (MANDATORY):
1. First, count the number of words in the Student Answer.
2. If the Student Answer has fewer than 50 words:
   - You MUST assign grade = 1
   - You MUST use EXACTLY this feedback text and nothing else:
     "The answer is too short. Please provide a more detailed answer."
   - Do NOT evaluate correctness, completeness, or clarity.
   - Do NOT mention any other issues.

Only if the Student Answer has 50 words or more, proceed with grading.

Inputs:
- Question: "${question}"
- Correct Answer: "${correctAnswer}"
- Student Answer: "${userAnswer}"

Grading Criteria (apply ONLY if ≥ 100 words):
Evaluate factual correctness, completeness, clarity, and alignment with the correct answer.

Grading Scale (1–4):
- 4: Fully correct, complete, and clearly explained.
- 3: Mostly correct with minor omissions or inaccuracies.
- 2: Partially correct but missing key points or containing notable errors.
- 1: Largely incorrect or irrelevant.

Output:
Return ONLY valid JSON in this exact format:
{
  "grade": <integer 1–4>,
  "feedback": "<brief, constructive feedback (1–2 sentences)>"
}

`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
        },
        required: ["score", "feedback"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};
