@echo off
echo Installing dependencies...
npm install @supabase/supabase-js

echo Running seed script...
node seed-data.js

pause
