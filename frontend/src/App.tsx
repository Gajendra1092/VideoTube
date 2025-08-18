import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'

// Layout Components
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Page Components
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import EmailVerificationPage from '@/pages/auth/EmailVerificationPage'
import VideoPage from '@/pages/VideoPage'
import ChannelPage from '@/pages/ChannelPage'
import DashboardPage from '@/pages/DashboardPage'
import PlaylistPage from '@/pages/PlaylistPage'
import PlaylistsPage from '@/pages/PlaylistsPage'
import SearchPage from '@/pages/SearchPage'
import UploadPage from '@/pages/UploadPage'
import SettingsPage from '@/pages/SettingsPage'
import SubscriptionsPage from '@/pages/SubscriptionsPage'
import HistoryPage from '@/pages/HistoryPage'
import LikedVideosPage from '@/pages/LikedVideosPage'
import WatchLaterPage from '@/pages/WatchLaterPage'
import SavedVideosPage from '@/pages/SavedVideosPage'
import TrendingPage from '@/pages/TrendingPage'

// Protected Route Component
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Loading Component
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function App() {
  const { initializeAuth, isLoading } = useAuthStore()
  const { theme } = useAppStore()

  useEffect(() => {
    // Initialize authentication state only once on app load
    initializeAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Set CSS custom properties for toast styling
    const root = document.documentElement
    if (theme === 'dark') {
      root.style.setProperty('--toast-bg', '#1E1E1E')
      root.style.setProperty('--toast-color', '#FFFFFF')
      root.style.setProperty('--toast-border', '#2C2C2E')
    } else {
      root.style.setProperty('--toast-bg', '#FFFFFF')
      root.style.setProperty('--toast-color', '#1C1C1E')
      root.style.setProperty('--toast-border', '#E5E5EA')
    }
  }, [theme])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email/:token" element={<EmailVerificationPage />} />
        <Route index element={<Navigate to="/auth/login" replace />} />
      </Route>

      {/* Main App Routes */}
      <Route path="/" element={<AppLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="trending" element={<TrendingPage />} />
        <Route path="watch/:videoId" element={<VideoPage />} />
        <Route path="channel/:username" element={<ChannelPage />} />
        <Route path="playlist/:playlistId" element={<PlaylistPage />} />
        <Route path="playlists" element={<PlaylistsPage />} />
        <Route path="search" element={<SearchPage />} />

        {/* Protected Routes */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="upload" element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="subscriptions" element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="liked" element={
          <ProtectedRoute>
            <LikedVideosPage />
          </ProtectedRoute>
        } />
        <Route path="watch-later" element={
          <ProtectedRoute>
            <WatchLaterPage />
          </ProtectedRoute>
        } />
        <Route path="saved" element={
          <ProtectedRoute>
            <SavedVideosPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
