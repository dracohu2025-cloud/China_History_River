# Project Overview

**Project Name:** History River - 5000 Years of Chinese Civilization

**Description:** An interactive web application that visualizes 5000 years of Chinese civilization as a flowing "river" of time. The application features AI-powered historical content generation, podcast functionality, and multi-dimensional timeline visualization using both 2D D3.js and 3D Three.js technologies.

**Key Technologies:**
- **Frontend:** React 19.2.0, Vite 6.2+, TypeScript, Tailwind CSS (via CDN), D3.js 7.9.0 (2D visualization)
- **Backend:** Vercel Serverless Functions + Supabase PostgreSQL
- **Database:** PostgreSQL via Supabase (direct client access)
- **AI Integration:** OpenRouter API (DeepSeek V3.2 model) via Vercel Functions
- **Deployment:** Vercel (frontend + AI functions), Supabase (database), Cloudflare Tunnel (development)

## Architecture

### Vercel Serverless Architecture
The project employs a pure serverless architecture with Vercel for compute and Supabase for data:

1. **Frontend (Vite/React)** - Deployed on Vercel
   - Main river visualization application
   - Standalone podcast player (player.html)
   - Admin interface for content management (admin.html)
   - Multiple entry points: `index.html`, `player.html`, `admin.html`
   - Direct Supabase client integration via `services/dataService.ts`
   - Static deployment with edge CDN distribution

2. **Backend (Vercel Serverless Functions)**
   - **AI Function**: `/api/event-details.js` - OpenRouter API integration
     - SHA-256 UUID generation for cache keys
     - Supabase-based caching for AI responses
     - DeepSeek V3.2 model for historical summaries
   - Edge-deployed, auto-scaling serverless functions
   - No server management, pay-per-use pricing

3. **Database (Supabase PostgreSQL)**
   - Direct client access from frontend (safe with RLS)
   - Tables: `dynasties`, `historical_events`, `river_pins`, `podcast_jobs`, `timeline_event_cache`
   - Row Level Security (RLS) for data protection
   - Real-time subscriptions support
   - Database backups and managed infrastructure

### Frontend Structure
- **`App.tsx`**: Main application entry point with modal state management
- **`components/RiverCanvas.tsx`**: Core 2D D3.js river visualization (31KB, main component)
- **`components/DetailModal.tsx`**: Historical event detail modal with AI content
- **`components/PodcastPlayerModal.tsx`**: Audio player interface
- **`components/ErrorBoundary.tsx`**: Error handling component
- **`types.ts`**: Centralized TypeScript type definitions

### Service Layer
- **`services/dataService.ts`**: Direct Supabase client for dynasties, events, river pins
- **`services/podcastService.ts`**: Podcast data fetching and job management
- **`services/geminiService.ts`**: Google Gemini AI API integration
- **`api/event-details.js`**: Vercel serverless function for OpenRouter AI API

### Data Layer
- **Supabase Integration**: PostgreSQL backend for all data storage
- **Database Schema**: 
  - `dynasties`: Dynasty information with color coding
  - `historical_events`: Historical events with importance scoring
  - `river_pins`: Podcast metadata and thumbnails
  - `podcast_jobs`: Podcast generation jobs (queued/processing/completed)
- **Fallback Data**: Static TypeScript files in `/data/historyData.ts`
- **Type Safety**: TypeScript definitions in `types.ts` for all data structures

## Build and Development Commands

### Prerequisites
- Node.js 18+
- Supabase account with configured project
- Vercel account for deployment
- OpenRouter API key (for AI features)
- Cloudflare account (optional, for tunnel access)

### Development Setup
```bash
# Install dependencies
cd history_river && npm install

# Configure environment (create .env.local with required keys)
# Required: 
# - OPENROUTER_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
```

### Development Server
```bash
# Single terminal: Frontend development server (port 3000)
cd history_river && npm run dev

# Note: No backend server needed - uses Vercel Functions in production
# and direct Supabase access in development
```

### Build Commands
```bash
npm run build          # Production build with multiple entry points
npm run preview        # Preview production build
npm run db:inspect     # Inspect Supabase database
```

### Cloudflare Tunnel Management (Development)
```bash
# Using Makefile
make tunnel-install    # Install cloudflared
make tunnel-login      # Authenticate Cloudflare
make tunnel-create     # Create tunnel
make tunnel-dns CLOUDFLARE_DOMAIN=yourdomain.com
make tunnel-start CLOUDFLARE_DOMAIN=yourdomain.com
```

