
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface FlashcardData {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  easeFactor: number;
  interval: number; // in days
  reviewCount: number;
  dueDate?: number; // timestamp
  lastReviewed?: number; // timestamp
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  parentTopic?: string; // Grouping identifier (e.g., "Operating Systems")
  cards: FlashcardData[];
  lastStudied?: number;
  userId: string; // Owner of the deck
}

export type StudyGrade = 'again' | 'hard' | 'good' | 'easy';

export interface StudySessionState {
  isActive: boolean;
  deckId: string | null;
  cardQueue: FlashcardData[];
  currentCardIndex: number;
  completedCount: number;
  correctCount: number;
}

export enum AppView {
  AUTH = 'AUTH',
  HOME = 'HOME',
  STUDY = 'STUDY',
  STATS = 'STATS',
}
