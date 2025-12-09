# 📘 Comprehensive Guide: Replicating the Podcast Player Page (Thick Client Architecture)

**Target Project**: Your new podcast application
**Source Project**: epub-to-pod (Full Feature Set)
**Architecture**: Thick Client (All processing in browser)

---

## 🎯 **Overview & Goals**

This guide provides **complete, step-by-step instructions** to replicate the **podcast player page** from the `epub-to-pod` project, including:

- ✅ **Supabase Integration** (Auth, Storage, Database)
- ✅ **Bookshelf/Library View** (List all podcasts)
- ✅ **Podcast Player** (Audio playback, visuals, transcript)
- ✅ **Export Functionality** (Video generation)
- ✅ **Thick Client Architecture** (All processing in browser)

---

## 📁 **File Structure to Create**

```
your-podcast-project/
├── components/
│   ├── AuthScreen.tsx      # User authentication
│   ├── Bookshelf.tsx       # Library management
│   ├── PodcastPlayer.tsx   # Audio playback interface
│   └── UploadSection.tsx   # File upload handling
├── services/
│   ├── supabaseService.ts  # Supabase integration
│   ├── storageService.ts   # Data persistence
│   ├── epubService.ts      # EPUB parsing
│   └── (optional) others
├── types.ts                # TypeScript definitions
├── constants.ts            # Configuration constants
├── .env                    # Environment variables
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind CSS config
├── index.html              # HTML entry
└── App.tsx                 # Main application
```

---

## 🔐 **Phase 1: Supabase Setup**

### **Step 1.1: Get Supabase Project Details**

From your **original** epub-to-pod project:

```bash
cd /Users/dracohu/REPO/epub-to-pod
cat .env | grep SUPABASE
```

