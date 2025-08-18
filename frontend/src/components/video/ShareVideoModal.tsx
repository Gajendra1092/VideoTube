import { useState } from 'react'
import { X, Copy, Check, Facebook, Twitter, MessageCircle, Mail, Link } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'

interface ShareVideoModalProps {
  videoId: string
  videoTitle: string
  videoUrl: string
  onClose: () => void
}

const ShareVideoModal = ({ videoId, videoTitle, videoUrl, onClose }: ShareVideoModalProps) => {
  const [copied, setCopied] = useState(false)
  const [includeTimestamp, setIncludeTimestamp] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Generate the full video URL
  const fullVideoUrl = videoUrl || `${window.location.origin}/watch/${videoId}`
  const shareUrl = includeTimestamp && currentTime > 0 
    ? `${fullVideoUrl}?t=${Math.floor(currentTime)}s`
    : fullVideoUrl

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(videoTitle)
    
    let shareLink = ''
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
        break
      case 'email':
        shareLink = `mailto:?subject=${encodedTitle}&body=Check out this video: ${shareUrl}`
        break
      default:
        return
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400')
  }

  const shareOptions = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-900/20'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-700'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share video
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Social sharing options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Share on social media
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSocialShare(option.id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${option.bgColor} hover:opacity-80 transition-opacity`}
                >
                  <option.icon className={`w-5 h-5 ${option.color}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy link section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Copy link
            </h3>
            
            {/* Timestamp option */}
            <div className="mb-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Start at current time
                </span>
              </label>
              
              {includeTimestamp && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseInt(e.target.value) || 0)}
                    placeholder="Time in seconds"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* URL display and copy */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                <div className="flex items-center space-x-2 min-w-0">
                  <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate min-w-0">
                    {shareUrl}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCopyLink}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1 flex-shrink-0 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Embed code section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Embed
            </h3>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                <span className="text-sm text-gray-600 dark:text-gray-300 block break-all">
                  {`<iframe src="${shareUrl}" width="560" height="315" frameborder="0"></iframe>`}
                </span>
              </div>

              <Button
                onClick={() => {
                  const embedCode = `<iframe src="${shareUrl}" width="560" height="315" frameborder="0"></iframe>`
                  navigator.clipboard.writeText(embedCode)
                  toast.success('Embed code copied!')
                }}
                variant="secondary"
                size="sm"
                className="flex items-center flex-shrink-0"
                title="Copy embed code"
              >
                <Copy className="w-4 h-4" />
                <span className="sr-only">Copy embed code</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShareVideoModal
