
import { Deck } from '../types';
import { INITIAL_DECKS } from './mockData';

const DB_KEY_PREFIX = 'flashfocus-db-v1-user-';
const DELAY_MS = 200;

const delay = <T>(data: T): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), DELAY_MS));
};

export const db = {
  getStorageKey(userId: string): string {
    return `${DB_KEY_PREFIX}${userId}`;
  },

  async init(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const key = this.getStorageKey(userId);
    const existing = localStorage.getItem(key);
    
    if (!existing) {
      // Seed with sample data for new user, but set userId correctly
      const initial = INITIAL_DECKS.map(d => ({ ...d, userId }));
      localStorage.setItem(key, JSON.stringify(initial));
    }
    return delay(undefined);
  },

  async getDecks(userId: string): Promise<Deck[]> {
    const key = this.getStorageKey(userId);
    const json = localStorage.getItem(key);
    if (!json) return delay([]);
    return delay(JSON.parse(json));
  },

  async addDeck(userId: string, deck: Deck): Promise<Deck> {
    const decks = await this.getDecks(userId);
    const newDeck = { ...deck, userId };
    const newDecks = [newDeck, ...decks];
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(newDecks));
    return delay(newDeck);
  },

  async updateDeck(userId: string, updatedDeck: Deck): Promise<Deck> {
    const decks = await this.getDecks(userId);
    const newDecks = decks.map(d => d.id === updatedDeck.id ? updatedDeck : d);
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(newDecks));
    return delay(updatedDeck);
  },

  async deleteDeck(userId: string, id: string): Promise<void> {
    const decks = await this.getDecks(userId);
    const newDecks = decks.filter(d => d.id !== id);
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(newDecks));
    return delay(undefined);
  }
};
