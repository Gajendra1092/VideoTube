import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Menu,
  Upload,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Video,
  Users
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import NotificationDropdown from '@/components/ui/NotificationDropdown'

const Header = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { toggleSidebar, toggleTheme, theme } = useAppStore()
  const {
    unreadCount,
    isDropdownOpen,
    setDropdownOpen,
    fetchUnreadCount,
    startPolling,
    stopPolling,
    reset
  } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Get search suggestions
  const { suggestions } = useSearchSuggestions(searchQuery, {
    enabled: showSuggestions && searchQuery.length > 1
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    navigate(`/search?q=${encodeURIComponent(suggestion)}`)
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle notification polling based on authentication
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch initial unread count
      fetchUnreadCount()
      // Start polling for new notifications
      startPolling()
    } else {
      // Reset notifications and stop polling when logged out
      reset()
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, fetchUnreadCount, startPolling, stopPolling, reset])

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b" style={{
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)'
    }}>
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <Link to="/" className="flex items-center space-x-2">
            <Video className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-xl font-bold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              VideoTube
            </span>
          </Link>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-2xl mx-4" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos and channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    {suggestion.type === 'channel' ? (
                      <Users className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Video className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-900 dark:text-white">{suggestion.text}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {isAuthenticated ? (
            <>
              {/* Upload button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/upload')}
                className="p-2"
              >
                <Upload className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className="p-2 relative"
                >
                  <Bell className="w-5 h-5" />
                  {/* Notification badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand-primary text-white text-xs rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>

                <NotificationDropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setDropdownOpen(false)}
                />
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="focus:outline-none"
                >
                  <Avatar
                    src={user?.avatar}
                    name={user?.fullName}
                    size="sm"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-light-primary dark:bg-dark-secondary rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <Link
                      to={`/channel/${user?.username}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-tertiary dark:hover:bg-dark-tertiary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Your Channel
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-tertiary dark:hover:bg-dark-tertiary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Video className="w-4 h-4 mr-3" />
                      Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-tertiary dark:hover:bg-dark-tertiary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-light-tertiary dark:hover:bg-dark-tertiary"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth/login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/auth/register')}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}

export default Header
