-- 1. Insert new Jin dynasties
INSERT INTO dynasties (id, name, chinese_name, start_year, end_year, color, description) VALUES
('western_jin', 'Western Jin', '西晋', 266, 316, '#9333ea', '短暂统一后，因八王之乱而亡。'),
('eastern_jin', 'Eastern Jin', '东晋', 317, 420, '#a855f7', '衣冠南渡，偏安江南，世族门阀政治。')
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate existing events from 'jin' to 'western_jin' (<= 316)
UPDATE historical_events
SET dynasty_id = 'western_jin'
WHERE dynasty_id = 'jin' AND year <= 316;

-- 3. Migrate existing events from 'jin' to 'eastern_jin' (>= 317)
UPDATE historical_events
SET dynasty_id = 'eastern_jin'
WHERE dynasty_id = 'jin' AND year >= 317;

-- 4. Delete the old 'jin' dynasty if no events reference it
DELETE FROM dynasties
WHERE id = 'jin' AND NOT EXISTS (
    SELECT 1 FROM historical_events WHERE dynasty_id = 'jin'
);
