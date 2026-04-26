# Gadget X Database Setup Script
Write-Host "Setting up database for Gadget X Desktop..." -ForegroundColor Cyan

$serverDir = "gadgetx-server"

if (!(Test-Path $serverDir)) {
    Write-Host "Error: gadgetx-server directory not found." -ForegroundColor Red
    exit
}

cd $serverDir
npm run migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database migration complete!" -ForegroundColor Green
} else {
    Write-Host "Database migration failed. Please check your .env settings." -ForegroundColor Red
}
