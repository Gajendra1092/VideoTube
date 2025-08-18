import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Flag, AlertTriangle } from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'

interface ReportVideoModalProps {
  videoId: string
  onClose: () => void
}

const ReportVideoModal = ({ videoId, onClose }: ReportVideoModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<'category' | 'details' | 'success'>('category')

  const reportCategories = [
    {
      id: 'spam',
      title: 'Spam or misleading',
      description: 'Content that is repetitive, misleading, or designed to deceive'
    },
    {
      id: 'harassment',
      title: 'Harassment or bullying',
      description: 'Content that targets individuals with harmful behavior'
    },
    {
      id: 'hate_speech',
      title: 'Hate speech',
      description: 'Content that promotes hatred against individuals or groups'
    },
    {
      id: 'violence',
      title: 'Violence or dangerous content',
      description: 'Content that depicts or promotes violence or dangerous activities'
    },
    {
      id: 'adult_content',
      title: 'Adult content',
      description: 'Sexually explicit or inappropriate content'
    },
    {
      id: 'copyright',
      title: 'Copyright infringement',
      description: 'Content that violates copyright laws'
    },
    {
      id: 'child_safety',
      title: 'Child safety',
      description: 'Content that may endanger the safety of minors'
    },
    {
      id: 'terrorism',
      title: 'Terrorism or extremism',
      description: 'Content that promotes terrorist activities or extremist views'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'Other policy violations not covered above'
    }
  ]

  const reportVideoMutation = useMutation({
    mutationFn: () => apiService.reportVideo(videoId, selectedCategory, description),
    onSuccess: () => {
      setStep('success')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit report')
    }
  })

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setStep('details')
  }

  const handleSubmitReport = () => {
    if (!description.trim()) {
      toast.error('Please provide a description')
      return
    }
    reportVideoMutation.mutate()
  }

  const renderCategoryStep = () => (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Flag className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Report video
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Help us understand what's wrong with this video
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {reportCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {category.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  )

  const renderDetailsStep = () => {
    const selectedCategoryData = reportCategories.find(cat => cat.id === selectedCategory)
    
    return (
      <>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('category')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCategoryData?.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Provide additional details
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please describe the issue in detail
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about why you're reporting this video..."
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description.length}/1000
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Before you report:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Make sure the content violates our community guidelines</li>
                  <li>Consider if this might be a misunderstanding</li>
                  <li>Reports are reviewed by our moderation team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <Button
            onClick={() => setStep('category')}
            variant="secondary"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmitReport}
            variant="primary"
            loading={reportVideoMutation.isPending}
            disabled={!description.trim() || reportVideoMutation.isPending}
            className="flex-1"
          >
            Submit Report
          </Button>
        </div>
      </>
    )
  }

  const renderSuccessStep = () => (
    <>
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flag className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Report submitted
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for helping keep our community safe. We'll review your report and take appropriate action if needed.
        </p>
        <Button
          onClick={onClose}
          variant="primary"
          className="w-full"
        >
          Done
        </Button>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header with close button (only for category step) */}
        {step === 'category' && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content based on current step */}
        {step === 'category' && renderCategoryStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
}

export default ReportVideoModal
