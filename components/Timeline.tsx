"use client";

import React, { useMemo, useState } from "react";
import { Deck, FlashcardData } from "@/lib/types";
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Layers,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

type CardWithMeta = FlashcardData & { deckTitle: string; deckId: string };

interface TimelineProps {
  decks: Deck[];
}

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

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

  // Build a sliding window of days
  const [startOffset, setStartOffset] = useState(0);
  const dayRange = 14; // 2 weeks view
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [movingDeck, setMovingDeck] = useState<{ deckId: string; deckTitle: string; fromDate: number } | null>(null);
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>("");

  const days = useMemo(() => {
    const now = new Date();
    const arr: { date: Date; label: string; shortLabel: string; key: number }[] = [];
    for (let i = 0; i < dayRange; i++) {
      const d = new Date();
      d.setDate(now.getDate() + startOffset + i);
      d.setHours(0, 0, 0, 0);
      arr.push({
        date: d,
        label: formatDate(d),
        shortLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        key: d.getTime(),
      });
    }
    return arr;
  }, [startOffset]);

  const grouped = useMemo(() => {
    const g: Record<number, CardWithMeta[]> = {};
    for (const card of allCards) {
      if (!card.dueDate) continue;
      const d = new Date(card.dueDate);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      if (!g[key]) g[key] = [];
      g[key].push(card as CardWithMeta);
    }
    return g;
  }, [allCards]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalScheduled = days.reduce((sum, day) => sum + (grouped[day.key]?.length || 0), 0);
    const todayCards = days.filter(d => isToday(d.date)).reduce((sum, day) => sum + (grouped[day.key]?.length || 0), 0);
    const overdueCards = days.filter(d => isPast(d.date)).reduce((sum, day) => sum + (grouped[day.key]?.length || 0), 0);
    const peakDay = days.reduce((max, day) => {
      const count = grouped[day.key]?.length || 0;
      return count > (grouped[max.key]?.length || 0) ? day : max;
    }, days[0]);
    
  // Handle deck moving
  const handleMoveDeck = async () => {
    if (!movingDeck || !selectedTargetDate) return;

    try {
      const fromDate = new Date(movingDeck.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(selectedTargetDate);
      toDate.setHours(0, 0, 0, 0);

      // Get all cards for this deck on the from date
      const cardsToMove = grouped[movingDeck.fromDate]?.filter(c => c.deckId === movingDeck.deckId) || [];

      if (cardsToMove.length === 0) {
        alert("No cards found to move");
        return;
      }

      // Update each card's due date
      for (const card of cardsToMove) {
        await fetch(`/api/cards?id=${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: toDate.toISOString() }),
        });
      }

      // Refresh the page to update the timeline
      window.location.reload();
    } catch (error) {
      console.error("Error moving deck:", error);
      alert("Failed to move deck. Please try again.");
    }
  };

    return { totalScheduled, todayCards, overdueCards, peakDay };
  }, [days, grouped]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <CalendarIcon className="text-indigo-600" size={28} />
              Review Timeline
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              Plan your study schedule for the next two weeks
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setStartOffset((s) => s - 7)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Previous week"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-3 text-sm font-medium text-gray-600">
              {days[0]?.label.split(',')[0]} - {days[days.length - 1]?.label.split(',')[0]}
            </span>
            <button
              onClick={() => setStartOffset((s) => s + 7)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Next week"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="opacity-90" />
              <span className="text-xs font-semibold uppercase opacity-90">Today</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black">{stats.todayCards}</p>
          </div>

          <div className="bg-white border-2 border-red-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-red-600">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase">Overdue</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.overdueCards}</p>
          </div>

          <div className="bg-white border-2 border-indigo-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-indigo-600">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase">Scheduled</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalScheduled}</p>
          </div>

          <div className="bg-white border-2 border-orange-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-orange-600">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase">Peak Day</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              {grouped[stats.peakDay?.key]?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
        {days.map((day) => {
          const dayCards = grouped[day.key] || [];
          const totalCards = dayCards.length;
          const today = isToday(day.date);
          const past = isPast(day.date);
          const isExpanded = expandedDay === day.key;

          // Group cards by deck for expanded view
          const deckGroups = dayCards.reduce((acc, card) => {
            if (!acc[card.deckId]) acc[card.deckId] = [];
            acc[card.deckId].push(card);
            return acc;
          }, {} as Record<string, CardWithMeta[]>);

          return (
            <div
              key={day.key}
              className={`rounded-xl p-4 border-2 transition-all ${
                today
                  ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 shadow-md'
                  : past && totalCards > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
              } ${isExpanded ? 'col-span-full shadow-xl' : 'hover:shadow-md cursor-pointer'}`}
              onClick={() => !isExpanded && setExpandedDay(day.key)}
            >
              <div className={`mb-3 ${isExpanded ? 'flex items-center justify-between' : ''}`}>
                <div className={isExpanded ? 'flex items-center gap-4' : ''}>
                  <div className={`text-xs font-bold uppercase tracking-wide ${isExpanded ? '' : 'mb-1'} ${
                    today ? 'text-indigo-600' : past ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {isExpanded ? formatDate(day.date) : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  {!isExpanded && (
                    <div className="flex items-baseline justify-between">
                      <div className={`text-lg font-black ${today ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {day.date.getDate()}
                      </div>
                      <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                        totalCards > 50 ? 'bg-red-100 text-red-700' :
                        totalCards > 20 ? 'bg-orange-100 text-orange-700' :
                        totalCards > 0 ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {totalCards}
                      </div>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-black px-4 py-1 rounded-full ${
                      totalCards > 50 ? 'bg-red-100 text-red-700' :
                      totalCards > 20 ? 'bg-orange-100 text-orange-700' :
                      totalCards > 0 ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {totalCards} cards
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(null);
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Collapse
                    </button>
                  </div>
                )}
              </div>

              {/* Deck breakdown */}
              {isExpanded ? (
                <div className="space-y-3">
                  {Object.entries(deckGroups).map(([deckId, cards]) => (
                    <div
                      key={deckId}
                      className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Layers size={18} className="text-indigo-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {cards[0]?.deckTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cards.length} card{cards.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMovingDeck({
                            deckId,
                            deckTitle: cards[0]?.deckTitle || 'Untitled',
                            fromDate: day.key,
                          });
                        }}
                        className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <CalendarIcon size={16} />
                        Move Deck
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(deckGroups).slice(0, 3).map(([deckId, cards]) => (
                    <div key={deckId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Layers size={14} className="text-indigo-500 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">{cards[0]?.deckTitle}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{cards.length}</span>
                    </div>
                  ))}
                  {Object.keys(deckGroups).length > 3 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      +{Object.keys(deckGroups).length - 3} more deck{Object.keys(deckGroups).length - 3 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Tips */}
      <div className="mt-6 sm:mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <CalendarIcon size={16} />
          Planning Tips
        </h3>
        <ul className="text-xs sm:text-sm text-indigo-700 space-y-1">
          <li>• <strong>Click on a day</strong> to expand and see all decks scheduled</li>
          <li>• <strong>Move decks</strong> to different days to balance your workload</li>
          <li>• <strong>Today</strong> is highlighted in blue - tackle these first!</li>
          <li>• <strong>Overdue cards</strong> appear in red - catch up when possible</li>
          <li>• <strong>Peak days</strong> (50+ cards) may need extra time or spreading out</li>
        </ul>
      </div>

      {/* Move Deck Modal */}
      {movingDeck && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setMovingDeck(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CalendarIcon className="text-indigo-600" size={24} />
              Move Deck
            </h3>
            <p className="text-gray-600 mb-4">
              Moving <strong>{movingDeck.deckTitle}</strong> from{' '}
              <strong>{formatDate(new Date(movingDeck.fromDate))}</strong>
            </p>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">
                Select new date:
              </span>
              <input
                type="date"
                value={selectedTargetDate}
                onChange={(e) => setSelectedTargetDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleMoveDeck();
                  setMovingDeck(null);
                  setSelectedTargetDate("");
                }}
                disabled={!selectedTargetDate}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Move Deck
              </button>
              <button
                onClick={() => {
                  setMovingDeck(null);
                  setSelectedTargetDate("");
                }}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;