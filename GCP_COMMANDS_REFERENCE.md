# GCP Deployment Quick Commands Reference

## Check Status of All Services

```powershell
# Load configuration
$config = Get-Content "gcp-config.txt" | ConvertFrom-StringData

# Check all VM status
gcloud compute instances list

# Check database status
gcloud sql instances list

# Check storage buckets
gcloud storage buckets list
```

## View Logs

```powershell
# Backend logs (live)
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo journalctl -u elearning-backend -f"

# Backend logs (last 100 lines)
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo journalctl -u elearning-backend -n 100"

# Ollama logs
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="sudo journalctl -u ollama -f"

# Cloud SQL Proxy logs
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo journalctl -u cloud-sql-proxy -f"
```

## Restart Services

```powershell
# Restart backend
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo systemctl restart elearning-backend"

# Restart Ollama
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="sudo systemctl restart ollama"

# Restart Cloud SQL Proxy
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo systemctl restart cloud-sql-proxy"
```

## Update Application Code

### Update Backend

```powershell
# 1. Create new deployment package
cd backend
tar -czf backend-deploy.tar.gz app migrations scripts requirements.txt alembic.ini

# 2. Upload to VM
gcloud compute scp backend-deploy.tar.gz backend-vm:/tmp/ --zone=$config.ZONE

# 3. Update on VM
gcloud compute ssh backend-vm --zone=$config.ZONE --command='
cd /opt/elearning-backend
sudo tar -xzf /tmp/backend-deploy.tar.gz
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart elearning-backend
'

# 4. Verify
curl http://$config.BACKEND_IP:8000/
```

### Update Frontend

```powershell
# 1. Build new version
cd frontend
npm run build

# 2. Upload to bucket
gcloud storage cp -r dist/* gs://$config.BUCKET_NAME/

# 3. Clear CDN cache (if using CDN)
gcloud compute url-maps invalidate-cdn-cache frontend-url-map --path="/*"
```

## Database Operations

```powershell
# Connect to database
gcloud sql connect elearning-postgres --user=elearning_user --database=elearning_db

# Create backup
gcloud sql backups create --instance=elearning-postgres --description="Manual backup"

# List backups
gcloud sql backups list --instance=elearning-postgres

# Restore from backup
gcloud sql backups restore BACKUP_ID --instance=elearning-postgres
```

## Test Ollama

```powershell
# Test Ollama from backend VM
gcloud compute ssh backend-vm --zone=$config.ZONE --command="
curl http://$config.OLLAMA_IP:11434/api/generate -d '{
  \"model\": \"gemma3:4b\",
  \"prompt\": \"What is machine learning?\",
  \"stream\": false
}'
"

# SSH into Ollama VM and test locally
gcloud compute ssh ollama-vm --zone=$config.ZONE
curl http://localhost:11434/api/tags
ollama run gemma3:4b "Explain Python"
exit
```

## Cost Management

```powershell
# Stop all VMs (save money when not using)
gcloud compute instances stop ollama-vm backend-vm --zone=$config.ZONE

# Start all VMs
gcloud compute instances start ollama-vm backend-vm --zone=$config.ZONE

# Check current costs
gcloud billing accounts list

# View project billing
gcloud beta billing projects describe $config.PROJECT_ID
```

## Troubleshooting

### Backend won't start

```powershell
# Check backend service status
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo systemctl status elearning-backend"

# Check logs for errors
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo journalctl -u elearning-backend -n 50"

# Check if Cloud SQL Proxy is running
gcloud compute ssh backend-vm --zone=$config.ZONE --command="sudo systemctl status cloud-sql-proxy"

# Manually test database connection
gcloud compute ssh backend-vm --zone=$config.ZONE --command="
cd /opt/elearning-backend
source venv/bin/activate
python -c 'from app.database.config import settings; print(settings.database_url)'
"
```

### Ollama not responding

```powershell
# Check Ollama status
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="sudo systemctl status ollama"

# Check if model is downloaded
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="ollama list"

# Re-download model if needed
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="ollama pull gemma3:4b"

# Check Ollama configuration
gcloud compute ssh ollama-vm --zone=$config.ZONE --command="cat /etc/systemd/system/ollama.service.d/override.conf"
```

### Frontend API errors (CORS)

