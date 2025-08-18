import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore()

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-primary to-light-secondary dark:from-dark-primary dark:to-dark-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">
            VideoTube
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your video streaming platform
          </p>
        </div>
        <div className="card">
          <div className="card-content p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
