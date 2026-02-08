# Quick Start Guide - Deploy to GCP in 30 Minutes

## 🚀 Prerequisites
- [ ] GCP account with $300 free credit
- [ ] Google Cloud SDK installed (gcloud CLI)
- [ ] Windows PowerShell (as Administrator)

## 📋 3-Step Deployment Process

### Step 1: Initial GCP Setup (10 minutes)

Open PowerShell as Administrator and run:

```powershell
cd E-Learning-Platform

# Edit this file first - set your passwords!
notepad deploy-gcp-setup.ps1

# Run the setup (creates database, VMs, networking)
.\deploy-gcp-setup.ps1
```

**This script will:**
- ✅ Create PostgreSQL database on Cloud SQL
- ✅ Create Ollama VM and download Gemma3:4b model
- ✅ Create Backend VM
- ✅ Configure firewall rules
- ✅ Save configuration to `gcp-config.txt`

**⏳ Wait 10-15 minutes** for Ollama to download the Gemma3:4b model (4GB+)

---

### Step 2: Deploy Backend (10 minutes)

```powershell
# Deploy your FastAPI backend
.\deploy-backend.ps1
```

**This script will:**
- ✅ Package your backend code
- ✅ Upload to Backend VM
- ✅ Install dependencies
- ✅ Setup Cloud SQL Proxy
- ✅ Run database migrations
- ✅ Start backend service

**Verify:** Visit `http://YOUR_BACKEND_IP:8000/docs` in your browser

---

### Step 3: Deploy Frontend (10 minutes)

```powershell
# Build and deploy React frontend
.\deploy-frontend.ps1
```

**This script will:**
- ✅ Update API endpoint configuration
- ✅ Build React application
- ✅ Create Cloud Storage bucket
- ✅ Upload static files
- ✅ Configure public access

**Verify:** Visit the frontend URL displayed after deployment

---

## 🎯 Quick Commands

### Check if everything is running:
```powershell
# Load config
$config = Get-Content "gcp-config.txt" | ConvertFrom-StringData

# Check VM status
gcloud compute instances list

# Check database
gcloud sql instances list

# Test backend API
curl http://$($config.BACKEND_IP):8000/
```

### View logs:
```powershell
# Backend logs
gcloud compute ssh backend-vm --command="sudo journalctl -u elearning-backend -f"

# Ollama logs
gcloud compute ssh ollama-vm --command="sudo journalctl -u ollama -f"
```

### Stop VMs to save money:
```powershell
# Stop when not using (saves 80% of costs!)
gcloud compute instances stop ollama-vm backend-vm

# Start again
gcloud compute instances start ollama-vm backend-vm
```

---

## 💰 Cost Breakdown

| Service | Type | Monthly Cost | Notes |
|---------|------|--------------|-------|
| Cloud SQL | db-f1-micro | ~$15 | Can use free tier |
| Ollama VM | e2-standard-2 | ~$50 | Stop when not using |
| Backend VM | e2-medium | ~$25 | Stop when not using |
| Storage | Bucket | ~$1 | Pay per GB |
| **Total** | | **~$90/month** | **3+ months free!** |

💡 **Pro tip:** Stop VMs at night to save ~$50/month!

---

## 🔧 Troubleshooting

### Backend won't start?
```powershell
# Check what's wrong
gcloud compute ssh backend-vm --command="sudo systemctl status elearning-backend"

# View detailed logs
gcloud compute ssh backend-vm --command="sudo journalctl -u elearning-backend -n 50"
```

### Ollama not working?
```powershell
# Check if model is downloaded
gcloud compute ssh ollama-vm --command="ollama list"

# Re-download if needed
gcloud compute ssh ollama-vm --command="ollama pull gemma3:4b"
```

### Database connection failed?
```powershell
# Check Cloud SQL Proxy
gcloud compute ssh backend-vm --command="sudo systemctl status cloud-sql-proxy"

# Test database connection
gcloud sql connect elearning-postgres --user=elearning_user
```

### Frontend can't connect to backend (CORS)?
```powershell
# SSH to backend
gcloud compute ssh backend-vm

# Edit CORS settings
cd /opt/elearning-backend
sudo nano app/main.py

# Add 'https://storage.googleapis.com' to allow_origins
# Then restart:
sudo systemctl restart elearning-backend
exit
```

---

## 📚 Additional Resources

- **Full Documentation:** See `GCP_DEPLOYMENT_GUIDE.md`
- **Command Reference:** See `GCP_COMMANDS_REFERENCE.md`
- **GCP Console:** https://console.cloud.google.com

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Backend API docs accessible at `http://YOUR_IP:8000/docs`
- [ ] Frontend loads in browser
- [ ] Can create user account
- [ ] Can login
- [ ] Can create a course
- [ ] Ollama generates content (test RAG feature)

---

## 🗑️ Cleanup (When Done)

**To delete everything and stop billing:**

```powershell
# Delete all resources
gcloud compute instances delete backend-vm ollama-vm --quiet
gcloud sql instances delete elearning-postgres --quiet
gcloud storage rm -r gs://YOUR_BUCKET_NAME
gcloud compute firewall-rules delete allow-backend-http allow-ollama-internal --quiet
```

---

## 🆘 Need Help?

**Common Issues:**

1. **"Authentication failed"**
   - Run: `gcloud auth login`
   - Make sure you selected the right project

2. **"Quota exceeded"**
   - Your free trial might be exhausted
   - Check: https://console.cloud.google.com/billing

3. **"Permission denied"**
   - Enable required APIs: `gcloud services enable compute.googleapis.com sqladmin.googleapis.com`

4. **Backend timeout**
   - Ollama might still be downloading the model
   - Wait 15 minutes after initial setup

5. **502 Bad Gateway**
   - Backend service might have crashed
   - Check logs: `gcloud compute ssh backend-vm --command="sudo journalctl -u elearning-backend"`

---

## 🎓 What You've Deployed

Your architecture:

```
                     ┌──────────────┐
                     │   Frontend   │
                     │ (Storage)    │
                     └──────┬───────┘
                            │ HTTP
                            ▼
                     ┌──────────────┐
                     │   Backend    │
                     │  (FastAPI)   │─────┐
                     └──────┬───────┘     │ SQL
                            │ HTTP        │
                            ▼             ▼
                     ┌──────────────┐  ┌────────────┐
                     │    Ollama    │  │ PostgreSQL │
                     │  (Gemma3:4b) │  │ (Cloud SQL)│
                     └──────────────┘  └────────────┘
```

---

**Made with ❤️ for your E-Learning Platform**

*Questions? Check the full deployment guide or GCP documentation.*
