import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS, Playlist } from '@/types'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PlaylistCard from './PlaylistCard'
import CreatePlaylistModal from './CreatePlaylistModal'
import EditPlaylistModal from './EditPlaylistModal'
import { toast } from 'react-hot-toast'

interface PlaylistsSectionProps {
  userId: string
  username: string
  isOwnChannel: boolean
}

const PlaylistsSection = ({ userId, username, isOwnChannel }: PlaylistsSectionProps) => {
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'videoCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  const queryClient = useQueryClient()

  // Fetch user playlists (fetch all for client-side filtering)
  const {
    data: playlistsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.USER_PLAYLISTS, userId],
    queryFn: () => apiService.getUserPlaylists(userId, {
      page: 1,
      limit: 100, // Fetch more playlists for client-side filtering
      sortBy: 'createdAt',
      sortType: 'desc'
    }),
    enabled: !!userId
  })

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: (playlistId: string) => apiService.deletePlaylist(playlistId),
    onSuccess: () => {
      toast.success('Playlist deleted successfully!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS, userId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete playlist')
    }
  })

  const allPlaylists = playlistsResponse?.data?.playlists || []

  // Filter and sort playlists (client-side like Subscriptions page)
  const filteredAndSortedPlaylists = useMemo(() => {
    let filtered = allPlaylists.filter(playlist => {
      // Text search - filter by title and description
      const matchesSearch = playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })

    // Sort playlists
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'videoCount':
          comparison = a.videoCount - b.videoCount
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [allPlaylists, searchQuery, sortBy, sortOrder])

  // Pagination for filtered results
  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredAndSortedPlaylists.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPlaylists = filteredAndSortedPlaylists.slice(startIndex, endIndex)

  // Reset to first page when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
  }

  const handleDeletePlaylist = (playlistId: string) => {
    deletePlaylistMutation.mutate(playlistId)
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
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load playlists</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Playlists ({allPlaylists.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isOwnChannel ? 'Manage your playlists' : `${username}'s playlists`}
          </p>
        </div>

        {isOwnChannel && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'createdAt' | 'updatedAt' | 'videoCount')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            aria-label="Sort playlists by"
          >
            <option value="title">Title</option>
            <option value="createdAt">Date Created</option>
            <option value="updatedAt">Last Updated</option>
            <option value="videoCount">Video Count</option>
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

      {/* Filtered Results Info */}
      {searchQuery && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAndSortedPlaylists.length} of {allPlaylists.length} playlists
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      )}

      {/* Playlists Grid/List */}
      {paginatedPlaylists.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700'
        }>
          {paginatedPlaylists.map((playlist: any, index: number) => (
            <PlaylistCard
              key={playlist._id}
              playlist={playlist}
              isOwner={isOwnChannel}
              onEdit={handleEditPlaylist}
              onDelete={handleDeletePlaylist}
              showOwner={false}
              viewMode={viewMode}
              showIndex={viewMode === 'list'}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No playlists found matching your search.'
              : allPlaylists.length === 0
                ? isOwnChannel
                  ? "You haven't created any playlists yet."
                  : 'This channel has no playlists yet.'
                : 'No playlists to display.'
            }
          </p>
          {isOwnChannel && !searchQuery && allPlaylists.length === 0 && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Playlist</span>
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              type="button"
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={userId}
      />

      {editingPlaylist && (
        <EditPlaylistModal
          isOpen={!!editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          playlist={editingPlaylist}
          userId={userId}
        />
      )}
    </div>
  )
}

export default PlaylistsSection
