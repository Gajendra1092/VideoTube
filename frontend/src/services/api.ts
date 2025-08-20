import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, ApiError } from '@/types';

class ApiService {
  private api: AxiosInstance;
  private isInitializing: boolean = false;

  constructor() {
    // Use environment variable for production, proxy for development
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

    this.api = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getTokenFromCookie();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        // Don't retry if it's already a retry or if it's a refresh token request
        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/refreshToken')) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, but don't force redirect here
            // Let the auth store handle the redirect properly
            console.log('Token refresh failed, auth state will be cleared');
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        const apiError: ApiError = error.response?.data || {
          statusCode: error.response?.status || 500,
          message: error.message || 'An unexpected error occurred',
          errors: [],
          success: false,
          data: null,
        };

        // Show error toast for user-facing errors (but not during initialization or for registration/login)
        if (!this.isInitializing && !originalRequest.url?.includes('/register') && !originalRequest.url?.includes('/login')) {
          if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
            toast.error(apiError.message);
          } else if (apiError.statusCode >= 500) {
            toast.error('Server error. Please try again later.');
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  private getTokenFromCookie(): string | null {
    // This would extract token from HTTP-only cookie
    // Since we can't access HTTP-only cookies from JS, 
    // the token will be sent automatically with requests
    return null;
  }

  private async refreshToken(): Promise<void> {
    try {
      await this.api.post('/users/refreshToken');
    } catch (error) {
      throw error;
    }
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    console.log('🌐 HTTP: Making GET request to:', url, 'with params:', params);
    try {
      const response = await this.api.get<ApiResponse<T>>(url, { params });
      console.log('🌐 HTTP: GET response received:', {
        url,
        status: response.status,
        dataExists: !!response.data
      });
      return response.data;
    } catch (error) {
      console.error('🌐 HTTP: GET request failed:', { url, error });
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url);
    return response.data;
  }

  // File upload method (POST)
  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // File upload method (PATCH)
  async uploadPatch<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Auth methods
  async login(credentials: { email?: string; username?: string; password: string }) {
    return this.post('/users/login', credentials);
  }

  async register(formData: FormData) {
    return this.upload('/users/register', formData);
  }

  async googleAuth(data: { fullName: string; email: string; avatar: string; googleId: string }) {
    return this.post('/users/google-auth', data);
  }

  async logout() {
    return this.post('/users/logout');
  }

  async getCurrentUser() {
    this.isInitializing = true;
    try {
      const result = await this.post('/users/current_user');
      return result;
    } finally {
      this.isInitializing = false;
    }
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.post('/users/changePassword', data);
  }

  // Email verification methods
  async sendVerificationEmail(email: string) {
    return this.post('/users/send-verification-email', { email });
  }

  async verifyEmail(token: string) {
    return this.post('/users/verify-email', { token });
  }

  async resendVerificationEmail(email: string) {
    return this.post('/users/resend-verification-email', { email });
  }

  // Username availability methods
  async checkUsernameAvailability(username: string) {
    return this.get(`/users/check-username/${encodeURIComponent(username)}`);
  }

  async getUsernameSuggestions(username: string) {
    return this.get(`/users/username-suggestions/${encodeURIComponent(username)}`);
  }

  async updateAccountDetails(data: { fullName: string; email: string }) {
    return this.patch('/users/update_account_detail', data);
  }

  async updateAvatar(formData: FormData) {
    return this.uploadPatch('/users/avatar', formData);
  }

  async updateCoverImage(formData: FormData) {
    return this.uploadPatch('/users/coverImage', formData);
  }

  async getUserChannelProfile(username: string) {
    console.log('🌐 API: getUserChannelProfile called with username:', username);
    const url = `/users/channel/${username}`;
    console.log('🌐 API: Making GET request to:', url);

    try {
      const response = await this.get(url);
      console.log('🌐 API: getUserChannelProfile response:', {
        status: response.status,
        success: response.success,
        isSubscribed: response.data?.isSubscribed,
        subscribersCount: response.data?.subscribersCount
      });
      return response;
    } catch (error) {
      console.error('🌐 API: getUserChannelProfile error:', error);
      throw error;
    }
  }

  async getWatchHistory() {
    return this.patch('/users/watchHistory');
  }

  // Watch History methods
  async recordWatchHistory(videoId: string, watchProgress: number, deviceInfo?: any) {
    return this.post(`/watch-history/record/${videoId}`, {
      watchProgress,
      deviceInfo
    });
  }

  async getWatchHistoryList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    channelId?: string;
    completedOnly?: boolean
  }) {
    return this.get('/watch-history', params);
  }

  async getWatchHistoryStats() {
    return this.get('/watch-history/stats');
  }

  async clearWatchHistory() {
    return this.delete('/watch-history/clear');
  }

  async removeFromWatchHistory(videoId: string) {
    return this.delete(`/watch-history/remove/${videoId}`);
  }

  async pauseWatchHistory() {
    return this.patch('/watch-history/pause');
  }

  async resumeWatchHistory() {
    return this.patch('/watch-history/resume');
  }

