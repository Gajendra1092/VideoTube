import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { WatchHistory } from "../models/watchHistory.models.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";

// Record or update watch history
const recordWatchHistory = asyncHandler(async (req, res) => {
  console.log('🎬 Recording watch history');
  
  const { videoId } = req.params;
  const { watchProgress, deviceInfo = {} } = req.body;
  const userId = req.user?._id;

  console.log('📊 Watch history data:', { videoId, watchProgress, deviceInfo, userId });

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video ID is required");
  }

  if (typeof watchProgress !== 'number' || watchProgress < 0) {
    throw new ApiError(400, "Valid watch progress is required");
  }

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  try {
    // Find existing watch history or create new one
    let watchHistory = await WatchHistory.findOne({
      user: userId,
      video: videoId
    });

    if (watchHistory) {
      // Update existing record
      console.log('📝 Updating existing watch history');
      await watchHistory.updateProgress(watchProgress, deviceInfo);
    } else {
      // Create new record
      console.log('🆕 Creating new watch history record');
      watchHistory = new WatchHistory({
        user: userId,
        video: videoId,
        watchProgress,
        deviceInfo
      });
      await watchHistory.save();
    }

    console.log('✅ Watch history recorded successfully');

    return res.status(200).json(
      new ApiResponse(200, watchHistory, "Watch history recorded successfully")
    );
  } catch (error) {
    console.error('❌ Error recording watch history:', error);
    throw new ApiError(500, "Failed to record watch history");
  }
});

// Get user's watch history with pagination and filters
const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const {
    page = 1,
    limit = 20,
    search = "",
    dateFrom,
    dateTo,
    channelId,
    completedOnly = false
  } = req.query;

  console.log('🔄 Fetching watch history:', {
    userId: userId.toString(),
    page,
    limit,
    search,
    filters: { dateFrom, dateTo, channelId, completedOnly }
  });

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build match conditions
  const matchConditions = { user: userId };

  // Date range filter
  if (dateFrom || dateTo) {
    matchConditions.lastWatchedAt = {};
    if (dateFrom) matchConditions.lastWatchedAt.$gte = new Date(dateFrom);
    if (dateTo) matchConditions.lastWatchedAt.$lte = new Date(dateTo);
  }

  // Completed videos filter
  if (completedOnly === 'true') {
    matchConditions.isCompleted = true;
  }

  // Build aggregation pipeline
  const pipeline = [
    { $match: matchConditions },
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
      $lookup: {
        from: 'users',
        localField: 'videoDetails.owner',
        foreignField: '_id',
        as: 'channelDetails'
      }
    },
    { $unwind: '$channelDetails' }
  ];

  // Add search filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'videoDetails.title': { $regex: search, $options: 'i' } },
          { 'videoDetails.description': { $regex: search, $options: 'i' } },
          { 'channelDetails.username': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Add channel filter
  if (channelId && mongoose.Types.ObjectId.isValid(channelId)) {
    pipeline.push({
      $match: { 'videoDetails.owner': new mongoose.Types.ObjectId(channelId) }
    });
  }

  // Add sorting and pagination
  pipeline.push(
    { $sort: { lastWatchedAt: -1 } },
    { $skip: skip },
    { $limit: limitNum }
  );

  // Add projection
  pipeline.push({
    $project: {
      _id: 1,
      watchProgress: 1,
      watchPercentage: 1,
      isCompleted: 1,
      lastWatchedAt: 1,
      createdAt: 1,
      watchSessions: 1,
      video: {
        _id: '$videoDetails._id',
        title: '$videoDetails.title',
        description: '$videoDetails.description',
        thumbnail: '$videoDetails.thumbnail',
        duration: '$videoDetails.duration',
        view: '$videoDetails.view',
        createdAt: '$videoDetails.createdAt'
      },
      channel: {
        _id: '$channelDetails._id',
        username: '$channelDetails.username',
        fullName: '$channelDetails.fullName',
        avatar: '$channelDetails.avatar'
      }
    }
  });

  try {
    const [watchHistory, totalCount] = await Promise.all([
      WatchHistory.aggregate(pipeline),
      WatchHistory.countDocuments(matchConditions)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.log('✅ Watch history fetched successfully:', {
      count: watchHistory.length,
      totalCount,
      totalPages
    });

    return res.status(200).json(
      new ApiResponse(200, {
        watchHistory,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      }, "Watch history fetched successfully")
    );
  } catch (error) {
    console.error('❌ Error fetching watch history:', error);
    throw new ApiError(500, "Failed to fetch watch history");
  }
});

// Get watch history statistics
const getWatchHistoryStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  console.log('📊 Fetching watch history stats for user:', userId.toString());

  try {
    const stats = await WatchHistory.getUserStats(userId);

    console.log('✅ Watch history stats fetched successfully:', stats);

    return res.status(200).json(
      new ApiResponse(200, stats, "Watch history statistics fetched successfully")
    );
  } catch (error) {
    console.error('❌ Error fetching watch history stats:', error);
    throw new ApiError(500, "Failed to fetch watch history statistics");
  }
});

// Clear all watch history
const clearWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  console.log('🗑️ Clearing watch history for user:', userId.toString());

  try {
    const result = await WatchHistory.deleteMany({ user: userId });

    console.log('✅ Watch history cleared successfully:', { deletedCount: result.deletedCount });

    return res.status(200).json(
      new ApiResponse(200, { deletedCount: result.deletedCount }, "Watch history cleared successfully")
    );
  } catch (error) {
    console.error('❌ Error clearing watch history:', error);
    throw new ApiError(500, "Failed to clear watch history");
  }
});

// Remove specific video from watch history
const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  console.log('🗑️ Removing video from watch history:', { videoId, userId: userId.toString() });

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Valid video ID is required");
  }

  try {
    const result = await WatchHistory.findOneAndDelete({
      user: userId,
      video: videoId
    });

    if (!result) {
      throw new ApiError(404, "Watch history entry not found");
    }

    console.log('✅ Video removed from watch history successfully');

    return res.status(200).json(
      new ApiResponse(200, {}, "Video removed from watch history successfully")
    );
  } catch (error) {
    console.error('❌ Error removing video from watch history:', error);
    throw new ApiError(500, "Failed to remove video from watch history");
  }
});

// Pause watch history tracking (user preference)
const pauseWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  console.log('⏸️ Pausing watch history for user:', userId.toString());

  // This would typically update a user preference
  // For now, we'll just return a success response
  return res.status(200).json(
    new ApiResponse(200, {}, "Watch history tracking paused")
  );
});

// Resume watch history tracking (user preference)
const resumeWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  console.log('▶️ Resuming watch history for user:', userId.toString());

  // This would typically update a user preference
  // For now, we'll just return a success response
  return res.status(200).json(
    new ApiResponse(200, {}, "Watch history tracking resumed")
  );
});

export {
  recordWatchHistory,
  getWatchHistory,
  getWatchHistoryStats,
  clearWatchHistory,
  removeFromWatchHistory,
  pauseWatchHistory,
  resumeWatchHistory
};
