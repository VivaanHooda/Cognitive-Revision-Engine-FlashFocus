/**
 * API Route: Submit flashcard review with rating
 * 
 * Flow:
 * 1. Receive card review (rating + question variant shown)
 * 2. Calculate FSRS next review parameters
 * 3. Update card in database
 * 4. Save review record to card_reviews table
 * 5. Return updated card data
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase.server";
import { calculateNextReview, SRS_TARGETS } from "@/lib/srs.server";
import { FlashcardData, StudyGrade } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface ReviewSubmission {
  cardId: string;
  rating: 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy
  questionVariant: string; // The rephrased question that was shown
  userAnswer?: string; // Optional user's written answer
  responseTimeMs?: number; // Time taken to answer
}

// ============================================================================
// POST: Submit Card Review
// ============================================================================

export async function POST(request: NextRequest) {
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
    
    // 2. Parse request body
    const body: ReviewSubmission = await request.json();
    const { cardId, rating, questionVariant, userAnswer, responseTimeMs } = body;
    
    // Validate inputs
    if (!cardId || !rating || !questionVariant) {
      return NextResponse.json(
        { error: "Missing required fields: cardId, rating, questionVariant" },
        { status: 400 }
      );
    }
    
    if (![1, 2, 3, 4].includes(rating)) {
      return NextResponse.json(
        { error: "Invalid rating. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)" },
        { status: 400 }
      );
    }
    
    // 3. Fetch current card state
    const { data: currentCard, error: fetchError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();
    
    if (fetchError || !currentCard) {
      console.error("[API] Card not found:", fetchError);
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }
    
    // 4. Get user's FSRS parameters (or use defaults)
    const { data: userParams } = await supabase
      .from("srs_params")
      .select("params")
      .eq("user_id", user.id)
      .single();
    
    const fsrsParams = userParams?.params || {};
    
    // 5. Map rating to grade
    const gradeMap: Record<number, StudyGrade> = {
      1: "again",
      2: "hard",
      3: "good",
      4: "easy",
    };
    const grade = gradeMap[rating];
    
    // 6. Get target retrievability for this grade
    const targetRetrievability = SRS_TARGETS[grade];
    
    // 7. Calculate next review parameters
    const cardData: FlashcardData = {
      id: currentCard.id,
      front: currentCard.front,
      back: currentCard.back,
      status: currentCard.status as FlashcardData['status'],
      easeFactor: currentCard.ease_factor || 2.5,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      dueDate: currentCard.due_date ? new Date(currentCard.due_date).getTime() : Date.now(),
      lastReviewed: currentCard.last_review ? new Date(currentCard.last_review).getTime() : undefined,
      reviewCount: currentCard.review_count || 0,
      interval: currentCard.scheduled_days || 0,
    };
    
    const nextReviewData = calculateNextReview(
      cardData,
      grade,
      fsrsParams,
      targetRetrievability
    );
    
    // 8. Update card in database
    const nextLastReviewed = nextReviewData.lastReviewed ?? Date.now();

    const { data: updatedCard, error: updateError } = await supabase
      .from("cards")
      .update({
        status: nextReviewData.status,
        stability: nextReviewData.stability,
        difficulty: nextReviewData.difficulty,
        due_date: nextReviewData.dueDate ? new Date(nextReviewData.dueDate).toISOString() : null,
        last_review: new Date(nextLastReviewed).toISOString(),
        scheduled_days: nextReviewData.interval,
        review_count: nextReviewData.reviewCount,
        elapsed_days: Math.floor((Date.now() - (currentCard.last_review ? new Date(currentCard.last_review).getTime() : Date.now())) / (24 * 60 * 60 * 1000)),
        reps: currentCard.reps + 1,
        lapses: rating === 1 ? currentCard.lapses + 1 : currentCard.lapses,
        state: rating === 1 ? 1 : (nextReviewData.status === 'learning' ? 1 : (nextReviewData.status === 'review' ? 2 : 3)),
      })
      .eq("id", cardId)
      .select()
      .single();
    
    if (updateError) {
      console.error("[API] Failed to update card:", updateError);
      return NextResponse.json(
        { 
          error: "Failed to update card",
          details: updateError.message,
        },
        { status: 500 }
      );
    }
    
    // 9. Save review record to card_reviews table
    const { error: reviewError } = await supabase
      .from("card_reviews")
      .insert({
        card_id: cardId,
        user_id: user.id,
        question_variant: questionVariant,
        user_answer: userAnswer,
        rating: rating,
        response_time_ms: responseTimeMs,
        reviewed_at: new Date().toISOString(),
      });
    
    if (reviewError) {
      console.error("[API] Failed to save review record:", reviewError);
      // Don't fail the request, but log the error
      // Card is already updated, which is the critical part
    }
    
    // 10. Return success with updated card data
    return NextResponse.json({
      success: true,
      card: {
        id: updatedCard.id,
        status: updatedCard.status,
        dueDate: updatedCard.due_date,
        interval: updatedCard.scheduled_days,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        reviewCount: updatedCard.review_count,
      },
      nextReview: {
        dueDate: updatedCard.due_date,
        intervalDays: updatedCard.scheduled_days,
        status: updatedCard.status,
      },
    });
    
  } catch (error) {
    console.error("[API] /api/review/submit error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
