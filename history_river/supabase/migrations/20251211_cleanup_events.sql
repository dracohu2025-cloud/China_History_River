-- 1. Remove fictional events from "Romance of the Three Kingdoms"
DELETE FROM historical_events 
WHERE title IN (
  '吕布戏貂蝉', 
  '桃园结义', 
  '三英战吕布', 
  '温酒斩华雄', 
  '借东风', 
  '草船借箭', 
  '空城计'
);

-- 2. Deduplicate "Emperor Xiaowen Moves Capital"
-- Keep the record for year 494 (historically accurate for the official move).
-- Remove records for year 493 (preparatory year, often duplicates).
DELETE FROM historical_events 
WHERE year = 493 AND (title LIKE '%迁都%' OR title LIKE '%洛阳%');
