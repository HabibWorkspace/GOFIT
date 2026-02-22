# Migration Guide: Render → Vercel + Supabase

## Overview
This guide will help you migrate from Render to Vercel (backend) + Supabase (database).

## Prerequisites
- Vercel account (free tier)
- Supabase account (free tier)
- GitHub repository

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and project name: `fitcore`
4. Set database password (save this!)
5. Choose region closest to your users
6. Wait for project to be created (~2 minutes)

### 1.2 Get Database Connection String
1. Go to Project Settings → Database
2. Copy the "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password
4. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 1.3 Run Migrations
```bash
cd backend

# Update .env with Supabase connection string
echo "DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > .env

# Run migrations
alembic upgrade head

# Assign member numbers (if not done)
python assign_member_numbers.py
```

## Step 2: Deploy Backend to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Configure Environment Variables
Create `.env.production` in backend folder:
```env
FLASK_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SECRET_KEY=[generate-random-string]
JWT_SECRET_KEY=[generate-random-string]
JWT_ACCESS_TOKEN_EXPIRES=86400
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=[your-email]
MAIL_PASSWORD=[your-app-password]
MAIL_DEFAULT_SENDER=[your-email]
```

### 2.3 Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Go to: Project Settings → Environment Variables
# Add all variables from .env.production
```

## Step 3: Update Frontend API URL

### 3.1 Update API Base URL
In `frontend/src/services/api.js`, update:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-vercel-app.vercel.app/api'
```

### 3.2 Add Environment Variable
Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-vercel-app.vercel.app/api
```

### 3.3 Redeploy Frontend
```bash
cd frontend
npm run build
# Push to GitHub - GitHub Actions will deploy
```

## Step 4: Verify Migration

### 4.1 Test Backend
```bash
curl https://your-vercel-app.vercel.app/api/health
```

### 4.2 Test Database Connection
```bash
curl https://your-vercel-app.vercel.app/api/admin/members
```

### 4.3 Test Frontend
Open https://habibworkspace.github.io/MODERN-FITNESS-GYM/

## Important Considerations

### ⚠️ Vercel Limitations
1. **10-second timeout**: Long-running operations may fail
2. **Cold starts**: First request after inactivity may be slow
3. **Stateless**: No persistent connections between requests

### ⚠️ Supabase Limitations
1. **Database pauses**: After 1 week of inactivity (free tier)
2. **500MB storage**: Monitor database size
3. **Connection pooling**: Use connection pooling for better performance

### 💡 Recommendations

**Option 1: Vercel + Supabase (Recommended for Free Tier)**
- ✅ Both have generous free tiers
- ✅ Good for low-traffic applications
- ⚠️ 10-second timeout may affect some operations

**Option 2: Keep Render (Current Setup)**
- ✅ No timeout issues
- ✅ Persistent connections
- ✅ Better for background jobs
- ⚠️ Free tier has limitations

**Option 3: Railway + Supabase**
- ✅ Better than Vercel for Flask apps
- ✅ No 10-second timeout
- ✅ $5/month credit on free tier
- ✅ Persistent connections

## Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Render** | 750 hours/month | $7/month |
| **Vercel** | 100GB bandwidth | $20/month |
| **Supabase** | 500MB DB | $25/month |
| **Railway** | $5 credit/month | Pay as you go |

## Migration Checklist

- [ ] Create Supabase project
- [ ] Get database connection string
- [ ] Run migrations on Supabase
- [ ] Assign member numbers
- [ ] Deploy backend to Vercel
- [ ] Add environment variables
- [ ] Update frontend API URL
- [ ] Test all endpoints
- [ ] Monitor for errors
- [ ] Update documentation

## Rollback Plan

If migration fails:
1. Keep Render deployment active
2. Update frontend to point back to Render
3. Debug Vercel issues
4. Try again when ready

## Support

If you encounter issues:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs: Dashboard → Logs
3. Test locally with Supabase connection string
4. Verify environment variables are set correctly

## Next Steps

After successful migration:
1. Monitor application performance
2. Set up Supabase backups
3. Configure Vercel custom domain (optional)
4. Set up monitoring/alerts
5. Document any issues encountered
