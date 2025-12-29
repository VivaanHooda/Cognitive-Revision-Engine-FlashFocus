import { FlashcardData, StudyGrade } from './types';

/**
 * Anki / SM-2 Algorithm Implementation
 */

export const calculateNextReview = (card: FlashcardData, grade: StudyGrade): Partial<FlashcardData> => {
  let { easeFactor, interval, reviewCount } = card;

  // Default values
  if (!easeFactor) easeFactor = 2.5;
  if (!interval) interval = 0;
  if (!reviewCount) reviewCount = 0;

  let newInterval = interval;
  let newEaseFactor = easeFactor;
  let newStatus: FlashcardData['status'] = card.status;

  switch (grade) {
    case 'again':
      newInterval = 0; // < 1 day (minutes)
      newEaseFactor = Math.max(1.3, easeFactor - 0.20);
      newStatus = 'learning';
      break;

    case 'hard':
      newInterval = interval === 0 ? 1 : Math.ceil(interval * 1.2);
      newEaseFactor = Math.max(1.3, easeFactor - 0.15);
      newStatus = 'learning';
      break;

    case 'good':
      if (interval === 0) newInterval = 1;
      else if (interval === 1) newInterval = 6;
      else newInterval = Math.ceil(interval * easeFactor);
      newStatus = 'review';
      break;

    case 'easy':
      if (interval === 0) newInterval = 4;
      else newInterval = Math.ceil(interval * easeFactor * 1.3);
      newEaseFactor = easeFactor + 0.15;
      newStatus = 'mastered';
      break;
  }

  // Status corrections
  if (newStatus === 'mastered' && newInterval < 21) newStatus = 'review';
  if (newStatus === 'learning' && newInterval > 3) newStatus = 'review';

  // Calculate Due Date (Calendar Aligned)
  const now = new Date();
  let nextDueDate = now.getTime();

  if (newInterval < 1) {
      // Intraday / Immediate review (1 minute later)
      nextDueDate = now.getTime() + 60000;
  } else {
      // Calendar scheduling: Add days, then align to 4:00 AM (Anki-style rollover)
      // This ensures if you study at 8pm, a 1-day interval is available at 4am tomorrow (effectively "Tomorrow")
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + newInterval);
      targetDate.setHours(4, 0, 0, 0);
      
      // Edge case: If it's currently 2 AM, "today" might be considered yesterday in some mental models,
      // but for simplicity here, we stick to standard wall-clock date addition.
      
      nextDueDate = targetDate.getTime();
  }

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    status: newStatus,
    reviewCount: reviewCount + 1,
    dueDate: nextDueDate,
    lastReviewed: now.getTime()
  };
};

export const getNextReviewText = (interval: number, grade: StudyGrade): string => {
  if (grade === 'again') return '< 1d';
  
  let nextI = 0;
  if (grade === 'hard') nextI = Math.max(1, Math.ceil(interval * 1.2));
  if (grade === 'good') nextI = interval === 0 ? 1 : (interval === 1 ? 6 : Math.ceil(interval * 2.5));
  if (grade === 'easy') nextI = interval === 0 ? 4 : Math.ceil(interval * 2.5 * 1.3);

  return `${nextI}d`;
};
