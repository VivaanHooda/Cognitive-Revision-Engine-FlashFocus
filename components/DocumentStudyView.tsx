/**
 * DocumentStudyView Component
 * 
 * Displays flashcards from a specific document with rephrasing support
 * - Fetches due cards from /api/review
 * - Shows rephrased questions
 * - Allows rating (Again, Hard, Good, Easy)
 * - Submits reviews to /api/review/submit
 * - Tracks progress
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase.client";

// ============================================================================
// Types
// ============================================================================

interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  hint: string | null;
  difficulty: string | null;
  documentTitle: string | null;
  topicLabel: string | null;
  isRephrased: boolean;
  timesReviewed: number;
  dueDate: string;
  originalQuestion?: string;
}

interface DocumentStudyViewProps {
  documentId: string;
  documentTitle: string;
  onBack: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentStudyView({
  documentId,
  documentTitle,
  onBack,
}: DocumentStudyViewProps) {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now());
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch due cards on mount
  useEffect(() => {
    fetchDueCards();
  }, [documentId]);

  const fetchDueCards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please log in to study");
        return;
      }
      
      const response = await fetch(
        `/api/review?documentId=${documentId}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch due cards");
      }
      
      const data = await response.json();
      
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
        setCurrentIndex(0);
        setReviewStartTime(Date.now());
      } else {
        setError("No cards due for review! 🎉");
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (rating: 1 | 2 | 3 | 4) => {
    if (submitting || currentIndex >= cards.length) return;
    
    setSubmitting(true);
    const currentCard = cards[currentIndex];
    const responseTime = Date.now() - reviewStartTime;
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Session expired. Please log in again.");
        return;
      }
      
      const response = await fetch("/api/review/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          rating: rating,
          questionVariant: currentCard.question,
          responseTimeMs: responseTime,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit review");
      }
      
      // Move to next card
      setCompletedCount(prev => prev + 1);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setReviewStartTime(Date.now());
      } else {
        // All cards reviewed
        setError(`Session complete! Reviewed ${cards.length} cards. 🎉`);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (submitting || currentIndex >= cards.length) return;
    
    if (e.code === "Space" && !isFlipped) {
      e.preventDefault();
      setIsFlipped(true);
    } else if (isFlipped) {
      if (e.code === "Digit1") submitReview(1); // Again
      if (e.code === "Digit2") submitReview(2); // Hard
      if (e.code === "Digit3") submitReview(3); // Good
      if (e.code === "Digit4") submitReview(4); // Easy
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFlipped, submitting, currentIndex]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading due cards...</p>
        </div>
      </div>
    );
  }

  // Error or completion state
  if (error || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">{error?.includes("complete") ? "🎉" : "📚"}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "No cards available"}
          </h2>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((completedCount) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <span>←</span> Back
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-gray-800">{documentTitle}</h1>
            <p className="text-sm text-gray-500">
              Card {completedCount + 1} of {cards.length}
            </p>
          </div>
          
          <div className="w-24"></div>
        </div>
        
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {currentCard.topicLabel && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                📌 {currentCard.topicLabel}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {currentCard.isRephrased && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                ✨ Rephrased
              </span>
            )}
            {currentCard.timesReviewed > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                Reviewed {currentCard.timesReviewed}x
              </span>
            )}
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl shadow-2xl p-12 min-h-[400px] flex flex-col justify-center items-center cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {!isFlipped ? (
            // Question side
            <div className="text-center w-full">
              <div className="text-3xl font-bold text-gray-800 mb-6">
                {currentCard.question}
              </div>
              
              {currentCard.hint && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 Hint: {currentCard.hint}
                  </p>
                </div>
              )}
              
              <div className="mt-12 text-gray-400 text-sm">
                Click or press [Space] to reveal answer
              </div>
            </div>
          ) : (
            // Answer side
            <div className="text-center w-full">
              <div className="text-xl text-gray-500 mb-4">Answer:</div>
              <div className="text-2xl font-semibold text-gray-800 mb-8">
                {currentCard.answer}
              </div>
              
              <div className="mt-12 text-gray-500 text-sm mb-6">
                How well did you know this?
              </div>
              
              {/* Rating buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => submitReview(1)}
                  disabled={submitting}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex-1 max-w-[140px]"
                >
                  <div className="font-bold">Again</div>
                  <div className="text-xs">Press 1</div>
                </button>
                
                <button
                  onClick={() => submitReview(2)}
                  disabled={submitting}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex-1 max-w-[140px]"
                >
                  <div className="font-bold">Hard</div>
                  <div className="text-xs">Press 2</div>
                </button>
                
                <button
                  onClick={() => submitReview(3)}
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex-1 max-w-[140px]"
                >
                  <div className="font-bold">Good</div>
                  <div className="text-xs">Press 3</div>
                </button>
                
                <button
                  onClick={() => submitReview(4)}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex-1 max-w-[140px]"
                >
                  <div className="font-bold">Easy</div>
                  <div className="text-xs">Press 4</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug info (can be removed in production) */}
        {currentCard.originalQuestion && currentCard.isRephrased && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <strong>Original:</strong> {currentCard.originalQuestion}
          </div>
        )}
      </div>
    </div>
  );
}
