import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData } from "./types";

// Helper to init AI
const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

export interface SubtopicSuggestion {
  title: string;
  description: string;
}

/**
 * Step 1: Decompose a topic into subtopics
 */
export const generateCurriculum = async (
  topic: string,
  apiKey: string
): Promise<SubtopicSuggestion[]> => {
  const ai = getAI(apiKey);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert curriculum designer. Break down the topic "${topic}" into 4-6 logical, ordered subtopics for a student. 
    Start from fundamentals and move to more advanced concepts.
    Return a JSON list of subtopics, each with a title and a brief 1-sentence description.`,
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

/**
 * Step 2: Generate cards for a specific subtopic with SRS Optimization
 */
export const generateDeckFromTopic = async (
  subtopic: string,
  parentTopic: string,
  apiKey: string
): Promise<{
  title: string;
  cards: Omit<
    FlashcardData,
    "id" | "status" | "easeFactor" | "interval" | "reviewCount"
  >[];
}> => {
  const ai = getAI(apiKey);

  const prompt = `Create a high-quality "Atomic" flashcard deck for the subtopic: "${subtopic}". 
  Context: This is part of a course on "${parentTopic}".
  
  SRS DESIGN PRINCIPLES (MUST FOLLOW):
  1. ATOMICITY: Each card must test exactly ONE discrete fact or concept. Do not include lists or multiple steps on one card.
  2. CLARITY: The "Front" should be a precise trigger (Question, Definition, or Fill-in-the-blank).
  3. BREVITY: The "Back" should be a short, "punchy" answer that can be verified in < 2 seconds.
  4. ACTIVE RECALL: Avoid "True/False" or "Multiple Choice" styles. Use "What is...", "How does...", "Define...".
  
  Generate 6-10 cards.
  Return a JSON object with a specific title for this deck and the list of cards.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Specific title for this subtopic deck",
          },
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

/**
 * Ask for clarification on a specific flashcard
 */
export const askCardClarification = async (
  apiKey: string,
  question: string,
  cardFront: string,
  cardBack: string,
  history: ChatMessage[]
): Promise<string> => {
  const ai = getAI(apiKey);

  const systemContext = `You are a helpful and encouraging tutor. 
  The student is reviewing a flashcard.
  
  [Flashcard Question]: "${cardFront}"
  [Flashcard Answer]: "${cardBack}"
  
  The student has a question about this card or answer. Answer clearly and concisely. 
  If they ask something unrelated, politely steer them back to the card's topic.`;

  let promptHistory = "";
  history.forEach((msg) => {
    promptHistory += `${msg.role === "user" ? "Student" : "Tutor"}: ${
      msg.text
    }\n`;
  });

  const fullPrompt = `${systemContext}\n\n${promptHistory}Student: ${question}\nTutor:`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: fullPrompt,
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return text;
};

export interface GradingResult {
  score: 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
  feedback: string;
}

/**
 * Grade the student's answer using AI
 */
export const evaluateAnswer = async (
  apiKey: string,
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<GradingResult> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are a strict but fair flashcard grader.
    Question: "${question}"
    Correct Answer: "${correctAnswer}"
    Student Answer: "${userAnswer}"

    Rate the student's answer on a scale of 1-4 based on the correct answer.
    1 (Again): Incorrect or completely missed the key concepts.
    2 (Hard): Partially incorrect, struggled significantly but got some things right.
    3 (Good): Partially Correct, captures the main idea properly, almost there.
    4 (Easy): Perfect, precise, and recalled effortlessly.

    Provide a brief 1-sentence feedback explaining the rating.
    Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
