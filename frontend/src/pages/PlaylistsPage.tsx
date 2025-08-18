import { useAuthStore } from '@/store/authStore'
import PlaylistsSection from '@/components/playlist/PlaylistsSection'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const PlaylistsPage = () => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your playlists
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your video playlists by signing in to your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Playlists
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and organize your video collections
        </p>
      </div>

      <PlaylistsSection
        userId={user._id}
        username={user.username}
        isOwnChannel={true}
      />
    </div>
  )
}

export default PlaylistsPage
