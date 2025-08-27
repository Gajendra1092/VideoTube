import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { VideoView } from "../models/videoView.models.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";

// Record a video view (one per user per video)
const recordVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    const sessionInfo = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        platform: req.body.platform || '',
        browser: req.body.browser || ''
    };

    // Ensure authentication (route is protected, but double-check here)
    if (!userId) {
        throw new ApiError(401, "Authentication required to record video view");
    }

    // Recording video view for authenticated user (removed sensitive logging)

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Valid video ID is required");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    try {
        // Try to create a new view record
        // If it already exists (unique constraint), it will throw an error
        const existingView = await VideoView.findOne({
            video: videoId,
            user: userId
        });

        if (existingView) {
            // User has already viewed this video
            return res.status(200).json(
                new ApiResponse(200, { alreadyViewed: true }, "View already recorded")
            );
        }

        // Create new view record
        const newView = await VideoView.create({
            video: videoId,
            user: userId,
            sessionInfo
        });

        // Increment video view count and get updated document
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { view: 1 } },
            { new: true }
        ).select('_id view');

        // New video view recorded successfully

        return res.status(201).json(
            new ApiResponse(201, {
                viewId: newView._id,
                newView: true,
                totalViews: updatedVideo?.view ?? null
            }, "Video view recorded successfully")
        );

    } catch (error) {
        console.error('❌ Error recording video view:', error);
        
        // If it's a duplicate key error, the user has already viewed this video
        if (error.code === 11000) {
            return res.status(200).json(
                new ApiResponse(200, { alreadyViewed: true }, "View already recorded")
            );
        }
        
        throw new ApiError(500, "Failed to record video view");
    }
});

// Get view statistics for a video
const getVideoViewStats = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Valid video ID is required");
    }

    try {
        const [video, viewStats] = await Promise.all([
            Video.findById(videoId).select('view title'),
            VideoView.aggregate([
                { $match: { video: new mongoose.Types.ObjectId(videoId) } },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: 1 },
                        uniqueViewers: { $addToSet: "$user" },
                        firstView: { $min: "$viewedAt" },
                        lastView: { $max: "$viewedAt" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalViews: 1,
                        uniqueViewers: { $size: "$uniqueViewers" },
                        firstView: 1,
                        lastView: 1
                    }
                }
            ])
        ]);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const stats = viewStats[0] || {
            totalViews: 0,
            uniqueViewers: 0,
            firstView: null,
            lastView: null
        };

        return res.status(200).json(
            new ApiResponse(200, {
                video: {
                    id: video._id,
                    title: video.title,
                    viewCount: video.view
                },
                stats
            }, "Video view statistics retrieved successfully")
        );

    } catch (error) {
        console.error('❌ Error getting video view stats:', error);
        throw new ApiError(500, "Failed to get video view statistics");
    }
});

export {
    recordVideoView,
    getVideoViewStats
};
