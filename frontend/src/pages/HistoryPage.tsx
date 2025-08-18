import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { History, Clock, Search, Filter, Grid, List, Trash2, Calendar, User, Play, SortAsc, SortDesc } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/api'
import { QUERY_KEYS } from '../types'
import { formatRelativeTime, formatDuration } from '../utils'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const HistoryPage = () => {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'lastWatchedAt' | 'title' | 'channel'>('lastWatchedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    completedOnly: false
  })

  // Navigation function for video cards
  const navigateToVideo = (videoId: string) => {
    navigate(`/watch/${videoId}`)
  }

  // Handle keyboard navigation for accessibility
  const handleKeyPress = (event: React.KeyboardEvent, videoId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigateToVideo(videoId)
    }
  }

  // Handle delete confirmation
  const handleDeleteClick = (event: React.MouseEvent, videoId: string) => {
    event.stopPropagation() // Prevent navigation when clicking delete
    setDeleteConfirmId(videoId)
  }

  // Confirm delete
  const confirmDelete = (videoId: string) => {
    deleteFromHistoryMutation.mutate(videoId)
  }

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  // Fetch watch history
  const {
    data: watchHistoryData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.WATCH_HISTORY, page, searchQuery, filters],
    queryFn: () => apiService.getWatchHistoryList({
      page,
      limit: 20,
      search: searchQuery,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      completedOnly: filters.completedOnly
    }),
    enabled: isAuthenticated
  })



  const watchHistory = watchHistoryData?.data?.watchHistory || []
  const pagination = watchHistoryData?.data?.pagination || {}

  // Delete from watch history mutation
  const deleteFromHistoryMutation = useMutation({
    mutationFn: (videoId: string) => apiService.removeFromWatchHistory(videoId),
    onSuccess: () => {
      toast.success('Video removed from watch history!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCH_HISTORY] })
      setDeleteConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove video from history')
      setDeleteConfirmId(null)
    }
  })

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to see your watch history
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Your watch history helps you find videos you've watched before and pick up where you left off.
          </p>
          <button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            onClick={() => window.location.href = '/auth/login'}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load watch history
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There was an error loading your watch history. Please try again.
          </p>
          <button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Watch History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Videos you've watched recently
            </p>
          </div>
        </div>


      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search watch history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'lastWatchedAt' | 'title' | 'channel')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            aria-label="Sort history by"
          >
            <option value="lastWatchedAt">Watch Date</option>
            <option value="title">Video Title</option>
            <option value="channel">Channel Name</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Advanced Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                title="Filter from date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                title="Filter to date"
              />
            </div>

            {/* Completion Filter */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.completedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, completedOnly: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Completed videos only
                </span>
              </label>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFilters({
                  dateFrom: '',
                  dateTo: '',
                  completedOnly: false
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtered Results Info */}
      {searchQuery && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing results for "{searchQuery}"
        </div>
      )}

      {/* Content */}
      {watchHistory.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No watch history yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Videos you watch will appear here. Start exploring and your watch history will be saved automatically!
          </p>
          <button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            onClick={() => window.location.href = '/'}
          >
            Explore Videos
          </button>
        </div>
      ) : (
        <>
          {/* Videos Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {watchHistory.map((item: any) => (
                <div
                  key={item._id}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  onClick={() => navigateToVideo(item.video?._id)}
                  onKeyDown={(e) => handleKeyPress(e, item.video?._id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch ${item.video?.title}`}
                >
                  <div className="relative">
                    <img
                      src={item.video?.thumbnail}
                      alt={item.video?.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      {formatDuration(item.video?.duration)}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.video?.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {item.video?.owner?.username}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Watched {formatRelativeTime(item.lastWatchedAt)}
                    </div>
                    {item.isCompleted || item.watchPercentage >= 90 ? (
                      <div className="flex items-center space-x-1">
                        <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                          ✓ Completed
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                          Not Completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 mb-8">
              {watchHistory.map((item: any, index: number) => (
                <div
                  key={item._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => navigateToVideo(item.video?._id)}
                  onKeyDown={(e) => handleKeyPress(e, item.video?._id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch ${item.video?.title}`}
                >
                  <div className="flex space-x-4">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.video?.thumbnail}
                        alt={item.video?.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {formatDuration(item.video?.duration)}
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, item.video?._id)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.video?.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <User className="w-4 h-4" />
                        <span>{item.video?.owner?.username}</span>
                        <span>•</span>
                        <span>{item.video?.views} views</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Watched {formatRelativeTime(item.lastWatchedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Play className="w-4 h-4" />
                          {item.isCompleted || item.watchPercentage >= 90 ? (
                            <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                              Not Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <div className="flex-shrink-0 ml-4">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, item.video?._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Remove from History
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove this video from your watch history? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={deleteFromHistoryMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteFromHistoryMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
