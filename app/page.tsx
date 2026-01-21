"use client";

import React, { useState, useEffect } from "react";
import { AppView, Deck, User } from "@/lib/types";
import { DeckList } from "@/components/DeckList";
import { StudyView } from "@/components/StudyView";
import { Statistics } from "@/components/Statistics";
import { Timeline } from "@/components/Timeline";
import { Auth } from "@/components/Auth";
import { DocumentsView } from "@/components/DocumentsView";
import DocumentStudyView from "@/components/DocumentStudyView";
import { db } from "@/lib/db";
import * as authClient from "@/lib/auth.client";
import { createClient } from "@/lib/supabase.client";
import {
  LayoutGrid,
  BarChart2,
  Loader2,
  LogOut,
  User as UserIcon,
  Calendar as CalendarIcon,
  FileText,
} from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [studyDocumentId, setStudyDocumentId] = useState<string | null>(null);
  const [studyDocumentTitle, setStudyDocumentTitle] = useState<string>("");
  const [authReady, setAuthReady] = useState(false);
  const [virtualBookmarkedDeck, setVirtualBookmarkedDeck] = useState<Deck | null>(null);

  // Set up auth state listener and check for existing session
  useEffect(() => {
    const supabase = createClient();
    let authCheckComplete = false;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth State Change]', event, session?.user?.id);
      
      // Only respond to INITIAL_SESSION to avoid duplicate fetches
      // SIGNED_IN is followed immediately by INITIAL_SESSION anyway
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
          };
          setCurrentUser(user);
          setView(AppView.HOME);
        } else {
          setCurrentUser(null);
          setView(AppView.AUTH);
        }
        
        if (!authCheckComplete) {
          authCheckComplete = true;
          setAuthReady(true);
        }
      } else if (event === 'SIGNED_IN') {
        // Just set the user, but don't trigger auth ready yet
        // Wait for INITIAL_SESSION to actually fetch data
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
          };
          setCurrentUser(user);
          setView(AppView.HOME);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setView(AppView.AUTH);
        setDecks([]);
        setActiveDeckId(null);
        if (!authCheckComplete) {
          authCheckComplete = true;
          setAuthReady(true);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Update user on token refresh but don't re-fetch decks
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        };
        setCurrentUser(user);
      }
    });

    // Set timeout to mark auth as ready even if no event fires
    const timeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.log('[Auth] Timeout reached, marking auth as ready');
        authCheckComplete = true;
        setAuthReady(true);
      }
    }, 1000);

    // Cleanup subscription
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch data when user changes and auth is ready
  useEffect(() => {
    if (!authReady || !currentUser) {
      setDecks([]);
      setIsDataLoading(false);
      return;
    }
    
    const initData = async () => {
      setIsDataLoading(true);
      try {
        console.log('[initData] Starting deck fetch for user:', currentUser.id);
        
        // Wait longer for session to be fully available
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify session is still valid and has an access token
        const supabase = createClient();
        let session = null;
        let attempts = 0;
        
        // Retry getting session with token up to 3 times
        while (attempts < 3 && (!session || !session.access_token)) {
          const { data: { session: sess }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[initData] Session error:', sessionError);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            continue;
          }
          
          if (sess && sess.access_token) {
            session = sess;
            break;
          }
          
          console.warn('[initData] No valid session or token, attempt', attempts + 1);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!session || !session.access_token) {
          console.error('[initData] Failed to get valid session after', attempts, 'attempts');
          setDecks([]);
          setIsDataLoading(false);
          return;
        }
        
        console.log('[initData] Session valid with token, fetching decks...');
        
        // Try to initialize decks (non-fatal if fails)
        try {
          await db.init(currentUser.id);
        } catch (initError) {
          console.warn("Failed to initialize decks, continuing anyway:", initError);
        }
        
        // Load existing decks
        const data = await db.getDecks(currentUser.id);
        console.log('[initData] Fetched decks:', data?.length || 0);
        setDecks(data || []);
      } catch (error) {
        console.error("Failed to load data:", error);
        setDecks([]);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    initData();
  }, [currentUser, authReady]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setView(AppView.HOME);
  };

  const handleLogout = async () => {
    try {
      await authClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      setView(AppView.AUTH);
      setActiveDeckId(null);
      setDecks([]);
    }
  };

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    setView(AppView.STUDY);
  };

  const handleSelectVirtualDeck = (deck: Deck) => {
    setVirtualBookmarkedDeck(deck);
    setActiveDeckId(deck.id);
    setView(AppView.STUDY);
  };

  const handleUpdateDeck = async (updatedDeck: Deck) => {
    if (!currentUser) return;
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );
    try {
      await db.updateDeck(currentUser.id, updatedDeck);
    } catch (error) {
      console.error("Failed to update deck in DB", error);
    }
  };

  const handleAddDeck = async (newDeck: Deck) => {
    if (!currentUser) return;
    setDecks((prev) => [newDeck, ...prev]);
    try {
      await db.addDeck(currentUser.id, newDeck);
    } catch (error) {
      console.error("Failed to add deck to DB", error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to delete this deck?")) {
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
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

  const activeDeck = decks.find((d) => d.id === activeDeckId) || virtualBookmarkedDeck;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {view !== AppView.STUDY && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setView(AppView.HOME)}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                F
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:inline">
                FlashFocus
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                <button
                  onClick={() => setView(AppView.HOME)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${
                    view === AppView.HOME
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden md:inline">Library</span>
                </button>
                <button
                  onClick={() => setView(AppView.DOCUMENTS)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${
                    view === AppView.DOCUMENTS
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <FileText size={18} />
                  <span className="hidden md:inline">Documents</span>
                </button>
                <button
                  onClick={() => setView(AppView.TIMELINE)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${
                    view === AppView.TIMELINE
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <CalendarIcon size={18} />
                  <span className="hidden md:inline">Timeline</span>
                </button>

                <button
                  onClick={() => setView(AppView.STATS)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold ${
                    view === AppView.STATS
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <BarChart2 size={18} />
                  <span className="hidden md:inline">Insights</span>
                </button>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="flex items-center gap-3 ml-2">
                {/* <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900">
                    {currentUser?.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {currentUser?.email}
                  </span>
                </div> */}
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                  <UserIcon size={18} />
                </div>
                <span className="hidden sm:inline ml-2 text-sm font-semibold text-gray-900">
                  {currentUser?.name || currentUser?.email}
                </span>
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
            <p className="text-gray-500 font-medium">
              Synchronizing your library...
            </p>
          </div>
        ) : (
          <>
            {view === AppView.HOME && (
              <DeckList
                decks={decks}
                onSelectDeck={handleSelectDeck}
                onSelectVirtualDeck={handleSelectVirtualDeck}
                onAddDeck={handleAddDeck}
                onUpdateDeck={handleUpdateDeck}
                onDeleteDeck={handleDeleteDeck}
                userId={currentUser?.id || ""}
              />
            )}

            {view === AppView.DOCUMENTS && (
              <DocumentsView 
                userId={currentUser?.id || ""}
                onStudyDocument={(docId: string, docTitle: string) => {
                  setStudyDocumentId(docId);
                  setStudyDocumentTitle(docTitle);
                  setView(AppView.DOCUMENT_STUDY);
                }}
              />
            )}

            {view === AppView.DOCUMENT_STUDY && studyDocumentId && (
              <DocumentStudyView
                documentId={studyDocumentId}
                documentTitle={studyDocumentTitle}
                onBack={() => setView(AppView.DOCUMENTS)}
              />
            )}

            {view === AppView.STUDY && activeDeck && (
              <StudyView
                deck={activeDeck}
                onExit={() => setView(AppView.HOME)}
                onUpdateDeck={handleUpdateDeck}
              />
            )}

            {view === AppView.TIMELINE && <Timeline decks={decks} />}

            {view === AppView.STATS && <Statistics decks={decks} />}
          </>
        )}
      </main>
    </div>
  );
}
