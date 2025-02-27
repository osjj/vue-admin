@echo off
chcp 65001 > nul
echo Installing dependencies...
npm install

echo Running seed script...
node run-seed.js

echo Done!
pause
