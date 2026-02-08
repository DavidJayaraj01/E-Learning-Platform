# Deploy Frontend Application to GCP
# Run this after deploying the backend

# Load configuration
$config = Get-Content "gcp-config.txt" | ConvertFrom-StringData
$BACKEND_IP = $config.BACKEND_IP

Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYING FRONTEND APPLICATION" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# ============================================
# STEP 1: UPDATE API ENDPOINT
# ============================================

Write-Host "Updating API endpoint configuration..." -ForegroundColor Yellow

Push-Location frontend

# Backup original api.ts
Copy-Item "src\services\api.ts" "src\services\api.ts.backup"

# Read and update api.ts
$apiContent = Get-Content "src\services\api.ts" -Raw

# Check if BASE_URL or API_URL exists and update it
if ($apiContent -match "const\s+(BASE_URL|API_URL)\s*=\s*[`"'].*[`"']") {
    $apiContent = $apiContent -replace "(const\s+(BASE_URL|API_URL)\s*=\s*)[`"'].*[`"']", "`$1`"http://${BACKEND_IP}:8000`""
    $apiContent | Set-Content "src\services\api.ts"
    Write-Host "Updated API endpoint to: http://${BACKEND_IP}:8000" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not find API_URL in api.ts. Please update manually!" -ForegroundColor Red
    Write-Host "Set API endpoint to: http://${BACKEND_IP}:8000" -ForegroundColor Yellow
    pause
}

# ============================================
# STEP 2: BUILD FRONTEND
# ============================================

Write-Host "`nBuilding frontend..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please fix errors and try again." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# ============================================
# STEP 3: CREATE STORAGE BUCKET
# ============================================

Write-Host "`nCreating storage bucket..." -ForegroundColor Yellow

$TIMESTAMP = [int][double]::Parse((Get-Date -UFormat %s))
$BUCKET_NAME = "elearning-frontend-$TIMESTAMP"

gcloud storage buckets create "gs://$BUCKET_NAME" `
    --location=$config.REGION `
    --uniform-bucket-level-access

# Make bucket publicly readable
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" `
    --member=allUsers `
    --role=roles/storage.objectViewer

# Configure as website
gcloud storage buckets update "gs://$BUCKET_NAME" `
    --web-main-page-suffix=index.html `
    --web-error-page=index.html

Write-Host "Bucket created: $BUCKET_NAME" -ForegroundColor Green

# ============================================
# STEP 4: UPLOAD FILES
# ============================================

Write-Host "`nUploading frontend files..." -ForegroundColor Yellow

# Upload all dist files
gcloud storage cp -r dist/* "gs://$BUCKET_NAME/"

Write-Host "Files uploaded successfully!" -ForegroundColor Green

# ============================================
# STEP 5: GET PUBLIC URL
# ============================================

$FRONTEND_URL = "https://storage.googleapis.com/$BUCKET_NAME/index.html"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "FRONTEND DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend API: http://${BACKEND_IP}:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://${BACKEND_IP}:8000/docs" -ForegroundColor Cyan

# Save frontend URL to config
Add-Content -Path "gcp-config.txt" -Value "`nFRONTEND_URL=$FRONTEND_URL"
Add-Content -Path "gcp-config.txt" -Value "BUCKET_NAME=$BUCKET_NAME"

Write-Host "`nConfiguration updated in gcp-config.txt" -ForegroundColor Green

# ============================================
# STEP 6: UPDATE BACKEND CORS
# ============================================

Write-Host "`nTo allow frontend to access backend, update CORS settings:" -ForegroundColor Yellow
Write-Host "1. SSH into backend VM:" -ForegroundColor White
Write-Host "   gcloud compute ssh backend-vm --zone=$($config.ZONE)" -ForegroundColor Cyan
Write-Host "2. Edit app/main.py and add to CORS origins:" -ForegroundColor White
Write-Host "   'https://storage.googleapis.com'" -ForegroundColor Cyan
Write-Host "3. Restart backend:" -ForegroundColor White
Write-Host "   sudo systemctl restart elearning-backend" -ForegroundColor Cyan

Pop-Location

Write-Host "`n🚀 Your E-Learning Platform is now live!" -ForegroundColor Green
Write-Host "Open this URL in your browser: $FRONTEND_URL" -ForegroundColor Cyan