```powershell
# Update CORS in backend
gcloud compute ssh backend-vm --zone=$config.ZONE

# Edit main.py
cd /opt/elearning-backend
sudo nano app/main.py

# Add to CORS middleware allow_origins:
# "https://storage.googleapis.com"

# Save and restart
sudo systemctl restart elearning-backend
exit
```

### Database connection issues

```powershell
# Test database from backend VM
gcloud compute ssh backend-vm --zone=$config.ZONE --command="
ls -la /cloudsql/
sudo systemctl status cloud-sql-proxy
"

# Check database from Cloud SQL side
gcloud sql instances describe elearning-postgres

# Check if database exists
gcloud sql databases list --instance=elearning-postgres

# Check users
gcloud sql users list --instance=elearning-postgres
```

## Performance Monitoring

```powershell
# Check VM resource usage
gcloud compute instances describe backend-vm --zone=$config.ZONE --format="yaml(machineType,status)"
gcloud compute instances describe ollama-vm --zone=$config.ZONE --format="yaml(machineType,status)"

# Check database performance
gcloud sql operations list --instance=elearning-postgres

# View VM metrics in browser
# Go to: https://console.cloud.google.com/compute/instances
```

## Cleanup (Delete Everything)

```powershell
# WARNING: This deletes all resources. Make backups first!

# Delete VMs
gcloud compute instances delete backend-vm ollama-vm --zone=$config.ZONE --quiet

# Delete firewall rules
gcloud compute firewall-rules delete allow-backend-http allow-ollama-internal --quiet

# Delete database
gcloud sql instances delete elearning-postgres --quiet

# Delete storage bucket
gcloud storage rm -r gs://$config.BUCKET_NAME --quiet

# Delete load balancer (if created)
gcloud compute forwarding-rules delete frontend-http-rule --global --quiet
gcloud compute target-http-proxies delete frontend-http-proxy --quiet
gcloud compute url-maps delete frontend-url-map --quiet
gcloud compute backend-buckets delete frontend-backend --quiet
gcloud compute addresses delete frontend-ip --global --quiet
```

## Useful URLs

```powershell
# Display all service URLs
Write-Host "Backend API: http://$($config.BACKEND_IP):8000" -ForegroundColor Cyan
Write-Host "API Docs: http://$($config.BACKEND_IP):8000/docs" -ForegroundColor Cyan
Write-Host "Frontend: $($config.FRONTEND_URL)" -ForegroundColor Cyan
Write-Host "GCP Console: https://console.cloud.google.com" -ForegroundColor Cyan
```

## SSH Quick Access

```powershell
# SSH to backend
gcloud compute ssh backend-vm --zone=$config.ZONE

# SSH to Ollama
gcloud compute ssh ollama-vm --zone=$config.ZONE

# Copy files to backend
gcloud compute scp LOCAL_FILE backend-vm:/tmp/ --zone=$config.ZONE

# Copy files from backend
gcloud compute scp backend-vm:/path/to/file LOCAL_DIR/ --zone=$config.ZONE
```

## Health Checks

```powershell
# Quick health check of all services
function Test-Deployment {
    $config = Get-Content "gcp-config.txt" | ConvertFrom-StringData
    
    Write-Host "Testing deployment health..." -ForegroundColor Yellow
    
    # Test backend
    try {
        $response = Invoke-WebRequest -Uri "http://$($config.BACKEND_IP):8000/" -UseBasicParsing
        Write-Host "✓ Backend API: OK" -ForegroundColor Green
    } catch {
        Write-Host "✗ Backend API: FAILED" -ForegroundColor Red
    }
    
    # Test frontend
    try {
        $response = Invoke-WebRequest -Uri $config.FRONTEND_URL -UseBasicParsing
        Write-Host "✓ Frontend: OK" -ForegroundColor Green
    } catch {
        Write-Host "✗ Frontend: FAILED" -ForegroundColor Red
    }
    
    # Check VMs
    $vms = gcloud compute instances list --format="value(name,status)"
    Write-Host "`nVM Status:" -ForegroundColor Yellow
    Write-Host $vms
    
    # Check database
    $db = gcloud sql instances list --format="value(name,state)"
    Write-Host "`nDatabase Status:" -ForegroundColor Yellow
    Write-Host $db
}

# Run health check
Test-Deployment
```
