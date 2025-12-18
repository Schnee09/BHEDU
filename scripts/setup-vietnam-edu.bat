@echo off
cd /d E:\TTGDBH\BH-EDU
set NEXT_PUBLIC_SUPABASE_URL=https://mwncwhkdimnjovxzhtjm.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmN3aGtkaW1uam92eHpodGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzODUzMCwiZXhwIjoyMDc2MDE0NTMwfQ.XRfRqGTIvIyGeg6iw8dWDBEh552tBrSI0RetYQkqsjU

echo 🚀 Setting up Vietnamese Education System...

echo 1. Seeding Missing Subjects...
node scripts\seed-missing-subjects.js

echo 2. Seeding Curriculum Standards...
node scripts\seed-curriculum-standards.js

echo 3. Seeding Subject Groups and Education Data...
node scripts\seed-vietnam-education.js

echo 🎉 Setup Complete!
pause