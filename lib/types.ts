export interface User {
  id: string;
  email: string;
  name: string;
}

export interface FlashcardData {
  id: string;
  front: string;
  back: string;
  status: "new" | "learning" | "review" | "mastered";
  easeFactor: number;
  interval: number; // in days
  reviewCount: number;
  dueDate?: number; // timestamp
  lastReviewed?: number; // timestamp
  // FSRS fields
  stability?: number; // S
  difficulty?: number; // D
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

export type StudyGrade = "again" | "hard" | "good" | "easy";

export interface StudySessionState {
  isActive: boolean;
  deckId: string | null;
  cardQueue: FlashcardData[];
  currentCardIndex: number;
  completedCount: number;
  correctCount: number;
}

export enum AppView {
  AUTH = "AUTH",
  HOME = "HOME",
  STUDY = "STUDY",
  STATS = "STATS",
  TIMELINE = "TIMELINE",
  DOCUMENTS = "DOCUMENTS",
}

// ============================================================================
// Document Ingestion Types
// ============================================================================

/**
 * Topic tree node structure
 * Represents a hierarchical curriculum extracted from a document
 */
export interface TopicNode {
  name: string;
  children?: TopicNode[];
}

/**
 * Document record from the database
 */
export interface Document {
  id: string;
  userId: string;
  filePath: string;
  title: string;
  fileSize?: number;
  mimeType?: string;
  topicTree?: TopicNode;
  isProcessed: boolean;
  processingError?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Document chunk for semantic search
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity?: number; // Only present in search results
}

/**
 * Semantic search result
 */
export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
}

/**
 * Document upload response
 */
export interface UploadResponse {
  success: boolean;
  documentId?: string;
  title?: string;
  chunkCount?: number;
  processingTimeMs?: number;
  error?: string;
  details?: string;
}

/**
 * Topic tree generation response
 */
export interface TopicTreeResponse {
  success: boolean;
  topicTree?: TopicNode;
  cached?: boolean;
  error?: string;
  details?: string;
}
