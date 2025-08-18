# VideoTube Frontend

A modern, responsive video streaming platform frontend built with React, TypeScript, and Tailwind CSS.

## Features

### 🎯 Core Functionality
- **User Authentication**: Login/Register with JWT tokens + Google OAuth support
- **Video Streaming**: Advanced video player with quality selection and controls
- **User Profiles**: Channel pages with customizable avatars and cover images
- **Video Management**: Upload, edit, delete videos with thumbnail support
- **Social Features**: Comments, likes, subscriptions, playlists
- **Search**: Global video and channel search functionality
- **Dashboard**: Creator analytics and video management

### 🎨 UI/UX Features
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern Interface**: Clean, intuitive design inspired by popular streaming platforms
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Lazy loading, code splitting, optimized images

### 🛠 Technical Features
- **TypeScript**: Full type safety throughout the application
- **State Management**: Zustand for global state, TanStack Query for server state
- **API Integration**: Comprehensive API service layer with error handling
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: Drag & drop file uploads with preview
- **Real-time Updates**: Optimistic updates and cache invalidation

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI elements (Button, Input, etc.)
│   │   ├── auth/           # Authentication components
│   │   ├── video/          # Video-related components
│   │   └── layout/         # Layout components (Header, Sidebar)
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   └── *.tsx           # Other pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # State management (Zustand stores)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static assets
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend server running on port 5000

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Environment Setup

The frontend is configured to proxy API requests to `http://localhost:5000` in development. Make sure your backend server is running on port 5000.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend integrates with the backend through a comprehensive API service layer:

### Authentication
- Login/Register with email/username and password
- Google OAuth integration (redirects to backend OAuth endpoint)
- JWT token management with automatic refresh
- Protected routes with authentication guards

### Video Management
- Upload videos with thumbnails
- Stream videos with quality selection
- CRUD operations for video metadata
- View count tracking

### Social Features
- User subscriptions and followers
- Video comments with CRUD operations
- Like/unlike videos and comments
- Playlist creation and management

### User Profiles
- Channel pages with customizable content
- Avatar and cover image uploads
- User settings and preferences
- Watch history tracking

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large**: 1440px+

## Theme System

Supports both light and dark themes with:
- System preference detection
- Manual theme switching
- Persistent theme selection
- Smooth transitions between themes

## Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading with intersection observer
- **Caching**: TanStack Query for intelligent data caching
- **Bundle Optimization**: Tree shaking and minification

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
