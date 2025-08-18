import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Download, FileVideo, Music, Image, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface DownloadVideoModalProps {
  videoId: string
  videoTitle?: string
  videoUrl?: string
  onClose: () => void
}

interface DownloadFormat {
  id: string
  format: string
  quality: string
  type: string
  name: string
  description: string
  available: boolean
  estimated_size: string
}

const DownloadVideoModal = ({ videoId, videoTitle, videoUrl, onClose }: DownloadVideoModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Fetch available download formats
  const { data: formatsData, isLoading: formatsLoading, error: formatsError } = useQuery({
    queryKey: [QUERY_KEYS.VIDEO_FORMATS, videoId],
    queryFn: () => apiService.getVideoFormats(videoId),
    enabled: !!videoId,
  })

  const formats: DownloadFormat[] = formatsData?.data?.formats || []
  const selectedFormatData = formats.find(f => f.id === selectedFormat)

  // Set default format when formats are loaded
  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) {
      setSelectedFormat(formats[0].id)
    }
  }, [formats, selectedFormat])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    // Save current overflow style
    const originalOverflow = document.body.style.overflow

    // Disable scrolling
    document.body.style.overflow = 'hidden'

    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const handleDownload = async () => {
    if (!selectedFormatData) {
      toast.error('Please select a format to download')
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Call the download API
      const result = await apiService.downloadVideo(videoId, selectedFormatData.format, selectedFormatData.quality)

      // Clear the progress interval
      clearInterval(progressInterval)

      // Complete the progress
      setDownloadProgress(100)
      toast.success(`Download completed: ${result.filename}`)

      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  if (formatsLoading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading download options...</span>
          </div>
        </div>
      </div>
    )
  }

  if (formatsError) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Failed to load download options</span>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Download video
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Video info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-white mb-1 truncate">
              {videoTitle || formatsData?.data?.title || 'Video'}
            </p>
            <p>Choose your preferred format and quality</p>
          </div>

          {/* Format selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Available Formats
            </h3>
            <div className="space-y-2">
              {formats.map((format) => {
                const IconComponent = format.type === 'video' ? FileVideo :
                                    format.type === 'audio' ? Music : Image

                return (
                  <label
                    key={format.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mt-1"
                    />
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Size: {format.estimated_size} • Quality: {format.quality}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Download Progress */}
          {isDownloading && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Download Progress
              </h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {downloadProgress < 100 ? 'Preparing download...' : 'Download complete!'}
              </p>
            </div>
          )}

          {/* Warning notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Download Notice</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Downloads are for personal use only</li>
                  <li>Respect copyright and creator rights</li>
                  <li>Large files may take time to process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-3 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            variant="primary"
            loading={isDownloading}
            disabled={isDownloading || !selectedFormat}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DownloadVideoModal