### Vercel Deployment (Recommended)
```bash
# Deploy to Vercel
vercel deploy --prod

# Vercel automatically handles:
# - Frontend static deployment
# - Serverless function deployment (api/event-details.js)
# - Environment variable injection
# - Custom domain configuration
# - Auto-scaling and monitoring
```

## Configuration

### Environment Variables
```bash
# OpenRouter Configuration (REQUIRED for AI features)
OPENROUTER_API_KEY=sk-or-v1-...
Default_LLM_Model=deepseek/deepseek-v3.2-exp

# Google Gemini API (alternative AI provider)
GEMINI_API_KEY=your-gemini-api-key

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_DIRECT_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Vite Configuration (vite.config.ts)
- Development server: port 3000, host 0.0.0.0
- Multiple entry points: index.html, player.html, admin.html
- Environment variable injection at build time
- Path alias: `@/*` maps to root directory

### TypeScript Configuration (tsconfig.json)
- Target: ES2022 with ESNext modules
- Strict mode disabled for development flexibility
- Path aliases configured for module resolution
- No legacy dependencies

## Code Style Guidelines

### TypeScript Usage
- Strict mode disabled for development flexibility
- Path aliases: `@/*` maps to root directory
- Centralized type definitions in `types.ts`
- Interface-based component props
- Target: ES2022, Module: ESNext

### Component Architecture
- Functional components with React hooks
- Consistent PascalCase for components, camelCase for functions/variables
- Error boundaries for robust error handling
- Modal-based interaction patterns

### Styling Conventions
- Tailwind CSS via CDN for utility-first styling
- Chinese font support: Noto Serif SC, Cinzel
- Responsive mobile-first design approach
- Consistent color palette based on historical themes

### State Management
- React local state for UI management
- URL parameters for navigation state (episode IDs)
- Supabase real-time subscriptions for data updates
- No external state management libraries

## Database Management

### Supabase Migration Files
- `20251209_create_timeline_tables.sql` - Core tables creation
- `20251209_insert_initial_data.sql` - Initial dynasty and event data
- `20251210_enable_public_access.sql` - RLS policies setup

### Vercel Function Files
- `api/event-details.js` - OpenRouter AI integration
  - Handler: `export default async function handler(req, res)`
  - Runtime: Node.js 18+ (serverless)
  - Memory: 1GB (default)
  - Timeout: 10s (configurable)
  - Cache: Supabase `timeline_event_cache` table

### Data Access Patterns
```typescript
// Direct Supabase access from frontend
import { fetchDynasties, fetchEvents } from '@/services/dataService'

// AI-powered content
import { fetchEventDetails } from '@/api/event-details'

// Podcast management
import { createPodcastJob, fetchCompletedPodcasts } from '@/services/podcastService'
```

## Testing Strategy

### Current Approach
- Manual testing via `test-fix.html`
- API endpoint testing through browser developer tools
- Visual regression testing for river visualization
- Cross-browser compatibility verification
- **No automated unit/integration tests implemented**

### Test Files
- `test-fix.html`: Basic functionality verification
- `test_network.sh`: Network connectivity testing

### Recommended Testing Areas
- River visualization interaction testing
- Supabase data fetching reliability
- AI content generation consistency
- Podcast playback functionality
- Offline/fallback data behavior

## Security Considerations

### API Security
- OpenRouter API keys stored in environment variables (server-side only)
- Supabase ANON key for client-side operations
- Supabase SERVICE ROLE key for admin operations only
- CORS configuration for approved domains only
- Input validation on all API endpoints

### Data Protection
- Environment variables for sensitive configuration
- No client-side storage of service role keys
- Supabase Row Level Security (RLS) for user data
- Anon key has limited permissions (SELECT only on public tables)

### Deployment Security
- HTTPS enforcement in production (Vercel automatic)
- Domain validation for tunnel access
- Secure cookie configuration
- CSRF protection for admin interfaces

## Deployment Process

### Frontend Deployment (Vercel - Recommended)
```bash
npm run build
# Deploy dist/ directory to Vercel
# Serverless function automatically deployed from /api directory
```

### Vercel Configuration
- Serverless function at `/api/event-details.js`
- Rewrite rules for SPA routing
- Environment variable injection
- Static asset optimization
- Automatic HTTPS

### Environment-Specific Settings
- **Development**: 
  - Uses `.env.local` for local Supabase project
  - Vercel Functions simulated by Vercel CLI (`vercel dev`)
  - Direct Supabase access from frontend
- **Production**: 
  - Uses Vercel environment variables
  - Functions deployed to Vercel Edge Network
  - Same API endpoints, production-ready scaling

## Development Workflow

### Feature Development Process
1. Create feature branch from main
2. Update Supabase schema if needed (create migration)
3. Implement frontend changes with TypeScript/React
4. Update service layer functions (`services/dataService.ts`)
5. Test locally with Vercel CLI: `cd history_river && vercel dev`
6. Deploy to Vercel preview environment
7. Verify production build functionality
8. Deploy to production with `vercel --prod`

### AI Integration Workflow (Vercel Function)
1. User clicks historical event on river visualization
2. Frontend makes POST request to `/api/event-details`
3. Vercel serverless function receives request
4. Function generates SHA-256 UUID based on event data
5. Checks Supabase cache (`timeline_event_cache` table)
6. **Cache hit**: Returns cached content immediately
7. **Cache miss**: Calls OpenRouter API with DeepSeek model
8. AI generates historical summary (~150 characters)
9. Response cached in Supabase for future requests
10. Returns AI content to frontend modal
11. Total latency: 50-500ms (cached) / 2-5s (AI generation)

### Database Changes Workflow
1. Create new migration file in `history_river/supabase/migrations/`
2. Apply migration: `supabase migration up`
3. Update `services/dataService.ts` if schema changed
4. Update TypeScript types in `types.ts` if needed

## Key Features

### Interactive River Visualization
- 2D D3.js implementation with smooth zoom/pan
- Dynasty color coding with historical accuracy
- Event markers sized by importance levels
- Responsive canvas with viewport optimization
- Chinese and English language support
- Performance optimizations (throttling, RAF-based updates)

### AI-Powered Historical Context
- DeepSeek V3.2 model for Chinese historical summaries
- Google Gemini API as alternative provider
- Intelligent caching to minimize API costs
- Context-aware prompt generation
- 150-character optimized summaries
- SHA-256 UUID generation for cache keys

### Podcast System Integration
- Supabase-backed content management
- Multi-speaker audio script support
- URL-based episode navigation
- Admin interface for content curation
- Audio playback with timeline synchronization
- Background generation via Supabase edge functions (future)

### Multi-Domain Support
- Cloudflare tunnel for development access
- Multiple production domains supported
- CORS configuration for cross-domain access
- Subdomain routing (frontend, API, timeline)

## Performance Optimization

### Frontend Optimization
- Vite for fast development builds
- React 19 performance improvements
- D3.js efficient rendering algorithms
- Code splitting for multiple entry points
- Canvas-based rendering with viewport culling

### Database Optimization
- Supabase PostgreSQL indexing for queries
- RLS policies optimized for performance
- Real-time subscriptions for live updates
- Query result caching (frontend level)

### Network Optimization
- Cloudflare CDN integration
- Static asset optimization (Vercel)
- Supabase CDN for storage assets
- Database connection pooling (managed by Supabase)

## Troubleshooting

### Common Development Issues
- **Port conflicts**: Ensure port 3000 is available (`npm run dev`)
- **Vercel CLI**: Install with `npm i -g vercel` for local function testing
- **API key configuration**: Verify keys in `.env.local` for dev, Vercel dashboard for prod
- **Supabase connection**: Check project URL and anon key match your project
- **Cloudflare tunnel**: Optional for development, check DNS settings
- **CORS issues**: Vercel functions handle CORS automatically, check Supabase RLS
- **Function logs**: Check Vercel dashboard for AI function logs

### Service Dependencies
- **Frontend**: Vite dev server for local development
- **Database**: Supabase project (dev/prod environments)
- **AI Functions**: Vercel account + OpenRouter API key
- **Deployment**: Vercel CLI for preview, Vercel dashboard for production
- **Optional**: Cloudflare tunnel for development domain access

### Log Locations
- Frontend: Browser developer console
- Supabase: Supabase dashboard (SQL editor > Logs)
- Vercel: Vercel dashboard (real-time logs)
- Cloudflare tunnel: `~/.cloudflared/` directory

## File Structure Reference

```
China_History_River/     # Git repository root
├── history_river/       # Main application
│   ├── components/      # React components
│   │   ├── RiverCanvas.tsx      # Core D3.js visualization (31KB)
│   │   ├── DetailModal.tsx      # AI-powered event details
│   │   └── PodcastPlayerModal.tsx  # Audio player
│   ├── pages/           # Page components (admin, player)
│   ├── services/        # API service layers (Supabase)
│   │   ├── dataService.ts       # Dynasty/Event/RiverPin fetching
│   │   ├── podcastService.ts    # Podcast job management
│   │   └── geminiService.ts     # Google Gemini AI
│   ├── api/             # Vercel Serverless Functions
│   │   └── event-details.js     # OpenRouter AI integration
│   ├── data/            # Fallback data
│   │   └── historyData.ts       # Static historical data
│   ├── supabase/        # Database migrations
│   │   └── migrations/
│   │       ├── 20251209_create_timeline_tables.sql
│   │       ├── 20251209_insert_initial_data.sql
│   │       └── 20251210_enable_public_access.sql
│   ├── public/          # Static assets
│   ├── scripts/         # Development scripts
│   ├── vercel.json      # Vercel deployment configuration
│   └── vite.config.ts   # Vite build configuration
├── ecosystem.config.js  # PM2 config (legacy, only frontend)
├── Makefile            # Development commands
├── AGENTS.md           # This documentation
└── STATUS.md           # Project status
```

### Key Architecture Files
- **`history_river/api/event-details.js`**: Vercel Serverless AI function
- **`history_river/services/dataService.ts`**: Frontend Supabase client
- **`vercel.json`**: Vercel deployment and routing configuration
- **`.env.local`**: Development environment variables
- **`ecosystem.config.js`**: Legacy PM2 (only manages static frontend now)

## Data Architecture

### Historical Data Structure
- Dynasty model with color coding and duration calculations
- Event model with importance scoring (1-5 scale) and type categorization
- RiverPin model for podcast content management
- PodcastJob model for async podcast generation
- SHA-256 based caching for AI responses

### Database Schema (Supabase)
- **dynasties**: Historical dynasties with color coding
  - `id`, `name`, `chinese_name`, `start_year`, `end_year`, `color`, `description`
- **historical_events**: Timeline events with importance scoring
  - `year`, `title`, `event_type`, `importance`, `description`
- **river_pins**: Podcast metadata for river visualization
  - `year`, `job_id`, `title`, `douban_rating`
- **podcast_jobs**: Async podcast generation status
  - `id`, `status`, `progress`, `output_data`, `error_message`, `created_at`, `user_id`
- **timeline_event_cache**: AI response cache (reduces costs)
  - `uuid`, `year`, `event_title`, `context`, `content`, `is_cached`, `is_deleted`, `created_at`

### Fallback Data
- Static TypeScript files in `history_river/data/historyData.ts`
- Comprehensive Chinese historical timeline from Xia dynasty (-2070) to modern era
- Used when Supabase connection fails or during development
- ~500 major historical events with importance scoring (1-5)

### Vercel Deployment Details
- **Function Deployment**: `api/event-details.js` deployed automatically
- **Zero Config**: Vercel auto-detects framework and functions
- **Edge Network**: Functions run on Vercel's global edge network
- **Environment**: Node.js 18+ runtime, 1GB memory, 10s timeout
- **Logs**: Real-time logs in Vercel dashboard
- **Scaling**: Auto-scales from 0 to ∞, pay-per-invocation

### Architecture Benefits
- ✅ **No server management**: Vercel handles infrastructure
- ✅ **Global CDN**: Fast loading worldwide
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Cost-effective**: Pay only for what you use
- ✅ **Developer experience**: Simple `git push` deployments
- ✅ **Type safety**: Full TypeScript support
- ✅ **Real-time data**: Supabase subscriptions
- ✅ **AI caching**: Reduces API costs by 80-90%

This documentation serves as the comprehensive guide for AI coding agents working on the History River project. All architectural decisions, development patterns, and deployment processes are documented here for consistent development practices.

---
**Last Updated**: 2025-12-10  
**Architecture**: Vercel Serverless + Supabase PostgreSQL  
**Status**: ✅ Production Ready
