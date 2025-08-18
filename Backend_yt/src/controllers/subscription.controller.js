import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscriptions.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import NotificationService from "../services/notification.service.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params
    const userId = req.user._id.toString();

    if(!channelId && !userId){
        throw new ApiError(400,"Give channel and user info!")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (existingSubscription) {
        // If already subscribed, unsubscribe (delete the subscription)
        await existingSubscription.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, { action: 'unsubscribed', isSubscribed: false }, "Unsubscribed successfully!")
        );
    }

    const subscriptionDocument = await Subscription.create({
        subscriber:userId,
        channel:channelId
    })

    if(!subscriptionDocument){
        throw new ApiError(400, "Error in subscribing!");
    }

    // Create notification for new subscription
    try {
        await NotificationService.createSubscriptionNotification(channelId, userId);
    } catch (notificationError) {
        // Don't fail the subscription operation if notification fails
    }

    res.status(200).json(new ApiResponse(200, { action: 'subscribed', isSubscribed: true, subscription: subscriptionDocument }, "Subscribed successfully!"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: new mongoose.Types.ObjectId(channelId),
                totalSubscribers: { $sum: 1 }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers[0] || { totalSubscribers: 0 },
            "Subscribers fetched successfully!"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const currentUserId = req.user._id.toString();

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber Id is required!");
    }

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber Id!");
    }

    // Get subscribed channels with detailed information
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $lookup: {
                from: "subscriptions",
                let: { channelId: "$channel" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$channel", "$$channelId"] }
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                as: "subscriberCount"
            }
        },
        {
            $lookup: {
                from: "videos",
                let: { channelId: "$channel" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$owner", "$$channelId"] },
                            isPublished: true
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1
                    }
                ],
                as: "latestVideo"
            }
        },
        {
            $lookup: {
                from: "videos",
                let: { channelId: "$channel" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$owner", "$$channelId"] },
                            isPublished: true
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                as: "videoCount"
            }
        },
        {
            $project: {
                _id: "$channelDetails._id",
                username: "$channelDetails.username",
                fullName: "$channelDetails.fullName",
                avatar: "$channelDetails.avatar",
                description: "$channelDetails.description",
                subscribersCount: {
                    $ifNull: [{ $arrayElemAt: ["$subscriberCount.count", 0] }, 0]
                },
                videosCount: {
                    $ifNull: [{ $arrayElemAt: ["$videoCount.count", 0] }, 0]
                },
                latestVideo: {
                    $arrayElemAt: ["$latestVideo", 0]
                },
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 }
        }
    ]);

    console.log(`📺 Subscribed channels fetched for user ${subscriberId}:`, {
        count: subscriptions.length,
        channels: subscriptions.map(sub => ({
            username: sub.username,
            subscribersCount: sub.subscribersCount,
            videosCount: sub.videosCount
        }))
    });

    res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "Subscribed channels fetched successfully!"
        )
    );
})

// controller to get recent videos from subscribed channels (one per channel)
const getSubscriptionFeed = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { page = 1, limit = 20 } = req.query;

    // Get most recent video from each subscribed channel (deduplication by channel)
    const subscriptionFeed = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                let: { channelId: "$channel" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$owner", "$$channelId"] },
                            isPublished: true
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1 // Get only the latest video per channel
                    }
                ],
                as: "latestVideo"
            }
        },
        {
            $unwind: {
                path: "$latestVideo",
                preserveNullAndEmptyArrays: false // Only include channels that have videos
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: "$latestVideo._id",
                title: "$latestVideo.title",
                description: "$latestVideo.description",
                thumbnail: "$latestVideo.thumbnail",
                videoFile: "$latestVideo.videoFile",
                duration: "$latestVideo.duration",
                view: "$latestVideo.view",
                createdAt: "$latestVideo.createdAt",
                channelId: "$channel", // Add channel ID for deduplication verification
                owner: {
                    _id: "$channelDetails._id",
                    username: "$channelDetails.username",
                    fullName: "$channelDetails.fullName",
                    avatar: "$channelDetails.avatar"
                }
            }
        },
        {
            $group: {
                _id: "$channelId", // Group by channel to ensure deduplication
                video: { $first: "$$ROOT" } // Take the first (most recent) video per channel
            }
        },
        {
            $replaceRoot: { newRoot: "$video" } // Replace the root with the video document
        },
        {
            $sort: { createdAt: -1 } // Sort by video upload date (most recent first)
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    // Verify deduplication
    const channelIds = subscriptionFeed.map(video => video.channelId.toString());
    const uniqueChannelIds = [...new Set(channelIds)];
    const isDeduplicated = channelIds.length === uniqueChannelIds.length;

    console.log(`📺 Subscription feed fetched for user ${userId}:`, {
        page: parseInt(page),
        limit: parseInt(limit),
        videosCount: subscriptionFeed.length,
        uniqueChannels: uniqueChannelIds.length,
        isDeduplicated: isDeduplicated,
        channels: subscriptionFeed.map(video => ({
            channelName: video.owner.fullName,
            videoTitle: video.title,
            uploadDate: video.createdAt
        }))
    });

    res.status(200).json(
        new ApiResponse(
            200,
            subscriptionFeed,
            "Subscription feed fetched successfully!"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscriptionFeed
}