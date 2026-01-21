import { Deck } from "./types";
import { INITIAL_DECKS } from "./mockData";
import { supabase } from "./supabase.client";

async function safeFetch(path: string, opts: RequestInit = {}) {
  // Attach Supabase access token if available so server can verify via Authorization header
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = (session as any)?.access_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(path, { ...opts, credentials: "include", headers });

    // If unauthorized, clear session and return to login
    if (res.status === 401 && typeof window !== "undefined") {
      console.warn("Session expired, redirecting to login...");
      await supabase.auth.signOut();
      // Instead of hard reload, let the auth state listener handle it
      // This prevents infinite loops
      throw new Error("Session expired");
    }

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (!res.ok) throw new Error(json?.error || text || res.statusText);
      return json;
    } catch (e) {
      if (!res.ok) throw new Error(text || res.statusText);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  } catch (e) {
    // If token retrieval fails, fall back to request without Authorization
    const res = await fetch(path, { ...opts, credentials: "include" });
    const text = await res.text();
    
    // If unauthorized, clear session and return to login
    if (res.status === 401 && typeof window !== "undefined") {
      console.warn("No valid session, redirecting to login...");
      await supabase.auth.signOut();
      throw new Error("Not authenticated");
    }
    
    try {
      const json = JSON.parse(text);
      if (!res.ok) throw new Error(json?.error || text || res.statusText);
      return json;
    } catch (e2) {
      if (!res.ok) throw new Error(text || res.statusText);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  }
}

export const db = {
  getStorageKey(_userId: string): string {
    // kept for compatibility with existing code
    return `supabase-decks`;
  },

  // Seed initial decks for a new user if they have none
  async init(userId: string): Promise<void> {
    if (typeof window === "undefined") return;
    
    try {
      // Check if session is available before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No session available, skipping deck initialization");
        return;
      }
      
      const decks = await this.getDecks(userId);
      if (!decks || decks.length === 0) {
        console.log("No decks found, creating initial decks...");
        // Insert initial decks into Supabase - map to correct field names
        const toInsert = INITIAL_DECKS.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          parentTopic: d.parentTopic,
          cards: d.cards,
          lastStudied: d.lastStudied,
        }));
        await safeFetch("/api/decks", {
          method: "POST",
          body: JSON.stringify(toInsert),
        });
        console.log("Initial decks created successfully");
      }
    } catch (error) {
      // Don't block app startup if initial deck creation fails
      console.warn("Failed to initialize decks (non-fatal):", error);
      // Rethrow only if it's a critical auth error that should stop the flow
      if (error instanceof Error && error.message === "Not authenticated") {
        throw error;
      }
    }
    return;
  },

  async getDecks(_userId: string): Promise<Deck[]> {
    const res = await safeFetch("/api/decks");
    // Also fetch cards for each deck and attach them (backwards compatibility)
    const decks: Deck[] = res || [];
    if (decks.length === 0) return decks;

    try {
      const allCards = await safeFetch("/api/cards");
      const cardsByDeck: Record<string, any[]> = {};
      for (const c of allCards) {
        cardsByDeck[c.deck_id] = cardsByDeck[c.deck_id] || [];
        cardsByDeck[c.deck_id].push({
          id: c.id,
          front: c.front,
          back: c.back,
          status: c.status,
          easeFactor: c.ease_factor,
          stability: c.stability,
          difficulty: c.difficulty,
          interval: c.interval,
          reviewCount: c.review_count,
          dueDate: c.due_date,
          lastReviewed: c.last_reviewed,
          meta: c.meta,
        });
      }
      return decks.map((d) => ({ ...d, cards: cardsByDeck[d.id] || [] }));
    } catch (e) {
      // If cards fetch fails, return decks as-is with embedded cards field
      return decks;
    }
  },

  async addDeck(_userId: string, deck: Deck): Promise<Deck> {
    const res = await safeFetch("/api/decks", {
      method: "POST",
      body: JSON.stringify(deck),
    });
    return Array.isArray(res) ? res[0] : res;
  },

  async updateDeck(_userId: string, updatedDeck: Deck): Promise<Deck> {
    const res = await safeFetch("/api/decks", {
      method: "PUT",
      body: JSON.stringify(updatedDeck),
    });
    return res;
  },

  async deleteDeck(_userId: string, id: string): Promise<void> {
    // Prefer query-string id for delete
    await safeFetch(`/api/decks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  },
};
