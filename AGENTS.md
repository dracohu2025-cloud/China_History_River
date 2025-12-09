# Project Overview

**Project Name:** History River - 5000 Years of Chinese Civilization

**Description:** An interactive web application that visualizes 5000 years of Chinese civilization as a flowing "river" of time. The application features AI-powered historical content generation, podcast functionality, and multi-dimensional timeline visualization using both 2D D3.js and 3D Three.js technologies.

**Key Technologies:**
- **Frontend:** React 19, Vite 6.2+, TypeScript, Tailwind CSS, D3.js (2D visualization), Three.js (3D visualization)
- **Backend:** Dual architecture - Node.js Express (port 4000) + Django REST API (port 8000)
- **Database:** PostgreSQL via Supabase, SQLite for Django development
- **AI Integration:** OpenRouter API (DeepSeek V3.2 model) + Google Gemini API
- **Deployment:** Vercel (frontend), UCloud (Django), Cloudflare Tunnel (development access)
- **Process Management:** PM2 for production deployment

## Architecture

### Multi-Service Architecture
The project employs a sophisticated multi-service architecture with three main components:

1. **Frontend Service (Vite/React)** - Port 3000
   - Main river visualization application
   - Standalone podcast player (player.html)
   - Admin interface for content management (admin.html)
   - Multiple entry points: `index.html`, `player.html`, `admin.html`, `admin/index.html`

2. **Express API Service** - Port 4000
   - AI-powered historical event details with file-based caching
   - OpenRouter API integration for DeepSeek model
   - Google Gemini API integration
   - File-based caching system at `server/storage/eventsCache.json`
   - Health monitoring endpoint at `/health`

3. **Django Timeline API Service** - Port 8000 (dev) / 8001 (prod)
   - Comprehensive historical data management
   - Dynasty and event models with importance scoring (1-5 scale)
   - Event cache system for AI-generated content
   - Admin interface for data curation
   - Chinese localization support

### Frontend Structure
- **`App.tsx`**: Main application entry point with modal state management
- **`components/RiverCanvas.tsx`**: Core 2D D3.js river visualization (31KB, main component)
- **`components/DetailModal.tsx`**: Historical event detail modal with AI content
- **`components/PodcastPlayerModal.tsx`**: Audio player interface
- **`components/ErrorBoundary.tsx`**: Error handling component
- **`types.ts`**: Centralized TypeScript type definitions

### Backend Structure
- **`server/index.js`**: Express server with OpenRouter API integration
- **`dj_backend/timeline/`**: Django app with comprehensive historical models
  - Dynasty management with color coding and duration calculations
  - Historical events with importance levels (1-5 scale) and type categorization
  - EventCache system for AI response caching with SHA-256 UUID generation
  - RiverPin model for podcast content management

### Data Layer
- **Supabase Integration**: PostgreSQL backend for podcast and media storage
- **Django Models**: Structured historical data with Chinese language support
- **File Caching**: JSON-based caching for AI responses to minimize API costs
- **Type Safety**: TypeScript definitions in `types.ts` for all data structures

## Build and Development Commands

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- PostgreSQL (or Supabase account)
- Cloudflare account (for tunnel access)

### Development Setup
```bash
# Install dependencies
cd history_river && npm install

# Configure environment (copy from .env.local.example if exists)
# Edit .env.local with your API keys
```

### Development Servers (Run in separate terminals)
```bash
# Terminal 1: Frontend development server (port 3000)
cd history_river && npm run dev

# Terminal 2: Express API server (port 4000)  
cd history_river && npm run server

# Terminal 3: Django backend (port 8000)
cd history_river/dj_backend
./setup_django.sh  # First time setup
python manage.py migrate  # Run migrations
python manage.py runserver
```

### Build Commands
```bash
npm run build          # Production build
npm run preview        # Preview production build
npm run db:inspect     # Inspect Supabase database
```

### Cloudflare Tunnel Management (Development)
```bash
# Using Makefile (recommended)
make tunnel-install    # Install cloudflared
make tunnel-login      # Authenticate Cloudflare
make tunnel-create     # Create tunnel
make tunnel-dns CLOUDFLARE_DOMAIN=yourdomain.com
make tunnel-start CLOUDFLARE_DOMAIN=yourdomain.com

# Using npm scripts (if available)
npm run tunnel:start   # Start tunnel
npm run tunnel:status  # Check status
npm run tunnel:logs    # View logs
npm run tunnel:stop    # Stop tunnel
```

### Production Management
```bash
# PM2 process management (from root directory)
pm2 start ecosystem.config.js    # Start all services
pm2 stop ecosystem.config.js     # Stop all services
pm2 restart ecosystem.config.js  # Restart all services
pm2 status                       # View service status
pm2 logs                         # View combined logs
```

### Development Helper Commands
```bash
make all-dev           # Show development setup instructions
make all-stop          # Stop all development services
```

## Configuration

### Environment Variables
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-...
Default_LLM_Model=deepseek/deepseek-v3.2-exp

# Google Gemini API (alternative AI provider)
GEMINI_API_KEY=your-gemini-api-key

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_DIRECT_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Django Configuration
DJANGO_SETTINGS_MODULE=dj_backend.settings
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,history-timeline.aigc24.com,.aigc24.com
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
```

### Vite Configuration
- Development server: port 3000, host 0.0.0.0
- Proxy setup: `/api` → `http://localhost:4000`, `/timeline-api` → `http://localhost:8000`
- Multiple entry points with optimized builds
- Environment variable injection at build time
- Path alias: `@/*` maps to root directory

