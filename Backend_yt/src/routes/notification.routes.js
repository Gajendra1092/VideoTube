import { Router } from 'express';
import {
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
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Get user notifications with pagination and filtering
router.route("/").get(getUserNotifications);

// Get unread notification count
router.route("/unread-count").get(getUnreadCount);

// Mark multiple notifications as read
router.route("/mark-read").patch(markNotificationsAsRead);

// Mark all notifications as read
router.route("/mark-all-read").patch(markAllAsRead);

// Delete multiple notifications
router.route("/delete").delete(deleteNotifications);

// Delete all notifications
router.route("/delete-all").delete(deleteAllNotifications);

// Single notification operations
router.route("/:notificationId/mark-read").patch(markSingleAsRead);
router.route("/:notificationId").delete(deleteSingleNotification);

// Notification preferences (for future implementation)
router.route("/preferences").get(getNotificationPreferences);
router.route("/preferences").patch(updateNotificationPreferences);

export default router;
