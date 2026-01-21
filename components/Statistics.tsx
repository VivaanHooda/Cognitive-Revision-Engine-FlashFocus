'use client';

import React, { useMemo } from 'react';
import { Deck } from '@/lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, Zap, Target, Calendar, CheckCircle, 
  Clock, Award, Brain, Flame, BarChart3, Activity, Trophy
} from 'lucide-react';

interface StatsProps {
  decks: Deck[];
}

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const Statistics: React.FC<StatsProps> = ({ decks }) => {
  const allCards = useMemo(() => decks.flatMap(d => d.cards), [decks]);
  const totalCards = allCards.length;

  // Core Metrics
  const metrics = useMemo(() => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayTs = startOfDay.getTime();

    // Cards reviewed today
    const reviewedToday = allCards.filter(c => 
      c.lastReviewed && c.lastReviewed >= startOfDayTs
    ).length;

    // Retention rate (cards with interval > 7 days / total reviewed cards)
    const longTermCards = allCards.filter(c => 
      c.status !== 'new' && (c.interval || 0) >= 7
    ).length;
    const reviewedCards = allCards.filter(c => c.status !== 'new').length;
    const retentionRate = reviewedCards > 0 
      ? Math.round((longTermCards / reviewedCards) * 100) 
      : 0;

    // Average interval (proof of spacing)
    const avgInterval = reviewedCards > 0
      ? Math.round(allCards.reduce((sum, c) => sum + (c.interval || 0), 0) / reviewedCards)
      : 0;

    // Study streak (consecutive days with reviews)
    const studyDays = new Set<string>();
    allCards.forEach(c => {
      if (c.lastReviewed) {
        const date = new Date(c.lastReviewed);
        studyDays.add(date.toDateString());
      }
    });
    const streak = studyDays.size;

    // Cards due today
    const dueToday = allCards.filter(c => 
      c.status !== 'new' && (!c.dueDate || c.dueDate <= now)
    ).length;

    // Mastered cards (interval >= 21 days)
    const masteredCards = allCards.filter(c => (c.interval || 0) >= 21).length;

    // Total reviews
    const totalReviews = allCards.reduce((sum, c) => sum + (c.reviewCount || 0), 0);

    // Time saved calculation (assuming 10 mins per card if cramming vs spaced)
    const timeSavedHours = Math.round((totalReviews * 10 - reviewedCards * 15) / 60);

    return {
      reviewedToday,
      retentionRate,
      avgInterval,
      streak,
      dueToday,
      masteredCards,
      totalReviews,
      timeSavedHours: Math.max(0, timeSavedHours),
    };
  }, [allCards]);

  // 7-day forecast
  const forecastData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i + 1);
      date.setHours(0, 0, 0, 0);
      const count = allCards.filter(c => {
        if (!c.dueDate || c.status === 'new') return false;
        const due = new Date(c.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === date.getTime();
      }).length;
      days.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count,
      });
    }
    return days;
  }, [allCards]);

  // Interval distribution (proof of spacing)
  const intervalDistribution = useMemo(() => {
    const buckets = [
      { range: '<1d', count: 0 },
      { range: '1-3d', count: 0 },
      { range: '4-7d', count: 0 },
      { range: '1-3w', count: 0 },
      { range: '1-3m', count: 0 },
      { range: '>3m', count: 0 },
    ];

    allCards.forEach(c => {
      const interval = c.interval || 0;
      if (interval < 1) buckets[0].count++;
      else if (interval <= 3) buckets[1].count++;
      else if (interval <= 7) buckets[2].count++;
      else if (interval <= 21) buckets[3].count++;
      else if (interval <= 90) buckets[4].count++;
      else buckets[5].count++;
    });

    return buckets;
  }, [allCards]);

  // Deck performance
  const deckPerformance = useMemo(() => {
    return decks.map(deck => {
      const reviewed = deck.cards.filter(c => c.status !== 'new').length;
      const mastered = deck.cards.filter(c => (c.interval || 0) >= 21).length;
      const avgInterval = reviewed > 0
        ? Math.round(deck.cards.reduce((sum, c) => sum + (c.interval || 0), 0) / reviewed)
        : 0;
      const retention = reviewed > 0 ? Math.round((mastered / reviewed) * 100) : 0;

      return {
        title: deck.title,
        total: deck.cards.length,
        reviewed,
        mastered,
        avgInterval,
        retention,
      };
    }).sort((a, b) => b.retention - a.retention);
  }, [decks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <BarChart3 className="text-indigo-600" size={28} />
          Learning Analytics
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-2">
          Track your progress and see how spaced repetition improves retention
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Retention Rate - PRIMARY METRIC */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 sm:p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="opacity-90" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide opacity-90">
              Retention Rate
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black mb-1">{metrics.retentionRate}%</p>
          <p className="text-xs opacity-75">Cards with 7+ day intervals</p>
        </div>

        {/* Avg Interval - PROOF OF SPACING */}
        <div className="bg-white border-2 border-green-200 p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Avg Interval</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.avgInterval}<span className="text-lg font-normal text-gray-500">d</span></p>
          <p className="text-xs text-gray-500 mt-1">Spacing is working!</p>
        </div>

        {/* Study Streak */}
        <div className="bg-white border-2 border-orange-200 p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-orange-600">
            <Flame size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Study Days</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.streak}</p>
          <p className="text-xs text-gray-500 mt-1">Total unique days</p>
        </div>

        {/* Mastered Cards */}
        <div className="bg-white border-2 border-purple-200 p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-purple-600">
            <Award size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Mastered</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.masteredCards}</p>
          <p className="text-xs text-gray-500 mt-1">21+ day intervals</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <CheckCircle size={16} />
            <span className="text-xs font-semibold">Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.reviewedToday}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <Clock size={16} />
            <span className="text-xs font-semibold">Due Now</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.dueToday}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <Activity size={16} />
            <span className="text-xs font-semibold">Reviews</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.totalReviews}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <Zap size={16} />
            <span className="text-xs font-semibold">Time Saved</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.timeSavedHours}<span className="text-sm font-normal text-gray-500">h</span></p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* 7-Day Forecast */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-gray-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Upcoming Reviews</h3>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interval Distribution - PROOF OF SRS */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-gray-600" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Spacing Distribution</h3>
              <p className="text-xs text-gray-500">Proof that SRS works</p>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intervalDistribution} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="range" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deck Performance Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-gray-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Deck Performance</h3>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Deck
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Total
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Retention
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Avg Interval
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mastered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deckPerformance.slice(0, 10).map((deck, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 max-w-[150px] sm:max-w-none truncate">
                      {deck.title}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                      {deck.total}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        deck.retention >= 70 ? 'bg-green-100 text-green-800' :
                        deck.retention >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deck.retention}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                      {deck.avgInterval}d
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-indigo-600">
                      {deck.mastered}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {deckPerformance.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">
            No decks yet. Start studying to see performance data!
          </p>
        )}
      </div>
    </div>
  );
};
