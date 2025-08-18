import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Eye, CheckCircle, XCircle, AlertTriangle, Filter } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const AdminReportsPage = () => {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const statusOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'violence', label: 'Violence' },
    { value: 'adult_content', label: 'Adult Content' },
    { value: 'copyright', label: 'Copyright' },
    { value: 'child_safety', label: 'Child Safety' },
    { value: 'terrorism', label: 'Terrorism' },
    { value: 'other', label: 'Other' }
  ]

  // Fetch reports
  const {
    data: reportsData,
    isLoading,
    error
  } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_REPORTS, page, selectedStatus, selectedCategory],
    queryFn: () => apiService.getVideoReports(page, 20, selectedStatus === 'all' ? undefined : selectedStatus, selectedCategory === 'all' ? undefined : selectedCategory)
  })

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_REPORT_STATS],
    queryFn: () => apiService.getReportStatistics()
  })

  // Review report mutation
  const reviewReportMutation = useMutation({
    mutationFn: ({ reportId, status, adminNotes, actionTaken }: any) =>
      apiService.reviewVideoReport(reportId, status, adminNotes, actionTaken),
    onSuccess: () => {
      toast.success('Report reviewed successfully!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_REPORTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_REPORT_STATS] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to review report')
    }
  })

  const reports = reportsData?.data?.docs || []
  const stats = statsData?.data?.overview || {}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'reviewed': return 'text-blue-600 bg-blue-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'dismissed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spam': return 'text-orange-600 bg-orange-100'
      case 'harassment': return 'text-red-600 bg-red-100'
      case 'hate_speech': return 'text-purple-600 bg-purple-100'
      case 'violence': return 'text-red-700 bg-red-100'
      case 'adult_content': return 'text-pink-600 bg-pink-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleReviewReport = (reportId: string, status: string, actionTaken = 'none') => {
    reviewReportMutation.mutate({
      reportId,
      status,
      adminNotes: '',
      actionTaken
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Video Reports Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage reported content
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReports || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{stats.reviewedReports || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Reviewed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{stats.resolvedReports || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Resolved</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-600">{stats.dismissedReports || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Dismissed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(1)
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
          <p className="text-gray-600 dark:text-gray-400">No reports match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report: any) => (
            <div
              key={report._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={report.videoDetails?.thumbnail}
                    alt={report.videoDetails?.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {report.videoDetails?.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      by {report.videoDetails?.owner?.fullName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(report.category)}`}>
                        {report.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <div>Reported by {report.reporterDetails?.fullName}</div>
                  <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Description:</strong> {report.description}
                </p>
              </div>

              {report.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleReviewReport(report._id, 'reviewed')}
                    disabled={reviewReportMutation.isPending}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReviewReport(report._id, 'resolved', 'warning')}
                    disabled={reviewReportMutation.isPending}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolve</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReviewReport(report._id, 'dismissed')}
                    disabled={reviewReportMutation.isPending}
                    className="flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReportsPage
