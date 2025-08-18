# 🚀 VideoTube Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Generate Strong JWT Secrets
```bash
# Generate strong secrets for production
node -e "console.log('ACCESS_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Prepare Your Code
```bash
# Ensure all dependencies are installed
cd Backend_yt && npm install
cd ../frontend && npm install

# Test locally one more time
npm run dev # in both directories
```

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Optimize MongoDB for Production
1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create Production Cluster** (if not already done):
   - Choose M0 (Free tier) or M2+ for better performance
   - Select region closest to your users
   - Enable backup (recommended for production)

3. **Security Configuration**:
   ```bash
   # Update Network Access
   - Add your deployment platform IPs
   - For Railway/Render: Allow access from anywhere (0.0.0.0/0)
   ```

4. **Database User**:
   - Create a dedicated production user
   - Use strong password
   - Grant readWrite permissions

### Step 2: Update Connection String
```env
MONGODB_URI=mongodb+srv://prod_user:strong_password@cluster.mongodb.net/videotube_prod
```

## 🖥️ Backend Deployment (Railway - Recommended)

### Step 1: Prepare Backend for Deployment
```bash
cd Backend_yt

# Create package.json scripts for production
npm run build # if you have a build step
```

### Step 2: Deploy to Railway
1. **Sign up**: https://railway.app
2. **Connect GitHub**: Link your repository
3. **Create New Project**: 
   - Select "Deploy from GitHub repo"
   - Choose your VideoTube repository
   - Select Backend_yt folder as root

4. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=your_production_mongodb_uri
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ACCESS_TOKEN_SECRET=your_generated_secret
   REFRESH_TOKEN_SECRET=your_generated_secret
   CLOUDINARY_CLOUD_NAME=dvpset7bw
   CLOUDINARY_API_KEY=316193194152524
   CLOUDINARY_API_SECRET=nx2vuEXgm5l3mXM5gYTEDpGM7kI
   ```

5. **Deploy**: Railway will automatically deploy
6. **Get Domain**: Copy your Railway app URL (e.g., `https://videotube-api-production.up.railway.app`)

### Alternative: Render Deployment
1. **Sign up**: https://render.com
2. **New Web Service**: Connect GitHub repo
3. **Configuration**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
   - Add all environment variables

## 🌐 Frontend Deployment (Vercel - Recommended)

### Step 1: Update Frontend Configuration

Create production environment file:
```bash
cd frontend
```

Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-api.railway.app/api/v1
VITE_APP_NAME=VideoTube
VITE_APP_VERSION=1.0.0
```

### Step 2: Update API Service
Update `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
```

### Step 3: Deploy to Vercel
1. **Sign up**: https://vercel.com
2. **Import Project**: Connect GitHub repository
3. **Configure**:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://your-api.railway.app/api/v1
   ```

5. **Deploy**: Vercel will build and deploy automatically
6. **Get Domain**: Copy your Vercel app URL

### Step 4: Update Backend CORS
Update your Railway backend environment:
```env
CORS_ORIGIN=https://your-app.vercel.app
```

## 🔐 Security Configuration

### 1. Update CORS for Production
```javascript
// Backend_yt/src/app.js
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3001",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 2. Add Security Headers
```bash
npm install helmet compression
```

### 3. Rate Limiting
```bash
npm install express-rate-limit
```

## 📁 File Storage (Cloudinary Production)

### Current Setup is Production-Ready
Your Cloudinary configuration is already suitable for production:
- Free tier: 25GB storage, 25GB bandwidth
- Automatic optimization
- Global CDN

### Upgrade Considerations
- **Plus Plan**: $89/month for 100GB
- **Advanced Plan**: $224/month for 500GB

## 🌍 Domain and SSL Setup

### Step 1: Purchase Domain
Recommended registrars:
- **Namecheap**: $8-15/year
- **Google Domains**: $12/year
- **Cloudflare**: $8-10/year

### Step 2: Configure DNS
1. **Frontend (Vercel)**:
   - Add custom domain in Vercel dashboard
   - Update DNS CNAME: `your-domain.com` → `cname.vercel-dns.com`

2. **Backend (Railway)**:
   - Add custom domain in Railway dashboard
   - Update DNS CNAME: `api.your-domain.com` → `your-app.railway.app`

### Step 3: SSL Certificates
- **Automatic**: Both Vercel and Railway provide free SSL
- **Custom**: Use Cloudflare for additional security

## 🚀 Deployment Process

### Initial Deployment
```bash
# 1. Push to GitHub
git add .
git commit -m "Production deployment setup"
git push origin main

