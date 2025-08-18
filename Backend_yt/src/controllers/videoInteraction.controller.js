import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { WatchLater } from "../models/watchLater.models.js";
import { SavedVideo } from "../models/savedVideo.models.js";
import { VideoReport } from "../models/videoReport.models.js";
import { Video } from "../models/video.models.js";
import { Playlist } from "../models/playlist.models.js";
import { Like } from "../models/like.models.js";
import mongoose, { isValidObjectId } from "mongoose";

// Watch Later functionality
const addToWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('🔄 Adding video to watch later:', { videoId, userId: req.user._id });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // Check if already in watch later
    const existingEntry = await WatchLater.findOne({
        user: req.user._id,
        video: videoId
    });

    if (existingEntry) {
        throw new ApiError(400, "Video already in watch later!");
    }

    // Add to watch later
    const watchLaterEntry = await WatchLater.create({
        user: req.user._id,
        video: videoId
    });

    console.log('✅ Video added to watch later successfully');

    return res.status(201).json(new ApiResponse(201, watchLaterEntry, "Video added to watch later successfully!"));
});

const removeFromWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('🔄 Removing video from watch later:', { videoId, userId: req.user._id });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    const watchLaterEntry = await WatchLater.findOneAndDelete({
        user: req.user._id,
        video: videoId
    });

    if (!watchLaterEntry) {
        throw new ApiError(404, "Video not found in watch later!");
    }

    console.log('✅ Video removed from watch later successfully');

    return res.status(200).json(new ApiResponse(200, null, "Video removed from watch later successfully!"));
});

const getWatchLaterVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    console.log('🔄 Fetching watch later videos for user:', req.user._id);

    const aggregateQuery = WatchLater.aggregate([
        {
            $match: {
                user: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $sort: {
                addedAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                addedAt: 1,
                video: "$videoDetails"
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const watchLaterVideos = await WatchLater.aggregatePaginate(aggregateQuery, options);

    console.log('✅ Watch later videos fetched successfully:', { count: watchLaterVideos.docs.length });

    return res.status(200).json(new ApiResponse(200, watchLaterVideos, "Watch later videos fetched successfully!"));
});

// Saved Videos functionality
const saveVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { category = 'general', notes = '' } = req.body;

    console.log('🔄 Saving video:', { videoId, userId: req.user._id, category });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // Check if already saved
    const existingEntry = await SavedVideo.findOne({
        user: req.user._id,
        video: videoId
    });

    if (existingEntry) {
        throw new ApiError(400, "Video already saved!");
    }

    // Save video
    const savedVideoEntry = await SavedVideo.create({
        user: req.user._id,
        video: videoId,
        category,
        notes: notes.trim()
    });

    console.log('✅ Video saved successfully');

    return res.status(201).json(new ApiResponse(201, savedVideoEntry, "Video saved successfully!"));
});

const unsaveVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('🔄 Unsaving video:', { videoId, userId: req.user._id });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    const savedVideoEntry = await SavedVideo.findOneAndDelete({
        user: req.user._id,
        video: videoId
    });

    if (!savedVideoEntry) {
        throw new ApiError(404, "Video not found in saved videos!");
    }

    console.log('✅ Video unsaved successfully');

    return res.status(200).json(new ApiResponse(200, null, "Video unsaved successfully!"));
});

const getSavedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;

    console.log('🔄 Fetching saved videos for user:', req.user._id);

    const matchStage = {
        user: req.user._id
    };

    if (category && category !== 'all') {
        matchStage.category = category;
    }

    const aggregateQuery = SavedVideo.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $sort: {
                addedAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                addedAt: 1,
                category: 1,
                notes: 1,
                video: "$videoDetails"
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const savedVideos = await SavedVideo.aggregatePaginate(aggregateQuery, options);

    console.log('✅ Saved videos fetched successfully:', { count: savedVideos.docs.length });

    return res.status(200).json(new ApiResponse(200, savedVideos, "Saved videos fetched successfully!"));
});

// Video Report functionality
const reportVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { category, description } = req.body;

    console.log('🔄 Reporting video:', { videoId, userId: req.user._id, category });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    if (!category || !description) {
        throw new ApiError(400, "Category and description are required!");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // Check if user already reported this video
    const existingReport = await VideoReport.findOne({
        video: videoId,
        reportedBy: req.user._id
    });

    if (existingReport) {
        throw new ApiError(400, "You have already reported this video!");
    }

    // Create report
    const report = await VideoReport.create({
        video: videoId,
        reportedBy: req.user._id,
        category,
        description: description.trim()
    });

    console.log('✅ Video reported successfully');

    return res.status(201).json(new ApiResponse(201, report, "Video reported successfully! Our team will review it."));
});

// Check video interaction status
const getVideoInteractionStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('🔄 Checking video interaction status:', { videoId, userId: req.user._id });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // Check all interaction statuses including likes/dislikes
    const [watchLaterEntry, savedVideoEntry, userPlaylists, likeInteraction, likeCount, dislikeCount] = await Promise.all([
        WatchLater.findOne({ user: req.user._id, video: videoId }),
        SavedVideo.findOne({ user: req.user._id, video: videoId }),
        Playlist.find({
            owner: req.user._id,
            'videos.video': videoId
        }).select('_id title'),
        Like.findOne({ likedBy: req.user._id, video: videoId }),
        Like.countDocuments({ video: videoId, type: 'like' }),
        Like.countDocuments({ video: videoId, type: 'dislike' })
    ]);

    const status = {
        isInWatchLater: !!watchLaterEntry,
        isSaved: !!savedVideoEntry,
        savedCategory: savedVideoEntry?.category || null,
        playlistsContaining: userPlaylists.map(playlist => ({
            _id: playlist._id,
            title: playlist.title
        })),
        // Like/dislike status
        isLiked: likeInteraction?.type === 'like' || false,
        isDisliked: likeInteraction?.type === 'dislike' || false,
        likeCount,
        dislikeCount
    };

    console.log('✅ Video interaction status fetched successfully');

    return res.status(200).json(new ApiResponse(200, status, "Video interaction status fetched successfully!"));
});

// Get user's playlists for adding videos
const getUserPlaylistsForVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('🔄 Fetching user playlists for video:', { videoId, userId: req.user._id });

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Valid video ID is required!");
    }

    // Get user's playlists with video status
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: req.user._id
            }
        },
        {
            $addFields: {
                containsVideo: {
                    $in: [new mongoose.Types.ObjectId(videoId), "$videos.video"]
                }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                privacy: 1,
                videoCount: 1,
                thumbnail: 1,
                containsVideo: 1,
                createdAt: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    console.log('✅ User playlists fetched successfully:', { count: playlists.length });

    return res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully!"));
});

export {
    addToWatchLater,
    removeFromWatchLater,
    getWatchLaterVideos,
    saveVideo,
    unsaveVideo,
    getSavedVideos,
    reportVideo,
    getVideoInteractionStatus,
    getUserPlaylistsForVideo
};
