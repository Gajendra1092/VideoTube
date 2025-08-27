import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

// Global search that returns both videos and channels
const globalSearch = asyncHandler(async (req, res) => {
    const { 
        q: query, 
        page = 1, 
        limit = 20, 
        type = 'all', // 'all', 'videos', 'channels'
        sortBy = 'relevance', // 'relevance', 'date', 'views', 'subscribers'
        sortOrder = 'desc'
    } = req.query;

    if (!query || query.trim() === '') {
        throw new ApiError(400, "Search query is required");
    }

    const searchQuery = query.trim();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const userId = req.user?._id || null; // Get userId from authenticated user

    let results = {
        videos: [],
        channels: [],
        totalVideos: 0,
        totalChannels: 0,
        totalResults: 0,
        currentPage: pageNum,
        hasNextPage: false,
        hasPrevPage: pageNum > 1
    };

    // Search videos if type is 'all' or 'videos'
    if (type === 'all' || type === 'videos') {
        const videoResults = await searchVideosInternal(searchQuery, pageNum, limitNum, sortBy, sortOrder);
        results.videos = videoResults.videos;
        results.totalVideos = videoResults.total;
    }

    // Search channels if type is 'all' or 'channels'
    if (type === 'all' || type === 'channels') {
        const channelResults = await searchChannelsInternal(searchQuery, pageNum, limitNum, sortBy, sortOrder, userId);
        results.channels = channelResults.channels;
        results.totalChannels = channelResults.total;
    }

    // Calculate total results and pagination
    results.totalResults = results.totalVideos + results.totalChannels;
    
    if (type === 'all') {
        // For mixed results, show fewer of each type per page
        const videosPerPage = Math.floor(limitNum * 0.6); // 60% videos
        const channelsPerPage = Math.floor(limitNum * 0.4); // 40% channels
        
        results.videos = results.videos.slice(0, videosPerPage);
        results.channels = results.channels.slice(0, channelsPerPage);
        
        results.hasNextPage = results.totalResults > pageNum * limitNum;
    } else {
        const total = type === 'videos' ? results.totalVideos : results.totalChannels;
        results.hasNextPage = total > pageNum * limitNum;
    }

    console.log(`🔍 Global search completed for "${searchQuery}":`, {
        type,
        videosFound: results.videos.length,
        channelsFound: results.channels.length,
        totalResults: results.totalResults
    });

    return res.status(200).json(
        new ApiResponse(200, results, "Search completed successfully")
    );
});

// Internal function to search videos
const searchVideosInternal = async (query, page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc') => {
    const matchConditions = {
        isPublished: true,
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
        ]
    };

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
        case 'date':
            sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
            break;
        case 'views':
            sortOptions.view = sortOrder === 'asc' ? 1 : -1;
            break;
        case 'relevance':
        default:
            // For relevance, we'll sort by a combination of factors
            sortOptions = { 
                score: { $meta: 'textScore' },
                view: -1,
                createdAt: -1
            };
            break;
    }

    const pipeline = [
        { $match: matchConditions },
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
                owner: { $first: "$owner" },
                hasValidOwner: { $gt: [{ $size: "$owner" }, 0] },
                // Calculate relevance score
                relevanceScore: {
                    $add: [
                        // Title match gets higher score
                        { $cond: [{ $regexMatch: { input: "$title", regex: query, options: "i" } }, 10, 0] },
                        // Description match gets medium score
                        { $cond: [{ $regexMatch: { input: "$description", regex: query, options: "i" } }, 5, 0] },
                        // View count factor (normalized)
                        { $divide: ["$view", 1000] }
                    ]
                }
            }
        },
        {
            $match: {
                hasValidOwner: true
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                view: 1,
                owner: 1,
                createdAt: 1,
                relevanceScore: 1
            }
        }
    ];

    // Add sorting
    if (sortBy === 'relevance') {
        pipeline.push({ $sort: { relevanceScore: -1, view: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: sortOptions });
    }

    // Get total count
    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Video.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });

    const videos = await Video.aggregate(pipeline);

    return { videos, total };
};

