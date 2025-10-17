# Script untuk fix routing struktur tugas (Windows PowerShell)
# Usage: .\scripts\fix-task-routing.ps1

Write-Host "Fixing Task Routing Structure..." -ForegroundColor Cyan
Write-Host ""

# Pastikan dijalankan di root project
if (-not (Test-Path 'package.json')) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory."
    exit 1
}

# Backup folder tugas/buat/[id]
$tugasBuatFolders = Get-ChildItem -Path 'src\app\tugas\buat\' -Directory
foreach ($folder in $tugasBuatFolders) {
    $backupPath = "$($folder.FullName).backup"
    Copy-Item -Path $folder.FullName -Destination $backupPath -Recurse -Force
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
}

# Backup folder api/tasks/create/[id]
$apiCreateFolders = Get-ChildItem -Path 'src\app\api\tasks\create\' -Directory
foreach ($folder in $apiCreateFolders) {
    $backupPath = "$($folder.FullName).backup"
    Copy-Item -Path $folder.FullName -Destination $backupPath -Recurse -Force
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Creating new folder structure..." -ForegroundColor Blue

# Buat folder tujuan
foreach ($folder in $tugasBuatFolders) {
    $id = $folder.Name
    New-Item -ItemType Directory -Path "src\app\tugas\$id\perjanjian" -Force | Out-Null
    New-Item -ItemType Directory -Path "src\app\tugas\$id\konfirmasi" -Force | Out-Null
}

foreach ($folder in $apiCreateFolders) {
    $id = $folder.Name
    New-Item -ItemType Directory -Path "src\app\api\tasks\$id\agreement" -Force | Out-Null
}

Write-Host "✓ New folders created" -ForegroundColor Green
Write-Host ""

Write-Host "Moving page files..." -ForegroundColor Blue

foreach ($folder in $tugasBuatFolders) {
    $id = $folder.Name
    $source = Join-Path $folder.FullName 'perjanjian\page.tsx'
    $dest = "src\app\tugas\$id\perjanjian\page.tsx"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "✓ Moved perjanjian page for $id" -ForegroundColor Green
    } else {
        Write-Host "⚠ perjanjian\page.tsx not found for $id, skipping..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Moving API files..." -ForegroundColor Blue

foreach ($folder in $apiCreateFolders) {
    $id = $folder.Name

    # Move main route.ts
    $sourceRoute = Join-Path $folder.FullName 'route.ts'
    $destRoute = "src\app\api\tasks\$id\route.ts"
    if (Test-Path $sourceRoute) {
        Move-Item -Path $sourceRoute -Destination $destRoute -Force
        Write-Host "✓ Moved task route.ts for $id" -ForegroundColor Green
    } else {
        Write-Host "⚠ route.ts not found for $id, skipping..." -ForegroundColor Yellow
    }

    # Move agreement route.ts
    $sourceAgreement = Join-Path $folder.FullName 'agreement\route.ts'
    $destAgreement = "src\app\api\tasks\$id\agreement\route.ts"
    if (Test-Path $sourceAgreement) {
        Move-Item -Path $sourceAgreement -Destination $destAgreement -Force
        Write-Host "✓ Moved agreement route.ts for $id" -ForegroundColor Green
    } else {
        Write-Host "⚠ agreement\route.ts not found for $id, skipping..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Cleaning up old folders..." -ForegroundColor Blue

foreach ($folder in $tugasBuatFolders) {
    Remove-Item -Path $folder.FullName -Recurse -Force
    Write-Host "✓ Removed old tugas\buat\$($folder.Name) folder" -ForegroundColor Green
}

foreach ($folder in $apiCreateFolders) {
    Remove-Item -Path $folder.FullName -Recurse -Force
    Write-Host "✓ Removed old api\tasks\create\$($folder.Name) folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "Routing structure fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary of changes:" -ForegroundColor Cyan
Write-Host "  ✓ Moved tugas\buat\[id]\perjanjian → tugas\[id]\perjanjian" -ForegroundColor Green
Write-Host "  ✓ Moved api\tasks\create\[id]\route.ts → api\tasks\[id]\route.ts" -ForegroundColor Green
Write-Host "  ✓ Moved api\tasks\create\[id]\agreement → api\tasks\[id]\agreement" -ForegroundColor Green
Write-Host ""
Write-Host "Important:" -ForegroundColor Yellow
Write-Host "  1. Restart your dev server: " -NoNewline
Write-Host "npm run dev" -ForegroundColor Blue
Write-Host "  2. Clear .next cache if needed: " -NoNewline
Write-Host "Remove-Item -Recurse .next" -ForegroundColor Blue
Write-Host "  3. Test the flow: /tugas/buat → /tugas/{id}/perjanjian"
Write-Host ""
Write-Host "Backups are stored in *.backup folders"
Write-Host "  Delete them after confirming everything works."
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