**Copy these values**:
```
NEXT_PUBLIC_SUPABASE_URL=https://zhvczrrcwpxgrifshhmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 1.2: Create `.env` File**

In your **new project** root, create `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://zhvczrrcwpxgrifshhmh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: API Keys (if using Gemini TTS)
VITE_GEMINI_API_KEY=your_gemini_key
```

### **Step 1.3: Configure Supabase Storage**

In Supabase Dashboard **(important!)**:

1. **Create Storage Bucket**: `podcast-media`
   ```sql
   -- Run in SQL Editor
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('podcast-media', 'podcast-media', true);
   ```

2. **Set Storage Policies** (for public read):
   ```sql
   CREATE POLICY "Public read access" ON storage.objects
     FOR SELECT USING (bucket_id = 'podcast-media');
   ```

---

## 🗄️ **Phase 2: Database Schema**

### **Step 2.1: Create `podcasts` Table**

Run in **Supabase SQL Editor**:

```sql
-- Table: podcasts
CREATE TABLE IF NOT EXISTS podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  script jsonb,
  audio_path text,
  video_path text,
  thumbnail_url text,
  youtube_title text,
  youtube_description text,
  total_duration numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own" ON podcasts FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own" ON podcasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own" ON podcasts FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own" ON podcasts FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_podcasts_user_created ON podcasts (user_id, created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_podcasts_updated_at 
  BEFORE UPDATE ON podcasts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📋 **Phase 3: Type Definitions**

### **Step 3.1: Create `types.ts`**

```typescript
// types.ts
export enum ProcessingState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SCRIPTING = 'SCRIPTING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  GENERATING_VISUALS = 'GENERATING_VISUALS',
  SAVING = 'SAVING',
  READY = 'READY',
  ERROR = 'ERROR',
  VIEW_BOOKSHELF = 'VIEW_BOOKSHELF'
}

export type Language = 'English' | 'Chinese' | 'Japanese' | 'French' | 'Spanish' | 'German';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ScriptSegment {
  speaker: 'Male' | 'Female';
  text: string;
  visualPrompt: string;
  estimatedDuration?: number;
  startTime?: number;
  generatedImageUrl?: string;
}

export interface PodcastData {
  id: string;
  title: string;
  userId?: string;
  script: ScriptSegment[];
  audioUrl?: string;
  totalDuration: number;
  createdAt: number;
  thumbnailUrl?: string;
}
```

---

## 🔧 **Phase 4: Configuration**

### **Step 4.1: Create `constants.ts`**

```typescript
// constants.ts
export const SAMPLE_RATE = 24000;

// Supabase
export const BUCKET = 'podcast-media';
export const TABLE = 'podcasts';

// Configuration (minimal - you can expand later)
export const SUPPORTED_LANGUAGES: Language[] = ['English', 'Chinese'];
```

---

## 🔌 **Phase 5: Supabase Service**

### **Step 5.1: Create `services/supabaseService.ts`**

```typescript
// services/supabaseService.ts
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseService = {
  async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthChange(callback: (user: User | null) => void) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      callback(session?.user ? mapUser(session.user) : null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? mapUser(session.user) : null);
    });
    
    return () => subscription.unsubscribe();
  }
};

function mapUser(u: SupabaseUser): User {
  return {
    uid: u.id,
    email: u.email || null,
    displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
    photoURL: u.user_metadata?.avatar_url || null
  };
}
```

### **Step 5.2: Create `services/storageService.ts`**

```typescript
// services/storageService.ts
import { supabase } from './supabaseService';
import { PodcastData, BUCKET, TABLE } from '../constants';

export const storageService = {
  async savePodcast(podcast: PodcastData): Promise<void> {
    const userId = supabase.auth.user()?.id;
    if (!userId) throw new Error("You must be logged in");

    // Upload audio
    const audioBlob = new Blob([podcast.audioArrayBuffer || new ArrayBuffer(0)], { type: 'audio/mp3' });
    const audioPath = `${userId}/${podcast.id}/audio.mp3`;
    
    const { error: audioError } = await supabase.storage
      .from(BUCKET)
      .upload(audioPath, audioBlob, { upsert: true });
    if (audioError) throw new Error(`Audio upload: ${audioError.message}`);

    // Save metadata
    const { error: dbError } = await supabase.from(TABLE).upsert({
      id: podcast.id,
      user_id: userId,
      title: podcast.title,
      script: podcast.script,
      audio_path: audioPath,
      total_duration: podcast.totalDuration,
      created_at: podcast.createdAt
    });
    if (dbError) throw new Error(`Database save: ${dbError.message}`);
  },

  async getAllPodcasts(userId: string) {
    if (!userId) throw new Error("User ID required");
    
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, title, user_id, total_duration, created_at, thumbnail_url, script')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPodcast(id: string, userId: string) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.audio_path);
    
    return {
      ...data,
      audioUrl: publicUrl.publicUrl
    };
  }
};
```

---

## 🎨 **Phase 6: UI Components**

### **Step 6.1: Bookshelf Component**

```typescript
// components/Bookshelf.tsx
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { PodcastData } from '../types';
import { BookOpen, Clock, Loader2, Play, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  userId: string;
  onPlay: (id: string) => void;
  onCreateNew: () => void;
}

export const Bookshelf: React.FC<Props> = ({ userId, onPlay, onCreateNew }) => {
  const [podcasts, setPodcasts] = useState<PodcastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPodcasts();
  }, [userId]);

  const loadPodcasts = async () => {
    try {
      const pods = await storageService.getAllPodcasts(userId);
      setPodcasts(pods);
    } catch (error) {
      console.error('Failed to load podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">My Library</h2>
        <button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Play size={20} /> New Podcast
        </button>
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-800 border-dashed">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No podcasts yet</h3>
          <p className="text-slate-500 mb-6">Upload your first book to get started</p>
          <button onClick={onCreateNew} className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
            Create one now →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((pod) => (
            <div key={pod.id} onClick={() => onPlay(pod.id)} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 cursor-pointer">
              <div className="aspect-video bg-slate-900 relative">
                <img src={pod.script?.[0]?.generatedImageUrl || 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=800'} 
                     alt={pod.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock size={12} />
                  {Math.round(pod.totalDuration / 60)}m
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-white mb-1">{pod.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                  <span>{new Date(pod.createdAt).toLocaleDateString()}</span>
                  <span>{pod.script?.length || 0} segments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **Step 6.2: PodcastPlayer Component**

```typescript
// components/PodcastPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { PodcastData } from '../types';

interface Props {
  audioUrl: string;
  script: any[];
  title: string;
  onBack: () => void;
}

export const PodcastPlayer: React.FC<Props> = ({ audioUrl, script, title, onBack }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    if (!audioRef.current || script.length === 0) return;

    const updateSegment = () => {
      const currentTime = audioRef.current?.currentTime || 0;
      const duration = audioRef.current?.duration || 1;
      
      // Simple timeline based on character count
      const totalChars = script.reduce((acc, seg) => acc + seg.text.length, 0);
      const progress = currentTime / duration;
      let accumulatedRatio = 0;
      
      for (let i = 0; i < script.length; i++) {
        const segRatio = script[i].text.length / totalChars;
        if (progress >= accumulatedRatio && progress < accumulatedRatio + segRatio) {
          setCurrentSegment(i);
          break;
        }
        accumulatedRatio += segRatio;
      }
    };

    const interval = setInterval(updateSegment, 100);
    return () => clearInterval(interval);
  }, [audioRef.current, script]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur">
        <button onClick={onBack} className="text-white">← Back</button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3">
        {/* Visual Area */}
        <div className="lg:col-span-2 flex items-center justify-center p-8 bg-gray-950">
          <div className="aspect-video w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden">
            <img 
              src={script[currentSegment]?.generatedImageUrl} 
              alt="Visual" 
              className="w-full h-full object-cover"
            />
          </div>
          <audio ref={audioRef} src={audioUrl} controls className="w-full mt-4" />
        </div>

        {/* Transcript */}
        <div className="hidden lg:flex flex-col border-l border-gray-800 p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-4">Transcript</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {script.map((seg, i) => (
              <div key={i} className={`p-3 rounded ${i === currentSegment ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-gray-900/50'}`}>
                <span className={`text-xs font-bold ${seg.speaker === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>{seg.speaker}</span>
                <p className="text-sm text-gray-300 mt-1">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 **Phase 7: Main App Component**

### **Step 7.1: App.tsx (Routing)**

```typescript
// App.tsx
import React, { useState, useEffect } from 'react';
import { Bookshelf } from './components/Bookshelf';
import { PodcastPlayer } from './components/PodcastPlayer';
import { supabaseService } from './services/supabaseService';
import { storageService } from './services/storageService';
import { User, ProcessingState } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [podcastData, setPodcastData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = supabaseService.onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const handleGuestLogin = () => {
    setUser({
      uid: 'guest',
      email: 'guest@example.com',
      displayName: 'Guest Developer',
      photoURL: null
    });
  };

  const handleLoadPodcast = async (id: string) => {
    if (!user) return;
    const data = await storageService.getPodcast(id, user.uid);
    setPodcastData(data);
    setState(ProcessingState.READY);
  };

  // Render based on state
  if (!user) {
    return <button onClick={handleGuestLogin} className="p-4 bg-blue-600 text-white">Continue as Guest</button>;
  }

  if (state === ProcessingState.VIEW_BOOKSHELF) {
    return <Bookshelf userId={user.uid} onPlay={handleLoadPodcast} onCreateNew={() => setState(ProcessingState.IDLE)} />;
  }

  if (state === ProcessingState.READY && podcastData?.audioUrl) {
    return <PodcastPlayer audioUrl={podcastData.audioUrl} script={podcastData.script} title={podcastData.title} onBack={() => setState(ProcessingState.VIEW_BOOKSHELF)} />;
  }

  return <div>Main App View</div>;
}

export default App;
```

---

## 🚀 **Phase 8: Build & Run**

### **Step 8.1: Install Dependencies**

```bash
# Core packages
npm install react@^19.2.0 react-dom@^19.2.0
npm install @supabase/supabase-js@^2.84.0
npm install lucide-react@^0.554.0

# Development
npm install -D vite@^7.2.4 @vitejs/plugin-react@^5.1.1 typescript@^5.8.2
npm install -D tailwindcss@^4.1.17 @tailwindcss/postcss
```

### **Step 8.2: Configure Vite**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6001,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
```

### **Step 8.3: Run Development Server**

```bash
npm run dev
```

Access at: `http://localhost:6001`

---

## ✅ **Phase 9: Testing Checklist**

Test these features:

- [ ] Supabase auth (guest login)
- [ ] Bookshelf loads user's podcasts
- [ ] Click podcast → opens player
- [ ] Audio plays from Supabase URL
- [ ] Transcript syncs with audio
- [ ] Visuals display correctly
- [ ] Back button returns to Bookshelf
- [ ] No console errors

---

## 📚 **Phase 10: Advanced Features (Optional)**

Add these later:
- **Export Video**: Integrate FFmpeg for video generation
- **Image Generation**: Add visual content creation
- **TTS Integration**: Add multiple voice providers
- **Error Handling**: Add comprehensive error boundaries
- **Loading States**: Add skeleton loaders
- **Optimistic Updates**: Improve UX

---

## 🆘 **Troubleshooting**

### **Supabase Connection Fails**
```bash
# Check .env
node -e "require('dotenv').config(); console.log(process.env.VITE_SUPABASE_URL)"
```

### **CORS Errors**
```sql
-- In Supabase SQL Editor
alter table storage.buckets set cors_origins = {'*'};
```

### **Audio Won't Play**
- Verify `audioUrl` is public Supabase URL
- Check browser console for errors
- Ensure audio file exists in storage

---

## 📖 **Documentation Summary**

**Complete project structure created with:**
- ✅ Types & constants
- ✅ Supabase services
- ✅ Bookshelf component
- ✅ PodcastPlayer component
- ✅ Routing logic
- ✅ All configurations

**Next steps:** Run `npm run dev` and test!