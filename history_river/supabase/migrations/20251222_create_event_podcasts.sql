-- Create Event Podcasts table
-- Links historical events (by year + title) to podcast jobs
CREATE TABLE IF NOT EXISTS public.event_podcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_year INTEGER NOT NULL,          -- Links to historical event year
    event_title VARCHAR(200) NOT NULL,    -- Links to historical event title
    podcast_uuid VARCHAR(36) NOT NULL,    -- Job ID from podcast system
    book_title VARCHAR(200) NOT NULL,     -- Book name to display
    douban_rating DECIMAL(3, 1),          -- Optional Douban rating (0.0 - 10.0)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups by event
CREATE INDEX IF NOT EXISTS idx_event_podcasts_event ON public.event_podcasts(event_year, event_title);

-- Create index for podcast UUID lookups
CREATE INDEX IF NOT EXISTS idx_event_podcasts_podcast ON public.event_podcasts(podcast_uuid);

-- Enable RLS for Event Podcasts
ALTER TABLE public.event_podcasts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON public.event_podcasts FOR SELECT USING (true);

-- Allow write access for authenticated users only
CREATE POLICY "Enable write access for authenticated users only" ON public.event_podcasts 
    FOR ALL USING (auth.role() = 'authenticated');
