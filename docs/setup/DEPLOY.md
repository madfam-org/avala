# AVALA LMS - Production Deployment Guide

**Phase 6: Deployment Protocol**

This guide walks you through deploying AVALA LMS to a production Linux VPS (Ubuntu 22.04 recommended).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DNS Configuration](#dns-configuration)
3. [Server Preparation](#server-preparation)
4. [First-Time Deployment](#first-time-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Post-Deployment Tasks](#post-deployment-tasks)
7. [Updating the Application](#updating-the-application)
8. [Backup and Restore](#backup-and-restore)
9. [Monitoring and Logs](#monitoring-and-logs)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 22.04 LTS (or Debian 11+)
- **RAM**: Minimum 4GB, Recommended 8GB
- **CPU**: Minimum 2 cores, Recommended 4 cores
- **Storage**: Minimum 40GB SSD
- **Network**: Public IP address with ports 80 and 443 accessible

### Domain Requirements

You need **two DNS records** pointing to your server's public IP:

- `yourdomain.com` → Web Frontend (Next.js)
- `api.yourdomain.com` → API Backend (NestJS)

### Required Services

- **SMTP Server**: For sending emails (Gmail, SendGrid, AWS SES, etc.)
- **Domain Registrar**: To configure DNS records

---

## DNS Configuration

### Step 1: Create DNS A Records

In your domain registrar's DNS management panel, create these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_SERVER_IP` | 3600 |
| A | api | `YOUR_SERVER_IP` | 3600 |

**Example** (if your domain is `avala.example.com` and server IP is `203.0.113.45`):

```
A    avala.example.com       203.0.113.45    3600
A    api.avala.example.com   203.0.113.45    3600
```

### Step 2: Verify DNS Propagation

Wait for DNS propagation (usually 5-30 minutes). Verify with:

```bash
# Check main domain
dig avala.example.com +short

# Check API subdomain
dig api.avala.example.com +short
```

Both should return your server's IP address.

---

## Server Preparation

### Step 1: Update System

SSH into your server and update packages:

```bash
# For MADFAM infrastructure (via Cloudflare Zero Trust tunnel)
ssh ssh.madfam.io
# User: solarpunk (use sudo for admin commands)

# Update package lists
sudo apt update && sudo apt upgrade -y

# Install basic utilities
apt install -y curl git ufw vim
```

### Step 2: Configure Firewall

```bash
# Allow SSH (important!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 3: Create Deployment User (Optional but Recommended)

```bash
# Create user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

---

## First-Time Deployment

### Step 1: Clone Repository

```bash
cd /home/deploy  # or your preferred directory

# Clone the repository
git clone https://github.com/your-org/avala.git
cd avala

# Checkout production branch (if applicable)
git checkout main  # or your production branch
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.production.example .env

# Edit with your production values
nano .env
```

**Critical Values to Change:**

```env
# Domain
DOMAIN=avala.example.com

# Database (use strong passwords!)
POSTGRES_USER=avala_prod
POSTGRES_PASSWORD=YourSecurePasswordHere123!
POSTGRES_DB=avala_production

# Database URL
DATABASE_URL=postgresql://avala_prod:YourSecurePasswordHere123!@postgres:5432/avala_production?schema=public

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your-generated-secret-here

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="AVALA LMS" <noreply@avala.example.com>
```

**Generate Secure JWT Secret:**

```bash
openssl rand -base64 64
```

Copy the output to `JWT_SECRET` in `.env`.

### Step 3: Run Deployment Script

The deployment script will:
- Install Docker if needed
- Obtain SSL certificates
- Build and start all services
- Run database migrations

```bash
./scripts/deploy.sh
```

**Expected Output:**

```
================================
   AVALA LMS Deployment Script
   Phase 6: Production Deploy
================================

[INFO] Running pre-flight checks...
[SUCCESS] .env file found
[SUCCESS] All required environment variables are set
[INFO] Checking Docker installation...
[SUCCESS] Docker is already installed
[INFO] Setting up SSL certificates...
[INFO] Building Docker images...
[SUCCESS] Docker images built successfully
[INFO] Starting AVALA LMS services...
[SUCCESS] Services started successfully
================================
[SUCCESS] AVALA LMS Deployed Successfully!
================================

Access your application:
  Web:  https://avala.example.com
  API:  https://api.avala.example.com
```

### Step 4: Verify Deployment

Visit your domain in a browser:

- **Web**: https://avala.example.com → Should show login page
- **API**: https://api.avala.example.com/health → Should return `{"status":"ok"}`

---

## SSL Certificate Setup

SSL certificates are automatically obtained via Let's Encrypt during first deployment.

### Manual Certificate Renewal

Certificates auto-renew every 12 hours. To manually renew:

```bash
docker compose -f docker-compose.deploy.yml run --rm certbot renew
docker compose -f docker-compose.deploy.yml restart nginx
```

### Certificate Troubleshooting

If certificate issuance fails:

1. **Verify DNS**: Ensure domain points to server
2. **Check Firewall**: Ports 80 and 443 must be open
3. **Check Nginx**: `docker compose -f docker-compose.deploy.yml logs nginx`
4. **Manual Debug**:

```bash
docker compose -f docker-compose.deploy.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@avala.example.com \
  --agree-tos \
  -d avala.example.com \
  -d api.avala.example.com \
  --dry-run
```

---

## Post-Deployment Tasks

### 1. Create First Admin User

Use Prisma Studio or direct database access:

```bash
# Access database container
docker compose -f docker-compose.deploy.yml exec postgres psql -U avala_prod -d avala_production

# Create tenant (if not exists)
INSERT INTO tenants (id, name, slug, created_at, updated_at)
VALUES (gen_random_uuid(), 'My Organization', 'my-org', NOW(), NOW());

# Note the tenant ID from the output
```

Then create admin user via API or database.

### 2. Configure SMTP (if using Gmail)

For Gmail SMTP:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `.env` as `SMTP_PASS`

### 3. Set Up Database Backups

Create automated backup script:

```bash
# Create backup script
sudo nano /usr/local/bin/backup-avala.sh
```

**Backup Script Content:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/avala"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose -f /home/deploy/avala/docker-compose.deploy.yml exec -T postgres \
  pg_dump -U avala_prod avala_production | gzip > $BACKUP_DIR/avala_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "avala_*.sql.gz" -mtime +30 -delete

echo "Backup completed: avala_$DATE.sql.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-avala.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-avala.sh >> /var/log/avala-backup.log 2>&1
```

### 4. Configure Monitoring (Optional)

Install monitoring tools like:

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Server Monitoring**: Netdata, Prometheus + Grafana
- **Log Aggregation**: Loki, ELK Stack

---

## Updating the Application

### Standard Update Process

```bash
cd /home/deploy/avala

# Pull latest changes
git pull origin main

# Run deployment script (rebuilds and restarts)
./scripts/deploy.sh
```

### Manual Update Steps

If you need more control:

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.deploy.yml build --no-cache

# Stop services
docker compose -f docker-compose.deploy.yml down

# Start services
docker compose -f docker-compose.deploy.yml up -d

# Run migrations
docker compose -f docker-compose.deploy.yml exec api sh -c "cd /app/packages/db && pnpm exec prisma migrate deploy"

# Verify
docker compose -f docker-compose.deploy.yml ps
```

---

## Backup and Restore

### Create Backup

```bash
# Database backup
docker compose -f docker-compose.deploy.yml exec -T postgres \
  pg_dump -U avala_prod avala_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Verify backup
gunzip -c backup_$(date +%Y%m%d).sql.gz | head -n 20
```

### Restore Backup

```bash
# Stop API to prevent connections
docker compose -f docker-compose.deploy.yml stop api web

# Restore database
gunzip -c backup_20250122.sql.gz | \
  docker compose -f docker-compose.deploy.yml exec -T postgres \
  psql -U avala_prod -d avala_production

# Restart services
docker compose -f docker-compose.deploy.yml start api web
```

---

## Monitoring and Logs

### View Service Logs

```bash
# All services
docker compose -f docker-compose.deploy.yml logs -f

# Specific service
docker compose -f docker-compose.deploy.yml logs -f api
docker compose -f docker-compose.deploy.yml logs -f web
docker compose -f docker-compose.deploy.yml logs -f nginx
docker compose -f docker-compose.deploy.yml logs -f postgres

# Last 100 lines
docker compose -f docker-compose.deploy.yml logs --tail=100 api
```

### Service Status

```bash
# Check running containers
docker compose -f docker-compose.deploy.yml ps

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Nginx Access Logs

```bash
# Real-time access logs
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/web_access.log
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/api_access.log

# Error logs
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/web_error.log
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/api_error.log
```

---

## Troubleshooting

### Issue: Services Won't Start

**Check logs:**

```bash
docker compose -f docker-compose.deploy.yml logs
```

**Common causes:**

1. Port already in use: `sudo netstat -tulpn | grep :80`
2. Environment variables missing: `cat .env`
3. Database connection failed: Check `DATABASE_URL`

### Issue: 502 Bad Gateway

**Diagnosis:**

```bash
# Check if API is running
docker compose -f docker-compose.deploy.yml ps api

# Check API health
docker compose -f docker-compose.deploy.yml exec api curl http://localhost:4000/health

# Check API logs
docker compose -f docker-compose.deploy.yml logs api
```

### Issue: SSL Certificate Errors

**Re-issue certificates:**

```bash
# Remove existing certificates
sudo rm -rf infra/certbot/conf/live/your-domain.com

# Re-run deployment
./scripts/deploy.sh
```

### Issue: Database Migration Failures

**Manual migration:**

```bash
docker compose -f docker-compose.deploy.yml exec api sh -c \
  "cd /app/packages/db && pnpm exec prisma migrate deploy"
```

### Issue: Out of Disk Space

**Clean up Docker resources:**

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# Full cleanup (CAUTION: Removes everything not in use)
docker system prune -a --volumes
```

### Issue: Email Not Sending

**Check SMTP configuration:**

```bash
# View environment variables
docker compose -f docker-compose.deploy.yml exec api env | grep SMTP

# Test SMTP connection
docker compose -f docker-compose.deploy.yml exec api sh -c \
  "curl -v telnet://$SMTP_HOST:$SMTP_PORT"

# Check API logs for email errors
docker compose -f docker-compose.deploy.yml logs api | grep -i "email\|smtp"
```

---

## Emergency Procedures

### Complete Restart

```bash
cd /home/deploy/avala

docker compose -f docker-compose.deploy.yml down
docker compose -f docker-compose.deploy.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Check status
docker compose -f docker-compose.deploy.yml ps
```

### Rollback to Previous Version

```bash
cd /home/deploy/avala

# Find previous commit
git log --oneline -n 5

# Checkout previous version
git checkout COMMIT_HASH

# Redeploy
./scripts/deploy.sh

# If successful, you can stay on this version
# If you want to return to latest:
git checkout main
```

---

## Security Best Practices

1. **Firewall**: Only open ports 22, 80, 443
2. **SSH**: Use key-based authentication, disable password login
3. **Updates**: Regularly update OS and Docker images
4. **Secrets**: Never commit `.env` to git
5. **Backups**: Automate daily database backups
6. **Monitoring**: Set up uptime monitoring and alerts
7. **SSL**: Keep certificates renewed (automatic with Let's Encrypt)
8. **Database**: Never expose PostgreSQL port publicly

---

## Support and Resources

- **Repository**: https://github.com/your-org/avala
- **Documentation**: See `/docs` directory
- **Issues**: https://github.com/your-org/avala/issues
- **Docker Docs**: https://docs.docker.com
- **Nginx Docs**: https://nginx.org/en/docs
- **Let's Encrypt**: https://letsencrypt.org/docs

---

## Quick Reference

### Useful Commands

```bash
# Deploy/Update
./scripts/deploy.sh

# View logs
docker compose -f docker-compose.deploy.yml logs -f

# Restart service
docker compose -f docker-compose.deploy.yml restart api

# Stop all services
docker compose -f docker-compose.deploy.yml down

# Start all services
docker compose -f docker-compose.deploy.yml up -d

# Database backup
docker compose -f docker-compose.deploy.yml exec -T postgres \
  pg_dump -U avala_prod avala_production | gzip > backup.sql.gz

# Shell access
docker compose -f docker-compose.deploy.yml exec api sh
docker compose -f docker-compose.deploy.yml exec postgres psql -U avala_prod

# Check resource usage
docker stats

# Renew SSL
docker compose -f docker-compose.deploy.yml run --rm certbot renew
```

---

## Related Documentation

- [Setup Guide](./SETUP.md) - Local development setup
- [Documentation Hub](../INDEX.md) - All documentation
- [Architecture Overview](../architecture/OVERVIEW.md) - System architecture
- [Security Policies](../../SECURITY.md) - Security guidelines

---

**Last Updated**: November 2024
**Version**: 1.0.0 (Phase 6)