// Internal function to search channels
const searchChannelsInternal = async (query, page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc', userId = null) => {
    const matchConditions = {
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    };

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
        case 'subscribers':
            sortOptions.subscribersCount = sortOrder === 'asc' ? 1 : -1;
            break;
        case 'date':
            sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
            break;
        case 'relevance':
        default:
            // For relevance, prioritize username matches, then fullName, then subscriber count
            sortOptions = { 
                relevanceScore: -1,
                subscribersCount: -1,
                createdAt: -1
            };
            break;
    }

    const pipeline = [
        { $match: matchConditions },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    { $match: { isPublished: true } },
                    { $count: "count" }
                ]
            }
        },
        // Add lookup for current user's subscription status
        ...(userId ? [{
            $lookup: {
                from: "subscriptions",
                let: { channelId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$channel", "$$channelId"] },
                                    { $eq: ["$subscriber", userId] }
                                ]
                            }
                        }
                    }
                ],
                as: "userSubscription"
            }
        }] : []),
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                videosCount: { $ifNull: [{ $first: "$videos.count" }, 0] },
                isSubscribed: userId ? { $gt: [{ $size: "$userSubscription" }, 0] } : false,
                // Calculate relevance score for channels
                relevanceScore: {
                    $add: [
                        // Username exact match gets highest score
                        { $cond: [{ $eq: [{ $toLower: "$username" }, query.toLowerCase()] }, 20, 0] },
                        // Username partial match gets high score
                        { $cond: [{ $regexMatch: { input: "$username", regex: query, options: "i" } }, 15, 0] },
                        // Full name match gets medium score
                        { $cond: [{ $regexMatch: { input: "$fullName", regex: query, options: "i" } }, 10, 0] },
                        // Description match gets low score
                        { $cond: [{ $regexMatch: { input: "$description", regex: query, options: "i" } }, 5, 0] },
                        // Subscriber count factor (normalized)
                        { $divide: [{ $size: "$subscribers" }, 100] }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                description: 1,
                subscribersCount: 1,
                videosCount: 1,
                createdAt: 1,
                relevanceScore: 1,
                isSubscribed: 1
            }
        }
    ];

    // Add sorting
    if (sortBy === 'relevance') {
        pipeline.push({ $sort: { relevanceScore: -1, subscribersCount: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: sortOptions });
    }

    // Get total count
    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });

    const channels = await User.aggregate(pipeline);

    return { channels, total };
};

// Dedicated video search endpoint
const searchVideos = asyncHandler(async (req, res) => {
    const { 
        q: query, 
        page = 1, 
        limit = 20, 
        sortBy = 'relevance', 
        sortOrder = 'desc'
    } = req.query;

    if (!query || query.trim() === '') {
        throw new ApiError(400, "Search query is required");
    }

    const results = await searchVideosInternal(query.trim(), parseInt(page), parseInt(limit), sortBy, sortOrder);
    
    const response = {
        videos: results.videos,
        total: results.total,
        currentPage: parseInt(page),
        hasNextPage: results.total > parseInt(page) * parseInt(limit),
        hasPrevPage: parseInt(page) > 1
    };

    return res.status(200).json(
        new ApiResponse(200, response, "Video search completed successfully")
    );
});

// Dedicated channel search endpoint
const searchChannels = asyncHandler(async (req, res) => {
    const { 
        q: query, 
        page = 1, 
        limit = 20, 
        sortBy = 'relevance', 
        sortOrder = 'desc'
    } = req.query;

    if (!query || query.trim() === '') {
        throw new ApiError(400, "Search query is required");
    }

    const userId = req.user?._id || null; // Get userId from authenticated user
    const results = await searchChannelsInternal(query.trim(), parseInt(page), parseInt(limit), sortBy, sortOrder, userId);
    
    const response = {
        channels: results.channels,
        total: results.total,
        currentPage: parseInt(page),
        hasNextPage: results.total > parseInt(page) * parseInt(limit),
        hasPrevPage: parseInt(page) > 1
    };

    return res.status(200).json(
        new ApiResponse(200, response, "Channel search completed successfully")
    );
});

// Get search suggestions (for autocomplete)
const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "No query provided")
        );
    }

    const searchQuery = query.trim();

    // Get video title suggestions
    const videoSuggestions = await Video.aggregate([
        {
            $match: {
                isPublished: true,
                title: { $regex: searchQuery, $options: 'i' }
            }
        },
        {
            $project: {
                title: 1,
                view: 1
            }
        },
        { $sort: { view: -1 } },
        { $limit: parseInt(limit) / 2 }
    ]);

    // Get channel name suggestions
    const channelSuggestions = await User.aggregate([
        {
            $match: {
                $or: [
                    { username: { $regex: searchQuery, $options: 'i' } },
                    { fullName: { $regex: searchQuery, $options: 'i' } }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                subscribersCount: { $size: "$subscribers" }
            }
        },
        { $sort: { subscribersCount: -1 } },
        { $limit: parseInt(limit) / 2 }
    ]);

    const suggestions = [
        ...videoSuggestions.map(v => ({ text: v.title, type: 'video' })),
        ...channelSuggestions.map(c => ({ text: c.username, type: 'channel' }))
    ].slice(0, parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, { suggestions }, "Search suggestions retrieved successfully")
    );
});

export {
    globalSearch,
    searchVideos,
    searchChannels,
    getSearchSuggestions
};
