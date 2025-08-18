import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';
import { Notification, NotificationResponse } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;
  isDropdownOpen: boolean;
  
  // Actions
  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markSingleAsRead: (notificationId: string) => Promise<void>;
  deleteNotifications: (notificationIds: string[]) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  deleteSingleNotification: (notificationId: string) => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  toggleDropdown: () => void;
  
  // Real-time updates
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  
  // Polling
  startPolling: () => void;
  stopPolling: () => void;
  
  // Reset
  reset: () => void;
}

let pollingInterval: number | null = null;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasNextPage: false,
      currentPage: 1,
      totalPages: 1,
      isDropdownOpen: false,

      fetchNotifications: async (page = 1, unreadOnly = false) => {
        try {
          set({ isLoading: true });

          const response = await apiService.getNotifications({
            page,
            limit: 20,
            unreadOnly
          });

          if (response.success && response.data) {
            const notificationData = response.data as NotificationResponse;
            
            if (page === 1) {
              // Replace notifications for first page
              set({
                notifications: notificationData.docs,
                currentPage: notificationData.page,
                totalPages: notificationData.totalPages,
                hasNextPage: notificationData.hasNextPage,
                isLoading: false
              });
            } else {
              // Append notifications for subsequent pages
              set(state => ({
                notifications: [...state.notifications, ...notificationData.docs],
                currentPage: notificationData.page,
                totalPages: notificationData.totalPages,
                hasNextPage: notificationData.hasNextPage,
                isLoading: false
              }));
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({ isLoading: false });
          toast.error('Failed to fetch notifications');
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await apiService.getUnreadNotificationCount();
          
          if (response.success && response.data) {
            set({ unreadCount: (response.data as { count: number }).count });
          }
        } catch (error: any) {
          console.error('Error fetching unread count:', error);
          // Don't show error toast for count fetch failures
        }
      },

      markAsRead: async (notificationIds: string[]) => {
        try {
          const response = await apiService.markNotificationsAsRead(notificationIds);
          
          if (response.success) {
            set(state => ({
              notifications: state.notifications.map(notification =>
                notificationIds.includes(notification._id)
                  ? { ...notification, isRead: true }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - notificationIds.length)
            }));
          }
        } catch (error: any) {
          console.error('Error marking notifications as read:', error);
          toast.error('Failed to mark notifications as read');
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await apiService.markAllNotificationsAsRead();
          
          if (response.success) {
            set(state => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                isRead: true
              })),
              unreadCount: 0
            }));
            toast.success('All notifications marked as read');
          }
        } catch (error: any) {
          console.error('Error marking all notifications as read:', error);
          toast.error('Failed to mark all notifications as read');
        }
      },

      markSingleAsRead: async (notificationId: string) => {
        try {
          const response = await apiService.markSingleNotificationAsRead(notificationId);
          
          if (response.success) {
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification._id === notificationId
                  ? { ...notification, isRead: true }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - 1)
            }));
          }
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
          // Don't show error toast for single mark as read failures
        }
      },

      deleteNotifications: async (notificationIds: string[]) => {
        try {
          const response = await apiService.deleteNotifications(notificationIds);
          
          if (response.success) {
            set(state => {
              const deletedUnreadCount = state.notifications
                .filter(n => notificationIds.includes(n._id) && !n.isRead)
                .length;
              
              return {
                notifications: state.notifications.filter(
                  notification => !notificationIds.includes(notification._id)
                ),
                unreadCount: Math.max(0, state.unreadCount - deletedUnreadCount)
              };
            });
            toast.success('Notifications deleted');
          }
        } catch (error: any) {
          console.error('Error deleting notifications:', error);
          toast.error('Failed to delete notifications');
        }
      },

      deleteAllNotifications: async () => {
        try {
          const response = await apiService.deleteAllNotifications();
          
          if (response.success) {
            set({
              notifications: [],
              unreadCount: 0,
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false
            });
            toast.success('All notifications deleted');
          }
        } catch (error: any) {
          console.error('Error deleting all notifications:', error);
          toast.error('Failed to delete all notifications');
        }
      },

      deleteSingleNotification: async (notificationId: string) => {
        try {
          const response = await apiService.deleteSingleNotification(notificationId);
          
          if (response.success) {
            set(state => {
              const notification = state.notifications.find(n => n._id === notificationId);
              const wasUnread = notification && !notification.isRead;
              
              return {
                notifications: state.notifications.filter(n => n._id !== notificationId),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
              };
            });
          }
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          toast.error('Failed to delete notification');
        }
      },

      setDropdownOpen: (open: boolean) => {
        set({ isDropdownOpen: open });
      },

      toggleDropdown: () => {
        set(state => ({ isDropdownOpen: !state.isDropdownOpen }));
      },

      addNotification: (notification: Notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
        }));
      },

      updateNotification: (notificationId: string, updates: Partial<Notification>) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, ...updates }
              : notification
          )
        }));
      },

      removeNotification: (notificationId: string) => {
        set(state => {
          const notification = state.notifications.find(n => n._id === notificationId);
          const wasUnread = notification && !notification.isRead;
          
          return {
            notifications: state.notifications.filter(n => n._id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          };
        });
      },

      startPolling: () => {
        // Stop existing polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        // Start new polling every 30 seconds
        pollingInterval = window.setInterval(() => {
          const { fetchUnreadCount } = get();
          fetchUnreadCount();
        }, 30000);
      },

      stopPolling: () => {
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
          pollingInterval = null;
        }
      },

      reset: () => {
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          hasNextPage: false,
          currentPage: 1,
          totalPages: 1,
          isDropdownOpen: false
        });
        
        // Stop polling when resetting
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        // Only persist unread count and dropdown state
        unreadCount: state.unreadCount,
        isDropdownOpen: false // Always start with dropdown closed
      })
    }
  )
);
