import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  MessageCircle,
  Heart,
  UserPlus,
  Upload,
  Loader2
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { Notification } from '@/types';
import Button from './Button';
import Avatar from './Avatar';
import {
  getNotificationNavigationUrl,
  shouldShowAvatar,
  getNotificationAriaLabel,
  formatTimeAgo
} from '@/utils/notificationNavigation';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown = ({ isOpen, onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    currentPage,
    fetchNotifications,
    markAllAsRead,
    markSingleAsRead,
    deleteSingleNotification,
    deleteAllNotifications
  } = useNotificationStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications(1);
    }
  }, [isOpen, isAuthenticated, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'video_upload_success':
        return <Upload className="w-4 h-4 text-green-500" />;
      case 'comment_like':
      case 'tweet_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment_reply':
      case 'video_comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'new_subscription':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'content_deletion':
        return <Trash2 className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };



  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markSingleAsRead(notification._id);
    }

    // Navigate to the relevant page using navigation utility
    const navigationUrl = getNotificationNavigationUrl(notification);
    navigate(navigationUrl);
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setShowDeleteConfirm(false);
  };

  const handleDeleteSingle = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteSingleNotification(notificationId);
  };

  const loadMoreNotifications = () => {
    if (hasNextPage && !isLoading) {
      fetchNotifications(currentPage + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="bg-brand-primary text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                aria-label={getNotificationAriaLabel(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {shouldShowAvatar(notification) && notification.sender?.avatar ? (
                      <Avatar
                        src={notification.sender.avatar}
                        name={notification.sender.fullName}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteSingle(notification._id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {hasNextPage && (
              <div className="p-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreNotifications}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Delete all notifications?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteAll}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
