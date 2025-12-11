-- Increase importance of major Jin Dynasty events to ensure visibility
-- 1. Founding of Eastern Jin (317) - Critical event, was hidden due to layout collision
UPDATE historical_events 
SET importance = 5, event_type = 'politics'
WHERE year = 317 AND (title = '东晋建立' OR title LIKE '%东晋建立%');

-- 2. Founding of Western Jin (266) - Critical event
UPDATE historical_events 
SET importance = 5 
WHERE year = 266 AND (title = '司马炎建晋' OR title LIKE '%司马炎建晋%');

-- 3. Unification of Three Kingdoms (280) - Major event
UPDATE historical_events
SET importance = 4
WHERE year = 280 AND (title = '西晋灭吴' OR title LIKE '%西晋灭吴%');
