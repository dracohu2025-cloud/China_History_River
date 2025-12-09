# Project Overview

**Project Name:** history-river:-5000-years-of-civilization

**Description:** A web application that visualizes 5000 years of Chinese civilization as an interactive "river" of time. The application features both 2D (D3.js) and 3D (Three.js) visualizations, allowing users to explore historical events and periods interactively. It includes AI-powered historical context generation using OpenRouter/DeepSeek API and podcast functionality with Supabase backend storage.

**Key Technologies:**
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, D3.js (2D visualization), Three.js (3D visualization)
- **Backend:** Node.js, Express.js, JavaScript
- **Database:** Supabase (PostgreSQL)
- **AI Integration:** OpenRouter API (DeepSeek V3.2 model)
- **Deployment:** Vercel

## Architecture

### Frontend Structure
- **`App.tsx`**: Main application entry point, handles view switching and modal state management
- **`components/RiverCanvas.tsx`**: 2D D3.js river visualization component
- **`components/DetailModal.tsx`**: Modal for displaying historical event details
- **`components/PodcastPlayerModal.tsx`**: Podcast player interface
- **`pages/PlayerPage.tsx`**: Standalone podcast player page
- **`pages/AdminPins.tsx`**: Admin interface for managing podcast content

### Backend Structure
- **`server/index.js`**: Express server handling API endpoints
  - `/health`: Health check endpoint
  - `/api/event-details`: AI-powered historical event details with caching
- **`server/storage/eventsCache.json`**: File-based cache for AI-generated content

### Data Layer
- **`data/historyData.ts`**: Core historical dataset containing dynasties and key events
- **`types.ts`**: TypeScript type definitions for all data structures
- **`services/podcastService.ts`**: Supabase integration for podcast functionality

### Multi-Page Architecture
- **`index.html`**: Main river visualization application
- **`player.html`**: Standalone podcast player
- **`admin.html`**: Admin interface for content management

## Build and Development Commands

**Prerequisites:** Node.js, OpenRouter API key

**Setup:**
```bash
npm install
```

**Development (requires both frontend and backend running):**
```bash
# Terminal 1: Start backend server (port 4000)
npm run server

# Terminal 2: Start frontend dev server (port 3000)
npm run dev
```

**Build:**
```bash
npm run build
```

**Database Inspection:**
```bash
npm run db:inspect
```

## Configuration

### Environment Variables (`.env.local`)
```
# OpenRouter Configuration
OpenRouter_API_KEY=your_openrouter_api_key
Default_LLM_Model=deepseek/deepseek-v3.2-exp

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DIRECT_URL=your_supabase_direct_url
NEXT_PUBLIC_SUPABASE_BUCKET=podcast-media
```

### Vite Configuration
- Development server runs on port 3000
- Proxy setup: `/api` → `http://localhost:4000`
- Multiple entry points: main, player, admin, admin_index
- Environment variables injected at build time

## Code Style Guidelines

### TypeScript Usage
- Strict mode disabled for flexibility
- Path aliases configured: `@/*` maps to root directory
- Type definitions centralized in `types.ts`

### Component Structure
- Functional components with React hooks
- TypeScript interfaces for component props
- Consistent naming: PascalCase for components, camelCase for functions/variables

### Styling
- Tailwind CSS for utility-first styling
- Chinese font support: Noto Serif SC, ZCOOL QingKe HuangYou
- Responsive design with mobile-first approach

### State Management
- React local state (`useState`, `useEffect`) for UI state
- URL parameters for episode navigation
- No external state management libraries

## Testing Strategy

Currently no automated testing framework is configured. Manual testing approach:
- Visual regression testing for river visualizations
- API endpoint testing via browser developer tools
- Cross-browser compatibility testing

## Security Considerations

### API Security
- OpenRouter API key stored server-side only
- CORS enabled for cross-origin requests
- Input validation on API endpoints

### Data Protection
- Environment variables for sensitive configuration
- No client-side storage of API keys
- Cache file stored server-side only

## Deployment Process

### Vercel Deployment
- Configured via `vercel.json` for SPA routing
- Multiple entry points supported
- Serverless function support for backend

### Build Output
- Static files generated in `dist/` directory
- Multiple HTML entry points preserved
- Assets optimized for production

## Development Workflow

### Feature Development
1. Create feature branch
2. Implement changes with TypeScript/React
3. Test locally with both frontend and backend running
4. Build and verify production output
5. Deploy to Vercel

### AI Integration Workflow
1. User interacts with historical event
2. Frontend requests details from `/api/event-details`
3. Backend checks cache first
4. If not cached, calls OpenRouter API with DeepSeek model
5. Response cached and returned to frontend
6. Modal displays AI-generated historical context

### Podcast Workflow
1. Admin creates podcast content via admin interface
2. Content stored in Supabase with job tracking
3. Audio generation and processing
4. Player interface for episode consumption
5. URL-based episode navigation support

## Key Features

### Interactive River Visualization
- 2D D3.js implementation with zoom/pan
- Dynasty color coding and historical context
- Event markers with importance levels
- Responsive canvas with viewport management

### 3D Visualization Enhancement
- Three.js-based 3D river geometry
- Flowing water animation effects
- Bird's-eye camera perspective
- Material properties for realistic water appearance

### AI-Powered Historical Context
- DeepSeek V3.2 model integration
- Chinese language historical summaries
- Intelligent caching system
- Context-aware prompt generation

### Podcast System
- Supabase-backed content management
- Multi-speaker script support
- Audio URL generation and playback
- Admin interface for content curation

## Performance Considerations

### Frontend Optimization
- Vite for fast development and optimized builds
- React 19 for improved performance
- D3.js and Three.js for efficient rendering
- Lazy loading for modal components

### Backend Optimization
- File-based caching for AI responses
- Express middleware for request handling
- Error handling with fallback responses
- Health monitoring endpoint

### Data Management
- Structured historical data with type safety
- Efficient Supabase queries
- Optimized JSON caching
- Minimal bundle size with tree shaking