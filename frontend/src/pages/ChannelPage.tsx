import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Upload, Settings, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CoverImageUploadModal from '@/components/ui/CoverImageUploadModal'
import PlaylistsSection from '@/components/playlist/PlaylistsSection'
import AboutSection from '@/components/channel/AboutSection'
import { toast } from 'react-hot-toast' // Still needed for video deletion

const ChannelPage = () => {
  const { username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser, updateCoverImage, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCoverUploadModal, setShowCoverUploadModal] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Get active tab from URL params, default to 'videos'
  const activeTab = searchParams.get('tab') || 'videos'

  // Fetch channel data
  const {
    data: channelResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_VIDEOS, username],
    queryFn: () => apiService.getUserChannelProfile(username!),
    enabled: !!username,
    retry: 2
  })

  const channelData = channelResponse?.data

  // Debug logging for channel data
  console.log('📊 ChannelPage channelData:', {
    exists: !!channelData,
    isSubscribed: channelData?.isSubscribed,
    subscribersCount: channelData?.subscribersCount,
    channelId: channelData?._id,
    username: channelData?.username
  })
  const isOwnChannel = isAuthenticated && currentUser?.username === username

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => apiService.deleteVideo(videoId),
    onSuccess: () => {
      toast.success('Video deleted successfully!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHANNEL_VIDEOS, username] })
      setDeleteConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete video')
      setDeleteConfirmId(null)
    }
  })

  // Subscribe mutation - simplified without optimistic updates
  const subscribeMutation = useMutation({
    mutationFn: () => {
      console.log('🚀 Calling toggleSubscription API with channelId:', channelData?._id)
      return apiService.toggleSubscription(channelData?._id!)
    },
    onSuccess: async (response) => {
      // Show success message from backend
      toast.success(response.message || 'Subscription updated successfully')

      // Force invalidate and refetch the channel data
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHANNEL_VIDEOS, username] })
      await refetch()
    },
    onError: (err) => {
      console.error('❌ Subscription toggle failed:', err)
    }
  })

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab })
  }

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated - cannot subscribe')
      return
    }
    console.log('🔄 ChannelPage handleSubscribe called:', {
      channelId: channelData?._id,
      currentSubscriptionStatus: channelData?.isSubscribed,
      subscribersCount: channelData?.subscribersCount
    })
    subscribeMutation.mutate()
  }

  // Handle delete confirmation
  const handleDeleteClick = (event: React.MouseEvent, videoId: string) => {
    event.preventDefault() // Prevent navigation when clicking delete
    event.stopPropagation()
    setDeleteConfirmId(videoId)
  }

  // Confirm delete
  const confirmDelete = (videoId: string) => {
    deleteVideoMutation.mutate(videoId)
  }

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleCoverImageUpload = async (file: File) => {
    setIsUploadingCover(true)
    try {
      await updateCoverImage(file)
      toast.success('Cover image updated successfully!')
      // Refetch channel data to get updated cover image
      refetch()
    } catch (error) {
      console.error('Cover image update failed:', error)
      toast.error('Failed to update cover image')
      throw error
    } finally {
      setIsUploadingCover(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            Failed to load channel: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!channelData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Channel not found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Channel Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg overflow-hidden group">
          {(channelData.coverImage || currentUser?.coverImage) && (
            <img
              src={channelData.coverImage || currentUser?.coverImage}
              alt="Channel cover"
              className="w-full h-full object-cover"
            />
          )}

          {/* Cover Image Upload Button - Only show for own channel */}
          {isOwnChannel && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2 bg-black bg-opacity-75 hover:bg-opacity-90 text-white border-none"
                onClick={() => setShowCoverUploadModal(true)}
                type="button"
              >
                <Camera className="w-4 h-4" />
                <span>Change Cover</span>
              </Button>
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 mt-4">
          <Avatar
            src={channelData.avatar}
            name={channelData.fullName}
            size="2xl"
            className="w-20 h-20 md:w-32 md:h-32"
          />

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {channelData.fullName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              @{channelData.username}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {channelData.subscribersCount?.toLocaleString() || 0} subscribers • {channelData.totalVideos || 0} videos
            </p>
            {channelData.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 max-w-2xl">
                {channelData.description}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            {isOwnChannel ? (
              <Link to="/settings">
                <Button variant="secondary" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Edit Channel</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant={channelData?.isSubscribed ? "secondary" : "primary"}
                onClick={handleSubscribe}
                loading={subscribeMutation.isPending}
                type="button"
              >
                {channelData?.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Channel Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => handleTabChange('videos')}
            className={`py-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'videos'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('playlists')}
            className={`py-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'playlists'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Playlists
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('about')}
            className={`py-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'about'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            About
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'videos' && (
          <div className="video-grid">
            {channelData.videos && channelData.videos.length > 0 ? (
              channelData.videos.map((video: any) => (
                <div key={video._id} className="space-y-3 group relative">
                  <Link to={`/watch/${video._id}`} className="block">
                    <div className="relative aspect-video bg-gray-300 dark:bg-gray-600 rounded-lg overflow-hidden">
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}

                      {/* Delete button - Only show for own channel */}
                      {isOwnChannel && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, video._id)}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Link>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {video.view?.toLocaleString() || 0} views • {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  {isOwnChannel ? 'You haven\'t uploaded any videos yet.' : 'This channel has no videos yet.'}
                </p>
                {isOwnChannel && (
                  <Link to="/upload" className="mt-4 inline-block">
                    <Button variant="primary">Upload Your First Video</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <PlaylistsSection
            userId={channelData._id}
            username={channelData.username}
            isOwnChannel={isOwnChannel}
          />
        )}

        {activeTab === 'about' && (
          <AboutSection
            channelData={channelData}
            isOwnChannel={isOwnChannel}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Video
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this video? This action cannot be undone.
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
                disabled={deleteVideoMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteVideoMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Image Upload Modal */}
      <CoverImageUploadModal
        isOpen={showCoverUploadModal}
        onClose={() => setShowCoverUploadModal(false)}
        onUpload={handleCoverImageUpload}
        currentImage={channelData?.coverImage || currentUser?.coverImage}
        isUploading={isUploadingCover}
      />
    </div>
  )
}

export default ChannelPage
