import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';
import { QUERY_KEYS } from '@/types';

/**
 * Hook for managing notifications with real-time updates
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    currentPage,
    fetchNotifications,
    fetchUnreadCount,
    startPolling,
    stopPolling,
    reset
  } = useNotificationStore();

  // Query for notifications
  const notificationsQuery = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: () => apiService.getNotifications({ page: 1, limit: 20 }),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Query for unread count
  const unreadCountQuery = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_COUNT],
    queryFn: () => apiService.getUnreadNotificationCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  // Sync query data with store
  useEffect(() => {
    if (notificationsQuery.data?.success && notificationsQuery.data.data) {
      // Update store with fresh data from query
      // Note: This would require adding a method to sync external data to the store
      // For now, we'll rely on the store's own fetching mechanism
    }
  }, [notificationsQuery.data]);

  useEffect(() => {
    if (unreadCountQuery.data?.success && unreadCountQuery.data.data) {
      // Update store with fresh unread count
      // This would also require a sync method in the store
    }
  }, [unreadCountQuery.data]);

  // Handle authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
    } else {
      stopPolling();
      reset();
      // Clear queries
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] });
    }
  }, [isAuthenticated, startPolling, stopPolling, reset, queryClient]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    if (isAuthenticated) {
      await Promise.all([
        fetchNotifications(1),
        fetchUnreadCount(),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_COUNT] })
      ]);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount, queryClient]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (hasNextPage && !isLoading) {
      await fetchNotifications(currentPage + 1);
    }
  }, [hasNextPage, isLoading, currentPage, fetchNotifications]);

  // Mark notification as read and update cache
  const markAsReadWithCache = useCallback(async (notificationId: string) => {
    const { markSingleAsRead } = useNotificationStore.getState();
    await markSingleAsRead(notificationId);
    
    // Update query cache
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS], (oldData: any) => {
      if (!oldData?.data?.docs) return oldData;
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          docs: oldData.data.docs.map((notification: any) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        }
      };
    });

    // Update unread count cache
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATION_COUNT], (oldData: any) => {
      if (!oldData?.data?.count) return oldData;
      
      return {
        ...oldData,
        data: {
          count: Math.max(0, oldData.data.count - 1)
        }
      };
    });
  }, [queryClient]);

  // Delete notification and update cache
  const deleteNotificationWithCache = useCallback(async (notificationId: string) => {
    const { deleteSingleNotification } = useNotificationStore.getState();
    await deleteSingleNotification(notificationId);
    
    // Update query cache
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATIONS], (oldData: any) => {
      if (!oldData?.data?.docs) return oldData;
      
      const notification = oldData.data.docs.find((n: any) => n._id === notificationId);
      const wasUnread = notification && !notification.isRead;
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          docs: oldData.data.docs.filter((n: any) => n._id !== notificationId)
        }
      };
    });

    // Update unread count cache if notification was unread
    queryClient.setQueryData([QUERY_KEYS.NOTIFICATION_COUNT], (oldData: any) => {
      if (!oldData?.data?.count) return oldData;

      const notification = notifications.find(n => n._id === notificationId);
      const wasUnread = notification && !notification.isRead;

      return {
        ...oldData,
        data: {
          count: wasUnread ? Math.max(0, oldData.data.count - 1) : oldData.data.count
        }
      };
    });
  }, [queryClient, notifications]);

  return {
    // Data
    notifications,
    unreadCount,
    isLoading: isLoading || notificationsQuery.isLoading || unreadCountQuery.isLoading,
    hasNextPage,
    currentPage,
    
    // Actions
    refreshNotifications,
    loadMoreNotifications,
    markAsReadWithCache,
    deleteNotificationWithCache,
    
    // Query states
    isRefreshing: notificationsQuery.isFetching || unreadCountQuery.isFetching,
    error: notificationsQuery.error || unreadCountQuery.error
  };
};

/**
 * Hook for notification preferences
 */
export const useNotificationPreferences = () => {
  const { isAuthenticated } = useAuthStore();
  
  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiService.getNotificationPreferences(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updatePreferences = useCallback(async (preferences: Record<string, boolean>) => {
    if (!isAuthenticated) return;
    
    try {
      await apiService.updateNotificationPreferences(preferences);
      // Invalidate and refetch preferences
      preferencesQuery.refetch();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }, [isAuthenticated, preferencesQuery]);

  return {
    preferences: preferencesQuery.data?.data || {},
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    updatePreferences
  };
};

export default useNotifications;