  // Video View methods
  async recordVideoView(videoId: string, sessionInfo?: any) {
    return this.post(`/video-views/record/${videoId}`, sessionInfo || {});
  }

  async getVideoViewStats(videoId: string) {
    return this.get(`/video-views/stats/${videoId}`);
  }

  // Video methods
  async getAllVideos(params?: { page?: number; limit?: number; sortBy?: string; sortType?: string }) {
    return this.get('/videos', params);
  }

  async publishVideo(formData: FormData) {
    return this.upload('/videos', formData);
  }

  async getVideoById(videoId: string) {
    return this.get(`/videos/${videoId}`);
  }

  async getUserVideos(params?: { page?: number; limit?: number; sortBy?: string; sortType?: string }) {
    return this.get('/dashboard/videos', params);
  }

  async getChannelStats() {
    return this.get('/dashboard/stats');
  }

  // Playlist methods
  async createPlaylist(data: { title: string; description: string; privacy?: string; thumbnail?: string; videoIds?: string[] }) {
    return this.post('/playlist', data);
  }

  async getUserPlaylists(userId: string, params?: { page?: number; limit?: number; sortBy?: string; sortType?: string; search?: string }) {
    return this.get(`/playlist/user/${userId}`, params);
  }

  async getPublicPlaylists(params?: { page?: number; limit?: number; sortBy?: string; sortType?: string; search?: string }) {
    return this.get('/playlist/public', params);
  }

  async getPlaylistById(playlistId: string) {
    return this.get(`/playlist/${playlistId}`);
  }

  async updatePlaylist(playlistId: string, data: { name: string; description: string }) {
    return this.patch(`/playlist/${playlistId}`, data);
  }

  async deletePlaylist(playlistId: string) {
    return this.delete(`/playlist/${playlistId}`);
  }

  async addVideoToPlaylist(videoId: string, playlistId: string) {
    return this.patch(`/playlist/add/${videoId}/${playlistId}`);
  }

  async removeVideoFromPlaylist(videoId: string, playlistId: string) {
    return this.patch(`/playlist/remove/${videoId}/${playlistId}`);
  }

  async toggleVideoInPlaylist(videoId: string, playlistId: string) {
    return this.patch(`/playlist/toggle/${videoId}/${playlistId}`);
  }

  async reorderPlaylistVideos(playlistId: string, videoIds: string[]) {
    return this.patch(`/playlist/${playlistId}/reorder`, { videoIds });
  }

  // Channel information methods
  async updateChannelInfo(data: {
    description?: string;
    businessEmail?: string;
    location?: string;
    socialLinks?: {
      website?: string;
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      youtube?: string;
    };
  }) {
    return this.patch('/users/update-channel-info', data);
  }

  // Video Interaction methods

  // Watch Later
  async addToWatchLater(videoId: string) {
    return this.post(`/video-interactions/watch-later/${videoId}`);
  }

  async removeFromWatchLater(videoId: string) {
    return this.delete(`/video-interactions/watch-later/${videoId}`);
  }

  async getWatchLaterVideos(page = 1, limit = 10) {
    return this.get(`/video-interactions/watch-later?page=${page}&limit=${limit}`);
  }

  // Saved Videos
  async saveVideo(videoId: string, category = 'general', notes = '') {
    return this.post(`/video-interactions/saved/${videoId}`, { category, notes });
  }

  async unsaveVideo(videoId: string) {
    return this.delete(`/video-interactions/saved/${videoId}`);
  }

  async getSavedVideos(page = 1, limit = 10, category?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (category) params.append('category', category);
    return this.get(`/video-interactions/saved?${params}`);
  }

  // Video Reports
  async reportVideo(videoId: string, category: string, description: string) {
    return this.post(`/video-interactions/report/${videoId}`, { category, description });
  }

  // Video Status
  async getVideoInteractionStatus(videoId: string) {
    return this.get(`/video-interactions/status/${videoId}`);
  }

  // User Playlists for Video
  async getUserPlaylistsForVideo(videoId: string) {
    return this.get(`/video-interactions/playlists/${videoId}`);
  }

  // Admin methods
  async getVideoReports(page = 1, limit = 20, status?: string, category?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    return this.get(`/admin/reports?${params}`);
  }

  async reviewVideoReport(reportId: string, status: string, adminNotes?: string, actionTaken?: string) {
    return this.patch(`/admin/reports/${reportId}/review`, { status, adminNotes, actionTaken });
  }

  async getReportStatistics() {
    return this.get('/admin/reports/statistics');
  }

  async updateVideo(videoId: string, data: { title: string; description: string }) {
    return this.patch(`/videos/${videoId}`, data);
  }

  async deleteVideo(videoId: string) {
    return this.delete(`/videos/${videoId}`);
  }

  async updateVideoThumbnail(videoId: string, formData: FormData) {
    return this.upload(`/videos/${videoId}/updateThumbnail`, formData);
  }

  async togglePublishStatus(videoId: string) {
    return this.patch(`/videos/toggle/publish/${videoId}`);
  }

