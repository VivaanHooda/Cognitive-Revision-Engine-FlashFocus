'use client';

import React, { useMemo } from 'react';
import { Deck, FlashcardData } from '@/lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { Trophy, Target, Activity, Layers, BookOpen, Brain, TrendingUp, Clock, CheckCircle, Star, Calendar, Award } from 'lucide-react';

interface StatsProps {
  decks: Deck[];
}

// Anki-like Color Palette
const COLORS = {
  new: '#3b82f6',      // Blue
  learning: '#f97316', // Orange
  review: '#10b981',   // Emerald
  mastered: '#15803d', // Dark Green
  background: '#f8fafc',
  grid: '#e2e8f0',
  text: '#64748b'
};

export const Statistics: React.FC<StatsProps> = ({ decks }) => {
  // Aggregate all cards into a single array for global stats
  const allCards = useMemo(() => decks.flatMap(d => d.cards), [decks]);
  const totalCards = allCards.length;

  // --- Today's Stats Calculation ---
  const todayStats = useMemo(() => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const startOfDayTs = startOfDay.getTime();

    const reviewsDue = allCards.filter(c => c.status !== 'new' && (!c.dueDate || c.dueDate <= now)).length;
    const newItems = allCards.filter(c => c.status === 'new').length;
    const completedToday = allCards.filter(c => c.lastReviewed && c.lastReviewed >= startOfDayTs).length;
    const remainingToday = reviewsDue + newItems; 

    return { reviewsDue, newItems, completedToday, remainingToday };
  }, [allCards]);

  // --- Content Mastery Calculation (Per Subject/Deck) ---
  const subjectMastery = useMemo(() => {
    return decks.map(deck => {
      const total = deck.cards.length;
      const counts = {
        mastered: deck.cards.filter(c => c.status === 'mastered').length,
        review: deck.cards.filter(c => c.status === 'review').length,
        learning: deck.cards.filter(c => c.status === 'learning').length,
        new: deck.cards.filter(c => c.status === 'new').length,
      };

      const masteryPercent = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;
      const seenPercent = total > 0 ? Math.round(((total - counts.new) / total) * 100) : 0;
      
      const avgInterval = total > 0 
        ? (deck.cards.reduce((acc, c) => acc + (c.interval || 0), 0) / total).toFixed(1)
        : 0;

      return {
        id: deck.id,
        title: deck.title,
        topic: deck.parentTopic || 'General',
        counts,
        total,
        masteryPercent,
        seenPercent,
        avgInterval
      };
    });
  }, [decks]);

  // --- KPI Stats ---
  const totalReviews = useMemo(() => 
    allCards.reduce((acc, card) => acc + (card.reviewCount || 0), 0)
  , [allCards]);

  const avgEase = useMemo(() => {
    if (totalCards === 0) return 0;
    const sum = allCards.reduce((acc, card) => acc + (card.easeFactor || 2.5), 0);
    return (sum / totalCards).toFixed(2);
  }, [allCards, totalCards]);

  // --- CHART 1: Card Status (Pie Chart) ---
  const statusData = useMemo(() => {
    const counts = { new: 0, learning: 0, review: 0, mastered: 0 };
    allCards.forEach(c => {
      const s = c.status || 'new';
      if (counts[s] !== undefined) counts[s]++;
    });

    return [
      { name: 'New', value: counts.new, color: COLORS.new },
      { name: 'Learning', value: counts.learning, color: COLORS.learning },
      { name: 'Review', value: counts.review, color: COLORS.review },
      { name: 'Mastered', value: counts.mastered, color: COLORS.mastered },
    ].filter(d => d.value > 0);
  }, [allCards]);

  // --- CHART 2: Future Due Forecast (7 Days) ---
  const forecastData = useMemo(() => {
    const now = new Date();
    const days = [];
    for(let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i + 1);
        d.setHours(0,0,0,0);
        days.push({
            date: d,
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            count: 0
        });
    }

    allCards.forEach(c => {
        if (!c.dueDate || c.status === 'new') return;
        const due = new Date(c.dueDate);
        due.setHours(0,0,0,0);
        const dayStat = days.find(d => d.date.getTime() === due.getTime());
        if (dayStat) dayStat.count++;
    });

    return days.map(d => ({ name: d.label, count: d.count }));
  }, [allCards]);

  // --- CHART 3: Ease Factor Distribution ---
  const easeData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for(let i = 13; i <= 30; i++) buckets[(i/10).toFixed(1)] = 0;
    allCards.forEach(c => {
        if (c.status === 'new') return;
        const ef = c.easeFactor || 2.5;
        const key = ef.toFixed(1);
        if (buckets[key] !== undefined) buckets[key]++;
    });
    return Object.entries(buckets).map(([ease, count]) => ({ ease, count }));
  }, [allCards]);


  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      
      {/* TODAY'S DASHBOARD */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Today's Progress</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Reviews Due</p>
                    <p className="text-3xl font-bold text-gray-900">{todayStats.reviewsDue}</p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Clock size={24} />
                </div>
            </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">New Cards</p>
                    <p className="text-3xl font-bold text-gray-900">{todayStats.newItems}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Star size={24} />
                </div>
            </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500"></div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{todayStats.completedToday}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <CheckCircle size={24} />
                </div>
            </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-gray-400"></div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Total Due</p>
                    <p className="text-3xl font-bold text-gray-900">{todayStats.remainingToday}</p>
                </div>
                <div className="p-3 bg-gray-50 text-gray-500 rounded-xl">
                    <Layers size={24} />
                </div>
            </div>
        </div>
      </div>

      {/* CONTENT MASTERY BLOCK (New Section) */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
            <Award className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Content Mastery</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjectMastery.map(subj => (
                <div key={subj.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{subj.topic}</span>
                            <h3 className="text-lg font-bold text-gray-800 leading-tight">{subj.title}</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-indigo-600">{subj.masteryPercent}%</span>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Mastery Score</p>
                        </div>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex mb-4">
                        <div 
                            className="h-full bg-green-700 transition-all duration-500" 
                            style={{ width: `${(subj.counts.mastered / subj.total) * 100}%` }}
                            title={`Mastered: ${subj.counts.mastered}`}
                        />
                        <div 
                            className="h-full bg-emerald-400 transition-all duration-500" 
                            style={{ width: `${(subj.counts.review / subj.total) * 100}%` }}
                            title={`Review: ${subj.counts.review}`}
                        />
                        <div 
                            className="h-full bg-orange-400 transition-all duration-500" 
                            style={{ width: `${(subj.counts.learning / subj.total) * 100}%` }}
                            title={`Learning: ${subj.counts.learning}`}
                        />
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(subj.counts.new / subj.total) * 100}%` }}
                            title={`New: ${subj.counts.new}`}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Seen</p>
                            <p className="text-sm font-bold text-gray-700">{subj.seenPercent}%</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Interval</p>
                            <p className="text-sm font-bold text-gray-700">{subj.avgInterval}d</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                            <p className="text-sm font-bold text-gray-700">{subj.total}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 w-full mb-10"></div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Lifetime Statistics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-indigo-500">
            <BookOpen size={20} />
            <span className="text-xs font-bold uppercase tracking-wide">Total Cards</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCards}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-indigo-500">
            <Activity size={20} />
            <span className="text-xs font-bold uppercase tracking-wide">Total Reviews</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
        </div>

         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-indigo-500">
            <Brain size={20} />
            <span className="text-xs font-bold uppercase tracking-wide">Avg Ease Factor</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{avgEase}</p>
            <p className="text-xs text-gray-400 mt-1">Lower = Harder deck</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex items-center gap-2 text-indigo-500">
            <Layers size={20} />
            <span className="text-xs font-bold uppercase tracking-wide">Decks</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{decks.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Target size={18} className="text-gray-400" />
            Card Breakdown
          </h3>
          <p className="text-sm text-gray-500 mb-6">Distribution of card maturity.</p>
          
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-800">{totalCards}</span>
                <p className="text-xs text-gray-400 font-semibold uppercase">Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
             {statusData.map(item => (
                 <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div className="flex-1 flex justify-between">
                        <span className="text-sm font-medium text-gray-600">{item.name}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                 </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            7-Day Forecast
          </h3>
          <p className="text-sm text-gray-500 mb-6">Number of reviews due in the coming days.</p>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis 
                    dataKey="name" 
                    stroke={COLORS.text} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10}
                />
                <YAxis 
                    stroke={COLORS.text} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                />
                <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill={COLORS.review} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">Based on current Due Dates (4 AM rollover)</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Activity size={18} className="text-gray-400" />
          Card Ease Distribution
        </h3>
        <p className="text-sm text-gray-500 mb-6">
            Lower Ease (1.3) = Harder content. Higher Ease (3.0) = Easier content.
        </p>

        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={easeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.learning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.learning} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="ease" stroke={COLORS.text} fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke={COLORS.text} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.learning} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
