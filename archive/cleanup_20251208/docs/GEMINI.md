# Project Overview

**Project Name:** history-river:-5000-years-of-civilization

**Description:**
A web application that visualizes 5000 years of Chinese civilization as a "river" of time. It supports both 2D (D3.js) and 3D (Three.js) visualizations, allowing users to explore historical events and periods interactively. The application fetches detailed historical context using an AI backend (OpenRouter/DeepSeek) and caches the results.

**Key Technologies:**
*   **Frontend:** React 19, Vite, Tailwind CSS (inferred from class names), D3.js (2D viz), Three.js (3D viz).
*   **Backend:** Node.js, Express.js.
*   **AI Integration:** OpenRouter API (DeepSeek V3 model).
*   **Language:** TypeScript (Frontend), JavaScript (Backend).

## Architecture

*   **Frontend (`/`):**
    *   `App.tsx`: Main entry point, handles view switching (2D/3D) and modal state.
    *   `components/RiverCanvas.tsx`: 2D D3.js visualization.
    *   `components/RiverCanvas3D.tsx`: 3D Three.js visualization.
    *   `components/DetailModal.tsx`: Displays event details.
    *   `services/geminiService.ts`: Client-side service to communicate with the backend API.
*   **Backend (`/server`):**
    *   `index.js`: Express server. Handles `/api/event-details` endpoint.
    *   `storage/eventsCache.json`: File-based cache for generated event descriptions to save API calls.
*   **Data:**
    *   `data/historyData.ts`: Core dataset of historical events.

## Building and Running

**Prerequisites:**
*   Node.js installed.
*   OpenRouter API Key (configured in `.env.local`).

**Setup:**
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Configure Environment Variables:
    Create `.env.local` and add your OpenRouter API key:
    ```
    OPENROUTER_API_KEY=your_key_here
    ```

**Development:**
The application requires both the frontend (Vite) and backend (Express) to be running.

1.  Start the Backend Server (runs on port 4000 by default):
    ```bash
    npm run server
    ```
2.  Start the Frontend Dev Server (in a separate terminal):
    ```bash
    npm run dev
    ```

**Build:**
To build the frontend for production:
```bash
npm run build
```

## Development Conventions

*   **Styling:** Tailwind CSS utility classes are used for styling components.
*   **State Management:** React local state (`useState`, `useEffect`) is used for managing UI state.
*   **API Communication:** The frontend proxies requests to OpenRouter through the local Express server to handle authentication and caching securely.
*   **Type Safety:** TypeScript is used for the frontend to ensure type safety for props and data structures (`HistoricalEvent`). The backend is currently standard JavaScript.
