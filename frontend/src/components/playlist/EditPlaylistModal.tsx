import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Lock, Globe, EyeOff } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS, Playlist } from '@/types'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: Playlist
  userId: string
}

const EditPlaylistModal = ({ isOpen, onClose, playlist, userId }: EditPlaylistModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  // Initialize form data when playlist changes
  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.title || '',
        description: playlist.description || '',
        privacy: (playlist as any).privacy || 'public'
      })
    }
  }, [playlist])

  const updatePlaylistMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => 
      apiService.updatePlaylist(playlist._id, data),
    onSuccess: () => {
      toast.success('Playlist updated successfully!')
      // Invalidate and refetch playlists
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS, userId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLAYLIST_DETAILS, playlist._id] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update playlist')
    }
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Playlist title is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Title must be less than 100 characters'
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
      updatePlaylistMutation.mutate({
        name: formData.name,
        description: formData.description
      })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Playlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter playlist title"
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            <p className="mt-1 text-xs text-gray-500">{formData.name.length}/100 characters</p>
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

          {/* Privacy (Read-only for now - would need separate API endpoint to update privacy) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Privacy (Read-only)
            </label>
            <div className="space-y-2">
              {privacyOptions.map((option) => {
                const IconComponent = option.icon
                const isSelected = formData.privacy === option.value
                return (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 border rounded-lg ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary bg-opacity-10'
                        : 'border-gray-300 dark:border-gray-600 opacity-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={isSelected}
                      disabled
                      className="mt-1"
                    />
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Privacy settings cannot be changed after creation. Create a new playlist to use different privacy settings.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={updatePlaylistMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={updatePlaylistMutation.isPending}
              loading={updatePlaylistMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPlaylistModal
