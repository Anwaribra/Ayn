# Script to build only the landing page (excluding platform pages)

Write-Host "Building landing page only..."

# Backup platform directory outside of app folder
if (Test-Path "app\platform") {
  Write-Host "Moving platform directory temporarily..."
  Move-Item -Path "app\platform" -Destination "..\platform.backup"
}

# Build
Write-Host "Building..."
pnpm build

# Restore platform directory
if (Test-Path "..\platform.backup") {
  Write-Host "Restoring platform directory..."
  Move-Item -Path "..\platform.backup" -Destination "app\platform"
}

Write-Host "Build complete!"

