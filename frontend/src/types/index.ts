// API Response Types
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message: string;
  success: boolean;
}

// Utility type for unknown API responses
export type UnknownApiResponse = {
  data?: any;
  status?: number;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors: string[];
  success: false;
  data: null;
}

// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: string[];
  googleId?: string;
  isEmailVerified?: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  avatar: File;
  coverImage?: File;
}

export interface GoogleOAuthData {
  fullName: string;
  email: string;
  avatar: string;
  googleId: string;
}

// Video Types
export interface Video {
  _id: string;
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  view: number;
  isPublished: boolean;
  owner: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadData {
  title: string;
  description: string;
  videoFile: File;
  thumbnail: File;
}

// Comment Types
export interface Comment {
  _id: string;
  content: string;
  video: string;
  owner: User | string;
  createdAt: string;
  updatedAt: string;
  parentComment?: string;
  isReply?: boolean;
  likesCount?: number;
  repliesCount?: number;
  isLikedByUser?: boolean;
  replies?: Comment[];
}

// Like Types
export interface Like {
  _id: string;
  video?: string;
  comment?: string;
  tweet?: string;
  likedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Playlist Types
export interface Playlist {
  _id: string;
  title: string;
  description: string;
  owner: User | string;
  videos: Video[] | string[];
  privacy?: 'public' | 'private' | 'unlisted';
  thumbnail?: string;
  videoCount?: number;
  firstVideoThumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// Subscription Types
export interface Subscription {
  _id: string;
  subscriber: string;
  channel: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribedChannel {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  description?: string;
  subscribersCount: number;
  videosCount: number;
  subscribedAt: string;
  isNotificationsEnabled?: boolean;
  latestVideo?: {
    _id: string;
    title: string;
    thumbnail: string;
    createdAt: string;
    view: number;
    duration: number;
  };
}

// Tweet Types
export interface Tweet {
  _id: string;
  owner: User | string;
  tweet: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  recipient: string;
  sender?: User | null;
  type: 'video_upload_success' | 'comment_like' | 'tweet_like' | 'comment_reply' | 'content_deletion' | 'new_subscription' | 'video_comment' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedVideo?: string;
  relatedComment?: string;
  relatedTweet?: string;
  relatedChannel?: string;
  metadata: {
    actionUrl?: string;
    context: Record<string, any>;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  docs: Notification[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Dashboard Types
export interface ChannelStats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
}

// Channel Types
export interface Channel {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  coverImage?: string;
  description?: string;
  subscribersCount: number;
  totalVideos: number;
  totalViews?: number;
  isSubscribed?: boolean;
  videos?: Video[];
  createdAt: string;
  updatedAt: string;
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
}

// Video Interaction Types
export interface VideoInteractionStatus {
  isLiked: boolean;
  isDisliked: boolean;
  likeCount: number;
  dislikeCount: number;
  isInWatchLater: boolean;
  isSaved: boolean;
}

// Playlist Data Types
export interface PlaylistData {
  _id: string;
  title: string;
  description: string;
  owner: User;
  videos: Video[];
  privacy: 'public' | 'private' | 'unlisted';
  thumbnail?: string;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

// Search Types
export interface SearchSuggestion {
  _id: string;
  text: string;
  type: 'query' | 'channel' | 'video';
}

export interface SearchResults {
  videos: Video[];
  channels: Channel[];
  totalResults: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Download Types
export interface DownloadFormat {
  quality: string;
  format: string;
  size: string;
  url: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Watch History Types
export interface WatchHistoryItem {
  _id: string;
  video: Video;
  watchedAt: string;
  watchDuration?: number;
}

// API Response Types for specific endpoints
export interface VideosResponse {
  video: Video[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PlaylistsResponse {
  playlists: Playlist[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SubscriptionsResponse {
  subscriptions: SubscribedChannel[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface WatchHistoryResponse {
  watchHistory: WatchHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

export interface VideoFormatsResponse {
  formats: DownloadFormat[];
  title: string;
}

export interface ChannelResponse {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  coverImage?: string;
  description?: string;
  subscribersCount: number;
  totalVideos: number;
  totalViews?: number;
  isSubscribed: boolean;
  videos?: Video[];
  createdAt: string;
  updatedAt: string;
}

// Theme Types
export type Theme = 'light' | 'dark';

// Auth Store Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

// App Store Types
export interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// Query Keys
export const QUERY_KEYS = {
  VIDEOS: 'videos',
  VIDEO: 'video',
  USER: 'user',
  COMMENTS: 'comments',
  PLAYLISTS: 'playlists',
  PLAYLIST: 'playlist',
  USER_PLAYLISTS: 'user-playlists',
  PUBLIC_PLAYLISTS: 'public-playlists',
  PLAYLIST_DETAILS: 'playlist-details',
  LIKED_VIDEOS: 'liked-videos',
  SUBSCRIPTIONS: 'subscriptions',
  CHANNEL_STATS: 'channel-stats',
  CHANNEL_VIDEOS: 'channel-videos',
  TWEETS: 'tweets',
  SEARCH: 'search',
  // Video Interactions
  WATCH_LATER: 'watch-later',
  SAVED_VIDEOS: 'saved-videos',
  VIDEO_INTERACTION_STATUS: 'video-interaction-status',
  VIDEO_FORMATS: 'video-formats',
  USER_PLAYLISTS_FOR_VIDEO: 'user-playlists-for-video',
  WATCH_HISTORY: 'watch-history',
  // Admin
  ADMIN_REPORTS: 'admin-reports',
  ADMIN_REPORT_STATS: 'admin-report-stats',
  // Notifications
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_COUNT: 'notification-count',
} as const;