# 2. Deploy Backend (Railway auto-deploys)
# 3. Deploy Frontend (Vercel auto-deploys)
# 4. Update environment variables
# 5. Test all functionality
```

### Future Updates
```bash
# Simple git push triggers auto-deployment
git add .
git commit -m "Feature update"
git push origin main
```

## 💰 Cost Breakdown

### Free Tier (Portfolio/Demo)
- **MongoDB Atlas**: Free (M0 cluster)
- **Railway**: Free (500 hours/month)
- **Vercel**: Free (100GB bandwidth)
- **Cloudinary**: Free (25GB storage)
- **Domain**: $10-15/year
- **Total**: ~$15/year

### Startup Tier ($50-100/month)
- **MongoDB Atlas**: M2 ($9/month)
- **Railway**: Pro ($5/month)
- **Vercel**: Pro ($20/month)
- **Cloudinary**: Plus ($89/month)
- **Domain**: $15/year
- **Total**: ~$125/month

### Scale-Up Tier ($200-500/month)
- **MongoDB Atlas**: M10 ($57/month)
- **Railway**: Multiple services ($20-50/month)
- **Vercel**: Pro ($20/month)
- **Cloudinary**: Advanced ($224/month)
- **CDN**: Cloudflare Pro ($20/month)
- **Total**: ~$350/month

## 📊 Performance Optimization

### Backend Optimizations
```javascript
// Add compression
app.use(compression())

// Add caching headers
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300')
  }
  next()
})
```

### Frontend Optimizations
```bash
# Build optimization
npm run build

# Analyze bundle size
npm install --save-dev @rollup/plugin-analyzer
```

### Database Optimizations
```javascript
// Add indexes for frequently queried fields
db.videos.createIndex({ "owner": 1, "createdAt": -1 })
db.users.createIndex({ "username": 1 })
db.subscriptions.createIndex({ "subscriber": 1, "channel": 1 })
```

## 📈 Monitoring and Logging

### Basic Monitoring (Free)
1. **Railway**: Built-in metrics
2. **Vercel**: Analytics dashboard
3. **MongoDB Atlas**: Performance advisor

### Advanced Monitoring
1. **Sentry**: Error tracking ($26/month)
2. **LogRocket**: User session replay ($99/month)
3. **New Relic**: APM monitoring (free tier available)

## 🔄 CI/CD Setup

### GitHub Actions (Recommended)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: echo "Auto-deployed via Railway GitHub integration"
      - name: Deploy to Vercel
        run: echo "Auto-deployed via Vercel GitHub integration"
```

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Update CORS_ORIGIN environment variable
2. **Database Connection**: Check MongoDB Atlas network access
3. **File Upload Issues**: Verify Cloudinary credentials
4. **Authentication Issues**: Ensure JWT secrets are set correctly

### Debug Commands
```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test API endpoints
curl https://your-api.railway.app/api/v1/healthCheck
```

## 🎯 Next Steps After Deployment

1. **Test All Features**: Thoroughly test video upload, user registration, etc.
2. **Set Up Analytics**: Google Analytics, Vercel Analytics
3. **Configure Backups**: MongoDB Atlas automated backups
4. **Monitor Performance**: Set up alerts for downtime
5. **Plan Scaling**: Monitor usage and upgrade tiers as needed

## 📞 Support Resources

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Cloudinary**: https://cloudinary.com/documentation

---

**🎉 Congratulations!** Your VideoTube application is now ready for production deployment!
