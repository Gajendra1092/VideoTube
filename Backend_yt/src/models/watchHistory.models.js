import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    watchProgress: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    },
    watchSessions: {
      type: Number,
      default: 1,
      min: 1
    },
    deviceInfo: {
      userAgent: {
        type: String,
        default: ""
      },
      platform: {
        type: String,
        default: ""
      },
      browser: {
        type: String,
        default: ""
      }
    },
    watchPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, lastWatchedAt: -1 });
watchHistorySchema.index({ user: 1, isCompleted: 1 });
watchHistorySchema.index({ user: 1, createdAt: -1 });

// Pre-save middleware to calculate watch percentage and completion status
watchHistorySchema.pre('save', async function(next) {
  if (this.isModified('watchProgress')) {
    try {
      // Get video duration to calculate percentage
      const video = await mongoose.model('Video').findById(this.video).select('duration');
      if (video && video.duration > 0) {
        this.watchPercentage = Math.min(100, (this.watchProgress / video.duration) * 100);
        
        // Mark as completed if watched 90% or more
        if (this.watchPercentage >= 90 && !this.isCompleted) {
          this.isCompleted = true;
          this.completedAt = new Date();
        }
      }
    } catch (error) {
      console.error('Error calculating watch percentage:', error);
    }
  }
  
  this.lastWatchedAt = new Date();
  next();
});

// Static method to get user's watch statistics
watchHistorySchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'videoDetails'
      }
    },
    { $unwind: '$videoDetails' },
    {
      $group: {
        _id: null,
        totalVideosWatched: { $sum: 1 },
        totalWatchTime: { $sum: '$watchProgress' },
        completedVideos: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        averageWatchPercentage: { $avg: '$watchPercentage' },
        totalWatchSessions: { $sum: '$watchSessions' },
        oldestWatch: { $min: '$createdAt' },
        latestWatch: { $max: '$lastWatchedAt' }
      }
    }
  ]);

  const result = stats[0] || {
    totalVideosWatched: 0,
    totalWatchTime: 0,
    completedVideos: 0,
    averageWatchPercentage: 0,
    totalWatchSessions: 0,
    oldestWatch: null,
    latestWatch: null
  };

  // Format total watch time
  const hours = Math.floor(result.totalWatchTime / 3600);
  const minutes = Math.floor((result.totalWatchTime % 3600) / 60);
  result.totalWatchTimeFormatted = `${hours}h ${minutes}m`;

  return result;
};

// Instance method to update watch progress
watchHistorySchema.methods.updateProgress = function(newProgress, deviceInfo = {}) {
  this.watchProgress = Math.max(this.watchProgress, newProgress);
  this.watchSessions += 1;
  
  if (deviceInfo.userAgent) this.deviceInfo.userAgent = deviceInfo.userAgent;
  if (deviceInfo.platform) this.deviceInfo.platform = deviceInfo.platform;
  if (deviceInfo.browser) this.deviceInfo.browser = deviceInfo.browser;
  
  return this.save();
};

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
