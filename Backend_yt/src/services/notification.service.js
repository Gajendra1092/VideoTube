import { Notification } from "../models/notification.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";

class NotificationService {
    
    /**
     * Create a video upload success notification
     */
    static async createVideoUploadNotification(videoId, userId) {
        try {
            const video = await Video.findById(videoId).populate('owner', 'username fullName');
            if (!video) return null;
            
            return await Notification.createNotification({
                recipient: userId,
                type: 'video_upload_success',
                title: 'Video Upload Successful',
                message: `Your video "${video.title}" has been uploaded successfully!`,
                relatedVideo: videoId,
                actionUrl: `/video/${videoId}`,
                context: {
                    videoTitle: video.title,
                    videoThumbnail: video.thumbnail
                }
            });
        } catch (error) {
            console.error('Error creating video upload notification:', error);
            return null;
        }
    }
    
    /**
     * Create a comment like notification
     */
    static async createCommentLikeNotification(commentId, likedByUserId) {
        try {
            const comment = await Comment.findById(commentId)
                .populate('owner', 'username fullName')
                .populate('video', 'title _id');
            
            if (!comment || !comment.owner || !comment.video) return null;
            
            const liker = await User.findById(likedByUserId, 'username fullName avatar');
            if (!liker) return null;
            
            return await Notification.createNotification({
                recipient: comment.owner._id,
                sender: likedByUserId,
                type: 'comment_like',
                title: 'Comment Liked',
                message: `${liker.fullName} liked your comment on "${comment.video.title}"`,
                relatedComment: commentId,
                actionUrl: `/video/${comment.video._id}?comment=${commentId}`,
                context: {
                    likerName: liker.fullName,
                    likerAvatar: liker.avatar,
                    videoTitle: comment.video.title,
                    videoId: comment.video._id,
                    commentContent: comment.content.substring(0, 100)
                }
            });
        } catch (error) {
            console.error('Error creating comment like notification:', error);
            return null;
        }
    }
    
    /**
     * Create a tweet like notification
     */
    static async createTweetLikeNotification(tweetId, likedByUserId) {
        try {
            const tweet = await Tweet.findById(tweetId).populate('owner', 'username fullName');
            if (!tweet || !tweet.owner) return null;
            
            const liker = await User.findById(likedByUserId, 'username fullName avatar');
            if (!liker) return null;
            
            return await Notification.createNotification({
                recipient: tweet.owner._id,
                sender: likedByUserId,
                type: 'tweet_like',
                title: 'Tweet Liked',
                message: `${liker.fullName} liked your tweet`,
                relatedTweet: tweetId,
                actionUrl: `/tweet/${tweetId}`,
                context: {
                    likerName: liker.fullName,
                    likerAvatar: liker.avatar,
                    tweetContent: tweet.tweet.substring(0, 100)
                }
            });
        } catch (error) {
            console.error('Error creating tweet like notification:', error);
            return null;
        }
    }
    
    /**
     * Create a comment reply notification
     */
    static async createCommentReplyNotification(parentCommentId, replyId, replierUserId) {
        try {
            const parentComment = await Comment.findById(parentCommentId)
                .populate('owner', 'username fullName')
                .populate('video', 'title _id');
            
            const reply = await Comment.findById(replyId);
            
            if (!parentComment || !reply || !parentComment.owner || !parentComment.video) return null;
            
            const replier = await User.findById(replierUserId, 'username fullName avatar');
            if (!replier) return null;
            
            return await Notification.createNotification({
                recipient: parentComment.owner._id,
                sender: replierUserId,
                type: 'comment_reply',
                title: 'New Reply',
                message: `${replier.fullName} replied to your comment on "${parentComment.video.title}"`,
                relatedComment: replyId,
                actionUrl: `/video/${parentComment.video._id}?comment=${parentCommentId}`,
                context: {
                    replierName: replier.fullName,
                    replierAvatar: replier.avatar,
                    videoTitle: parentComment.video.title,
                    videoId: parentComment.video._id,
                    originalComment: parentComment.content.substring(0, 100),
                    replyContent: reply.content.substring(0, 100)
                }
            });
        } catch (error) {
            console.error('Error creating comment reply notification:', error);
            return null;
        }
    }
    
