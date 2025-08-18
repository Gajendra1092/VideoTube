import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  TrendingUp,
  Users,
  Clock,
  ThumbsUp,
  PlaySquare,
  Settings,
  Upload,
  BarChart3,
  Bookmark,
  History
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'

const Sidebar = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { sidebarOpen } = useAppStore()

  const isActive = (path: string) => location.pathname === path

  const publicNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
  ]

  const authenticatedNavItems = [
    { icon: Users, label: 'Subscriptions', path: '/subscriptions' },
    { icon: History, label: 'History', path: '/history' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
    { icon: Clock, label: 'Watch Later', path: '/watch-later' },
    { icon: Bookmark, label: 'Saved Videos', path: '/saved' },
    { icon: PlaySquare, label: 'Playlists', path: '/playlists' },
  ]

  const creatorNavItems = [
    { icon: Upload, label: 'Upload', path: '/upload' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <Link
      to={path}
      className={cn(
        'nav-link',
        isActive(path) && 'active',
        !sidebarOpen && 'justify-center px-2'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {sidebarOpen && <span className="ml-3">{label}</span>}
    </Link>
  )

  return (
    <aside 
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] border-r transition-all duration-300 z-30',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <nav className="p-2 space-y-1">
        {/* Public navigation */}
        <div className="space-y-1">
          {publicNavItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

        {isAuthenticated && (
          <>
            {/* Divider */}
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            
            {/* Authenticated user navigation */}
            <div className="space-y-1">
              {sidebarOpen && (
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Library
                </h3>
              )}
              {authenticatedNavItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>

            {/* Divider */}
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            
            {/* Creator navigation */}
            <div className="space-y-1">
              {sidebarOpen && (
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Creator
                </h3>
              )}
              {creatorNavItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </>
        )}

        {!isAuthenticated && sidebarOpen && (
          <>
            {/* Divider */}
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            
            {/* Sign in prompt */}
            <div className="p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Sign in to access your library, subscriptions, and more.
              </p>
              <Link
                to="/auth/login"
                className="btn btn-primary btn-sm w-full"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
