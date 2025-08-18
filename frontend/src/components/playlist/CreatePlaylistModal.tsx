import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Lock, Globe, EyeOff } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

interface CreatePlaylistModalProps {
  isOpen?: boolean
  onClose: () => void
  userId?: string
  initialVideoId?: string
  onSuccess?: () => void
}

const CreatePlaylistModal = ({ isOpen = true, onClose, userId, initialVideoId, onSuccess }: CreatePlaylistModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    privacy: 'public',
    thumbnail: '',
    videoIds: initialVideoId ? [initialVideoId] : []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const createPlaylistMutation = useMutation({
    mutationFn: (data: typeof formData) => apiService.createPlaylist(data),
    onSuccess: () => {
      toast.success('Playlist created successfully!')
      // Invalidate and refetch playlists
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS, userId] })
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_PLAYLISTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS] })

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      onClose()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create playlist')
    }
  })

  // Handle escape key press - moved before early return to fix hook order
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      privacy: 'public',
      thumbnail: '',
      videoIds: initialVideoId ? [initialVideoId] : []
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Playlist title is required'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Playlist description is required'
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      createPlaylistMutation.mutate(formData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can search for and view' },
    { value: 'unlisted', label: 'Unlisted', icon: EyeOff, description: 'Anyone with the link can view' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can view' }
  ]

  // Early return after all hooks have been called
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Playlist</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter playlist title"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter playlist description"
              maxLength={500}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-xs text-gray-500">{formData.description.length}/500 characters</p>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Privacy
            </label>
            <div className="space-y-2">
              {privacyOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.privacy === option.value
                        ? 'border-brand-primary bg-brand-primary bg-opacity-10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={formData.privacy === option.value}
                      onChange={(e) => handleInputChange('privacy', e.target.value)}
                      className="mt-1"
                    />
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Video Count Info */}
          {formData.videoIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <Plus className="w-4 h-4 inline mr-1" />
                {formData.videoIds.length} video{formData.videoIds.length !== 1 ? 's' : ''} will be added to this playlist
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={createPlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createPlaylistMutation.isPending}
              loading={createPlaylistMutation.isPending}
            >
              Create Playlist
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePlaylistModal
