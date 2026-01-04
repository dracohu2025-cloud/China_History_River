# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**History River** - An interactive web application visualizing 5000 years of Chinese civilization as a flowing "river" of time, with multi-country historical timeline comparison and AI-powered content generation.

## Development Commands

```bash
# Install dependencies
cd history_river && npm install

# Start development server (port 3000)
cd history_river && npm run dev

# Production build
cd history_river && npm run build

# Preview production build
cd history_river && npm run preview

# Inspect Supabase database
cd history_river && npm run db:inspect

# Deploy to Vercel
vercel deploy --prod
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Visualization**: D3.js 7.9.0 (stacked river chart)
- **Database**: Supabase PostgreSQL (direct client access with RLS)
- **AI**: OpenRouter API (DeepSeek V3.2) via Vercel Serverless Functions
- **i18n**: i18next (Chinese/English)
- **Deployment**: Vercel (frontend + serverless functions)

### Key Directories
```
history_river/
├── components/          # React components
│   ├── RiverCanvas.tsx     # Single-country D3.js river visualization
│   ├── OverviewCanvas.tsx  # Multi-country timeline overview
│   └── DetailModal.tsx     # Event details with AI content
├── services/            # Data access layer
│   └── dataService.ts      # Supabase client (dynasties, events, pins)
├── api/                 # Vercel Serverless Functions
│   └── event-details.js    # OpenRouter AI integration with caching
├── data/                # Static fallback data
│   └── historyData.ts      # ~500 Chinese historical events
├── supabase/migrations/ # Database schema migrations
└── types.ts             # Centralized TypeScript definitions
```

### Data Flow
1. **River Visualization**: App.tsx → dataService.ts → Supabase → RiverCanvas/OverviewCanvas
2. **AI Content**: Click event → DetailModal → /api/event-details → OpenRouter API → Supabase cache
3. **State Management**: React local state + URL parameters (no Redux/Zustand)

### Database Tables (Supabase)
- `dynasties`: Dynasty info (name, years, color, country)
- `historical_events`: Events with importance (1-10) and type
- `river_pins`: Podcast markers on timeline
- `timeline_event_cache`: AI response cache (SHA-256 keyed)

### Important Patterns

**Event Importance System**: 10-tier importance (1=most important) with 20 zoom levels. Events filter based on viewport.k (zoom level) - more events appear as user zooms in.

**AI Caching**: SHA-256 hash of `title|year|language` as cache key. Reduces API costs by 80-90%.

**Multi-country Support**: 8 countries (China, USA, UK, France, Germany, Russia, India, Japan). Data filtered by `country` field.

## Environment Variables

Required in `.env.local` (dev) or Vercel dashboard (prod):
```
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Admin operations only
```

## Entry Points

- `index.html` - Main river visualization app
- `player.html` - Standalone podcast player
- `admin.html` - Admin interface for content management
