import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import NotificationService from "../services/notification.service.js";
import { Notification } from "../models/notification.models.js";
import mongoose from "mongoose";

/**
 * Get notifications for the authenticated user
 */
const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    try {
        const notifications = await NotificationService.getUserNotifications(
            userId,
            parseInt(page),
            parseInt(limit),
            unreadOnly === 'true'
        );
        
        return res.status(200).json(
            new ApiResponse(200, notifications, "Notifications fetched successfully")
        );
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new ApiError(500, "Failed to fetch notifications");
    }
});

/**
 * Get unread notification count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const count = await NotificationService.getUnreadCount(userId);
        
        return res.status(200).json(
            new ApiResponse(200, { count }, "Unread count fetched successfully")
        );
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw new ApiError(500, "Failed to fetch unread count");
    }
});

/**
 * Mark specific notifications as read
 */
const markNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ApiError(400, "Notification IDs are required");
    }
    
    // Validate ObjectIds
    const validIds = notificationIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== notificationIds.length) {
        throw new ApiError(400, "Invalid notification IDs provided");
    }
    
    try {
        const result = await NotificationService.markNotificationsAsRead(validIds, userId);
        
        return res.status(200).json(
            new ApiResponse(200, { modifiedCount: result.modifiedCount }, "Notifications marked as read")
        );
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw new ApiError(500, "Failed to mark notifications as read");
    }
});

/**
 * Mark all notifications as read for the user
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
        
        return res.status(200).json(
            new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All notifications marked as read")
        );
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new ApiError(500, "Failed to mark all notifications as read");
    }
});

/**
 * Delete specific notifications
 */
const deleteNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ApiError(400, "Notification IDs are required");
    }
    
    // Validate ObjectIds
    const validIds = notificationIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== notificationIds.length) {
        throw new ApiError(400, "Invalid notification IDs provided");
    }
    
    try {
        const result = await NotificationService.deleteNotifications(validIds, userId);
        
        return res.status(200).json(
            new ApiResponse(200, { deletedCount: result.deletedCount }, "Notifications deleted successfully")
        );
    } catch (error) {
        console.error('Error deleting notifications:', error);
        throw new ApiError(500, "Failed to delete notifications");
    }
});

/**
 * Delete all notifications for the user
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const result = await Notification.deleteMany({ recipient: userId });
        
        return res.status(200).json(
            new ApiResponse(200, { deletedCount: result.deletedCount }, "All notifications deleted successfully")
        );
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        throw new ApiError(500, "Failed to delete all notifications");
    }
});

/**
 * Mark a single notification as read
 */
const markSingleAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }
    
    try {
        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        });
        
        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        
        if (!notification.isRead) {
            await notification.markAsRead();
        }
        
        return res.status(200).json(
            new ApiResponse(200, notification, "Notification marked as read")
        );
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new ApiError(500, "Failed to mark notification as read");
    }
});

/**
 * Delete a single notification
 */
const deleteSingleNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }
    
    try {
        const result = await Notification.deleteOne({
            _id: notificationId,
            recipient: userId
        });
        
        if (result.deletedCount === 0) {
            throw new ApiError(404, "Notification not found");
        }
        
        return res.status(200).json(
            new ApiResponse(200, null, "Notification deleted successfully")
        );
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw new ApiError(500, "Failed to delete notification");
    }
});

/**
 * Get notification preferences (placeholder for future implementation)
 */
const getNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // For now, return default preferences
    // In the future, this could be stored in user model or separate preferences model
    const defaultPreferences = {
        videoUpload: true,
        commentLikes: true,
        tweetLikes: true,
        commentReplies: true,
        newSubscriptions: true,
        videoComments: true,
        emailNotifications: false,
        pushNotifications: true
    };
    
    return res.status(200).json(
        new ApiResponse(200, defaultPreferences, "Notification preferences fetched successfully")
    );
});

/**
 * Update notification preferences (placeholder for future implementation)
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const preferences = req.body;
    
    // For now, just return the received preferences
    // In the future, this would update user preferences in database
    
    return res.status(200).json(
        new ApiResponse(200, preferences, "Notification preferences updated successfully")
    );
});

export {
    getUserNotifications,
    getUnreadCount,
    markNotificationsAsRead,
    markAllAsRead,
    deleteNotifications,
    deleteAllNotifications,
    markSingleAsRead,
    deleteSingleNotification,
    getNotificationPreferences,
    updateNotificationPreferences
};
