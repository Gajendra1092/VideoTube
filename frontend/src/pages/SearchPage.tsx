import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, SortAsc, SortDesc, Grid, List, Users, Video as VideoIcon } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import VideoCard from '@/components/video/VideoCard'
import ChannelCard from '@/components/channel/ChannelCard'
import toast from 'react-hot-toast'

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Get search query from URL
  const query = searchParams.get('q') || ''

  // State management
  const [searchInput, setSearchInput] = useState(query)
  const [contentType, setContentType] = useState<'all' | 'videos' | 'channels'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Update search input when URL query changes
  useEffect(() => {
    setSearchInput(query)
    setPage(1) // Reset page when query changes
  }, [query])

  // Fetch search results
  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.SEARCH, query, contentType, sortBy, sortOrder, page],
    queryFn: () => apiService.globalSearch({
      q: query,
      page,
      limit: 20,
      type: contentType,
      sortBy,
      sortOrder
    }),
    enabled: !!query && query.trim() !== '',
    keepPreviousData: true
  })

  const results = searchResults?.data || {
    videos: [],
    channels: [],
    totalVideos: 0,
    totalChannels: 0,
    totalResults: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() })
      setPage(1)
    }
  }

  // Handle filter changes
  const handleContentTypeChange = (type: 'all' | 'videos' | 'channels') => {
    setContentType(type)
    setPage(1)
  }

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
    setPage(1)
  }

  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Search Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Something went wrong while searching. Please try again.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // No query state
  if (!query || query.trim() === '') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Search Videos and Channels</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Discover amazing content from creators around the world
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for videos, channels, or topics..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                autoFocus
              />
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Search Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {results.totalResults > 0
            ? `Found ${results.totalResults.toLocaleString()} results for "${query}"`
            : `No results found for "${query}"`
          }
        </p>
      </div>



      {results.totalResults > 0 && (
        <>
          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Content Type Filter */}
            <div className="flex items-center space-x-2">
              <Button
                variant={contentType === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleContentTypeChange('all')}
                className="flex items-center space-x-1"
              >
                <span>All</span>
                {contentType === 'all' && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {results.totalResults}
                  </span>
                )}
              </Button>

              <Button
                variant={contentType === 'videos' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleContentTypeChange('videos')}
                className="flex items-center space-x-1"
              >
                <VideoIcon className="w-3 h-3" />
                <span>Videos</span>
                {results.totalVideos > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {results.totalVideos}
                  </span>
                )}
              </Button>

              <Button
                variant={contentType === 'channels' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleContentTypeChange('channels')}
                className="flex items-center space-x-1"
              >
                <Users className="w-3 h-3" />
                <span>Channels</span>
                {results.totalChannels > 0 && (
                  <span className="text-xs bg-white/20 px-1 rounded">
                    {results.totalChannels}
                  </span>
                )}
              </Button>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sort Options Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Sort Options
              </h3>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortBy === 'relevance' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSortChange('relevance')}
                  className="flex items-center space-x-1"
                >
                  <span>Relevance</span>
                  {sortBy === 'relevance' && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </Button>

                <Button
                  variant={sortBy === 'date' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSortChange('date')}
                  className="flex items-center space-x-1"
                >
                  <span>Upload Date</span>
                  {sortBy === 'date' && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </Button>

                {(contentType === 'all' || contentType === 'videos') && (
                  <Button
                    variant={sortBy === 'views' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleSortChange('views')}
                    className="flex items-center space-x-1"
                  >
                    <span>View Count</span>
                    {sortBy === 'views' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </Button>
                )}


              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-8">
            {/* Channels Section */}
            {results.channels.length > 0 && (contentType === 'all' || contentType === 'channels') && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Channels
                  </h2>
                  {contentType === 'all' && results.totalChannels > results.channels.length && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({results.channels.length} of {results.totalChannels})
                    </span>
                  )}
                </div>

                <div className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {results.channels.map((channel: any) => (
                    <ChannelCard
                      key={channel._id}
                      channel={channel}
                      viewMode={viewMode}
                      showSubscribeButton={true}
                      showCoverImage={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {results.videos.length > 0 && (contentType === 'all' || contentType === 'videos') && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <VideoIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Videos
                  </h2>
                  {contentType === 'all' && results.totalVideos > results.videos.length && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({results.videos.length} of {results.totalVideos})
                    </span>
                  )}
                </div>

                <div className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {results.videos.map((video: any) => (
                    <VideoCard
                      key={video._id}
                      video={video}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.totalResults === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try different keywords or check your spelling
                </p>

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Make sure all words are spelled correctly</li>
                    <li>Try different or more general keywords</li>
                    <li>Try fewer keywords</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Pagination */}
            {results.totalResults > 0 && (results.hasNextPage || results.hasPrevPage) && (
              <div className="flex items-center justify-center space-x-4 pt-8">
                <Button
                  variant="secondary"
                  onClick={() => setPage(page - 1)}
                  disabled={!results.hasPrevPage || isLoading}
                >
                  Previous
                </Button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page}
                </span>

                <Button
                  variant="secondary"
                  onClick={() => setPage(page + 1)}
                  disabled={!results.hasNextPage || isLoading}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Loading More Results */}
            {isLoading && page > 1 && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SearchPage
