/**
 * API Route: Get due flashcards for review with rephrasing
 * 
 * Flow:
 * 1. Fetch due cards from database
 * 2. For each card, rephrase the question (avoid recent variants)
 * 3. Return cards with rephrased questions
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase.server";
import { generateWithRetry } from "@/lib/gemini.safe";

// ============================================================================
// Types
// ============================================================================

interface DueCard {
  card_id: string;
  original_question: string;
  current_question: string;
  answer: string;
  hint: string | null;
  difficulty: string | null;
  document_id: string | null;
  document_title: string | null;
  topic_id: string | null;
  topic_label: string | null;
  times_reviewed: number;
  last_rephrased: string | null;
  due_date: string;
  stability: number;
  card_difficulty: number;
  status: string;
}

// ============================================================================
// GET: Fetch Due Cards with Rephrasing
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const topicId = searchParams.get("topicId");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // 3. Fetch due cards using the database function
    const { data: dueCards, error: fetchError } = await supabase
      .rpc("get_due_cards_for_review", {
        p_user_id: user.id,
        p_document_id: documentId,
        p_topic_id: topicId,
        p_limit: limit,
      });
    
    if (fetchError) {
      console.error("[API] Failed to fetch due cards:", fetchError);
      return NextResponse.json(
        { 
          error: "Failed to fetch due cards",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }
    
    if (!dueCards || dueCards.length === 0) {
      return NextResponse.json({
        success: true,
        cards: [],
        message: "No cards due for review",
      });
    }
    
    // 4. Rephrase questions for each card
    const rephrasedCards = await Promise.all(
      (dueCards as DueCard[]).map(async (card) => {
        try {
          // Skip rephrasing for new cards (first review)
          if (card.times_reviewed === 0) {
            return {
              id: card.card_id,
              question: card.original_question,
              answer: card.answer,
              hint: card.hint,
              difficulty: card.difficulty,
              documentTitle: card.document_title,
              topicLabel: card.topic_label,
              isRephrased: false,
              timesReviewed: card.times_reviewed,
              dueDate: card.due_date,
            };
          }
          
          // Build rephrasing prompt
          const rephrasePrompt = `You are rephrasing a flashcard question to help with spaced repetition learning.

ORIGINAL QUESTION:
${card.original_question}

ANSWER:
${card.answer}

${card.last_rephrased ? `PREVIOUS VARIANT (avoid this):
${card.last_rephrased}` : ''}

INSTRUCTIONS:
- Rephrase the question to test the same knowledge but with different wording
- Keep the difficulty level similar
- Make it fresh and engaging
- Ensure it still has the same answer
- Be concise and clear
- DO NOT change the core concept being tested
${card.hint ? `- Consider this hint: ${card.hint}` : ''}

Return ONLY the rephrased question, nothing else.`;

          const rephrasedQuestion = await generateWithRetry(rephrasePrompt, {
            model: "gemini-2.5-flash",
            config: { maxOutputTokens: 200, temperature: 0.8 },
          });
          
          return {
            id: card.card_id,
            question: rephrasedQuestion.trim(),
            answer: card.answer,
            hint: card.hint,
            difficulty: card.difficulty,
            documentTitle: card.document_title,
            topicLabel: card.topic_label,
            isRephrased: true,
            timesReviewed: card.times_reviewed,
            dueDate: card.due_date,
            originalQuestion: card.original_question, // Include for debugging
          };
        } catch (error) {
          console.error(`[API] Failed to rephrase card ${card.card_id}:`, error);
          // Fallback to original question if rephrasing fails
          return {
            id: card.card_id,
            question: card.original_question,
            answer: card.answer,
            hint: card.hint,
            difficulty: card.difficulty,
            documentTitle: card.document_title,
            topicLabel: card.topic_label,
            isRephrased: false,
            timesReviewed: card.times_reviewed,
            dueDate: card.due_date,
            error: "Rephrasing failed, showing original",
          };
        }
      })
    );
    
    // 5. Return rephrased cards
    return NextResponse.json({
      success: true,
      cards: rephrasedCards,
      totalCards: rephrasedCards.length,
    });
    
  } catch (error) {
    console.error("[API] /api/review error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
