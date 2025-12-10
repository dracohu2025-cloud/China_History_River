-- Enable public read access for jobs and podcasts tables to allow shared player access

-- 1. Jobs Table
-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts (optional, but safer to just add IF NOT EXISTS or create new name)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for public jobs" ON public.jobs;

-- Create new public read policy
CREATE POLICY "Enable read access for public jobs" 
ON public.jobs 
FOR SELECT 
USING (true);

-- 2. Podcasts Table
ALTER TABLE IF EXISTS public.podcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.podcasts;
DROP POLICY IF EXISTS "Enable read access for public podcasts" ON public.podcasts;

CREATE POLICY "Enable read access for public podcasts" 
ON public.podcasts 
FOR SELECT 
USING (true);
