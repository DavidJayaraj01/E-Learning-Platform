# GCP Deployment Guide for E-Learning Platform

## Overview
This guide walks you through deploying your E-Learning Platform to Google Cloud Platform using the CLI with your free $300 credit.

**Architecture:**
- **Compute Engine VM**: Ollama with Gemma3:4b model
- **Cloud SQL**: Managed PostgreSQL database
- **Compute Engine VM**: FastAPI backend application
- **Cloud Storage + Cloud CDN**: React frontend (static files)

**Estimated Monthly Cost**: ~$50-100 (well within your $300 credit for 3 months)

## Prerequisites

1. ✅ GCP Account with $300 free credit
2. ✅ Install Google Cloud SDK (gcloud CLI)
3. ✅ Basic knowledge of Linux commands

---

## Part 1: Initial Setup (10 minutes)

### 1.1 Install Google Cloud SDK

**Windows (PowerShell as Administrator):**
```powershell
# Download and install gcloud SDK
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

After installation, restart PowerShell and verify:
```powershell
gcloud --version
```

### 1.2 Initialize and Authenticate

```bash
# Login to your GCP account
gcloud auth login

# List your projects
gcloud projects list

# Create a new project (or use existing)
gcloud projects create elearning-platform-proj --name="E-Learning Platform"

# Set the project
gcloud config set project elearning-platform-proj

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable vpcaccess.googleapis.com
```

### 1.3 Set Default Region and Zone

```bash
# Set to a region close to you (examples: us-central1, europe-west1, asia-south1)
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a
```

---

## Part 2: Deploy PostgreSQL Database (15 minutes)

### 2.1 Create Cloud SQL PostgreSQL Instance

```bash
# Create PostgreSQL instance (db-f1-micro is free tier eligible)
gcloud sql instances create elearning-postgres \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_STRONG_PASSWORD_HERE \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=04 \
    --maintenance-release-channel=production

# Wait for instance to be created (takes 5-10 minutes)
gcloud sql instances list
```

### 2.2 Create Database and User

```bash
# Create the database
gcloud sql databases create elearning_db \
    --instance=elearning-postgres

# Create database user
gcloud sql users create elearning_user \
    --instance=elearning-postgres \
    --password=ELEARNING_USER_PASSWORD_HERE

# Get connection name (you'll need this later)
gcloud sql instances describe elearning-postgres --format="value(connectionName)"
# Output will be like: PROJECT_ID:REGION:INSTANCE_NAME
```

### 2.3 Configure Public IP Access (for initial setup)

```bash
# Allow your current IP to access the database
YOUR_IP=$(curl -s ifconfig.me)
gcloud sql instances patch elearning-postgres \
    --authorized-networks=$YOUR_IP/32

# Later, you'll restrict this to only allow VM access
```

---

## Part 3: Deploy Ollama VM with Gemma3:4b (20 minutes)

### 3.1 Create VM for Ollama

```bash
# Create a VM with sufficient resources for Gemma3:4b
# e2-standard-2: 2 vCPUs, 8GB RAM - good for Gemma3:4b
gcloud compute instances create ollama-vm \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-balanced \
    --tags=ollama-server \
    --metadata=startup-script='#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Configure Ollama to accept external connections
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

# Restart Ollama service
systemctl daemon-reload
systemctl restart ollama

# Pull Gemma3:4b model (this will take time)
sleep 10
ollama pull gemma3:4b

# Keep service running
systemctl enable ollama
'
```

### 3.2 Create Firewall Rule for Ollama

```bash
# Allow internal network access to Ollama (port 11434)
gcloud compute firewall-rules create allow-ollama-internal \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:11434 \
    --source-ranges=10.128.0.0/9 \
    --target-tags=ollama-server
```

### 3.3 Verify Ollama Installation

```bash
# SSH into the VM
gcloud compute ssh ollama-vm --zone=us-central1-a

# Inside the VM, check Ollama status
sudo systemctl status ollama

# Test Ollama
curl http://localhost:11434/api/tags

# Test Gemma3:4b model
ollama run gemma3:4b "Hello, how are you?"

