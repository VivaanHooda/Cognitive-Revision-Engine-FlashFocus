# FlashFocus - Next.js Port

AI-powered spaced repetition flashcard application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🧠 **AI-Powered Deck Generation**: Use Google Gemini AI to automatically create flashcard decks from any topic
- 📊 **Spaced Repetition System (SRS)**: Implements the SM-2 algorithm for optimal learning
- 💬 **AI Tutor**: Get instant clarification on any flashcard with conversational AI
- 📈 **Statistics Dashboard**: Track your learning progress with detailed insights
- 🎯 **Smart Card Queue**: Prioritizes due cards and failed cards for immediate review
- 🎤 **Voice Input**: Use speech recognition for answering flashcards
- 🔐 **User Authentication**: Simple JWT-based authentication with localStorage

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Rewise-main
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional, API key is stored in browser):
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Register a new account (stored locally in browser)
2. Add your Google Gemini API key in the deck creation modal
3. Create your first AI-generated deck!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Icons**: Lucide React
- **Storage**: Browser localStorage (client-side only)

## Project Structure

```
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main app page
│   └── globals.css     # Global styles
├── components/
│   ├── Auth.tsx        # Authentication component
│   ├── DeckList.tsx    # Deck library view
│   ├── Flashcard.tsx   # 3D flip card component
│   ├── Statistics.tsx  # Analytics dashboard
│   └── StudyView.tsx   # Study session interface
├── lib/
│   ├── types.ts        # TypeScript definitions
│   ├── authService.ts  # Authentication logic
│   ├── db.ts           # localStorage database
│   ├── geminiService.ts # AI integration
│   ├── srs.ts          # Spaced repetition algorithm
│   └── mockData.ts     # Initial sample decks
```

## Features in Detail

### AI Deck Generation
1. Enter any topic (e.g., "Photosynthesis", "React Hooks")
2. AI breaks it down into logical subtopics
3. Select which subtopics to generate
4. Get 6-10 atomic flashcards per subtopic

### Spaced Repetition
- **Again**: Card forgotten, review in < 1 day
- **Hard**: Partially remembered, modest interval increase
- **Good**: Correctly recalled, standard interval
- **Easy**: Effortlessly recalled, longest interval

### AI Tutor
- Ask questions about any flashcard during study
- Context-aware responses based on card content
- Conversational interface within study session

## Build for Production

```bash
npm run build
npm start
```

## Notes

- All data is stored in browser localStorage
- API keys are stored client-side only
- No backend server required
- Works completely offline after initial load (except AI features)

## License

MIT

## Original Project

Ported from Vite + React to Next.js App Router.
