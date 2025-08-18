import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const notificationSchema = new Schema({
    // The user who will receive this notification
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    
    // The user who triggered this notification (optional for system notifications)
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    // Type of notification
    type: {
        type: String,
        enum: [
            'video_upload_success',
            'comment_like',
            'tweet_like', 
            'comment_reply',
            'content_deletion',
            'new_subscription',
            'video_comment',
            'system'
        ],
        required: true,
        index: true
    },
    
    // Notification title/heading
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    
    // Notification message/content
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    
    // Whether the notification has been read
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Related entities - only one should be populated per notification
    relatedVideo: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        default: null
    },
    
    relatedComment: {
        type: Schema.Types.ObjectId,
        ref: "Comment", 
        default: null
    },
    
    relatedTweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet",
        default: null
    },
    
    relatedChannel: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    // Additional metadata for navigation and context
    metadata: {
        // URL to navigate to when notification is clicked
        actionUrl: {
            type: String,
            default: null
        },
        
        // Additional context data
        context: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    
    // Expiry date for notifications (optional)
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// Index for cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add pagination plugin
notificationSchema.plugin(mongooseAggregatePaginate);

// Static method to create notification with proper validation
notificationSchema.statics.createNotification = async function(notificationData) {
    const {
        recipient,
        sender,
        type,
        title,
        message,
        relatedVideo,
        relatedComment,
        relatedTweet,
        relatedChannel,
        actionUrl,
        context = {},
        expiresAt
    } = notificationData;
    
    // Validate that only one related entity is provided
    const relatedEntities = [relatedVideo, relatedComment, relatedTweet, relatedChannel].filter(Boolean);
    if (relatedEntities.length > 1) {
        throw new Error('Only one related entity can be specified per notification');
    }
    
    // Don't send notification to self (except for system notifications)
    if (sender && recipient && sender.toString() === recipient.toString() && type !== 'system') {
        return null;
    }
    
    const notification = new this({
        recipient,
        sender,
        type,
        title,
        message,
        relatedVideo,
        relatedComment,
        relatedTweet,
        relatedChannel,
        metadata: {
            actionUrl,
            context
        },
        expiresAt
    });
    
    return await notification.save();
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    return await this.save();
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = async function(notificationIds, userId) {
    return await this.updateMany(
        { 
            _id: { $in: notificationIds },
            recipient: userId 
        },
        { isRead: true }
    );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false
    });
};

export const Notification = mongoose.model("Notification", notificationSchema);
