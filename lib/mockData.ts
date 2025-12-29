
import { Deck } from './types';

const now = Date.now();
const day = 86400000;

export const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck-1',
    title: 'Basic Phrases',
    description: 'Essential phrases and vocabulary for beginners.',
    parentTopic: 'Spanish Language',
    userId: 'mock-user', // Added missing userId to match Deck interface
    cards: [
      // Due today (Review)
      { id: 'c1', front: 'Hello', back: 'Hola', status: 'review', easeFactor: 2.5, interval: 1, reviewCount: 3, dueDate: now - day, lastReviewed: now - (day * 2) },
      // Due today (Learning)
      { id: 'c2', front: 'Thank you', back: 'Gracias', status: 'learning', easeFactor: 2.5, interval: 0, reviewCount: 1, dueDate: now - 1000, lastReviewed: now - day },
      // New
      { id: 'c3', front: 'Water', back: 'Agua', status: 'new', easeFactor: 2.5, interval: 0, reviewCount: 0 },
      { id: 'c4', front: 'Good morning', back: 'Buenos días', status: 'new', easeFactor: 2.5, interval: 0, reviewCount: 0 },
      // Future
      { id: 'c5', front: 'Friend', back: 'Amigo', status: 'review', easeFactor: 2.6, interval: 4, reviewCount: 5, dueDate: now + (day * 3), lastReviewed: now - day },
    ],
    lastStudied: now - day,
  },
  {
    id: 'deck-2',
    title: 'Core Hooks',
    description: 'Core concepts of React functional components.',
    parentTopic: 'React Development',
    userId: 'mock-user', // Added missing userId to match Deck interface
    cards: [
      { id: 'r1', front: 'useState', back: 'Manages state in a functional component.', status: 'review', easeFactor: 2.6, interval: 1, reviewCount: 2, dueDate: now - day, lastReviewed: now - (day * 2) },
      { id: 'r2', front: 'useEffect', back: 'Handles side effects like data fetching or subscriptions.', status: 'learning', easeFactor: 2.4, interval: 0, reviewCount: 1, dueDate: now, lastReviewed: now - 3600000 },
      { id: 'r3', front: 'useContext', back: 'Accesses context values without nesting.', status: 'new', easeFactor: 2.5, interval: 0, reviewCount: 0 },
    ],
  },
  {
    id: 'deck-3',
    title: 'Geography Trivia',
    description: 'Test your geography knowledge.',
    parentTopic: 'General Knowledge',
    userId: 'mock-user', // Added missing userId to match Deck interface
    cards: [
      // Mastered, due far in future
      { id: 'w1', front: 'France', back: 'Paris', status: 'mastered', easeFactor: 2.9, interval: 10, reviewCount: 5, dueDate: now + (day * 9), lastReviewed: now - day },
      // Mastered, reviewed today
      { id: 'w2', front: 'Japan', back: 'Tokyo', status: 'mastered', easeFactor: 2.8, interval: 12, reviewCount: 6, dueDate: now + (day * 12), lastReviewed: now },
    ],
  }
];
