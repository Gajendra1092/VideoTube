import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Grid,
  List,
  Bell,
  BellOff,
  UserMinus,
  Play,
  Clock,
  Eye,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/services/api'
import { QUERY_KEYS, SubscribedChannel } from '@/types'
import { formatRelativeTime, formatViewCount, formatSubscriberCount } from '@/utils'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const SubscriptionsPage = () => {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'subscribers' | 'recent'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [unsubscribeConfirmId, setUnsubscribeConfirmId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    hasRecentVideos: false,
    minSubscribers: '',
    maxSubscribers: '',
    minVideos: '',
    maxVideos: ''
  })

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/auth/login')
    return null
  }

  // Fetch subscribed channels
  const {
    data: subscriptionsResponse,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions
  } = useQuery({
    queryKey: [QUERY_KEYS.SUBSCRIPTIONS, user?._id],
    queryFn: () => apiService.getSubscribedChannels(user!._id),
    enabled: !!user?._id,
  })

  // Fetch subscription feed (recent videos)
  const {
    data: feedResponse,
    isLoading: feedLoading,
    error: feedError
  } = useQuery({
    queryKey: [QUERY_KEYS.SUBSCRIPTIONS, 'feed'],
    queryFn: () => apiService.getSubscriptionFeed({ page: 1, limit: 20 }),
    enabled: !!user?._id,
  })

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: (channelId: string) => apiService.toggleSubscription(channelId),
    onSuccess: (response) => {
      // Use the message from the backend response
      toast.success(response.message || 'Subscription updated successfully')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBSCRIPTIONS] })
      setUnsubscribeConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update subscription')
    }
  })

  // Get subscribed channels data
  const subscriptions: SubscribedChannel[] = subscriptionsResponse?.data || []
  const recentVideos = feedResponse?.data || []

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter(channel => {
      // Text search
      const matchesSearch = channel.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.username.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by recent videos
      const hasRecentVideos = !filters.hasRecentVideos || !!channel.latestVideo

      // Filter by subscriber count
      const minSubs = filters.minSubscribers ? parseInt(filters.minSubscribers) : 0
      const maxSubs = filters.maxSubscribers ? parseInt(filters.maxSubscribers) : Infinity
      const matchesSubscribers = channel.subscribersCount >= minSubs && channel.subscribersCount <= maxSubs

      // Filter by video count
      const minVids = filters.minVideos ? parseInt(filters.minVideos) : 0
      const maxVids = filters.maxVideos ? parseInt(filters.maxVideos) : Infinity
      const matchesVideos = channel.videosCount >= minVids && channel.videosCount <= maxVids

      return matchesSearch && hasRecentVideos && matchesSubscribers && matchesVideos
    })

    // Sort subscriptions
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case 'subscribers':
          comparison = a.subscribersCount - b.subscribersCount
          break
        case 'recent':
          const aDate = a.latestVideo?.createdAt || a.subscribedAt
          const bDate = b.latestVideo?.createdAt || b.subscribedAt
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [subscriptions, searchQuery, sortBy, sortOrder, filters])

  // Handle unsubscribe
  const handleUnsubscribe = (channelId: string) => {
    unsubscribeMutation.mutate(channelId)
  }

  // Navigate to channel
  const navigateToChannel = (username: string) => {
    navigate(`/channel/${username}`)
  }

  // Navigate to video
  const navigateToVideo = (videoId: string) => {
    navigate(`/watch/${videoId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-brand-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Subscriptions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Channels you're subscribed to
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'subscribers' | 'recent')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              aria-label="Sort subscriptions by"
            >
              <option value="name">Name</option>
              <option value="subscribers">Subscribers</option>
              <option value="recent">Recent Activity</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Advanced Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recent Videos Filter */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasRecentVideos}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasRecentVideos: e.target.checked }))}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Has recent videos
                  </span>
                </label>
              </div>

              {/* Subscriber Count Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscribers
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minSubscribers}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSubscribers: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxSubscribers}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxSubscribers: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Video Count Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Videos
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minVideos}
                    onChange={(e) => setFilters(prev => ({ ...prev, minVideos: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxVideos}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxVideos: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters({
                    hasRecentVideos: false,
                    minSubscribers: '',
                    maxSubscribers: '',
                    minVideos: '',
                    maxVideos: ''
                  })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {subscriptionsLoading && (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Loading your subscriptions...
          </p>
        </div>
      )}

      {/* Error State */}
      {subscriptionsError && (
        <div className="text-center py-12">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Failed to load subscriptions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Please try again later
            </p>
          </div>
          <Button onClick={() => refetchSubscriptions()} variant="primary">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!subscriptionsLoading && !subscriptionsError && subscriptions.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No subscriptions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start following channels to see their latest content here
          </p>
          <Button onClick={() => navigate('/')} variant="primary">
            Discover Channels
          </Button>
        </div>
      )}

      {/* Subscriptions Content */}
      {!subscriptionsLoading && !subscriptionsError && subscriptions.length > 0 && (
        <div className="space-y-8">
          {/* Filtered Results Info */}
          {searchQuery && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          )}

          {/* Subscriptions Grid/List */}
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredAndSortedSubscriptions.map((channel) => (
              <ChannelSubscriptionCard
                key={channel._id}
                channel={channel}
                viewMode={viewMode}
                onUnsubscribe={() => setUnsubscribeConfirmId(channel._id)}
                onChannelClick={() => navigateToChannel(channel.username)}
                onVideoClick={channel.latestVideo ? () => navigateToVideo(channel.latestVideo!._id) : undefined}
              />
            ))}
          </div>

          {/* Recent Videos Feed */}
          {recentVideos.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recent Videos
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest uploads from your subscriptions
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentVideos.slice(0, 12).map((video: any) => (
                  <RecentVideoCard
                    key={video._id}
                    video={video}
                    onVideoClick={() => navigateToVideo(video._id)}
                    onChannelClick={() => navigateToChannel(video.owner.username)}
                  />
                ))}
              </div>

              {recentVideos.length > 12 && (
                <div className="text-center mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                  >
                    View All Recent Videos
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Unsubscribe Confirmation Modal */}
      {unsubscribeConfirmId && (
        <UnsubscribeConfirmModal
          channel={subscriptions.find(c => c._id === unsubscribeConfirmId)}
          onConfirm={() => handleUnsubscribe(unsubscribeConfirmId)}
          onCancel={() => setUnsubscribeConfirmId(null)}
          isLoading={unsubscribeMutation.isPending}
        />
      )}
    </div>
  )
}

// Channel Subscription Card Component
interface ChannelSubscriptionCardProps {
  channel: SubscribedChannel
  viewMode: 'grid' | 'list'
  onUnsubscribe: () => void
  onChannelClick: () => void
  onVideoClick?: () => void
}

const ChannelSubscriptionCard = ({
  channel,
  viewMode,
  onUnsubscribe,
  onChannelClick,
  onVideoClick
}: ChannelSubscriptionCardProps) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {/* Channel Avatar and Unsubscribe Button */}
          <div className="flex flex-col items-center space-y-3 flex-shrink-0">
            <button
              type="button"
              onClick={onChannelClick}
              title={`View ${channel.fullName}'s channel`}
              aria-label={`View ${channel.fullName}'s channel`}
            >
              <Avatar
                src={channel.avatar}
                name={channel.fullName}
                size="xl"
                className="hover:ring-2 hover:ring-brand-primary transition-all"
              />
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onUnsubscribe}
              className="flex items-center space-x-1 text-xs"
            >
              <UserMinus className="w-3 h-3" />
              <span className="hidden sm:inline">Unsubscribe</span>
            </Button>
          </div>

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onChannelClick}
              className="text-left block w-full"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-brand-primary transition-colors">
                {channel.fullName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                @{channel.username}
              </p>
            </button>

            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatSubscriberCount(channel.subscribersCount)} {channel.subscribersCount === 1 ? 'subscriber' : 'subscribers'}</span>
              <span>{channel.videosCount} {channel.videosCount === 1 ? 'video' : 'videos'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Channel Info */}
      <div className="p-6">
        {/* Channel Avatar and Unsubscribe Button */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <button
            type="button"
            onClick={onChannelClick}
            title={`View ${channel.fullName}'s channel`}
            aria-label={`View ${channel.fullName}'s channel`}
          >
            <Avatar
              src={channel.avatar}
              name={channel.fullName}
              size="xl"
              className="hover:ring-2 hover:ring-brand-primary transition-all"
            />
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onUnsubscribe}
            className="flex items-center space-x-1"
          >
            <UserMinus className="w-3 h-3" />
            <span>Unsubscribe</span>
          </Button>
        </div>

        {/* Channel Details */}
        <button
          type="button"
          onClick={onChannelClick}
          className="w-full text-center mb-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-brand-primary transition-colors">
            {channel.fullName}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            @{channel.username}
          </p>
        </button>

        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>{formatSubscriberCount(channel.subscribersCount)} {channel.subscribersCount === 1 ? 'subscriber' : 'subscribers'}</span>
            <span>{channel.videosCount} {channel.videosCount === 1 ? 'video' : 'videos'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Recent Video Card Component
interface RecentVideoCardProps {
  video: any // Using any for now, should be Video type
  onVideoClick: () => void
  onChannelClick: () => void
}

const RecentVideoCard = ({ video, onVideoClick, onChannelClick }: RecentVideoCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Video Thumbnail */}
      <button
        type="button"
        onClick={onVideoClick}
        className="w-full relative group"
        title={`Watch ${video.title}`}
        aria-label={`Watch ${video.title}`}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-32 object-cover group-hover:opacity-80 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
          <Play className="w-8 h-8 text-white" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
        </div>
      </button>

      {/* Video Info */}
      <div className="p-3">
        <button
          type="button"
          onClick={onVideoClick}
          className="text-left w-full mb-2"
          title={`Watch ${video.title}`}
          aria-label={`Watch ${video.title}`}
        >
          <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 hover:text-brand-primary transition-colors">
            {video.title}
          </h3>
        </button>

        <button
          type="button"
          onClick={onChannelClick}
          className="flex items-center space-x-2 text-left w-full mb-2"
          title={`View ${video.owner.fullName}'s channel`}
          aria-label={`View ${video.owner.fullName}'s channel`}
        >
          <Avatar
            src={video.owner.avatar}
            name={video.owner.fullName}
            size="xs"
            className="flex-shrink-0 w-4 h-4"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 hover:text-brand-primary transition-colors truncate">
            {video.owner.fullName}
          </span>
        </button>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{formatViewCount(video.view)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Unsubscribe Confirmation Modal Component
interface UnsubscribeConfirmModalProps {
  channel?: SubscribedChannel
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

const UnsubscribeConfirmModal = ({
  channel,
  onConfirm,
  onCancel,
  isLoading
}: UnsubscribeConfirmModalProps) => {
  if (!channel) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unsubscribe from {channel.fullName}?
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar
              src={channel.avatar}
              name={channel.fullName}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {channel.fullName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{channel.username} • {formatSubscriberCount(channel.subscribersCount)} {channel.subscribersCount === 1 ? 'subscriber' : 'subscribers'}
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You won't see new videos from this channel in your subscription feed.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Unsubscribing...
              </>
            ) : (
              'Unsubscribe'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsPage
