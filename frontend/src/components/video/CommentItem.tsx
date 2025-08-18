import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MoreVertical, ThumbsUp, ThumbsDown, Reply, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Comment, User } from '@/types'
import { formatRelativeTime } from '@/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

interface CommentItemProps {
  comment: Comment
  currentUser: User | null
  isAuthenticated: boolean
  onLike: (commentId: string) => void
  onDislike: (commentId: string) => void
  onDelete: (commentId: string) => void
  onReply: (commentId: string) => void
  onSubmitReply: (data: { text: string }, parentCommentId: string) => void
  replyingTo: string | null
  setReplyingTo: (commentId: string | null) => void
  expandedReplies: Set<string>
  toggleReplies: (commentId: string) => void
  isSubmittingReply: boolean
}

interface ReplyFormData {
  text: string
}

const CommentItem = ({
  comment,
  currentUser,
  isAuthenticated,
  onLike,
  onDislike,
  onDelete,
  onReply,
  onSubmitReply,
  replyingTo,
  setReplyingTo,
  expandedReplies,
  toggleReplies,
  isSubmittingReply
}: CommentItemProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormData>()

  // Safely handle comment owner
  const commentOwner = (typeof comment.owner === 'object' && comment.owner) ? comment.owner as User : null
  const ownerName = commentOwner?.fullName || commentOwner?.username || 'Anonymous User'
  const ownerAvatar = commentOwner?.avatar || undefined
  const ownerId = commentOwner?._id || (typeof comment.owner === 'string' ? comment.owner : '')

  // Check if current user owns this comment
  const isOwner = currentUser && ownerId === currentUser._id

  const handleReplySubmit = (data: ReplyFormData) => {
    onSubmitReply(data, comment._id)
    reset()
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    reset()
  }

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex space-x-3">
        <Avatar
          src={ownerAvatar}
          name={ownerName}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm text-gray-900 dark:text-white">
              {ownerName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {comment.content}
          </p>
          
          {/* Comment Actions */}
          <div className="flex items-center space-x-4">
            {/* Like and dislike buttons for all comments (both top-level and replies) */}
            <button
              type="button"
              onClick={() => onLike(comment._id)}
              disabled={!isAuthenticated}
              className={`flex items-center space-x-1 text-xs hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                comment.isLikedByUser
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likesCount || 0}</span>
            </button>

            <button
              type="button"
              onClick={() => onDislike(comment._id)}
              disabled={!isAuthenticated}
              className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Dislike</span>
            </button>

            {/* Reply button only for top-level comments (not replies) */}
            {!comment.isReply && !comment.parentComment && (
              <button
                type="button"
                onClick={() => onReply(comment._id)}
                disabled={!isAuthenticated}
                className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}
            
            {isOwner && (
              <button
                type="button"
                onClick={() => onDelete(comment._id)}
                className="flex items-center space-x-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                title="Delete comment"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment._id && (
            <div className="mt-3 space-y-3">
              <div className="flex space-x-3">
                <Avatar
                  src={currentUser?.avatar}
                  name={currentUser?.fullName}
                  size="sm"
                />
                <div className="flex-1">
                  <textarea
                    placeholder="Write a reply..."
                    className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[80px]"
                    rows={3}
                    {...register('text', { required: 'Reply is required' })}
                  />
                  {errors.text && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {errors.text.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 ml-12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelReply}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit(handleReplySubmit)}
                  loading={isSubmittingReply}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Show Replies Toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              type="button"
              onClick={() => toggleReplies(comment._id)}
              className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
            >
              {expandedReplies.has(comment._id) ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Hide {comment.replies.length} replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Show {comment.replies.length} replies</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment._id) && (
        <div className="ml-8 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              onLike={onLike}
              onDislike={onDislike}
              onDelete={onDelete}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              expandedReplies={expandedReplies}
              toggleReplies={toggleReplies}
              isSubmittingReply={isSubmittingReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem
