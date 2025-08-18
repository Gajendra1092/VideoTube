import { Link } from 'react-router-dom'
import { Users, Video, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { formatSubscriberCount } from '@/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Channel {
  _id: string
  username: string
  fullName: string
  avatar?: string
  coverImage?: string
  description?: string
  subscribersCount: number
  videosCount: number
  createdAt: string
  isSubscribed?: boolean
}

interface ChannelCardProps {
  channel: Channel
  viewMode?: 'grid' | 'list'
  showSubscribeButton?: boolean
  showCoverImage?: boolean
  className?: string
}

const ChannelCard = ({
  channel,
  viewMode = 'grid',
  showSubscribeButton = true,
  showCoverImage = true,
  className = ''
}: ChannelCardProps) => {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  // Subscribe/Unsubscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => apiService.toggleSubscription(channel._id),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.SEARCH] })

      // Snapshot the previous value
      const previousSearchData = queryClient.getQueryData([QUERY_KEYS.SEARCH])

      // Optimistically update the channel's subscription status
      queryClient.setQueryData([QUERY_KEYS.SEARCH], (old: any) => {
        if (!old) return old

        return {
          ...old,
          channels: old.channels?.map((ch: any) =>
            ch._id === channel._id
              ? {
                  ...ch,
                  isSubscribed: !ch.isSubscribed,
                  subscribersCount: ch.isSubscribed
                    ? ch.subscribersCount - 1
                    : ch.subscribersCount + 1
                }
              : ch
          ) || []
        }
      })

      return { previousSearchData }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBSCRIPTIONS] })
      // Use the message from the backend response
      toast.success(response.message || 'Subscription updated successfully')
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousSearchData) {
        queryClient.setQueryData([QUERY_KEYS.SEARCH], context.previousSearchData)
      }
      toast.error('Failed to update subscription')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEARCH] })
    }
  })

  const handleSubscribe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe to channels')
      return
    }
    
    subscribeMutation.mutate()
  }

  if (viewMode === 'list') {
    return (
      <div className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${className}`}>
        {/* Avatar */}
        <Link to={`/channel/${channel.username}`} className="flex-shrink-0">
          <Avatar
            src={channel.avatar}
            name={channel.fullName}
            size="lg"
            className="ring-2 ring-gray-200 dark:ring-gray-700"
          />
        </Link>

        {/* Channel info */}
        <div className="flex-1 min-w-0">
          <Link to={`/channel/${channel.username}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors line-clamp-1">
              {channel.fullName}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            @{channel.username}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{formatSubscriberCount(channel.subscribersCount)} subscribers</span>
            </div>
            <div className="flex items-center space-x-1">
              <Video className="w-3 h-3" />
              <span>{channel.videosCount} videos</span>
            </div>
          </div>
          
          {channel.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {channel.description}
            </p>
          )}
        </div>

        {/* Subscribe button */}
        {showSubscribeButton && isAuthenticated && (
          <div className="flex-shrink-0">
            <Button
              variant={channel.isSubscribed ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending}
              className="min-w-[100px]"
            >
              {subscribeMutation.isPending ? (
                'Loading...'
              ) : channel.isSubscribed ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Subscribed
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div className={`group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all ${className}`}>
      {/* Cover Image */}
      {showCoverImage && channel.coverImage && (
        <Link to={`/channel/${channel.username}`}>
          <div className="relative h-24 bg-gradient-to-r from-brand-primary to-brand-secondary">
            <img
              src={channel.coverImage}
              alt={`${channel.fullName} cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      {/* Channel Content */}
      <div className="p-4">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <Link to={`/channel/${channel.username}`} className="mb-3">
            <Avatar
              src={channel.avatar}
              name={channel.fullName}
              size="xl"
              className="ring-4 ring-white dark:ring-gray-800 shadow-lg"
            />
          </Link>
          
          <Link to={`/channel/${channel.username}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors line-clamp-1 mb-1">
              {channel.fullName}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            @{channel.username}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{formatSubscriberCount(channel.subscribersCount)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Video className="w-3 h-3" />
            <span>{channel.videosCount}</span>
          </div>
        </div>

        {/* Description */}
        {channel.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-2 mb-4">
            {channel.description}
          </p>
        )}

        {/* Subscribe button */}
        {showSubscribeButton && isAuthenticated && (
          <Button
            variant={channel.isSubscribed ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleSubscribe}
            disabled={subscribeMutation.isPending}
            className="w-full"
          >
            {subscribeMutation.isPending ? (
              'Loading...'
            ) : channel.isSubscribed ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Subscribed
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ChannelCard
