# Railway + Supabase Migration Guide

## 🎯 Why Railway + Supabase?

✅ **No wake-up time** - Always instant response
✅ **No timeout limits** - Unlike Vercel's 10-second limit
✅ **$5 free credit/month** - Enough for small apps
✅ **Easy migration** - Similar to Render
✅ **Better database** - Supabase 500MB vs Render's limited tier

## Step 1: Set Up Supabase Database (5 minutes)

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Project name: `fitcore`
4. Database password: **Save this securely!**
5. Region: Choose closest to your users
6. Wait ~2 minutes for setup

### 1.2 Get Connection String
1. Go to Project Settings → Database
2. Find "Connection string" section
3. Copy the URI format:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
4. Replace `[PASSWORD]` with your actual password

### 1.3 Migrate Your Data
```bash
cd backend

# Update .env with Supabase connection
echo "DATABASE_URL=your-supabase-connection-string" > .env

# Run migrations
alembic upgrade head

# Verify data migrated
python -c "from app import create_app; from database import db; from models.member_profile import MemberProfile; app = create_app(); app.app_context().push(); print(f'Members: {MemberProfile.query.count()}')"
```

## Step 2: Deploy to Railway (10 minutes)

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. You get **$5 free credit/month**

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your repository: `MODERN-FITNESS-GYM`

### 2.3 Configure Service
1. Railway will detect your Python app
2. Set root directory: `backend`
3. Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT`

### 2.4 Add Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
FLASK_ENV=production
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRES=86400
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
PORT=8080
```

### 2.5 Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Railway will give you a URL: `https://your-app.up.railway.app`

## Step 3: Update Frontend (2 minutes)

### 3.1 Update API URL
Edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-app.up.railway.app/api'
```

### 3.2 Update Environment Variable
Create/update `frontend/.env.production`:

```env
VITE_API_URL=https://your-app.up.railway.app/api
```

### 3.3 Rebuild and Deploy Frontend
```bash
cd frontend
npm run build
git add .
git commit -m "Update API URL to Railway"
git push origin main
```

GitHub Actions will automatically deploy to GitHub Pages.

## Step 4: Configure Railway Settings

### 4.1 Set Up Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as shown

### 4.2 Enable Auto-Deploy
1. Go to Settings → Service
2. Enable "Auto-deploy on push"
3. Set branch: `main`

### 4.3 Configure Health Checks
Railway automatically monitors your `/api/health` endpoint.

## Step 5: Verify Everything Works

### 5.1 Test Backend
```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Test login
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### 5.2 Test Frontend
1. Open https://habibworkspace.github.io/MODERN-FITNESS-GYM/
2. Try logging in
3. Check all features work

### 5.3 Monitor Usage
1. Go to Railway dashboard
2. Check "Usage" tab
3. Monitor credit consumption

## 📊 Expected Costs

With Railway's $5 free credit:

- **Backend Service**: ~$3-4/month
- **Bandwidth**: Included
- **Build time**: Included
- **Database**: $0 (using Supabase free tier)

**Total: Fits within $5 free credit!** 🎉

## 🔧 Railway Configuration Files

### Create `railway.json` (optional)
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Create `Procfile` (optional)
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

## 🚨 Important Notes

### Database Connection Pooling
Supabase uses connection pooling by default. Use the pooler connection string (port 6543) not direct connection (port 5432).

### Environment Variables
- Never commit `.env` files
- Use Railway's environment variables
- Regenerate SECRET_KEY and JWT_SECRET_KEY

### Monitoring
- Railway provides logs in real-time
- Set up alerts for high usage
- Monitor Supabase dashboard for database metrics

## 🔄 Migration Checklist

- [ ] Create Supabase project
- [ ] Get database connection string
- [ ] Migrate data to Supabase
- [ ] Create Railway account
- [ ] Deploy backend to Railway
- [ ] Add all environment variables
- [ ] Test backend endpoints
- [ ] Update frontend API URL
- [ ] Deploy frontend
- [ ] Test complete application
- [ ] Monitor usage for 24 hours
- [ ] Delete Render services (after confirming everything works)

## 🆘 Troubleshooting

### Backend won't start
- Check Railway logs: Click on deployment → View logs
- Verify all environment variables are set
- Check DATABASE_URL format

### Database connection fails
- Verify Supabase connection string
- Use pooler connection (port 6543)
- Check Supabase project is active

### Frontend can't connect
- Verify API URL in frontend/.env.production
- Check CORS settings in backend/app.py
- Verify Railway service is running

### Out of credits
- Monitor usage in Railway dashboard
- Optimize database queries
- Consider upgrading to paid plan ($5/month)

## 🎯 Advantages Over Render

| Feature | Render Free | Railway Free |
|---------|-------------|--------------|
| Wake-up time | 30+ seconds | None |
| Always on | ❌ Sleeps after 15min | ✅ Always on |
| Build time | Slow | Fast |
| Logs | Limited | Full access |
| Deployments | Slow | Fast |
| Database | Limited | Use Supabase |

## 📈 Next Steps After Migration

1. **Set up monitoring**: Use Railway's built-in monitoring
2. **Configure backups**: Supabase has automatic backups
3. **Add custom domain**: Optional but professional
4. **Set up CI/CD**: Railway auto-deploys on push
5. **Monitor costs**: Check usage weekly

## 💡 Pro Tips

1. **Use connection pooling**: Supabase pooler is faster
2. **Enable caching**: Add Redis if needed (Railway has it)
3. **Optimize queries**: Monitor slow queries in Supabase
4. **Set up alerts**: Railway can notify you of issues
5. **Keep Render as backup**: Don't delete until fully tested

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Supabase Dashboard: https://app.supabase.com
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs

## ✅ Success Criteria

Your migration is successful when:
- ✅ Backend responds instantly (no wake-up time)
- ✅ All API endpoints work
- ✅ Database queries are fast
- ✅ Frontend connects successfully
- ✅ All features work as before
- ✅ Usage stays within $5 credit

---

**Estimated Total Time: 20-30 minutes**

**Difficulty: Easy** (Similar to Render setup)

**Recommended: Yes!** This is the best free solution for your Flask app.
