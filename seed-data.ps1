# PowerShell script to run the data seeding script

Write-Host "Installing dependencies..."
npm install @supabase/supabase-js

Write-Host "Running seed script..."
node seed-data.js

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
