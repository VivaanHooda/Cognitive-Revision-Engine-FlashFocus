"use client";

import React, { useState, useEffect, useRef } from "react";
import { Deck, FlashcardData, StudyGrade } from "@/lib/types";
import { Flashcard } from "./Flashcard";
import {
  ArrowLeft,
  Mic,
  MicOff,
  CheckCircle,
  Sparkles,
  Send,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  askCardClarification,
  ChatMessage,
  evaluateAnswer,
  GradingResult,
} from "@/lib/gemini.client";
import { calculateNextReview, simulateNextReviews } from "@/lib/srs.client";

interface StudyViewProps {
  deck: Deck;
  onExit: () => void;
  onUpdateDeck: (updatedDeck: Deck) => void;
}

export const StudyView: React.FC<StudyViewProps> = ({
  deck,
  onExit,
  onUpdateDeck,
}) => {
  // Advanced Queue Logic: Initial filter of Due and New cards
  const [queue, setQueue] = useState<FlashcardData[]>(() => {
    const now = Date.now();
    const due = deck.cards.filter(
      (c) => c.status !== "new" && (!c.dueDate || c.dueDate <= now)
    );
    const newCards = deck.cards.filter((c) => c.status === "new");

    // Sort due cards by urgency
    due.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    return [...due, ...newCards];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Tutor Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Evaluation
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(
    null
  );

  const currentCard = queue[currentIndex];
  const isFinished = !currentCard;

  const [sessionStats, setSessionStats] = useState({ new: 0, review: 0 });

  // Prefetch simulated intervals for the current card from the server
  const [simulatedIntervals, setSimulatedIntervals] = useState<Record<
    StudyGrade,
    string
  > | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!currentCard) return;
    simulateNextReviews(currentCard)
      .then((res) => {
        if (mounted) setSimulatedIntervals(res);
      })
      .catch(() => {
        if (mounted) setSimulatedIntervals(null);
      });
    return () => {
      mounted = false;
    };
  }, [currentCard?.id]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatOpen]);

  useEffect(() => {
    setIsFlipped(false);
    setUserAnswer("");
    setIsChatOpen(false);
    setChatHistory([]);
    setChatInput("");
    setGradingResult(null);
    setIsGrading(false);
  }, [currentIndex]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserAnswer("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFlip = () => {
    setIsFlipped(true);
    if (userAnswer.trim()) {
      setIsGrading(true);
      evaluateAnswer(currentCard.front, currentCard.back, userAnswer)
        .then(setGradingResult)
        .catch((err) => console.error("Grading failed", err))
        .finally(() => setIsGrading(false));
    }
  };

  /**
   * CORE SRS FEATURE: Re-queue failed cards (Again) in the current session.
   */
  const handleGrade = async (grade: StudyGrade) => {
    setSessionStats((prev) => ({
      ...prev,
      new: currentCard.status === "new" ? prev.new + 1 : prev.new,
      review: currentCard.status !== "new" ? prev.review + 1 : prev.review,
    }));

    try {
      const updatedStats = await calculateNextReview(currentCard, grade);
      const updatedCard = { ...currentCard, ...updatedStats };

      // Persistent storage update
      const newCards = deck.cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      onUpdateDeck({ ...deck, cards: newCards });

      // In-session queue manipulation
      if (grade === "again") {
        // If the student fails, add the card back to the queue (Anki "Learning Step")
        // We add it to the end of the current queue.
        setQueue((prev) => [...prev, updatedCard]);
      }
    } catch (err) {
      console.error("SRS update failed", err);
    } finally {
      setIsFlipped(false);
      setTimeout(() => {
        // so that card flips first before it loads the next question
        setCurrentIndex((prev) => prev + 1);
      }, 500);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsChatLoading(true);
    try {
      const response = await askCardClarification(
        userMsg,
        currentCard.front,
        currentCard.back,
        chatHistory
      );
      setChatHistory((prev) => [...prev, { role: "model", text: response }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I couldn't connect to the tutor. Please try again later.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        if (
          e.key === "Enter" &&
          !isFlipped &&
          document.activeElement?.tagName === "INPUT"
        )
          handleFlip();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (!isFlipped) handleFlip();
      }
      if (isFlipped && !isChatOpen) {
        if (e.key === "1") handleGrade("again");
        if (e.key === "2") handleGrade("hard");
        if (e.key === "3") handleGrade("good");
        if (e.key === "4") handleGrade("easy");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isFinished, currentIndex, isChatOpen]);

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 text-indigo-500">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">No cards due!</h2>
        <p className="text-gray-500 mb-8">
          You're all caught up on this deck for now.
        </p>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Back to Decks
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 text-green-500">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Session Complete!
        </h2>
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {sessionStats.new}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              New Learnt
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {sessionStats.review}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Reviewed
            </div>
          </div>
        </div>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Back to Decks
        </button>
      </div>
    );
  }

  const progress = (currentIndex / queue.length) * 100;
  const getSimulatedInterval = (grade: StudyGrade) => {
    // Prefer server-provided simulated intervals (fetched on card change)
    if (simulatedIntervals && simulatedIntervals[grade])
      return simulatedIntervals[grade];

    // Fallback: small local calculation for instant UI feedback
    const interval = currentCard.interval || 0;
    if (grade === "again") return "< 1d";
    if (grade === "hard") return `${Math.max(1, Math.ceil(interval * 1.2))}d`;
    if (grade === "good")
      return `${
        interval === 0 ? 1 : interval === 1 ? 6 : Math.ceil(interval * 2.5)
      }d`;
    if (grade === "easy")
      return `${interval === 0 ? 4 : Math.ceil(interval * 2.5 * 1.3)}d`;
    return "< 1d";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 mx-8">
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>Remaining: {queue.length - currentIndex}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="w-6" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start min-h-0 relative">
        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
        />

        {!isFlipped && (
          <div className="mt-8 w-full max-w-xl animate-fade-in-up">
            <div className="relative">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full pl-6 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-lg text-gray-800 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleFlip()}
                autoFocus
              />
              <button
                onClick={toggleVoice}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  isListening
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50"
                }`}
                title="Voice Input"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={handleFlip}
                className="text-gray-400 hover:text-indigo-600 text-sm font-medium transition-colors"
              >
                Press Space to Show Answer
              </button>
            </div>
          </div>
        )}

        {isFlipped && (
          <div className="mt-6 w-full max-w-xl animate-fade-in-up flex flex-col gap-6">
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Your Answer
              </div>
              <div
                className={`p-4 rounded-lg text-lg ${
                  userAnswer.toLowerCase().trim() ===
                  currentCard.back.toLowerCase().trim()
                    ? "bg-green-50 text-green-800 border border-green-100"
                    : userAnswer
                    ? "bg-indigo-50 text-gray-800 border border-indigo-100"
                    : "bg-gray-50 text-gray-500 italic"
                }`}
              >
                {userAnswer || "No answer provided"}
              </div>
            </div>

            {(isGrading || gradingResult) && (
              <div className="animate-fade-in">
                {isGrading ? (
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-pulse">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-sm font-semibold">
                      AI is evaluating...
                    </span>
                  </div>
                ) : gradingResult ? (
                  <div
                    className={`p-4 rounded-xl border-2 shadow-sm ${
                      gradingResult.score === 1
                        ? "border-red-200 bg-red-50 text-red-900"
                        : gradingResult.score === 2
                        ? "border-orange-200 bg-orange-50 text-orange-900"
                        : gradingResult.score === 3
                        ? "border-green-200 bg-green-50 text-green-900"
                        : "border-blue-200 bg-blue-50 text-blue-900"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        <span className="font-bold text-sm uppercase tracking-wide">
                          AI Evaluation
                        </span>
                      </div>
                      <span
                        className={`font-bold px-2 py-0.5 bg-white/60 backdrop-blur-sm rounded-md shadow-sm text-xs border`}
                      >
                        Score: {gradingResult.score}/4
                      </span>
                    </div>
                    <p className="text-sm mb-4 leading-relaxed opacity-90">
                      {gradingResult.feedback}
                    </p>
                    <button
                      onClick={() =>
                        handleGrade(
                          gradingResult.score === 1
                            ? "again"
                            : gradingResult.score === 2
                            ? "hard"
                            : gradingResult.score === 3
                            ? "good"
                            : "easy"
                        )
                      }
                      className="w-full py-2.5 bg-white rounded-lg font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-gray-100 active:scale-[0.98]"
                    >
                      Apply Score ({gradingResult.score}) & Next{" "}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {isChatOpen ? (
              <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col h-64 md:h-80 transition-all">
                <div className="bg-indigo-50 p-3 flex justify-between items-center border-b border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <Sparkles size={16} />
                    <span>AI Tutor</span>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-gray-400 hover:text-indigo-600 text-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {chatHistory.length === 0 && (
                    <p className="text-center text-gray-400 text-sm italic mt-4">
                      Ask me anything about this card!
                    </p>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-full rounded-tl-none shadow-sm">
                        <div className="flex gap-1">
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  onSubmit={handleChatSubmit}
                  className="p-3 bg-white border-t border-gray-100 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isChatLoading}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 border-dashed transition-all"
              >
                <Sparkles size={18} />
                <span className="font-semibold">
                  Confused? Ask AI to clarify
                </span>
              </button>
            )}

            <div className="grid grid-cols-4 gap-4 mt-2">
              <button
                onClick={() => handleGrade("again")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border transition-all hover:-translate-y-1 active:scale-95 ${
                  gradingResult?.score === 1
                    ? "border-red-400 ring-2 ring-red-200 scale-105 shadow-md"
                    : "border-red-200"
                }`}
              >
                <span className="font-bold">Again</span>
                <span className="text-xs opacity-75 mt-1">
                  {getSimulatedInterval("again")}
                </span>
              </button>
              <button
                onClick={() => handleGrade("hard")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border transition-all hover:-translate-y-1 active:scale-95 ${
                  gradingResult?.score === 2
                    ? "border-orange-400 ring-2 ring-orange-200 scale-105 shadow-md"
                    : "border-orange-200"
                }`}
              >
                <span className="font-bold">Hard</span>
                <span className="text-xs opacity-75 mt-1">
                  {getSimulatedInterval("hard")}
                </span>
              </button>
              <button
                onClick={() => handleGrade("good")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border transition-all hover:-translate-y-1 active:scale-95 ${
                  gradingResult?.score === 3
                    ? "border-green-400 ring-2 ring-green-200 scale-105 shadow-md"
                    : "border-green-200"
                }`}
              >
                <span className="font-bold">Good</span>
                <span className="text-xs opacity-75 mt-1">
                  {getSimulatedInterval("good")}
                </span>
              </button>
              <button
                onClick={() => handleGrade("easy")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border transition-all hover:-translate-y-1 active:scale-95 ${
                  gradingResult?.score === 4
                    ? "border-blue-400 ring-2 ring-blue-200 scale-105 shadow-md"
                    : "border-blue-200"
                }`}
              >
                <span className="font-bold">Easy</span>
                <span className="text-xs opacity-75 mt-1">
                  {getSimulatedInterval("easy")}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
