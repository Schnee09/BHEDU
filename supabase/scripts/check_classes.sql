-- Check what classes exist
SELECT name, COUNT(*) as count 
FROM classes 
GROUP BY name 
ORDER BY name;

-- Show all class names
SELECT id, name FROM classes ORDER BY name;
