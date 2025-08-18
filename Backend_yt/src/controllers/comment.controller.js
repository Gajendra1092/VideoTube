import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import NotificationService from "../services/notification.service.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(400, "Video Id is required!")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID!")
    }

    // Get current user ID safely (null if not authenticated)
    const currentUserId = req.user?._id || null

    // Fetch top-level comments with basic population
    const comments = await Comment.find({
        video: videoId,
        parentComment: null
    })
    .populate('owner', 'username fullName avatar')
    .sort({ createdAt: -1 })
    .lean()

    // For each comment, fetch likes and replies
    const commentsWithDetails = await Promise.all(comments.map(async (comment) => {
        // Get likes for this comment
        const likes = await Like.find({ comment: comment._id }).lean()

        // Get replies for this comment
        const replies = await Comment.find({ parentComment: comment._id })
            .populate('owner', 'username fullName avatar')
            .sort({ createdAt: 1 })
            .lean()

        // For each reply, get its likes
        const repliesWithLikes = await Promise.all(replies.map(async (reply) => {
            const replyLikes = await Like.find({ comment: reply._id }).lean()
            return {
                ...reply,
                likesCount: replyLikes.length,
                isLikedByUser: currentUserId ? replyLikes.some(like => like.likedBy.toString() === currentUserId.toString()) : false
            }
        }))

        return {
            ...comment,
            likesCount: likes.length,
            isLikedByUser: currentUserId ? likes.some(like => like.likedBy.toString() === currentUserId.toString()) : false,
            repliesCount: replies.length,
            replies: repliesWithLikes
        }
    }))
    console.log(`📝 Comments fetched for video ${videoId}:`, {
        count: commentsWithDetails.length,
        sampleComment: commentsWithDetails[0] ? {
            id: commentsWithDetails[0]._id,
            hasOwner: !!commentsWithDetails[0].owner,
            ownerData: commentsWithDetails[0].owner
        } : null
    });

    res.status(200).json(new ApiResponse(200, commentsWithDetails, "Comments fetched successfully!"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    if (!videoId) {
        throw new ApiError(400, "Video Id is required!")
    }

    const {text, parentCommentId} = req.body

    if (!text) {
        throw new ApiError(400, "Comment text is required!")
    }

    // Check if this is a reply to another comment
    let isReply = false
    let parentComment = null

    if (parentCommentId) {
        parentComment = await Comment.findById(parentCommentId)
        if (!parentComment) {
            throw new ApiError(404, "Parent comment not found!")
        }
        isReply = true
    }

    const comment = await Comment.create({
        content: text,
        video: videoId,
        owner: req.user._id,
        parentComment: parentCommentId || null,
        isReply: isReply
    })

    if (!comment) {
        throw new ApiError(500, "Unable to add comment!")
    }

    // Populate the comment with owner details for response
    const populatedComment = await Comment.findById(comment._id).populate('owner', '_id username fullName avatar')

    // Create notifications
    try {
        if (isReply && parentComment) {
            // Create notification for comment reply
            await NotificationService.createCommentReplyNotification(parentCommentId, comment._id, req.user._id);
        } else {
            // Create notification for new video comment
            await NotificationService.createVideoCommentNotification(videoId, comment._id, req.user._id);
        }
    } catch (notificationError) {
        console.error('Error creating comment notification:', notificationError);
        // Don't fail the comment operation if notification fails
    }

    res.status(201).json(new ApiResponse(201, populatedComment, isReply ? "Reply added successfully!" : "Comment added successfully!"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {text} = req.body
    
    if(!commentId) {
        throw new ApiError(400, "Comment Id is required!")
    }

    if (!text.trim()) {
        throw new ApiError(400, "Comment text is required!")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!")
    }

    comment.content = text;
    const progress = await comment.save();

    res.status(200).json(new ApiResponse(200, progress, "Comment updated successfully!"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment Id is required!")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!")
    }

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments!")
    }

    // Delete all replies to this comment if it's a parent comment
    if (!comment.isReply) {
        await Comment.deleteMany({ parentComment: commentId })
    }

    // Delete all likes associated with this comment
    await Like.deleteMany({ comment: commentId })

    const isDeleted = await comment.deleteOne();
    if (!isDeleted) {
        throw new ApiError(500, "Unable to delete comment!")
    }

    res.status(200).json(new ApiResponse(200, { deletedCommentId: commentId }, "Comment deleted successfully!"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }