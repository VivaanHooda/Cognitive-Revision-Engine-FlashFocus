'use client';

import React, { useState, useEffect } from 'react';
import { AppView, Deck, User } from '@/lib/types';
import { DeckList } from '@/components/DeckList';
import { StudyView } from '@/components/StudyView';
import { Statistics } from '@/components/Statistics';
import { Auth } from '@/components/Auth';
import { db } from '@/lib/db';
import { authService } from '@/lib/authService';
import { LayoutGrid, BarChart2, Loader2, LogOut, User as UserIcon } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('flashfocus-api-key') || '';
    }
    return '';
  });

  // Check for existing JWT session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView(AppView.HOME);
    } else {
      setView(AppView.AUTH);
    }
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      const initData = async () => {
        setIsDataLoading(true);
        try {
          await db.init(currentUser.id);
          const data = await db.getDecks(currentUser.id);
          setDecks(data);
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setIsDataLoading(false);
        }
      };
      initData();
    } else {
      setDecks([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flashfocus-api-key', apiKey);
    }
  }, [apiKey]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setView(AppView.HOME);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setView(AppView.AUTH);
    setActiveDeckId(null);
  };

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    setView(AppView.STUDY);
  };

  const handleUpdateDeck = async (updatedDeck: Deck) => {
    if (!currentUser) return;
    setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
    try {
      await db.updateDeck(currentUser.id, updatedDeck);
    } catch (error) {
      console.error("Failed to update deck in DB", error);
    }
  };

  const handleAddDeck = async (newDeck: Deck) => {
    if (!currentUser) return;
    setDecks(prev => [newDeck, ...prev]);
    try {
      await db.addDeck(currentUser.id, newDeck);
    } catch (error) {
      console.error("Failed to add deck to DB", error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to delete this deck?')) {
      setDecks(prev => prev.filter(d => d.id !== deckId));
      try {
        await db.deleteDeck(currentUser.id, deckId);
      } catch (error) {
        console.error("Failed to delete deck from DB", error);
      }
    }
  };

  if (view === AppView.AUTH) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const activeDeck = decks.find(d => d.id === activeDeckId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {view !== AppView.STUDY && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.HOME)}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                F
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:inline">FlashFocus</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
              <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                <button 
                  onClick={() => setView(AppView.HOME)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${view === AppView.HOME ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden md:inline">Library</span>
                </button>
                <button 
                  onClick={() => setView(AppView.STATS)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${view === AppView.STATS ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <BarChart2 size={18} />
                  <span className="hidden md:inline">Insights</span>
                </button>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="flex items-center gap-3 ml-2">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900">{currentUser?.name}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{currentUser?.email}</span>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                  <UserIcon size={18} />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Log out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main>
        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Synchronizing your library...</p>
          </div>
        ) : (
          <>
            {view === AppView.HOME && (
              <DeckList 
                decks={decks} 
                onSelectDeck={handleSelectDeck}
                onAddDeck={handleAddDeck}
                onDeleteDeck={handleDeleteDeck}
                apiKey={apiKey}
                setApiKey={setApiKey}
                userId={currentUser?.id || ''}
              />
            )}
            
            {view === AppView.STUDY && activeDeck && (
              <StudyView 
                deck={activeDeck} 
                onExit={() => setView(AppView.HOME)} 
                onUpdateDeck={handleUpdateDeck}
                apiKey={apiKey}
              />
            )}

            {view === AppView.STATS && (
              <Statistics decks={decks} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
