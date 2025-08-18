# VideoTube Deployment Guide

This guide covers the complete deployment process for the VideoTube video streaming platform.

## Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database
- Cloudinary account for media storage
- Domain name (for production)
- SSL certificate (for production)

## Backend Deployment

### 1. Environment Setup

Create a `.env` file in the `Backend_yt` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videotube
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videotube

CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### 2. Install Dependencies

```bash
cd Backend_yt
npm install
```

### 3. Start Backend Server

```bash
# Development
npm run dev

# Production
npm start
```

The backend will run on `http://localhost:5000`

## Frontend Deployment

### 1. Environment Setup

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_APP_NAME=VideoTube
VITE_APP_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Production Build

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend Deployment

1. **Install Node.js and MongoDB**
2. **Clone and setup the application**:
   ```bash
   git clone <your-repo>
   cd Backend_yt
   npm install --production
   ```

3. **Setup PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "videotube-backend"
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-api-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Frontend Deployment

1. **Build the application**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Setup Nginx for static files**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://your-api-domain.com;
       }
   }
   ```

### Option 2: Docker Deployment

#### Backend Dockerfile

Create `Backend_yt/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: videotube-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./Backend_yt
    container_name: videotube-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/videotube
    depends_on:
      - mongodb
    volumes:
      - ./Backend_yt:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    container_name: videotube-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

Deploy with:
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

#### Vercel (Frontend)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment variables** in Vercel dashboard

#### Railway/Render (Backend)

1. **Connect your GitHub repository**
2. **Set environment variables**
3. **Deploy automatically on push**

#### MongoDB Atlas (Database)

1. **Create cluster** at mongodb.com
2. **Get connection string**
3. **Update MONGODB_URI** in environment variables

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Performance Optimization

### Backend Optimizations

1. **Enable compression**:
   ```javascript
   app.use(compression())
   ```

2. **Setup Redis for caching**:
   ```javascript
   const redis = require('redis')
   const client = redis.createClient()
   ```

3. **Database indexing**:
   ```javascript
   // Add indexes for frequently queried fields
   db.videos.createIndex({ "owner": 1 })
   db.videos.createIndex({ "createdAt": -1 })
   ```

### Frontend Optimizations

1. **Enable gzip in Nginx**:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Setup CDN** for static assets

3. **Enable browser caching**:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Monitoring and Maintenance

### Health Checks

Backend health endpoint: `GET /api/v1/healthCheck`

### Logging

- Backend logs: PM2 logs or Docker logs
- Frontend: Browser console and error tracking
- Database: MongoDB logs

### Backup Strategy

1. **Database backups**:
   ```bash
   mongodump --uri="mongodb://localhost:27017/videotube" --out=/backup/$(date +%Y%m%d)
   ```

2. **Media files**: Cloudinary handles this automatically

3. **Code**: Git repository with regular commits

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] File upload restrictions
- [ ] Regular security updates

## Troubleshooting

### Common Issues

1. **CORS errors**: Check CORS_ORIGIN in backend .env
2. **File upload fails**: Check Cloudinary credentials
3. **Database connection**: Verify MongoDB URI
4. **Authentication issues**: Check JWT secrets

### Logs Location

- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Docker logs: `docker logs <container_name>`

## Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test API endpoints manually
4. Check network connectivity

This deployment guide should get your VideoTube platform running in production!