    /**
     * Create a new subscription notification
     */
    static async createSubscriptionNotification(channelId, subscriberUserId) {
        try {
            const channel = await User.findById(channelId, 'username fullName avatar');
            const subscriber = await User.findById(subscriberUserId, 'username fullName avatar');
            
            if (!channel || !subscriber) return null;
            
            return await Notification.createNotification({
                recipient: channelId,
                sender: subscriberUserId,
                type: 'new_subscription',
                title: 'New Subscriber',
                message: `${subscriber.fullName} subscribed to your channel`,
                relatedChannel: channelId,
                actionUrl: `/channel/${channel.username}`,
                context: {
                    subscriberName: subscriber.fullName,
                    subscriberAvatar: subscriber.avatar,
                    subscriberUsername: subscriber.username
                }
            });
        } catch (error) {
            console.error('Error creating subscription notification:', error);
            return null;
        }
    }
    
    /**
     * Create a content deletion notification
     */
    static async createContentDeletionNotification(userId, contentType, contentTitle) {
        try {
            const user = await User.findById(userId, 'username fullName');
            if (!user) return null;
            
            const typeMap = {
                video: 'Video',
                comment: 'Comment',
                tweet: 'Tweet'
            };
            
            return await Notification.createNotification({
                recipient: userId,
                type: 'content_deletion',
                title: `${typeMap[contentType]} Deleted`,
                message: `Your ${contentType} "${contentTitle}" has been deleted successfully`,
                actionUrl: '/dashboard',
                context: {
                    contentType,
                    contentTitle
                }
            });
        } catch (error) {
            console.error('Error creating content deletion notification:', error);
            return null;
        }
    }
    
    /**
     * Create a video comment notification
     */
    static async createVideoCommentNotification(videoId, commentId, commenterUserId) {
        try {
            const video = await Video.findById(videoId).populate('owner', 'username fullName');
            const comment = await Comment.findById(commentId);
            
            if (!video || !comment || !video.owner) return null;
            
            const commenter = await User.findById(commenterUserId, 'username fullName avatar');
            if (!commenter) return null;
            
            return await Notification.createNotification({
                recipient: video.owner._id,
                sender: commenterUserId,
                type: 'video_comment',
                title: 'New Comment',
                message: `${commenter.fullName} commented on your video "${video.title}"`,
                relatedComment: commentId,
                actionUrl: `/video/${videoId}?comment=${commentId}`,
                context: {
                    commenterName: commenter.fullName,
                    commenterAvatar: commenter.avatar,
                    videoTitle: video.title,
                    videoId: videoId,
                    commentContent: comment.content.substring(0, 100)
                }
            });
        } catch (error) {
            console.error('Error creating video comment notification:', error);
            return null;
        }
    }
    
    /**
     * Get notifications for a user with pagination
     */
    static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        try {
            const matchConditions = { recipient: userId };
            if (unreadOnly) {
                matchConditions.isRead = false;
            }
            
            const aggregateQuery = Notification.aggregate([
                { $match: matchConditions },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sender',
                        foreignField: '_id',
                        as: 'senderInfo',
                        pipeline: [
                            { $project: { username: 1, fullName: 1, avatar: 1 } }
                        ]
                    }
                },
                {
                    $addFields: {
                        sender: { $arrayElemAt: ['$senderInfo', 0] }
                    }
                },
                { $unset: 'senderInfo' },
                { $sort: { createdAt: -1 } }
            ]);
            
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            
            return await Notification.aggregatePaginate(aggregateQuery, options);
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            throw error;
        }
    }
    
    /**
     * Mark notifications as read
     */
    static async markNotificationsAsRead(notificationIds, userId) {
        try {
            return await Notification.markMultipleAsRead(notificationIds, userId);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    }
    
    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId) {
        try {
            return await Notification.getUnreadCount(userId);
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
    
    /**
     * Delete notifications
     */
    static async deleteNotifications(notificationIds, userId) {
        try {
            return await Notification.deleteMany({
                _id: { $in: notificationIds },
                recipient: userId
            });
        } catch (error) {
            console.error('Error deleting notifications:', error);
            throw error;
        }
    }
}

export default NotificationService;
