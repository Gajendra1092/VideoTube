import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscriptions.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id.toString();

    if (!channelId) {
        throw new ApiError(400, "Channel Id is required!");
    }

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id!");
    }

    const dashboard = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(channelId),
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"owner",
                foreignField:"channel",
                as:"subscriptions"
            }
        },{
            $group:{
                _id:"$owner",
                totalVideos:{$sum:1},
                totalLikes:{$sum:{$size:"$likes"}},
                totalSubscribers:{$sum:{$size:"$subscriptions"}},
                totalViews:{$sum:"$view"},
            }
        }
    ]);

    if (!dashboard || dashboard.length === 0) {
        throw new ApiError(404, "No stats found for this channel!");
    }

    // Debug logging
    console.log('📊 Dashboard stats:', {
        userId: req.user._id,
        stats: dashboard[0]
    });

    res.status(200).json(new ApiResponse(200, dashboard[0], "Channel stats fetched successfully!"));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id.toString();
    if (!channelId) {
        throw new ApiError(400, "Channel Id is required!");
    }

    const videos = await Video.find({
        owner:channelId
    })

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel!");
    }

    res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully!"));
})

export {
    getChannelStats, 
    getChannelVideos
    }