# Exit SSH
exit
```

### 3.4 Get Ollama VM Internal IP

```bash
# Get the internal IP (you'll use this in backend configuration)
gcloud compute instances describe ollama-vm \
    --zone=us-central1-a \
    --format="get(networkInterfaces[0].networkIP)"
# Save this IP address
```

---

## Part 4: Deploy Backend FastAPI Application (25 minutes)

### 4.1 Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4.2 Create Backend Startup Script

Create `backend/startup.sh`:
```bash
#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database..."
sleep 10

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI application..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4.3 Create Backend VM

```bash
# Get Cloud SQL connection name
SQL_CONNECTION=$(gcloud sql instances describe elearning-postgres --format="value(connectionName)")

# Get Ollama VM internal IP
OLLAMA_IP=$(gcloud compute instances describe ollama-vm --zone=us-central1-a --format="get(networkInterfaces[0].networkIP)")

# Create backend VM
gcloud compute instances create backend-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=backend-server \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --metadata=sql-connection-name=$SQL_CONNECTION,ollama-ip=$OLLAMA_IP,startup-script='#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y python3-pip python3-venv git postgresql-client wget

# Install Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /usr/local/bin/cloud_sql_proxy
chmod +x /usr/local/bin/cloud_sql_proxy

# Create application directory
mkdir -p /opt/elearning-backend
cd /opt/elearning-backend

# Note: You will upload your code separately
echo "Backend VM ready. Upload your application code next."
'
```

### 4.4 Create Firewall Rule for Backend

```bash
# Allow HTTP/HTTPS traffic to backend
gcloud compute firewall-rules create allow-backend-http \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:8000,tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=backend-server
```

### 4.5 Deploy Backend Code

From your local machine:

```bash
# Navigate to your project directory
cd E-Learning-Platform/backend

# Create a deployment package
tar -czf backend-deploy.tar.gz \
    app/ \
    migrations/ \
    scripts/ \
    requirements.txt \
    alembic.ini \
    .env.example

# Copy to backend VM
gcloud compute scp backend-deploy.tar.gz backend-vm:/tmp/ --zone=us-central1-a

# SSH into backend VM and setup
gcloud compute ssh backend-vm --zone=us-central1-a

# Inside the VM:
cd /opt/elearning-backend
sudo tar -xzf /tmp/backend-deploy.tar.gz
sudo chown -R $USER:$USER /opt/elearning-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with production values (use nano or vi)
nano .env
```

**Update .env file with these values:**
```bash
# Get Cloud SQL connection and Ollama IP from metadata
SQL_CONNECTION=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/sql-connection-name)
OLLAMA_IP=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/ollama-ip)

# Set these in .env:
DATABASE_URL=postgresql+asyncpg://elearning_user:ELEARNING_USER_PASSWORD_HERE@/elearning_db?host=/cloudsql/$SQL_CONNECTION
DATABASE_URL_SYNC=postgresql://elearning_user:ELEARNING_USER_PASSWORD_HERE@/elearning_db?host=/cloudsql/$SQL_CONNECTION
SECRET_KEY=GENERATE_NEW_STRONG_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 4.6 Setup Cloud SQL Proxy and Run Backend

```bash
# Still in backend VM SSH session

# Start Cloud SQL Proxy in background
/usr/local/bin/cloud_sql_proxy \
    --unix-socket=/cloudsql \
    $(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/sql-connection-name) &

# Wait for proxy to connect
sleep 5

# Run database migrations
source venv/bin/activate
cd /opt/elearning-backend
alembic upgrade head

# Create systemd service for the backend
sudo tee /etc/systemd/system/elearning-backend.service > /dev/null << 'EOF'
[Unit]
Description=E-Learning Backend Service
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/elearning-backend
Environment="PATH=/opt/elearning-backend/venv/bin"
ExecStartPre=/usr/local/bin/cloud_sql_proxy --unix-socket=/cloudsql PROJECT_ID:REGION:elearning-postgres &
ExecStart=/opt/elearning-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Update the service file with your username
sudo sed -i "s/YOUR_USERNAME/$USER/" /etc/systemd/system/elearning-backend.service

# Get SQL connection name and update service
SQL_CONN=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/sql-connection-name)
sudo sed -i "s/PROJECT_ID:REGION:elearning-postgres/$SQL_CONN/" /etc/systemd/system/elearning-backend.service

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable elearning-backend
sudo systemctl start elearning-backend