### Django Settings
- SQLite for development, PostgreSQL for production
- Chinese language support (zh-hans)
- Shanghai timezone (Asia/Shanghai)
- Comprehensive CORS configuration for multiple domains
- CSRF protection for admin interface

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
- Tailwind CSS for utility-first styling
- Chinese font support: Noto Serif SC, ZCOOL QingKe HuangYou
- Responsive mobile-first design approach
- Consistent color palette based on historical themes

### State Management
- React local state for UI management
- URL parameters for navigation state (episode IDs)
- Server-side caching for AI responses
- No external state management libraries

## Testing Strategy

### Current Approach
- Manual testing for visual regressions
- API endpoint testing via browser developer tools
- Cross-browser compatibility verification
- Database integrity checks via inspection scripts
- Test files: `test-fix.html`, `test_network.sh`

### Recommended Testing Areas
- River visualization interaction testing
- AI content generation consistency
- Podcast playback functionality
- Multi-service integration points

## Security Considerations

### API Security
- OpenRouter API keys stored server-side only
- CORS configuration for approved domains only
- Input validation on all API endpoints
- Rate limiting consideration for AI services

### Data Protection
- Environment variables for sensitive configuration
- No client-side storage of API keys
- Supabase row-level security for user data
- Cache files stored server-side only

### Deployment Security
- HTTPS enforcement in production
- Secure cookie configuration for Django
- CSRF protection for admin interfaces
- Domain validation for tunnel access

## Deployment Process

### Frontend Deployment (Vercel)
```bash
npm run build
# Deploy dist/ directory to Vercel
# Multiple entry points preserved: main, player, admin
```

### Django Backend Deployment (UCloud)
```bash
cd dj_backend
./start_prod.sh  # Production startup script
# Gunicorn WSGI server with nginx reverse proxy
```

### PM2 Production Configuration
- Four services managed: frontend, API, Django, tunnel
- Automatic restart on failure
- Log aggregation with date formatting
- Memory limits for resource management
- Service ports: Frontend (static), API (4000), Django (8001)

## Development Workflow

### Feature Development Process
1. Create feature branch from main
2. Implement frontend changes with TypeScript/React
3. Update backend APIs as needed (Express/Django)
4. Test locally with all three services running
5. Verify production build and multi-page functionality
6. Deploy using appropriate platform (Vercel/UCloud)

### AI Integration Workflow
1. User interaction triggers event detail request
2. Frontend requests from `/api/event-details` (Express)
3. Backend checks file cache first at `server/storage/eventsCache.json`
4. Cache miss: calls OpenRouter API with DeepSeek model or Gemini API
5. Response cached and returned to frontend
6. Modal displays AI-generated historical context

### Historical Data Management
1. Django admin interface for data curation
2. Dynasty management with color coding
3. Event importance scoring (1-5 scale)
4. Type categorization (war, culture, politics, science)
5. Automatic cache invalidation for updated content

## Key Features

### Interactive River Visualization
- 2D D3.js implementation with smooth zoom/pan
- Dynasty color coding with historical accuracy
- Event markers sized by importance levels
- Responsive canvas with viewport optimization
- Chinese and English language support

### AI-Powered Historical Context
- DeepSeek V3.2 model for Chinese historical summaries
- Google Gemini API as alternative provider
- Intelligent caching to minimize API costs
- Context-aware prompt generation
- 150-character optimized summaries
- Year-overviews for non-specific years

### Podcast System Integration
- Supabase-backed content management
- Multi-speaker audio script support
- URL-based episode navigation
- Admin interface for content curation
- Audio playback with timeline synchronization

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
- Three.js 3D optimization techniques
- Code splitting for multiple entry points

### Backend Optimization
- File-based caching for AI responses
- Database indexing for historical queries
- Express middleware optimization
- Django query optimization with select_related
- Gunicorn worker process management

### Network Optimization
- Cloudflare CDN integration
- Static asset optimization
- API response caching strategies
- Database connection pooling
- Proxy configuration for development

## Troubleshooting

### Common Development Issues
- **Port conflicts**: Ensure ports 3000, 4000, 8000 are available
- **API key configuration**: Verify OpenRouter/Gemini key in environment
- **Django migrations**: Run `python manage.py migrate` after setup
- **Cloudflare tunnel**: Check domain configuration and DNS settings

### Service Dependencies
- Frontend requires backend services for full functionality
- Django admin requires superuser creation
- Supabase connection needed for podcast features
- Cloudflare authentication required for tunnel access

### Log Locations
- Frontend: Browser developer console
- Express API: Terminal output or PM2 logs (`./logs/api-*.log`)
- Django: Terminal output with SQL query logging (`./logs/django-*.log`)
- Cloudflare tunnel: `~/.cloudflared/` directory

## File Structure Reference

```
history_river/
├── components/           # React components
├── pages/               # Page components  
├── services/            # API service layers
├── data/                # Historical data files
├── server/              # Express backend
│   ├── index.js         # Main Express server
│   └── storage/         # File-based cache
├── dj_backend/          # Django backend
│   ├── timeline/        # Main Django app
│   │   ├── models.py    # Data models
│   │   ├── api_views.py # API endpoints
│   │   └── admin.py     # Admin interface
│   └── manage.py        # Django management
├── scripts/             # Utility scripts
└── supabase/            # Database configurations
```

This documentation serves as the comprehensive guide for AI coding agents working on the History River project. All architectural decisions, development patterns, and deployment processes are documented here for consistent development practices.