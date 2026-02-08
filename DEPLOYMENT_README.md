# E-Learning Platform - GCP Deployment

## 📁 Deployment Files

This directory contains everything you need to deploy your E-Learning Platform to Google Cloud Platform (GCP) using your $300 free credits.

## 🚀 Quick Start

### For Beginners - Start Here:
1. **[QUICK_START_GCP.md](QUICK_START_GCP.md)** - 30-minute deployment guide

### Deployment Scripts (Run in order):
1. **[deploy-gcp-setup.ps1](deploy-gcp-setup.ps1)** - Initial GCP setup
2. **[deploy-backend.ps1](deploy-backend.ps1)** - Deploy FastAPI backend
3. **[deploy-frontend.ps1](deploy-frontend.ps1)** - Deploy React frontend

### Reference Documentation:
- **[GCP_DEPLOYMENT_GUIDE.md](GCP_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[GCP_COMMANDS_REFERENCE.md](GCP_COMMANDS_REFERENCE.md)** - Useful commands and troubleshooting

## 🎯 What Gets Deployed

### Infrastructure:
- **PostgreSQL Database** (Cloud SQL) - For application data
- **Ollama VM** (e2-standard-2) - Running Gemma3:4b AI model
- **Backend VM** (e2-medium) - FastAPI application
- **Storage Bucket** - React frontend static files

### Cost: ~$90/month (3 months FREE with $300 credits!)

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ GCP account with $300 free credit
2. ✅ Google Cloud SDK installed
   - Download: https://cloud.google.com/sdk/docs/install
3. ✅ Windows PowerShell (as Administrator)
4. ✅ Project code ready in this directory

## 🔗 Quick Links

### After Deployment:
- **Backend API:** `http://YOUR_BACKEND_IP:8000`
- **API Docs:** `http://YOUR_BACKEND_IP:8000/docs`
- **Frontend:** `https://storage.googleapis.com/YOUR_BUCKET/index.html`
- **GCP Console:** https://console.cloud.google.com

### Service Ports:
- Backend API: `:8000`
- Ollama: `:11434` (internal only)
- PostgreSQL: `:5432` (via Cloud SQL Proxy)

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
└────────────┬─────────────────────┬──────────────┘
             │                     │
             │                     │
    ┌────────▼────────┐   ┌───────▼────────┐
    │    Frontend     │   │    Backend     │
    │ (Cloud Storage) │   │   (VM + API)   │
    └─────────────────┘   └────────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼──────┐  ┌───▼────┐  ┌─────▼─────┐
            │   Ollama     │  │ Cloud  │  │  Cloud    │
            │  (Gemma3:4b) │  │ SQL    │  │  Storage  │
            │      VM      │  │ Proxy  │  │           │
            └──────────────┘  └────────┘  └───────────┘
```

## 🛠️ Deployment Steps Summary

### 1. Initial Setup (10 min)
```powershell
.\deploy-gcp-setup.ps1
```
Creates all infrastructure and installs Ollama with Gemma3:4b

### 2. Deploy Backend (10 min)
```powershell
.\deploy-backend.ps1
```
Uploads and configures your FastAPI application

### 3. Deploy Frontend (10 min)
```powershell
.\deploy-frontend.ps1
```
Builds and uploads React static files

### ⏱️ Total Time: ~30 minutes
(Plus 10-15 min for Ollama to download the AI model)

## 💡 Pro Tips

### Save Money:
```powershell
# Stop VMs when not using (saves ~$2/day)
gcloud compute instances stop ollama-vm backend-vm

# Start again when needed
gcloud compute instances start ollama-vm backend-vm
```

### Monitor Costs:
```powershell
# Check what you're spending
gcloud beta billing projects describe YOUR_PROJECT_ID

# Set up budget alerts
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ID \
  --display-name="Budget Alert" \
  --budget-amount=100
```

### Quick Health Check:
```powershell
# Test if everything is running
curl http://YOUR_BACKEND_IP:8000/
gcloud compute instances list
gcloud sql instances list
```

## 🔒 Security Notes

Before going to production:

1. **Change default passwords** in deploy-gcp-setup.ps1
2. **Generate new SECRET_KEY** for backend .env
3. **Restrict database access** to only backend VM IP
4. **Enable HTTPS** with custom domain and SSL certificate
5. **Setup VPC firewall rules** for internal-only access
6. **Enable Cloud Armor** for DDoS protection
7. **Regular backups** of database (automatic with Cloud SQL)

## 📈 Scaling Options

When your platform grows:

### Free → Paid Tier Migration:
- Upgrade database: `db-f1-micro` → `db-n1-standard-1`
- Add load balancer for multiple backend instances
- Use Cloud CDN for faster frontend delivery
- Consider Kubernetes (GKE) for auto-scaling

### Cost at Scale:
- Small (hundreds of users): ~$100-150/month
- Medium (thousands of users): ~$300-500/month
- Large (10k+ users): ~$1000+/month

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| `gcloud: command not found` | Install Google Cloud SDK |
| `Permission denied` | Run as Administrator |
| Backend won't start | Check logs: See GCP_COMMANDS_REFERENCE.md |
| CORS errors | Update CORS config in backend |
| Ollama timeout | Wait for model download (15 min) |

Full troubleshooting guide: **[GCP_COMMANDS_REFERENCE.md](GCP_COMMANDS_REFERENCE.md)**

## 🗑️ Cleanup

When you're done testing:

```powershell
# Delete everything (stop all billing)
gcloud compute instances delete backend-vm ollama-vm --quiet
gcloud sql instances delete elearning-postgres --quiet
gcloud storage rm -r gs://YOUR_BUCKET_NAME --quiet
gcloud compute firewall-rules delete allow-backend-http allow-ollama-internal --quiet
```

## 📚 Additional Resources

- **GCP Free Tier:** https://cloud.google.com/free
- **Cloud SQL Docs:** https://cloud.google.com/sql/docs
- **Compute Engine Docs:** https://cloud.google.com/compute/docs
- **Ollama Docs:** https://ollama.ai/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com

## 🎓 Learning Resources

New to GCP?
- [GCP Quickstarts](https://cloud.google.com/docs/quickstarts)
- [Cloud Console Tour](https://console.cloud.google.com)
- [GCP YouTube Channel](https://www.youtube.com/user/googlecloudplatform)

## 📞 Support

- **GCP Support:** https://cloud.google.com/support
- **Community:** https://stackoverflow.com/questions/tagged/google-cloud-platform
- **Status:** https://status.cloud.google.com

---

## ✅ Deployment Checklist

Before you start:
- [ ] GCP account created with $300 credits
- [ ] Google Cloud SDK installed and authenticated
- [ ] PowerShell opened as Administrator
- [ ] Passwords changed in deployment scripts
- [ ] Project code is in `E-Learning-Platform` directory

After deployment:
- [ ] Backend API accessible
- [ ] Frontend loads in browser
- [ ] Can register and login
- [ ] Ollama responds to requests
- [ ] Database has tables created
- [ ] Costs monitoring setup

---

**Ready to deploy? Start with [QUICK_START_GCP.md](QUICK_START_GCP.md)!**

*Estimated setup time: 30 minutes*
*Estimated cost: $0 for first 3 months (using free credits)*

🎉 **Happy Deploying!**
