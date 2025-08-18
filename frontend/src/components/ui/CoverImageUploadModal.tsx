import { useState, useRef } from 'react'
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { validateFileType, validateFileSize } from '@/utils'
import { toast } from 'react-hot-toast'

interface CoverImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  currentImage?: string
  isUploading?: boolean
}

const CoverImageUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  currentImage,
  isUploading = false
}: CoverImageUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (10MB)
    if (!validateFileSize(file, 10)) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
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
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await onUpload(selectedFile)
      handleClose()
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setDragActive(false)
    onClose()
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Update Cover Image
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Image */}
          {currentImage && !previewUrl && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Cover Image
              </label>
              <div className="w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={currentImage}
                  alt="Current cover"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview
              </label>
              <div className="w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedFile ? 'Change Image' : 'Upload New Cover Image'}
            </label>
            
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
              <div className="space-y-4">
                <div className="flex justify-center">
                  {selectedFile ? (
                    <Camera className="w-12 h-12 text-brand-primary" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Drag and drop your image here'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    or click to browse files
                  </p>
                </div>
                
                <Button
                  variant="secondary"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  type="button"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supported: JPEG, PNG, WebP (max 10MB)<br />
                  Recommended: 1920x480 pixels for best quality
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected File
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Uploading...</span>
              </div>
            ) : (
              'Update Cover Image'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CoverImageUploadModal
