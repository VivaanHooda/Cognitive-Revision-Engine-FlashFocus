# Deck & Card Management Features

## Overview
This document describes the new deck and card management features added to the Cognitive Revision Engine.

## Features Implemented

### 1. Starred Decks ⭐
**Purpose**: Quickly access your most important or frequently used decks.

**How to use**:
- Click the star icon in the top-right corner of any deck card
- Starred decks have a yellow/golden star icon
- Use the "Starred" filter button at the top to view only starred decks

**Technical Details**:
- Added `is_starred` boolean column to `decks` table
- API endpoint: `PUT /api/decks` with `isStarred` field
- Persists across sessions

### 2. Bookmarked Cards 🔖
**Purpose**: Mark difficult or important cards during study sessions for later review.

**How to use**:
- During a study session, click the "Bookmark this card" button below the grade buttons
- Bookmarked cards have a filled amber bookmark icon
- View all decks with bookmarked cards using the "Bookmarked" filter

**Technical Details**:
- Added `is_bookmarked` boolean and `bookmarked_at` timestamp to `cards` table
- API endpoint: `PUT /api/cards` with `isBookmarked` field
- Automatically sets `bookmarked_at` when bookmarking

### 3. Category Management 📁
**Purpose**: Organize and reorder your learning categories.

**How to use**:
- Click the "Categories" button in the top navigation
- View all your learning categories with deck counts
- Visual order indicator shows current sequence
- (Drag-and-drop reordering coming soon)

**Technical Details**:
- Added `category_order` integer column to `decks` table
- Categories sorted by `category_order` field
- API ready for reordering updates

## Database Migration

**IMPORTANT**: Run the migration file before using these features!

```bash
# Navigate to Supabase dashboard SQL editor
# Copy and paste contents of:
supabase/migrations/20260121_add_starred_bookmarked_ordering.sql
```

The migration adds:
- `is_starred` (boolean) to `decks`
- `category_order` (integer) to `decks`
- `is_bookmarked` (boolean) to `cards`
- `bookmarked_at` (timestamptz) to `cards`
- Performance indexes on new columns

## API Changes

### Decks API (`/api/decks`)
**GET**: Returns `isStarred` and `categoryOrder` fields (transformed from snake_case)

**POST**: Accepts optional `isStarred` and `categoryOrder` fields

**PUT**: Update deck with `{ id, isStarred?, categoryOrder? }`

### Cards API (`/api/cards`)
**GET**: Returns `isBookmarked` and `bookmarkedAt` fields

**POST**: Accepts optional `isBookmarked` field

**PUT**: Update card with `{ id, isBookmarked }` - automatically sets `bookmarkedAt`

## UI Components Updated

### DeckList Component
- Added view filter tabs: All Decks | Starred | Bookmarked
- Star toggle button on each deck card
- Category Manager modal accessible via "Categories" button
- Empty states for each filter view

### StudyView Component
- Bookmark button below grade buttons (Again/Hard/Good/Easy)
- Visual feedback: filled amber bookmark when active
- Updates immediately without page reload

## TypeScript Types

```typescript
interface Deck {
  // ... existing fields
  isStarred?: boolean;
  categoryOrder?: number;
}

interface FlashcardData {
  // ... existing fields
  isBookmarked?: boolean;
  bookmarkedAt?: string;
}
```

## Future Enhancements

1. **Drag-and-Drop Category Reordering**: Visual reordering in Category Manager
2. **Bookmarked Cards Study Mode**: Special review session for only bookmarked cards
3. **Bulk Actions**: Star/unstar multiple decks at once
4. **Smart Filters**: Combine filters (e.g., starred + has due cards)
5. **Statistics**: Show bookmark rate, most starred categories

## Testing Checklist

- [ ] Run database migration in Supabase
- [ ] Star a deck and verify it persists after refresh
- [ ] Filter by "Starred" view
- [ ] Bookmark a card during study
- [ ] Verify bookmarked card shows in "Bookmarked" filter
- [ ] Open Category Manager and view categories
- [ ] Unstar a deck and verify it's removed from Starred view
- [ ] Unbookmark a card and verify behavior

## Performance Notes

- Indexes created on `is_starred` and `is_bookmarked` for fast filtering
- Category ordering index supports efficient sorted queries
- Partial indexes (WHERE clauses) reduce index size

## Browser Compatibility

All features use standard React hooks and Lucide icons. Compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
