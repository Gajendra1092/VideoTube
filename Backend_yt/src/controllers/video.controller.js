import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import cloudinary from "cloudinary";
import { User } from "../models/user.models.js"
import NotificationService from "../services/notification.service.js"

function extractPublicId(url) {
    return url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/)[1];
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 30, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query

    const matchFilter = { isPublished: true }; // Only show published videos
    if (userId) {
        matchFilter.owner = new mongoose.Types.ObjectId(userId);
    }
    if (query) {
        matchFilter.title = { $regex: query, $options: "i" }; // Case-insensitive search
    }

    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;

    const video = await Video.aggregate([
        { $match: matchFilter },
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
                hasValidOwner: { $gt: [{ $size: "$owner" }, 0] }
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
                videoFile: 1,
                duration: 1,
                view: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
                // hasValidOwner field is excluded from final output
            }
        },
        { $sort: sort },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
    ]);

    // Count only videos with valid owners for accurate pagination
    const totalVideosResult = await Video.aggregate([
        { $match: matchFilter },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $match: {
                "owner.0": { $exists: true }
            }
        },
        {
            $count: "total"
        }
    ]);

    const totalVideos = totalVideosResult.length > 0 ? totalVideosResult[0].total : 0;

    // Debug logging (removed sensitive data)

    return res.status(200).json(new ApiResponse(200, {
        video,
        totalVideos,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalVideos / limit),
    }, "All videos fetched successfully!"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;

    // TODO: get video, upload to cloudinary, create video
    const videoFileLocalPath = req.files?.videoFile?.[0].path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
    
    if(!videoFileLocalPath){
        throw new ApiError(400, "Video is required!");
    };

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required!");
    };

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile){
        throw new ApiError(400, "Failed to upload videoFile");
    }
    if(!thumbnail){
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    const video = await Video.create({
         title,
         description,
         videoFile: videoFile?.secure_url || videoFile?.url, // Use secure_url for HTTPS
         thumbnail: thumbnail?.secure_url || thumbnail?.url, // Use secure_url for HTTPS
         duration: videoFile?.duration,
         owner: req.user._id,
    })
    // timestamps i will use later.
     
    if(!video){
        throw new ApiError(400, "Failed to create video");
    }

    // Create notification for video upload success
    try {
        await NotificationService.createVideoUploadNotification(video._id, req.user._id);
    } catch (notificationError) {
        console.error('Error creating video upload notification:', notificationError);
        // Don't fail the video upload operation if notification fails
    }

    return res.status(200).json(new ApiResponse(200, video, "Video Published successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(400, "Enter video Id");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
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
                            avatar: 1,
                            description: 1,
                            subscribersCount: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                hasValidOwner: { $gt: [{ $size: "$owner" }, 0] }
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
                videoFile: 1,
                duration: 1,
                view: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    if(!video || video.length === 0){
        throw new ApiError(404, "Video not found!");
    }

    return res.status(200).json(new ApiResponse(200, video[0], "Video fetched successfully!"));

})

//TODO: update video details like title, description
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Enter valid video Id");
    }

    const {newTitle, newDescription} = req.body;
    if(!(newTitle || newDescription)){
         throw new ApiError(400, "Fill atleast one section to update!");
    }
    
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video not found!");
    }

    video.title = newTitle;
    video.description = newDescription;
    const progress = await video.save({validateBeforeSave: false});

    if(!progress){
        throw new ApiError(400,"Updatation failed");
    }

    return res.status(200).json(new ApiResponse(200, progress, "Video details updated successfully!"));
})

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params // automatically extracted id from paramaters.
    //TODO: update video thumbnail

    if(!videoId){
        throw new ApiError(400, "Enter valid video Id");
    }

    const newThumbnailPath = req.file?.path

    if(!(newThumbnailPath)){
         throw new ApiError(400, "Thumbnail not found!");
    }
    
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video object not found!");
    }

    const url = video.thumbnail;
    console.log(url);
    const publicId = extractPublicId(url);
    console.log(publicId);

    const result = await cloudinary.v2.uploader.upload(newThumbnailPath,{
      public_id: publicId, // this ensures it's uploaded to the same path
      overwrite: true,     // this replaces the old asset
      invalidate: true     // optional: forces CDN to update
    });

    if(!result || !result.secure_url){
        throw new ApiError(400, "Failed to update thumbnail!");
    }
    // asset id will change but public id will remain same when overwritten.
    return res.status(200).json(new ApiResponse(200, result, "Thumbnail updated successfully!"));

})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(400, "Enter valid video Id");
    }
    
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video not found!");
    }

    const url_video = video.videoFile;
    console.log(url_video);
    const publicId_vid = extractPublicId(url_video);
    console.log(publicId_vid);

    const url_thumbnail = video.thumbnail;
    console.log(url_thumbnail);
    const publicId_thumb = extractPublicId(url_thumbnail);
    console.log(publicId_thumb);

    const delVideo = await cloudinary.v2.uploader.destroy(publicId_vid,{resource_type: 'video' });
    const delThumbnail = await cloudinary.v2.uploader.destroy(publicId_thumb);
    
    if (!delVideo || delVideo.result !== "ok") {
        throw new ApiError(400, `Error in deleting video from Cloudinary: ${delVideo.result}`);
    }

    if (!delThumbnail || delThumbnail.result !== "ok") {
        throw new ApiError(400, `Error in deleting thumbnail from Cloudinary: ${delThumbnail.result}`);
    }
    
    const deleted = await video.deleteOne();
    if(!deleted){
        throw new ApiError(400, "Video not deleted from database!");
    }

    return res.status(200).json(new ApiResponse(200, delVideo,delThumbnail, "Video deleted successfully!"));

}) 

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);

    if(!videoId){
        throw new ApiError(400, "Enter valid video Id");
    }

    video.isPublished = true;
    await video.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, video, "Video is published!"));
    
})

// Test endpoint to manually increment view count for debugging
const incrementViewCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { count = 1 } = req.body;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Valid video ID is required");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { view: parseInt(count) } },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // View count incremented successfully

    return res.status(200).json(new ApiResponse(200, {
        videoId: video._id,
        title: video.title,
        newViewCount: video.view
    }, "View count incremented successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideoThumbnail,
    incrementViewCount
}

