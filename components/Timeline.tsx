"use client";

import React, { useMemo, useState } from "react";
import { Deck, FlashcardData } from "@/lib/types";

type CardWithMeta = FlashcardData & { deckTitle: string; deckId: string };
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";

interface TimelineProps {
  decks: Deck[];
}

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const Timeline: React.FC<TimelineProps> = ({ decks }) => {
  // Flatten cards with deck metadata
  const allCards = useMemo(() => {
    return decks.flatMap((d) =>
      d.cards.map((c) => ({
        ...(c as CardWithMeta),
        deckTitle: d.title,
        deckId: d.id,
      }))
    );
  }, [decks]);

  // Build a sliding window of days (2 days past -> 14 days future by default)
  const [startOffset, setStartOffset] = useState(-2);
  const dayRange = 16; // -2..13 => shows 16 days

  // Track per-deck expanded state (key: `${dayKey}-${deckId}`)
  const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>(
    {}
  );

  const days = useMemo(() => {
    const now = new Date();
    const arr: { date: Date; label: string; key: number }[] = [];
    for (let i = 0; i < dayRange; i++) {
      const d = new Date();
      d.setDate(now.getDate() + startOffset + i);
      d.setHours(0, 0, 0, 0);
      arr.push({ date: d, label: formatDate(d), key: d.getTime() });
    }
    return arr;
  }, [startOffset]);

  const grouped = useMemo(() => {
    const g: Record<number, FlashcardData[]> = {};
    for (const card of allCards) {
      if (!card.dueDate) continue;
      const d = new Date(card.dueDate);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      if (!g[key]) g[key] = [];
      g[key].push(card);
    }
    return g;
  }, [allCards]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
            <CalendarIcon size={20} />
          </div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-sm text-gray-500">See scheduled reviews by day</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartOffset((s) => s - 7)}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Previous week"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setStartOffset((s) => s + 7)}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Next week"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map((day) => {
          const dayCards = (grouped[day.key] || []) as CardWithMeta[];
          const deckGroups = dayCards.reduce<Record<string, CardWithMeta[]>>(
            (acc, c) => {
              if (!acc[c.deckId]) acc[c.deckId] = [];
              acc[c.deckId].push(c);
              return acc;
            },
            {}
          );

          const totalCards = Object.values(deckGroups).reduce(
            (s, a) => s + a.length,
            0
          );

          // No per-day limit: every deck starts collapsed and shows no cards until expanded.

          // Build a list of deck entries to render (always include decks so users can expand them even if none are visible initially)
          const decksToRender = Object.entries(deckGroups).map(
            ([deckId, cards]) => {
              const deckKey = `${day.key}-${deckId}`;
              const isDeckExpanded = !!expandedDecks[deckKey];
              const visibleCards = isDeckExpanded ? cards : [];
              return {
                deckId,
                deckTitle: cards[0]?.deckTitle || "Unknown",
                fullCount: cards.length,
                visibleCards,
                isDeckExpanded,
                deckKey,
              };
            }
          );

          return (
            <div
              key={day.key}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase">
                    {day.label}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-700">
                  {totalCards}
                </div>
              </div>

              {totalCards === 0 ? (
                <div className="text-xs text-gray-400">
                  No reviews scheduled
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {decksToRender.map((d) => (
                    <div key={d.deckId}>
                      <button
                        onClick={() =>
                          setExpandedDecks((prev) => ({
                            ...prev,
                            [d.deckKey]: !prev[d.deckKey],
                          }))
                        }
                        className="w-full text-xs font-medium text-gray-500 mb-2 flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md"
                        aria-expanded={d.isDeckExpanded}
                      >
                        <span className="flex items-center gap-2">
                          {d.isDeckExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <span className="font-medium text-gray-700">
                            {d.deckTitle}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {d.fullCount}
                        </span>
                      </button>

                      <div className="flex flex-col gap-2">
                        {d.visibleCards.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg border border-gray-100 bg-gray-50"
                          >
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {c.front}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                              <span className="truncate">{c.deckTitle}</span>
                              <span className="ml-2">{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Note: day-level expand/collapse removed; per-deck expand is available instead */}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Tip: Hover a day card to see details. Use the arrows to move the window.
      </div>
    </div>
  );
};
