# History River - 5000 Years of Civilization

## Project Overview

History River is a sophisticated web application that visualizes 5000 years of Chinese civilization through an interactive river metaphor. The project combines modern web technologies with AI-powered content generation to create an immersive historical exploration experience.

### Core Features
- **Interactive River Visualization**: D3.js-powered 2D timeline with dynasties as flowing river segments
- **AI-Powered Historical Content**: OpenRouter API integration for intelligent historical summaries
- **Podcast System**: Multi-speaker audio content with Supabase backend
- **Multi-Page Architecture**: Main visualization, standalone player, and admin interface
- **Dual Backend System**: Node.js Express server + Django REST API

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** build tool with multiple entry points
- **D3.js** for data visualization
- **Tailwind CSS** for styling
- **Three.js** for potential 3D enhancements

### Backend Services
- **Node.js Express Server** (Port 4000): AI-powered historical content generation
- **Django REST API** (Port 8000): Timeline data management with PostgreSQL
- **Supabase**: Podcast content storage and management

### AI Integration
- **OpenRouter API** with DeepSeek V3.2 model
- **File-based caching system** for AI responses
- **Chinese language historical summaries** with context awareness

## Project Structure

```
history_river/
├── Components/                 # React components
│   ├── RiverCanvas.tsx        # Main D3.js visualization (27KB)
│   ├── DetailModal.tsx        # Historical event details
│   └── PodcastPlayerModal.tsx # Audio player interface
├── Pages/                     # Standalone page components
├── Services/                  # API and utility services
│   ├── geminiService.ts       # AI service integration
│   └── podcastService.ts      # Supabase podcast management
├── Data/                      # Historical datasets
│   └── historyData.ts         # Core dynasty and event data (31KB)
├── Server/                    # Express backend
│   ├── index.js              # AI content generation API
│   └── storage/              # File-based AI response cache
└── dj_backend/               # Django REST API
    ├── timeline/             # Django app for timeline data
    │   ├── models.py         # Dynasty and HistoricalEvent models
    │   ├── api_views.py      # REST API endpoints
    │   └── admin.py          # Django admin interface
    └── requirements.txt      # Django dependencies
```

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (Vite on port 3000)
npm run dev

# Start Express server (port 4000)
npm run server

# Build for production
npm run build

# Preview production build
npm run preview

# Inspect Supabase database
npm run db:inspect
```

### Django Backend Development
```bash
# Navigate to Django directory
cd dj_backend/

# Set up Django environment
./setup_django.sh

# Run migrations
python manage.py migrate

# Start development server (port 8000)
python manage.py runserver

# Production deployment
./start_prod.sh
```

## Configuration Files

### Environment Variables (.env.local)
```
# OpenRouter API Configuration
OpenRouter_API_KEY=sk-or-v1-...
Default_LLM_Model=deepseek/deepseek-v3.2-exp

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_BUCKET=podcast-media
```

### Key Configuration Files
- **vite.config.ts**: Multi-entry build configuration with proxy setup
- **tsconfig.json**: TypeScript configuration with Next.js plugins
- **vercel.json**: SPA routing configuration for deployment
- **dj_backend/requirements.txt**: Django dependencies (Django 4.2, DRF, CORS, Gunicorn)

## Code Style Guidelines

### Frontend (React/TypeScript)
- Use **functional components** with hooks
- **TypeScript strict mode disabled** (current setting)
- **Chinese language comments** for historical context
- **Semantic naming** for dynasty and historical components
- **Responsive design** with Tailwind CSS utilities

### Backend (Node.js/Express)
- **ES6 modules** with async/await pattern
- **File-based caching** for AI responses
- **Error handling** with try-catch blocks
- **Chinese language prompts** for AI generation
- **UUID-based caching keys** for event details

### Django Backend
- **Model-driven development** with Django ORM
- **RESTful API design** with Django REST Framework
- **Database indexing** on frequently queried fields
- **Chinese field names** and verbose names
- **Constraint validation** for data integrity

## Testing Strategy

⚠️ **Current Status**: No testing infrastructure implemented

### Recommended Testing Approach
- **Frontend**: Jest + React Testing Library for component testing
- **Backend**: Pytest for Django API testing
- **Integration**: API endpoint testing with supertest
- **E2E**: Playwright or Cypress for user flow testing

## Deployment Process

### Frontend Deployment (Vercel)
- **Multi-page build** with Vite
- **SPA routing** configured in vercel.json
- **Environment variables** for API keys and Supabase config
- **Automatic deployments** on main branch pushes

### Django Backend Deployment (UCloud)
- **Gunicorn WSGI server** with configuration
- **PostgreSQL database** for production
- **Environment-based settings** separation
- **Static file serving** with WhiteNoise

## Security Considerations

### API Key Management
- **Environment variables** for all sensitive keys
- **Client-side exposure** of Supabase anon key (intentional)
- **Server-side only** for OpenRouter API key

### Data Validation
- **Input validation** on API endpoints
- **SQL injection prevention** via ORM
- **CORS configuration** for cross-origin requests

### Content Security
- **AI content filtering** through prompt engineering
- **Rate limiting** consideration for AI API calls
- **Cache management** for sensitive historical content

## Known Issues and Limitations

### Current Technical Debt
1. **No testing infrastructure** implemented
2. **No linting/formatting** configuration (ESLint, Prettier)
3. **No CI/CD pipelines** for automated testing/deployment
4. **Mixed language comments** (Chinese/English) without standardization
5. **No error boundary** components for React error handling

### Performance Considerations
- **Large D3.js visualization** may impact mobile performance
- **AI API latency** affects user experience
- **File-based caching** has scalability limitations
- **No CDN integration** for static assets

## Development Workflow

### Feature Development Process
1. **Feature planning** documented in `feature_iteration.md`
2. **Branch-based development** with Git
3. **Manual testing** before deployment
4. **Direct deployment** to production environments

### Code Review Guidelines
- **Functional component** preference over class components
- **Type safety** consideration despite strict mode being disabled
- **Chinese historical accuracy** for dynasty information
- **Responsive design** for mobile compatibility
- **Performance optimization** for D3.js visualizations

## Data Models

### Core Historical Data
- **Dynasties**: 5000-year timeline with color coding and descriptions
- **Historical Events**: Time-based events with importance levels (1-5)
- **Event Types**: War, Culture, Politics, Science categorization
- **Podcast Episodes**: Multi-speaker audio content with metadata

### AI Integration Data
- **Cached Responses**: Year-based historical summaries
- **Context Awareness**: User interaction context for AI prompts
- **Multi-language Support**: Chinese primary, English secondary

## Future Enhancement Areas

### Immediate Improvements
1. **Testing infrastructure** setup
2. **Code quality tools** (ESLint, Prettier)
3. **Error handling** enhancement
4. **Performance optimization** for mobile devices
5. **CI/CD pipeline** implementation

### Long-term Vision
1. **3D visualization** with Three.js integration
2. **Multi-language support** expansion
3. **User authentication** and personalization
4. **Advanced AI features** for historical analysis
5. **Mobile app** development

---

*This documentation reflects the current state of the History River project as of November 2025. For the most up-to-date information, please refer to the actual codebase and commit history.*