# Deploy Backend Application to GCP
# Run this after running deploy-gcp-setup.ps1

# Load configuration
$config = Get-Content "gcp-config.txt" | ConvertFrom-StringData
$ZONE = $config.ZONE
$BACKEND_IP = $config.BACKEND_IP
$SQL_CONNECTION = $config.SQL_CONNECTION
$OLLAMA_IP = $config.OLLAMA_IP
$DB_USER_PASSWORD = $config.DB_USER_PASSWORD

Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYING BACKEND APPLICATION" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# ============================================
# STEP 1: CREATE DEPLOYMENT PACKAGE
# ============================================

Write-Host "Creating deployment package..." -ForegroundColor Yellow

Push-Location backend

# Create deployment package
tar -czf backend-deploy.tar.gz `
    app `
    migrations `
    scripts `
    requirements.txt `
    alembic.ini `
    .en v.example

Write-Host "Deployment package created: backend-deploy.tar.gz" -ForegroundColor Green

# ============================================
# STEP 2: UPLOAD TO BACKEND VM
# ============================================

Write-Host "Uploading to backend VM..." -ForegroundColor Yellow

gcloud compute scp backend-deploy.tar.gz backend-vm:/tmp/ --zone=$ZONE

# ============================================
# STEP 3: SETUP BACKEND ON VM
# ============================================

Write-Host "Setting up backend on VM..." -ForegroundColor Yellow

# Create setup script
$setupScript = @"
#!/bin/bash
set -e

echo '=== Installing dependencies ==='
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv postgresql-client wget

echo '=== Installing Cloud SQL Proxy ==='
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /tmp/cloud_sql_proxy
sudo mv /tmp/cloud_sql_proxy /usr/local/bin/
sudo chmod +x /usr/local/bin/cloud_sql_proxy

echo '=== Setting up application ==='
sudo mkdir -p /opt/elearning-backend
cd /opt/elearning-backend
sudo tar -xzf /tmp/backend-deploy.tar.gz
sudo chown -R \`$USER:\$USER /opt/elearning-backend

echo '=== Creating virtual environment ==='
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo '=== Creating .env file ==='
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql+asyncpg://elearning_user:$DB_USER_PASSWORD@/elearning_db?host=/cloudsql/$SQL_CONNECTION
DATABASE_URL_SYNC=postgresql://elearning_user:$DB_USER_PASSWORD@/elearning_db?host=/cloudsql/$SQL_CONNECTION
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
FRONTEND_URL=http://$BACKEND_IP:8000
ENVEOF

echo '=== Creating Cloud SQL Proxy service ==='
sudo tee /etc/systemd/system/cloud-sql-proxy.service > /dev/null << 'EOF'
[Unit]
Description=Cloud SQL Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloud_sql_proxy --unix-socket=/cloudsql $SQL_CONNECTION
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

echo '=== Starting Cloud SQL Proxy ==='
sudo systemctl daemon-reload
sudo systemctl enable cloud-sql-proxy
sudo systemctl start cloud-sql-proxy
sleep 5

echo '=== Running database migrations ==='
source venv/bin/activate
alembic upgrade head

echo '=== Creating backend service ==='
sudo tee /etc/systemd/system/elearning-backend.service > /dev/null << EOF
[Unit]
Description=E-Learning Backend Service
After=network.target cloud-sql-proxy.service

[Service]
Type=simple
User=\$USER
WorkingDirectory=/opt/elearning-backend
Environment="PATH=/opt/elearning-backend/venv/bin"
ExecStart=/opt/elearning-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

echo '=== Starting backend service ==='
sudo systemctl daemon-reload
sudo systemctl enable elearning-backend
sudo systemctl start elearning-backend

echo '=== Checking service status ==='
sleep 3
sudo systemctl status elearning-backend --no-pager

echo '=== Setup complete! ==='
"@

# Save script and upload
$setupScript | Out-File -FilePath "setup-backend.sh" -Encoding UTF8
gcloud compute scp setup-backend.sh backend-vm:/tmp/ --zone=$ZONE

# Execute setup script
Write-Host "Executing setup script on VM..." -ForegroundColor Yellow
gcloud compute ssh backend-vm --zone=$ZONE --command="chmod +x /tmp/setup-backend.sh && /tmp/setup-backend.sh"

Pop-Location

# ============================================
# STEP 4: VERIFY DEPLOYMENT
# ============================================

Write-Host "`nVerifying deployment..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

$apiResponse = Invoke-WebRequest -Uri "http://${BACKEND_IP}:8000/" -UseBasicParsing -ErrorAction SilentlyContinue

if ($apiResponse.StatusCode -eq 200) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "BACKEND DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "API URL: http://${BACKEND_IP}:8000" -ForegroundColor Cyan
    Write-Host "API Docs: http://${BACKEND_IP}:8000/docs" -ForegroundColor Cyan
    
    Write-Host "`nYou can now deploy the frontend!" -ForegroundColor Yellow
} else {
    Write-Host "`nBackend may still be starting up. Check status with:" -ForegroundColor Yellow
    Write-Host "gcloud compute ssh backend-vm --zone=$ZONE --command='sudo systemctl status elearning-backend'" -ForegroundColor White
}

Write-Host "`nView backend logs:" -ForegroundColor Yellow
Write-Host "gcloud compute ssh backend-vm --zone=$ZONE --command='sudo journalctl -u elearning-backend -f'" -ForegroundColor White
