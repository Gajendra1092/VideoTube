# VideoTube Frontend - Netlify Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- ✅ Backend deployed on Render and working
- ✅ Production build tested locally
- ✅ Environment variables configured
- ✅ _redirects file in place for SPA routing

### 2. Update Environment Variables

**IMPORTANT**: Before deploying, update the `.env.production` file with your actual Render backend URL:

```bash
# Replace with your actual Render backend URL
VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com/api/v1
```

### 3. Netlify Deployment Options

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Sign up/Login** to [Netlify](https://netlify.com)
2. **Connect Repository**:
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository
   - Select your repository

3. **Configure Build Settings**:
   ```
   Base directory: backend/frontend
   Build command: npm run build
   Publish directory: backend/frontend/dist
   ```

4. **Environment Variables**:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com/api/v1`

5. **Deploy**: Click "Deploy site"

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd backend/frontend
netlify deploy --prod --dir=dist
```

### 4. Post-Deployment Configuration

#### Update Backend CORS Settings
After getting your Netlify URL, update your backend's CORS configuration:

```env
# In your Render backend environment variables
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

#### Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records as instructed

### 5. Verification Checklist

- [ ] Site loads without errors
- [ ] API calls work (check browser network tab)
- [ ] Authentication flows work
- [ ] Video upload/playback functions
- [ ] All routes work (SPA routing)
- [ ] No console errors

## 🔧 Build Configuration

### Optimized Vite Configuration
The project includes production optimizations:
- Code splitting for better caching
- Minification with Terser
- Vendor chunk separation
- Increased chunk size limit

### Bundle Analysis
Current build output:
- CSS: ~45KB (gzipped: ~8KB)
- JS: ~651KB (gzipped: ~176KB)
- Total: ~696KB

## 🐛 Troubleshooting

### Common Issues

1. **API Calls Failing**
   - Check VITE_API_BASE_URL in environment variables
   - Verify backend CORS settings
   - Check network tab for 404/500 errors

2. **Routing Issues**
   - Ensure _redirects file is in public/ folder
   - Verify SPA routing configuration

3. **Build Errors**
   - Use `npm run build` (without TypeScript checking)
   - For type checking: `npm run build:check`

4. **Large Bundle Size**
   - Consider lazy loading routes
   - Optimize images and assets
   - Use dynamic imports for heavy components

### Environment Variables Debug
Add this to verify environment variables are loaded:
```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

## 📝 Next Steps

1. **Monitor Performance**: Use Netlify Analytics
2. **Set up CI/CD**: Auto-deploy on git push
3. **Configure Caching**: Set up proper cache headers
4. **Add Monitoring**: Set up error tracking (Sentry)
5. **Optimize SEO**: Add meta tags and Open Graph data

## 🔗 Useful Links

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router SPA Deployment](https://reactrouter.com/en/main/guides/deploying)