  // Comment methods
  async getVideoComments(videoId: string, params?: { page?: number; limit?: number }) {
    return this.get(`/comments/${videoId}`, params);
  }

  async addComment(videoId: string, data: { text: string; parentCommentId?: string }) {
    return this.post(`/comments/${videoId}`, data);
  }

  async updateComment(commentId: string, data: { text: string }) {
    return this.patch(`/comments/c/${commentId}`, data);
  }

  async deleteComment(commentId: string) {
    return this.delete(`/comments/c/${commentId}`);
  }

  // Like methods
  async toggleVideoLike(videoId: string) {
    return this.post(`/likes/toggle/v/${videoId}`);
  }

  async toggleVideoDislike(videoId: string) {
    return this.post(`/likes/dislike/v/${videoId}`);
  }

  async getVideoLikeStatus(videoId: string) {
    return this.get(`/likes/status/${videoId}`);
  }

  async toggleCommentLike(commentId: string) {
    return this.post(`/likes/toggle/c/${commentId}`);
  }

  async toggleCommentDislike(commentId: string) {
    return this.post(`/likes/dislike/c/${commentId}`);
  }

  // Download methods
  async getVideoDownloadInfo(videoId: string) {
    return this.get(`/download/info/${videoId}`);
  }

  async getVideoFormats(videoId: string) {
    return this.get(`/download/formats/${videoId}`);
  }

  async downloadVideo(videoId: string, format: string = 'mp4', quality: string = 'original') {
    const params = new URLSearchParams({ format, quality });
    const url = `${this.api.defaults.baseURL}/download/file/${videoId}?${params}`;

    try {
      // Fetch the file as a blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `video.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get the blob
      const blob = await response.blob();

      // Create download URL and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, filename };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async toggleTweetLike(tweetId: string) {
    return this.post(`/likes/toggle/t/${tweetId}`);
  }

  async getLikedVideos(page: number = 1, limit: number = 20) {
    return this.get(`/likes/videos?page=${page}&limit=${limit}`);
  }

  // Subscription methods
  async toggleSubscription(channelId: string) {
    return this.post(`/subDetail/c/${channelId}`);
  }

  async getUserChannelSubscribers(channelId: string) {
    return this.get(`/subDetail/c/${channelId}`);
  }

  async getSubscribedChannels(subscriberId: string) {
    return this.get(`/subDetail/u/${subscriberId}`);
  }

  async getSubscriptionFeed(params?: { page?: number; limit?: number }) {
    return this.get('/subDetail/feed', params);
  }

  // Tweet methods
  async createTweet(data: { tweet: string }) {
    return this.post('/tweets', data);
  }

  async getUserTweets(userId: string) {
    return this.get(`/tweets/user/${userId}`);
  }

  async updateTweet(tweetId: string, data: { tweet: string }) {
    return this.patch(`/tweets/${tweetId}`, data);
  }

  async deleteTweet(tweetId: string) {
    return this.delete(`/tweets/${tweetId}`);
  }

  // Dashboard methods
  async getChannelVideos() {
    return this.get('/dashboard/videos');
  }

  // Health check
  async healthCheck() {
    return this.get('/healthCheck');
  }

  // Search methods
  async globalSearch(params: {
    q: string;
    page?: number;
    limit?: number;
    type?: 'all' | 'videos' | 'channels';
    sortBy?: 'relevance' | 'date' | 'views' | 'subscribers';
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.get('/search', params);
  }

  async searchVideos(params: {
    q: string;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'views';
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.get('/search/videos', params);
  }

  async searchChannels(params: {
    q: string;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'subscribers';
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.get('/search/channels', params);
  }

  async getSearchSuggestions(params: {
    q: string;
    limit?: number;
  }) {
    return this.get('/search/suggestions', params);
  }

  // Notification methods
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}) {
    return this.get('/notifications', params);
  }

  async getUnreadNotificationCount() {
    return this.get('/notifications/unread-count');
  }

  async markNotificationsAsRead(notificationIds: string[]) {
    return this.patch('/notifications/mark-read', { notificationIds });
  }

  async markAllNotificationsAsRead() {
    return this.patch('/notifications/mark-all-read');
  }

  async markSingleNotificationAsRead(notificationId: string) {
    return this.patch(`/notifications/${notificationId}/mark-read`);
  }

  async deleteNotifications(notificationIds: string[]) {
    return this.api.delete('/notifications/delete', { data: { notificationIds } });
  }

  async deleteAllNotifications() {
    return this.delete('/notifications/delete-all');
  }

  async deleteSingleNotification(notificationId: string) {
    return this.delete(`/notifications/${notificationId}`);
  }

  async getNotificationPreferences() {
    return this.get('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: Record<string, boolean>) {
    return this.patch('/notifications/preferences', preferences);
  }

  // Privacy settings
  async getPrivacySettings() {
    return this.get('/users/privacy-settings');
  }

  async updatePrivacySettings(settings: { profileVisibility?: string; showEmail?: boolean }) {
    return this.patch('/users/privacy-settings', settings);
  }
}

export const apiService = new ApiService();
