"use client";

import React, { useState } from "react";
import { Deck } from "@/lib/types";
import {
  Play,
  Plus,
  Brain,
  Trash2,
  Wand2,
  Sparkles,
  CheckSquare,
  Square,
  Loader2,
  ChevronRight,
  Layers,
  Clock,
  Star,
} from "lucide-react";
import {
  generateCurriculum,
  generateDeckFromTopic,
  SubtopicSuggestion,
} from "@/lib/gemini.client";
import { v4 as uuidv4 } from "uuid";

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deckId: string) => void;
  onAddDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  userId: string; // Added userId to props to ensure new decks have an owner
}

type WizardStep = "INPUT" | "CURRICULUM" | "GENERATING";

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onSelectDeck,
  onAddDeck,
  onDeleteDeck,
  userId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("INPUT");
  const [topicInput, setTopicInput] = useState("");
  const [subtopics, setSubtopics] = useState<SubtopicSuggestion[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetModal = () => {
    setShowModal(false);
    setWizardStep("INPUT");
    setTopicInput("");
    setSubtopics([]);
    setSelectedSubtopics(new Set());
    setProgressLog([]);
    setError(null);
  };

  const handleAnalyzeTopic = async () => {
    if (!topicInput) return;
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generateCurriculum(topicInput);
      setSubtopics(suggestions);
      setSelectedSubtopics(new Set(suggestions.map((_, i) => i)));
      setWizardStep("CURRICULUM");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze topic");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtopic = (index: number) => {
    const newSet = new Set(selectedSubtopics);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedSubtopics(newSet);
  };

  const handleGenerateDecks = async () => {
    setWizardStep("GENERATING");
    setIsLoading(true);
    setProgressLog([]);

    const selectedIndices = Array.from(selectedSubtopics).sort();
    const now = Date.now();

    for (const index of selectedIndices) {
      const subtopic = subtopics[index];
      setProgressLog((prev) => [
        ...prev,
        `Generating content for: ${subtopic.title}...`,
      ]);

      try {
        const data = await generateDeckFromTopic(subtopic.title, topicInput);

        // Fix: Added missing userId property to newDeck object
        const newDeck: Deck = {
          id: uuidv4(),
          title: data.title,
          description: subtopic.description,
          parentTopic: topicInput,
          userId: userId, // Correctly assigning the userId prop
          cards: data.cards.map((c) => ({
            ...c,
            id: uuidv4(),
            status: "new" as const,
            easeFactor: 2.5,
            interval: 0,
            reviewCount: 0,
            dueDate: now, // New cards are immediately due for learning
          })),
          lastStudied: now,
        };

        onAddDeck(newDeck);
        setProgressLog((prev) => [...prev, `✓ Created deck: ${data.title}`]);
      } catch (err) {
        setProgressLog((prev) => [...prev, `✗ Failed: ${subtopic.title}`]);
        console.error(err);
      }
    }

    setIsLoading(false);
    setTimeout(() => {
      resetModal();
    }, 1500);
  };

  const groupedDecks: Record<string, Deck[]> = decks.reduce((acc, deck) => {
    const key = deck.parentTopic || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(deck);
    return acc;
  }, {} as Record<string, Deck[]>);

  const getDeckStats = (deck: Deck) => {
    const now = Date.now();
    const newCards = deck.cards.filter((c) => c.status === "new").length;
    const dueCards = deck.cards.filter(
      (c) => c.status !== "new" && (!c.dueDate || c.dueDate <= now)
    ).length;
    return { newCards, dueCards };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
          <p className="text-gray-500 mt-1">
            Manage your learning paths and decks
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-md font-medium"
        >
          <Plus size={20} />
          <span>New Study Topic</span>
        </button>
      </div>

      {Object.keys(groupedDecks).length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Wand2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No decks yet</h3>
          <p className="text-gray-500 mb-4">
            Start by creating a new AI-powered study topic.
          </p>
        </div>
      )}

      <div className="space-y-12">
        {Object.entries(groupedDecks).map(([topic, topicDecks]) => (
          <div key={topic} className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Layers className="text-gray-400" size={18} />
              <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
                {topic}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicDecks.map((deck) => {
                const { newCards, dueCards } = getDeckStats(deck);
                return (
                  <div
                    key={deck.id}
                    className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <Brain size={22} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDeck(deck.id);
                        }}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all"
                        title="Delete Deck"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                      {deck.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-grow">
                      {deck.description}
                    </p>

                    <div className="flex gap-4 mb-4">
                      <div
                        className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md"
                        title="Cards Due Review"
                      >
                        <Clock size={14} />
                        <span>{dueCards} Due</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                        title="New Cards"
                      >
                        <Star size={14} />
                        <span>{newCards} New</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                      <span className="text-xs font-medium text-gray-400">
                        {deck.cards.length} Total Cards
                      </span>
                      <button
                        onClick={() => onSelectDeck(deck.id)}
                        className="text-indigo-600 text-sm font-bold hover:text-indigo-800 flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Study <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Wand2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    AI Course Creator
                  </h2>
                  <p className="text-xs text-gray-500">
                    From topic to full curriculum in seconds
                  </p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {wizardStep === "INPUT" && (
                <div className="animate-fade-in space-y-4">
                  <div>
                    <label className="block text-lg font-medium text-gray-900 mb-2">
                      What do you want to master?
                    </label>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="e.g., Photosynthesis, European History, Python Basics"
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm placeholder:text-gray-300"
                      autoFocus
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      The AI will break this topic down into logical sub-modules
                      for you.
                    </p>
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}

              {wizardStep === "CURRICULUM" && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">
                      Proposed Curriculum
                    </h3>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {selectedSubtopics.size} selected
                    </span>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {subtopics.map((sub, idx) => {
                      const isSelected = selectedSubtopics.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSubtopic(idx)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/50"
                              : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`mt-1 ${
                              isSelected ? "text-indigo-600" : "text-gray-300"
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare size={20} />
                            ) : (
                              <Square size={20} />
                            )}
                          </div>
                          <div>
                            <h4
                              className={`font-bold ${
                                isSelected ? "text-indigo-900" : "text-gray-600"
                              }`}
                            >
                              {sub.title}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {sub.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {wizardStep === "GENERATING" && (
                <div className="animate-fade-in space-y-6 text-center py-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Crafting your decks...
                      </h3>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-green-600">
                      <CheckSquare className="h-12 w-12 mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">
                        All Done!
                      </h3>
                    </div>
                  )}
                  <div className="bg-gray-900 rounded-lg p-4 text-left max-h-48 overflow-y-auto font-mono text-xs text-green-400">
                    {progressLog.map((log, i) => (
                      <div
                        key={i}
                        className="mb-1 opacity-90"
                      >{`> ${log}`}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {wizardStep === "INPUT" && (
                <button
                  onClick={handleAnalyzeTopic}
                  disabled={isLoading || !topicInput}
                  className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${
                    isLoading || !topicInput
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                  Analyze Topic
                </button>
              )}
              {wizardStep === "CURRICULUM" && (
                <>
                  <button
                    onClick={() => setWizardStep("INPUT")}
                    className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateDecks}
                    disabled={selectedSubtopics.size === 0}
                    className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${
                      selectedSubtopics.size === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25"
                    }`}
                  >
                    Generate {selectedSubtopics.size} Decks{" "}
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