# Check status
sudo systemctl status elearning-backend

# Exit SSH
exit
```

### 4.7 Test Backend API

```bash
# Get backend VM external IP
BACKEND_IP=$(gcloud compute instances describe backend-vm --zone=us-central1-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

# Test the API
curl http://$BACKEND_IP:8000/docs

echo "Backend API available at: http://$BACKEND_IP:8000"
```

---

## Part 5: Deploy Frontend (20 minutes)

### 5.1 Build Frontend Locally

```bash
# On your local machine
cd E-Learning-Platform/frontend

# Update API endpoint in your code to point to backend VM
# Edit src/services/api.ts and set:
# const API_URL = "http://BACKEND_VM_IP:8000"

# Install dependencies (if not already)
npm install

# Build for production
npm run build

# This creates a 'dist' folder with static files
```

### 5.2 Create Cloud Storage Bucket

```bash
# Create a unique bucket name
BUCKET_NAME="elearning-frontend-$(date +%s)"

# Create bucket
gcloud storage buckets create gs://$BUCKET_NAME \
    --location=us-central1 \
    --uniform-bucket-level-access

# Make bucket publicly readable
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
    --member=allUsers \
    --role=roles/storage.objectViewer

# Configure as website
gcloud storage buckets update gs://$BUCKET_NAME --web-main-page-suffix=index.html --web-error-page=index.html
```

### 5.3 Upload Frontend Files

```bash
# Upload all files from dist folder
gcloud storage cp -r dist/* gs://$BUCKET_NAME/

# Set cache control for static assets
gcloud storage objects update gs://$BUCKET_NAME/** \
    --cache-control="public, max-age=31536000" \
    --recursive

# Get the public URL
echo "Frontend URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
```

### 5.4 (Optional) Setup Load Balancer with Custom Domain

If you want a custom domain and HTTPS:

```bash
# Reserve static IP
gcloud compute addresses create frontend-ip --global

# Create backend bucket
gcloud compute backend-buckets create frontend-backend \
    --gcs-bucket-name=$BUCKET_NAME \
    --enable-cdn

# Create URL map
gcloud compute url-maps create frontend-url-map \
    --default-backend-bucket=frontend-backend

# Create HTTP(S) proxy
gcloud compute target-http-proxies create frontend-http-proxy \
    --url-map=frontend-url-map

# Create forwarding rule
gcloud compute forwarding-rules create frontend-http-rule \
    --address=frontend-ip \
    --global \
    --target-http-proxy=frontend-http-proxy \
    --ports=80

# Get static IP
gcloud compute addresses describe frontend-ip --global --format="get(address)"
```

---

## Part 6: Configure CORS and Security (10 minutes)

### 6.1 Update Backend CORS Settings

SSH into backend VM and update the CORS settings:

```bash
gcloud compute ssh backend-vm --zone=us-central1-a

# Edit main.py to update CORS origins
cd /opt/elearning-backend
nano app/main.py
```

Update CORS middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://storage.googleapis.com",
        "http://YOUR_BACKEND_IP:8000",
        # Add your custom domain if you have one
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart the backend:
```bash
sudo systemctl restart elearning-backend
exit
```

---

## Part 7: Testing and Verification (15 minutes)

### 7.1 Test Database Connection

```bash
# Connect to Cloud SQL instance
gcloud sql connect elearning-postgres --user=elearning_user --database=elearning_db

# Inside PostgreSQL shell:
\dt  # List all tables
\q   # Quit
```

### 7.2 Test Ollama Service

```bash
# SSH into Ollama VM
gcloud compute ssh ollama-vm --zone=us-central1-a

# Test model
curl http://localhost:11434/api/generate -d '{
  "model": "gemma3:4b",
  "prompt": "Explain machine learning",
  "stream": false
}'

exit
```

### 7.3 Test Complete Flow

```bash
# Get backend IP
BACKEND_IP=$(gcloud compute instances describe backend-vm --zone=us-central1-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

# Test health endpoint
curl http://$BACKEND_IP:8000/

# Access API docs
echo "API Documentation: http://$BACKEND_IP:8000/docs"

# Access frontend
echo "Frontend URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
```

---

## Part 8: Cost Optimization Tips

### 8.1 Monitor Your Spending

```bash
# Check current spending
gcloud billing accounts list

# Set up budget alerts
gcloud billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="E-Learning Platform Budget" \
    --budget-amount=100 \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90 \
    --threshold-rule=percent=100
```

### 8.2 Stop VMs When Not in Use

```bash
# Stop all VMs (will save compute costs)
gcloud compute instances stop ollama-vm --zone=us-central1-a
gcloud compute instances stop backend-vm --zone=us-central1-a

# Start them again when needed
gcloud compute instances start ollama-vm --zone=us-central1-a
gcloud compute instances start backend-vm --zone=us-central1-a
```

### 8.3 Use Preemptible VMs (50-80% cheaper)

For development/testing:
```bash
# Create preemptible Ollama VM (much cheaper)
gcloud compute instances create ollama-vm-preempt \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --preemptible \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    # ... rest of the configuration
```

---

## Part 9: Maintenance Commands

### 9.1 View Logs

```bash
# Backend logs
gcloud compute ssh backend-vm --zone=us-central1-a
sudo journalctl -u elearning-backend -f

# Ollama logs
gcloud compute ssh ollama-vm --zone=us-central1-a
sudo journalctl -u ollama -f
```

### 9.2 Update Application

```bash
# Create new deployment package on local machine
cd E-Learning-Platform/backend
tar -czf backend-deploy.tar.gz app/ migrations/ requirements.txt alembic.ini

# Upload and deploy
gcloud compute scp backend-deploy.tar.gz backend-vm:/tmp/ --zone=us-central1-a
gcloud compute ssh backend-vm --zone=us-central1-a

# Extract and restart
cd /opt/elearning-backend
tar -xzf /tmp/backend-deploy.tar.gz
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart elearning-backend
exit
```

### 9.3 Backup Database

```bash
# Create on-demand backup
gcloud sql backups create \
    --instance=elearning-postgres \
    --description="Manual backup $(date +%Y%m%d)"

# List backups
gcloud sql backups list --instance=elearning-postgres
```

---

## Part 10: Troubleshooting

### Common Issues:

**1. Backend can't connect to database:**
```bash
# Check Cloud SQL Proxy is running
sudo systemctl status elearning-backend
# Verify database credentials in .env
```

**2. Ollama out of memory:**
```bash
# Upgrade VM to larger instance
gcloud compute instances set-machine-type ollama-vm \
    --machine-type=e2-standard-4 \
    --zone=us-central1-a
```

**3. Frontend API calls failing:**
```bash
# Check CORS settings in backend
# Verify frontend API_URL points to correct backend IP
```

**4. High costs:**
```bash
# Check what's consuming resources
gcloud compute instances list
gcloud sql instances list
# Stop unused VMs
```

---

## Summary of Resources Created

1. **Cloud SQL PostgreSQL**: `elearning-postgres` (db-f1-micro)
2. **Ollama VM**: `ollama-vm` (e2-standard-2, ~$50/month)
3. **Backend VM**: `backend-vm` (e2-medium, ~$25/month)
4. **Storage Bucket**: For frontend static files (~$1/month)
5. **Total**: ~$75-100/month (3 months free!)

## Quick Reference - Service URLs

```bash
# Get all important URLs at once
echo "=== E-Learning Platform URLs ==="
echo "Backend API: http://$(gcloud compute instances describe backend-vm --zone=us-central1-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)"):8000"
echo "API Docs: http://$(gcloud compute instances describe backend-vm --zone=us-central1-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)"):8000/docs"
echo "Ollama Internal IP: $(gcloud compute instances describe ollama-vm --zone=us-central1-a --format="get(networkInterfaces[0].networkIP)")"
echo "Database: $(gcloud sql instances describe elearning-postgres --format="value(connectionName)")"
```

---

## Next Steps

1. **Setup monitoring**: Use Cloud Monitoring for alerts
2. **Enable HTTPS**: Get SSL certificate for custom domain
3. **Setup CI/CD**: Automate deployments with Cloud Build
4. **Scale**: Add load balancing when needed
5. **Backup strategy**: Regular automated backups

Good luck with your deployment! 🚀
