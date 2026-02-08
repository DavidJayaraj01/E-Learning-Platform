# Quick GCP Deployment Script
# Run this script section by section in PowerShell

# ============================================
# STEP 1: INITIAL SETUP
# ============================================

# Set your project name (change this!)
$PROJECT_ID = "elearning-platform-proj"
$REGION = "us-central1"
$ZONE = "us-central1-a"

# Authenticate and set project
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
gcloud config set compute/zone $ZONE

# Enable APIs
Write-Host "Enabling required APIs..." -ForegroundColor Green
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# ============================================
# STEP 2: CREATE POSTGRESQL DATABASE
# ============================================

Write-Host "Creating Cloud SQL PostgreSQL instance..." -ForegroundColor Green
Write-Host "This will take 5-10 minutes..." -ForegroundColor Yellow

# Set passwords (CHANGE THESE!)
$DB_ROOT_PASSWORD = "Change_This_Root_Pass_123"
$DB_USER_PASSWORD = "Change_This_User_Pass_456"

gcloud sql instances create elearning-postgres `
    --database-version=POSTGRES_14 `
    --tier=db-f1-micro `
    --region=$REGION `
    --root-password=$DB_ROOT_PASSWORD `
    --storage-type=SSD `
    --storage-size=10GB `
    --storage-auto-increase

# Create database and user
gcloud sql databases create elearning_db --instance=elearning-postgres
gcloud sql users create elearning_user --instance=elearning-postgres --password=$DB_USER_PASSWORD

# Get connection name
$SQL_CONNECTION = gcloud sql instances describe elearning-postgres --format="value(connectionName)"
Write-Host "Database Connection: $SQL_CONNECTION" -ForegroundColor Cyan

# Allow your IP temporarily
$YOUR_IP = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
gcloud sql instances patch elearning-postgres --authorized-networks="$YOUR_IP/32"

# ============================================
# STEP 3: CREATE OLLAMA VM
# ============================================

Write-Host "Creating Ollama VM with Gemma3:4b..." -ForegroundColor Green

gcloud compute instances create ollama-vm `
    --zone=$ZONE `
    --machine-type=e2-standard-2 `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --boot-disk-size=30GB `
    --tags=ollama-server `
    --metadata=startup-script='#!/bin/bash
apt-get update && apt-get upgrade -y
curl -fsSL https://ollama.com/install.sh | sh
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF
systemctl daemon-reload
systemctl restart ollama
sleep 10
ollama pull gemma3:4b
systemctl enable ollama
'

# Create firewall rule
gcloud compute firewall-rules create allow-ollama-internal `
    --direction=INGRESS `
    --network=default `
    --action=ALLOW `
    --rules=tcp:11434 `
    --source-ranges=10.128.0.0/9 `
    --target-tags=ollama-server

# Get Ollama IP
$OLLAMA_IP = gcloud compute instances describe ollama-vm --zone=$ZONE --format="get(networkInterfaces[0].networkIP)"
Write-Host "Ollama Internal IP: $OLLAMA_IP" -ForegroundColor Cyan

# ============================================
# STEP 4: CREATE BACKEND VM
# ============================================

Write-Host "Creating Backend VM..." -ForegroundColor Green

gcloud compute instances create backend-vm `
    --zone=$ZONE `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --boot-disk-size=20GB `
    --tags=backend-server `
    --scopes=https://www.googleapis.com/auth/cloud-platform `
    --metadata=sql-connection-name=$SQL_CONNECTION,ollama-ip=$OLLAMA_IP

# Create firewall rule
gcloud compute firewall-rules create allow-backend-http `
    --direction=INGRESS `
    --network=default `
    --action=ALLOW `
    --rules=tcp:8000,tcp:80,tcp:443 `
    --source-ranges=0.0.0.0/0 `
    --target-tags=backend-server

# Get Backend IP
$BACKEND_IP = gcloud compute instances describe backend-vm --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
Write-Host "Backend External IP: $BACKEND_IP" -ForegroundColor Cyan

# ============================================
# STEP 5: SUMMARY
# ============================================

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT INITIAL SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "DATABASE:" -ForegroundColor Yellow
Write-Host "  Connection: $SQL_CONNECTION"
Write-Host "  Database: elearning_db"
Write-Host "  User: elearning_user"
Write-Host "  Password: $DB_USER_PASSWORD"

Write-Host "`nOLLAMA VM:" -ForegroundColor Yellow
Write-Host "  Internal IP: $OLLAMA_IP"
Write-Host "  Port: 11434"
Write-Host "  Model: gemma3:4b (downloading...)"

Write-Host "`nBACKEND VM:" -ForegroundColor Yellow
Write-Host "  External IP: $BACKEND_IP"
Write-Host "  Port: 8000"

Write-Host "`nNEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Wait 5-10 minutes for Ollama to download Gemma3:4b model"
Write-Host "2. Run deploy-backend.ps1 to deploy your backend code"
Write-Host "3. Run deploy-frontend.ps1 to deploy your frontend"
Write-Host "`n"

# Save configuration to file
@"
# GCP Deployment Configuration
# Generated: $(Get-Date)

PROJECT_ID=$PROJECT_ID
REGION=$REGION
ZONE=$ZONE
SQL_CONNECTION=$SQL_CONNECTION
DB_USER_PASSWORD=$DB_USER_PASSWORD
OLLAMA_IP=$OLLAMA_IP
BACKEND_IP=$BACKEND_IP
"@ | Out-File -FilePath "gcp-config.txt" -Encoding UTF8

Write-Host "Configuration saved to: gcp-config.txt" -ForegroundColor Green
