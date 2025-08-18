import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/api'
import { QUERY_KEYS } from '../types'
import { formatRelativeTime } from '../utils'

const DashboardPage = () => {
  const { isAuthenticated } = useAuthStore()

  // Fetch channel statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_STATS],
    queryFn: () => apiService.getChannelStats(),
    enabled: isAuthenticated
  })

  // Fetch user's videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_VIDEOS],
    queryFn: () => apiService.getUserVideos({ limit: 5, sortBy: 'createdAt', sortType: 'desc' }),
    enabled: isAuthenticated
  })

  const stats = statsData?.data || {}
  const recentVideos = videosData?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your channel and content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card">
              <div className="card-content p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          [
            {
              label: 'Total Views',
              value: stats.totalViews?.toLocaleString() || '0',
              color: 'text-blue-600 dark:text-blue-400'
            },
            {
              label: 'Subscribers',
              value: stats.totalSubscribers?.toLocaleString() || '0',
              color: 'text-green-600 dark:text-green-400'
            },
            {
              label: 'Videos',
              value: stats.totalVideos?.toLocaleString() || '0',
              color: 'text-purple-600 dark:text-purple-400'
            },
          ].map((stat, index) => (
            <div key={index} className="card">
              <div className="card-content p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Videos */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Videos</h2>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {videosLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4">
                  <div className="w-16 h-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : recentVideos.length > 0 ? (
              recentVideos.map((video: any) => (
                <div key={video._id} className="flex items-center space-x-4 p-4 hover:bg-light-tertiary dark:hover:bg-dark-tertiary rounded-lg cursor-pointer"
                     onClick={() => window.location.href = `/watch/${video._id}`}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{video.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Published {formatRelativeTime(video.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {video.view?.toLocaleString() || 0} views
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {video.isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No videos uploaded yet</p>
                <button
                  type="button"
                  className="mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                  onClick={() => window.location.href = '/upload'}
                >
                  Upload your first video
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
