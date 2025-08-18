import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Upload, Video, Image } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { apiService } from '@/services/api'

interface UploadFormData {
  title: string
  description: string
  visibility: 'public' | 'unlisted' | 'private'
  category: string
}

const UploadPage = () => {
  const navigate = useNavigate()
  const [dragActive, setDragActive] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<UploadFormData>({
    defaultValues: {
      visibility: 'public',
      category: ''
    }
  })

  // File validation constants
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('🚀 Starting video upload...')
      const response = await apiService.publishVideo(formData)
      return response
    },
    onSuccess: (data) => {
      console.log('✅ Video uploaded successfully:', data)
      toast.success('Video uploaded successfully!')
      reset()
      setVideoFile(null)
      setThumbnailFile(null)
      navigate('/')
    },
    onError: (error: any) => {
      console.error('❌ Video upload failed:', error)
      toast.error(error.message || 'Failed to upload video')
    }
  })

  // File validation functions
  const validateVideoFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return 'Please select a valid video file (MP4, WebM, OGG, AVI, MOV)'
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return `Video file size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`
    }
    return null
  }

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, WebP)'
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `Image file size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
    }
    return null
  }

  // Form submission handler
  const onSubmit = async (data: UploadFormData) => {
    if (!videoFile) {
      toast.error('Please select a video file')
      return
    }

    if (!thumbnailFile) {
      toast.error('Please select a thumbnail image')
      return
    }

    // Validate files
    const videoError = validateVideoFile(videoFile)
    if (videoError) {
      toast.error(videoError)
      return
    }

    const thumbnailError = validateImageFile(thumbnailFile)
    if (thumbnailError) {
      toast.error(thumbnailError)
      return
    }

    // Create FormData
    const formData = new FormData()
    formData.append('videoFile', videoFile)
    formData.append('thumbnail', thumbnailFile)
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('visibility', data.visibility)
    formData.append('category', data.category)

    uploadMutation.mutate(formData)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const error = validateVideoFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setVideoFile(file)
      toast.success('Video file selected successfully!')
    }
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎬 Video file change event triggered')
    const file = e.target.files?.[0]
    console.log('🎬 Selected file:', file?.name, file?.size, file?.type)
    
    if (file) {
      const error = validateVideoFile(file)
      if (error) {
        console.log('❌ Video validation error:', error)
        toast.error(error)
        e.target.value = '' // Clear the input
        return
      }
      setVideoFile(file)
      console.log('✅ Video file set successfully')
      toast.success('Video file selected successfully!')
    } else {
      console.log('❌ No file selected')
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = validateImageFile(file)
      if (error) {
        toast.error(error)
        e.target.value = '' // Clear the input
        return
      }
      setThumbnailFile(file)
      toast.success('Thumbnail selected successfully!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Video</h1>
        <p className="text-gray-600 dark:text-gray-400">Share your content with the world</p>
      </div>

      {/* Upload Progress */}
      {uploadMutation.isPending && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Uploading your video...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This may take a few minutes depending on file size
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Upload */}
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {videoFile ? (
                <div className="space-y-4">
                  <Video className="w-12 h-12 text-brand-primary mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{videoFile.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setVideoFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Drag and drop your video here
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      or click to browse files
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={uploadMutation.isPending}
                      id="video-file-input"
                    />
                    <Button 
                      variant="primary" 
                      disabled={uploadMutation.isPending}
                      onClick={() => {
                        console.log('🎬 Video file button clicked')
                        const input = document.getElementById('video-file-input') as HTMLInputElement
                        if (input) {
                          console.log('🎬 Triggering video file input click')
                          input.click()
                        } else {
                          console.error('❌ Video file input not found')
                        }
                      }}
                      type="button"
                    >
                      Select Video
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supported: MP4, WebM, OGG, AVI, MOV (max 100MB)
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thumbnail</h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                {thumbnailFile ? (
                  <div className="space-y-4">
                    <Image className="w-8 h-8 text-brand-primary mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{thumbnailFile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setThumbnailFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Image className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Upload thumbnail</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recommended: 1280x720 pixels
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        disabled={uploadMutation.isPending}
                        id="thumbnail-file-input"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={uploadMutation.isPending}
                        onClick={() => {
                          console.log('🖼️ Thumbnail file button clicked')
                          const input = document.getElementById('thumbnail-file-input') as HTMLInputElement
                          if (input) {
                            console.log('🖼️ Triggering thumbnail file input click')
                            input.click()
                          } else {
                            console.error('❌ Thumbnail file input not found')
                          }
                        }}
                        type="button"
                      >
                        Choose Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  {...register('title', {
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                  })}
                  className="input"
                  placeholder="Enter video title"
                  disabled={uploadMutation.isPending}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  {...register('description', {
                    maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
                  })}
                  className="input min-h-[120px] resize-none"
                  placeholder="Tell viewers about your video"
                  rows={5}
                  disabled={uploadMutation.isPending}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visibility
                </label>
                <select
                  {...register('visibility', { required: 'Please select visibility' })}
                  className="input"
                  disabled={uploadMutation.isPending}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
                {errors.visibility && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.visibility.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  {...register('category', { required: 'Please select a category' })}
                  className="input"
                  disabled={uploadMutation.isPending}
                >
                  <option value="">Select category</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="technology">Technology</option>
                  <option value="sports">Sports</option>
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={uploadMutation.isPending}
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={uploadMutation.isPending || !videoFile || !thumbnailFile}
              >
                {uploadMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  'Publish Video'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default UploadPage
