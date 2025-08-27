import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { QUERY_KEYS, Comment, User } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CommentItem from './CommentItem'

interface CommentSectionProps {
  videoId: string
}

interface CommentFormData {
  text: string
}

interface ReplyFormData {
  text: string
}

const CommentSection = ({ videoId }: CommentSectionProps) => {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>()

  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm<ReplyFormData>()

  // Fetch comments
  const {
    data: commentsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.COMMENTS, videoId],
    queryFn: () => apiService.getVideoComments(videoId),
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: CommentFormData) => apiService.addComment(videoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] })
      reset()
      setShowCommentForm(false)
      toast.success('Comment added successfully!')
    },
    onError: (error) => {
      console.error('Comment submission error:', error)
      toast.error('Failed to add comment. Please try again.')
    },
  })

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: ({ data, parentCommentId }: { data: ReplyFormData; parentCommentId: string }) =>
      apiService.addComment(videoId, { text: data.text, parentCommentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] })
      resetReply()
      setReplyingTo(null)
      toast.success('Reply added successfully!')
    },
    onError: (error) => {
      console.error('Reply submission error:', error)
      toast.error('Failed to add reply. Please try again.')
    },
  })

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiService.toggleCommentLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] })
    },
  })

  // Dislike comment mutation
  const dislikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiService.toggleCommentDislike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] })
    },
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] })
    },
  })

  // Safely extract comments array and ensure it's always an array
  const comments = Array.isArray(commentsResponse?.data) ? commentsResponse.data : []

  const onSubmit = (data: CommentFormData) => {
    if (!isAuthenticated) return
    addCommentMutation.mutate(data)
  }

  const onSubmitReply = (data: ReplyFormData) => {
    if (!isAuthenticated || !replyingTo) return
    addReplyMutation.mutate({ data, parentCommentId: replyingTo })
  }

  const handleLikeComment = (commentId: string) => {
    if (!isAuthenticated) return
    likeCommentMutation.mutate(commentId)
  }

  const handleDislikeComment = (commentId: string) => {
    if (!isAuthenticated) return
    dislikeCommentMutation.mutate(commentId)
  }

  const handleDeleteComment = (commentId: string) => {
    if (!isAuthenticated) return
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

  const handleReply = (commentId: string) => {
    if (!isAuthenticated) return
    setReplyingTo(commentId)
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {comments.length} Comments
        </h3>
      </div>

      {/* Add comment form */}
      {isAuthenticated && (
        <div className="space-y-4">
          <div className="flex space-x-3">
            <Avatar
              src={user?.avatar}
              name={user?.fullName}
              size="sm"
            />
            <div className="flex-1">
              <textarea
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-light-primary dark:bg-dark-secondary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                rows={showCommentForm ? 3 : 1}
                onFocus={() => setShowCommentForm(true)}
                {...register('text', { required: 'Comment is required' })}
              />
              {errors.text && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.text.message}
                </p>
              )}
            </div>
          </div>

          {showCommentForm && (
            <div className="flex justify-end space-x-2 ml-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentForm(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit(onSubmit)}
                loading={addCommentMutation.isPending}
              >
                Comment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load comments. Please try again.
          </p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={user}
              isAuthenticated={isAuthenticated}
              onLike={handleLikeComment}
              onDislike={handleDislikeComment}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              onSubmitReply={(data, parentCommentId) =>
                addReplyMutation.mutate({ data, parentCommentId })
              }
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              expandedReplies={expandedReplies}
              toggleReplies={toggleReplies}
              isSubmittingReply={addReplyMutation.isPending}
            />
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center py-6 bg-light-secondary dark:bg-dark-secondary rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to leave a comment
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/auth/login'}
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommentSection
