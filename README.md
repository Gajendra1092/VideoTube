# VideoTube - Complete Video Streaming Platform

A modern, full-stack video streaming platform built with Node.js, React, and MongoDB. Features comprehensive video management, social interactions, and a beautiful responsive interface.

## 🎬 Live Demo

**Frontend**: http://localhost:3000  
**Backend API**: http://localhost:5000  
**Documentation**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## ✨ Key Features

### 🔐 Authentication & User Management
- **Secure Authentication**: JWT tokens with refresh mechanism
- **User Profiles**: Customizable avatars, cover images, and channel pages
- **Google OAuth Ready**: Schema prepared for Google authentication
- **Account Settings**: Comprehensive profile and security management

### 🎥 Video Management
- **Upload System**: Drag & drop video upload with thumbnail generation
- **Advanced Player**: Custom video player with quality selection, speed control, fullscreen
- **Content Management**: Full CRUD operations for videos
- **View Tracking**: Automatic view count and analytics

### 🌟 Social Features
- **Comments**: Real-time comment system with CRUD operations
- **Likes**: Like/unlike videos and comments
- **Subscriptions**: Follow channels and creators
- **Playlists**: Create and manage video collections
- **Channel Pages**: Dedicated pages for each creator

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, works on all devices (320px+)
- **Dark/Light Theme**: Seamless theme switching with persistence
- **Modern Interface**: Clean design inspired by popular platforms
- **Loading States**: Skeleton screens and smooth transitions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 📊 Dashboard & Analytics
- **Creator Dashboard**: Video management and performance metrics
- **Channel Statistics**: Views, subscribers, engagement data
- **Content Management**: Upload, edit, delete videos from dashboard
- **Settings Panel**: Comprehensive user preferences

## 🛠️ Technology Stack

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **File Storage**: Cloudinary for videos and images
- **Security**: bcrypt, CORS, input validation
- **Upload**: Multer middleware for file handling

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6 with protected routes
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
VideoTube/
├── Backend_yt/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/        # API route handlers
│   │   ├── models/            # MongoDB schemas (User, Video, Comment, etc.)
│   │   ├── routes/            # API endpoints
│   │   ├── middlewares/       # Auth, upload, validation
│   │   ├── utils/             # Helper functions
│   │   └── index.js           # Server entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Basic elements (Button, Input, etc.)
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── video/        # Video player, cards, etc.
│   │   │   └── layout/       # Header, sidebar, layouts
│   │   ├── pages/            # Page components
│   │   ├── services/         # API integration layer
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── main.tsx          # App entry point
│   ├── package.json
│   └── .env.example
│
├── DEPLOYMENT.md              # Comprehensive deployment guide
├── PROJECT_OVERVIEW.md        # Detailed project documentation
├── setup.sh                  # Automated setup script
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm/yarn
- **MongoDB** (local or Atlas)
- **Cloudinary account** for media storage

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repository-url>
cd VideoTube

# Run automated setup (Linux/Mac)
./setup.sh

# Follow the prompts and update .env files
```

### Manual Setup

1. **Backend Setup**
   ```bash
   cd Backend_yt
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start development server
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start development server
   npm run dev
   ```

3. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **Health Check**: http://localhost:5000/api/v1/healthCheck

## ⚙️ Configuration

### Backend Environment (.env)

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videotube
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration (Required)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Frontend Environment (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1

# App Configuration
VITE_APP_NAME=VideoTube
VITE_APP_URL=http://localhost:3000

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Feature Flags
VITE_ENABLE_GOOGLE_AUTH=true
```

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/v1/users/register          # User registration with avatar
POST   /api/v1/users/login             # User login
POST   /api/v1/users/logout            # User logout
POST   /api/v1/users/refreshToken      # Refresh access token
POST   /api/v1/users/current_user      # Get current user
PATCH  /api/v1/users/update_account_detail  # Update profile
PATCH  /api/v1/users/avatar            # Update avatar
PATCH  /api/v1/users/coverImage        # Update cover image
```

### Video Management
```
GET    /api/v1/videos                  # Get all videos
POST   /api/v1/videos                  # Upload video
GET    /api/v1/videos/:id              # Get video by ID
PATCH  /api/v1/videos/:id              # Update video
DELETE /api/v1/videos/:id              # Delete video
PATCH  /api/v1/videos/:id/updateThumbnail  # Update thumbnail
```

### Social Features
```
GET    /api/v1/comments/:videoId       # Get video comments
POST   /api/v1/comments/:videoId       # Add comment
PATCH  /api/v1/comments/c/:commentId   # Update comment
DELETE /api/v1/comments/c/:commentId   # Delete comment

POST   /api/v1/likes/toggle/v/:videoId    # Toggle video like
POST   /api/v1/likes/toggle/c/:commentId  # Toggle comment like
GET    /api/v1/likes/videos               # Get liked videos

POST   /api/v1/subDetail/c/:channelId     # Toggle subscription
GET    /api/v1/subDetail/c/:channelId     # Get subscribers
GET    /api/v1/subDetail/u/:userId        # Get subscriptions
```

### Dashboard & Analytics
```
GET    /api/v1/dashboard/stats          # Get channel statistics
GET    /api/v1/dashboard/videos         # Get channel videos
```

## 🎯 Feature Status

### ✅ Fully Implemented
- **User Authentication**: Registration, login, logout, JWT refresh
- **Video Management**: Upload, stream, CRUD operations, thumbnails
- **Social Features**: Comments, likes, subscriptions, playlists
- **User Profiles**: Avatars, cover images, channel pages
- **Dashboard**: Creator analytics and video management
- **UI/UX**: Responsive design, dark/light themes, accessibility
- **Settings**: Profile management, password change, preferences

### 🔄 Ready for Implementation
- **Google OAuth**: Schema ready, needs controller implementation
- **Search**: Frontend ready, backend search endpoint needed
- **Real-time**: WebSocket integration for live updates
- **Advanced Analytics**: Detailed video performance metrics
- **Recommendations**: Algorithm-based video suggestions

### 🚀 Future Enhancements
- **Live Streaming**: Real-time video broadcasting
- **Mobile App**: React Native implementation
- **Advanced Editor**: Video editing capabilities
- **Monetization**: Creator revenue features
- **AI Features**: Auto-generated captions, thumbnails

## 🚀 Deployment

### Quick Deploy Options

1. **Docker Deployment**
   ```bash
   docker-compose up -d
   ```

2. **Cloud Deployment**
   - **Frontend**: Vercel, Netlify
   - **Backend**: Railway, Render, Heroku
   - **Database**: MongoDB Atlas

3. **Traditional Server**
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

### Production Checklist
- [ ] Environment variables configured
- [ ] Database secured and backed up
- [ ] SSL certificates installed
- [ ] CDN configured for media files
- [ ] Monitoring and logging setup
- [ ] Performance optimization applied

## 📖 Documentation

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Comprehensive project overview and architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide for all platforms
- **[frontend/README.md](frontend/README.md)** - Frontend-specific documentation
- **API Documentation** - Available in this README

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper commit messages
4. **Add tests** if applicable
5. **Submit a pull request** with detailed description

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for new features
- Update documentation for new features
- Test thoroughly before submitting

## 🔒 Security

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt
- **Input Validation** on all endpoints
- **File Upload Security** with type and size restrictions
- **CORS Configuration** for cross-origin requests
- **Environment Variables** for sensitive data

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support & Troubleshooting

### Common Issues
1. **CORS Errors**: Check `CORS_ORIGIN` in backend .env
2. **File Upload Fails**: Verify Cloudinary credentials
3. **Database Connection**: Check MongoDB URI and service status
4. **Authentication Issues**: Verify JWT secrets are set

### Getting Help
1. **Check Documentation**: Review all .md files
2. **Check Logs**: Backend and frontend console logs
3. **Verify Configuration**: Environment variables and setup
4. **Test API**: Use tools like Postman to test endpoints

---

**Built with ❤️ using modern web technologies**

*VideoTube - Where creativity meets technology*
