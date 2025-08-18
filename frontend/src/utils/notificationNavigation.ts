import { Notification } from '@/types';

/**
 * Generate navigation URL based on notification type and metadata
 */
export const getNotificationNavigationUrl = (notification: Notification): string => {
  // If actionUrl is provided in metadata, use it directly
  if (notification.metadata.actionUrl) {
    return notification.metadata.actionUrl;
  }

  // Fallback navigation logic based on notification type
  switch (notification.type) {
    case 'video_upload_success':
      if (notification.relatedVideo) {
        return `/video/${notification.relatedVideo}`;
      }
      return '/dashboard';

    case 'comment_like':
      if (notification.relatedVideo && notification.relatedComment) {
        return `/video/${notification.relatedVideo}?comment=${notification.relatedComment}`;
      } else if (notification.relatedVideo) {
        return `/video/${notification.relatedVideo}`;
      }
      return '/dashboard';

    case 'tweet_like':
      if (notification.relatedTweet) {
        return `/tweet/${notification.relatedTweet}`;
      }
      return '/dashboard';

    case 'comment_reply':
      if (notification.relatedVideo && notification.relatedComment) {
        return `/video/${notification.relatedVideo}?comment=${notification.relatedComment}`;
      } else if (notification.relatedVideo) {
        return `/video/${notification.relatedVideo}`;
      }
      return '/dashboard';

    case 'video_comment':
      if (notification.relatedVideo && notification.relatedComment) {
        return `/video/${notification.relatedVideo}?comment=${notification.relatedComment}`;
      } else if (notification.relatedVideo) {
        return `/video/${notification.relatedVideo}`;
      }
      return '/dashboard';

    case 'new_subscription':
      if (notification.relatedChannel) {
        // Try to get username from context, fallback to channel ID
        const username = notification.metadata.context?.subscriberUsername;
        if (username) {
          return `/channel/${username}`;
        }
        return `/channel/${notification.relatedChannel}`;
      }
      return '/dashboard';

    case 'content_deletion':
      return '/dashboard';

    case 'system':
      return '/dashboard';

    default:
      return '/dashboard';
  }
};

/**
 * Get notification display priority (higher number = higher priority)
 */
export const getNotificationPriority = (notification: Notification): number => {
  switch (notification.type) {
    case 'video_upload_success':
      return 5;
    case 'new_subscription':
      return 4;
    case 'comment_reply':
      return 3;
    case 'video_comment':
      return 3;
    case 'comment_like':
      return 2;
    case 'tweet_like':
      return 2;
    case 'content_deletion':
      return 1;
    case 'system':
      return 1;
    default:
      return 0;
  }
};

/**
 * Get notification category for grouping
 */
export const getNotificationCategory = (notification: Notification): string => {
  switch (notification.type) {
    case 'video_upload_success':
      return 'uploads';
    case 'comment_like':
    case 'tweet_like':
      return 'likes';
    case 'comment_reply':
    case 'video_comment':
      return 'comments';
    case 'new_subscription':
      return 'subscriptions';
    case 'content_deletion':
      return 'content';
    case 'system':
      return 'system';
    default:
      return 'other';
  }
};

/**
 * Check if notification should show avatar
 */
export const shouldShowAvatar = (notification: Notification): boolean => {
  return notification.sender !== null && notification.type !== 'video_upload_success' && notification.type !== 'content_deletion' && notification.type !== 'system';
};

/**
 * Get notification action text for accessibility
 */
export const getNotificationActionText = (notification: Notification): string => {
  switch (notification.type) {
    case 'video_upload_success':
      return 'View uploaded video';
    case 'comment_like':
      return 'View liked comment';
    case 'tweet_like':
      return 'View liked tweet';
    case 'comment_reply':
      return 'View comment reply';
    case 'video_comment':
      return 'View video comment';
    case 'new_subscription':
      return 'View subscriber profile';
    case 'content_deletion':
      return 'Go to dashboard';
    case 'system':
      return 'View details';
    default:
      return 'View notification';
  }
};

/**
 * Format notification for screen readers
 */
export const getNotificationAriaLabel = (notification: Notification): string => {
  const timeAgo = formatTimeAgo(notification.createdAt);
  const actionText = getNotificationActionText(notification);
  const readStatus = notification.isRead ? 'read' : 'unread';
  
  return `${readStatus} notification: ${notification.title}. ${notification.message}. ${timeAgo}. ${actionText}`;
};

/**
 * Format time ago for notifications
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
};
