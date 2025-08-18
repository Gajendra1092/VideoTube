import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Helper function to update playlist thumbnail based on first video
const updatePlaylistThumbnail = async (playlistId) => {
    try {
        const playlist = await Playlist.findById(playlistId)
            .populate({
                path: 'videos.video',
                select: 'thumbnail',
                match: { isPublished: true }
            });

        if (!playlist) {
            console.log('❌ Playlist not found for thumbnail update:', playlistId);
            return;
        }

        // Get the first video's thumbnail
        let newThumbnail = null;
        if (playlist.videos.length > 0 && playlist.videos[0].video) {
            newThumbnail = playlist.videos[0].video.thumbnail;
        }

        // Update playlist thumbnail if it's different
        if (playlist.thumbnail !== newThumbnail) {
            playlist.thumbnail = newThumbnail;
            await playlist.save();
            console.log('🖼️ Playlist thumbnail updated:', { playlistId, newThumbnail });
        }
    } catch (error) {
        console.error('❌ Error updating playlist thumbnail:', error);
    }
};

const createPlaylist = asyncHandler(async (req, res) => {
    const {title, description, privacy = 'public', thumbnail = null, videoIds = []} = req.body;

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Playlist title is required!");
    }

    if (!description || description.trim() === "") {
        throw new ApiError(400, "Playlist description is required!");
    }

    // Validate privacy setting
    if (!['public', 'private', 'unlisted'].includes(privacy)) {
        throw new ApiError(400, "Invalid privacy setting!");
    }

    // check if playlist with same title already exists for this user
    const existingPlaylist = await Playlist.findOne({
        title: title.trim(),
        owner: req.user._id
    });

    if (existingPlaylist) {
        throw new ApiError(400, "Playlist with this title already exists!");
    }

    // Prepare videos array with proper structure
    const videosArray = [];
    if (videoIds && videoIds.length > 0) {
        for (const videoId of videoIds) {
            if (isValidObjectId(videoId)) {
                videosArray.push({
                    video: videoId,
                    addedAt: new Date()
                });
            }
        }
    }

    const playlistDocument = await Playlist.create({
        title: title.trim(),
        description: description.trim(),
        owner: req.user._id,
        privacy,
        thumbnail,
        videos: videosArray
    });

    if(!playlistDocument){
        throw new ApiError(400, "Error in creating playlist!");
    }

    // Update playlist thumbnail if videos were added during creation
    if (videosArray.length > 0) {
        await updatePlaylistThumbnail(playlistDocument._id);
    }

    // Populate the created playlist with video details
    const populatedPlaylist = await Playlist.findById(playlistDocument._id)
        .populate({
            path: 'videos.video',
            select: 'title thumbnail duration view createdAt',
            match: { isPublished: true }
        })
        .populate('owner', 'username fullName avatar');

    res.status(201).json(new ApiResponse(201, populatedPlaylist, "Playlist created successfully!"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc', search = '' } = req.query;

    if(!userId ){
        throw new ApiError(400, "User Id is required!");
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id!");
    }

    // Build match conditions
    const matchConditions = {
        owner: new mongoose.Types.ObjectId(userId)
    };

    // Add privacy filter - only show public playlists unless it's the owner
    const isOwner = req.user && req.user._id.toString() === userId;
    if (!isOwner) {
        matchConditions.privacy = 'public';
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
        matchConditions.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } }
        ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;

    const aggregationPipeline = [
        {
            $match: matchConditions
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos.video",
                foreignField: "_id",
                as: "populatedVideos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            view: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoCount: { $size: "$populatedVideos" },
                firstVideoThumbnail: {
                    $cond: {
                        if: { $ne: ["$thumbnail", null] },
                        then: "$thumbnail",
                        else: {
                            $cond: {
                                if: { $gt: [{ $size: "$populatedVideos" }, 0] },
                                then: { $arrayElemAt: ["$populatedVideos.thumbnail", 0] },
                                else: null
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                privacy: 1,
                thumbnail: 1,
                videoCount: 1,
                firstVideoThumbnail: 1,
                createdAt: 1,
                updatedAt: 1,
                videos: "$populatedVideos"
            }
        },
        {
            $sort: sortOptions
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: 'totalPlaylists',
            docs: 'playlists'
        }
    };

    const result = await Playlist.aggregatePaginate(
        Playlist.aggregate(aggregationPipeline),
        options
    );

    res.status(200).json(new ApiResponse(200, result, "User playlists fetched successfully!"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos.video',
            select: 'title description thumbnail duration view createdAt owner isPublished',
            match: { isPublished: true },
            populate: {
                path: 'owner',
                select: 'username fullName avatar'
            }
        })
        .populate('owner', 'username fullName avatar');

    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if playlist is private and user doesn't own it
    if (playlist.privacy === 'private' &&
        (!req.user || playlist.owner._id.toString() !== req.user._id.toString())) {
        throw new ApiError(403, "This playlist is private!");
    }

    // Add additional computed fields
    const playlistData = {
        ...playlist.toObject(),
        videoCount: playlist.videos.filter(v => v.video).length,
        totalDuration: playlist.videos.reduce((total, v) => {
            return total + (v.video ? v.video.duration : 0);
        }, 0),
        isOwner: req.user ? playlist.owner._id.toString() === req.user._id.toString() : false
    };

    res.status(200).json(new ApiResponse(200, playlistData, "Playlist fetched successfully!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }
    if(!videoId ){
        throw new ApiError(400, "Video Id is required!");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id!");
    }
    
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to modify this playlist!");
    }

    // check if video is already in playlist
    const videoExists = playlist.videos.some(v => v.video.toString() === videoId);
    if(videoExists){
        throw new ApiError(400, "Video already exists in playlist!");
    }

    // add video to playlist with proper structure
    playlist.videos.push({
        video: videoId,
        addedAt: new Date()
    });
    await playlist.save();

    res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully!"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }
    if(!videoId ){
        throw new ApiError(400, "Video Id is required!");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id!");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to modify this playlist!");
    }

    const videoExists = playlist.videos.some(v => v.video.toString() === videoId);
    if(!videoExists){
        throw new ApiError(400, "Video does not exist in playlist!");
    }

    // remove video from playlist
    playlist.videos = playlist.videos.filter(v => v.video.toString() !== videoId);
    await playlist.save();

    res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully!"))

})

// Toggle video in playlist (add if not present, remove if present)
const toggleVideoInPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    console.log('🔄 Toggling video in playlist:', { playlistId, videoId, userId: req.user._id });

    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }
    if(!videoId ){
        throw new ApiError(400, "Video Id is required!");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id!");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to modify this playlist!");
    }

    // Check if video exists in playlist
    const videoExists = playlist.videos.some(v => v.video.toString() === videoId);

    let action, message;

    if (videoExists) {
        // Remove video from playlist
        playlist.videos = playlist.videos.filter(v => v.video.toString() !== videoId);
        action = 'removed';
        message = "Video removed from playlist successfully!";
        console.log('✅ Video removed from playlist');
    } else {
        // Add video to playlist
        playlist.videos.push({
            video: videoId,
            addedAt: new Date()
        });
        action = 'added';
        message = "Video added to playlist successfully!";
        console.log('✅ Video added to playlist');
    }

    await playlist.save();

    // Update playlist thumbnail after video changes
    await updatePlaylistThumbnail(playlistId);

    res.status(200).json(new ApiResponse(200, {
        playlist,
        action,
        videoExists: !videoExists // New state after toggle
    }, message))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this playlist!");
    }

    await playlist.deleteOne()
    res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully!"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId ){
        throw new ApiError(400, "Playlist Id is required!");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id!");
    }
    if(!name || name.trim() === "" || !description || description.trim() === ""){
        throw new ApiError(400, "Playlist name or description is required!");
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this playlist!");
    }

    if(playlist.title === name.trim() && playlist.description === description.trim()){
        throw new ApiError(400, "No changes detected. Please modify the title or description.");
    }

    playlist.title = name.trim();
    playlist.description = description.trim();
    await playlist.save()

    // Return updated playlist with populated data
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos.video',
            select: 'title thumbnail duration view createdAt',
            match: { isPublished: true }
        })
        .populate('owner', 'username fullName avatar');

    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully!"));
})

const reorderPlaylistVideos = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { videoIds } = req.body; // Array of video IDs in new order

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required!");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id!");
    }

    if (!videoIds || !Array.isArray(videoIds)) {
        throw new ApiError(400, "Video IDs array is required!");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found!");
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to reorder this playlist!");
    }

    // Validate that all provided video IDs exist in the playlist
    const currentVideoIds = playlist.videos.map(v => v.video.toString());
    const providedVideoIds = videoIds.map(id => id.toString());

    if (currentVideoIds.length !== providedVideoIds.length) {
        throw new ApiError(400, "Video count mismatch!");
    }

    for (const videoId of providedVideoIds) {
        if (!currentVideoIds.includes(videoId)) {
            throw new ApiError(400, `Video ${videoId} not found in playlist!`);
        }
    }

    // Reorder videos maintaining the addedAt timestamps
    const reorderedVideos = [];
    for (const videoId of videoIds) {
        const existingVideo = playlist.videos.find(v => v.video.toString() === videoId.toString());
        if (existingVideo) {
            reorderedVideos.push(existingVideo);
        }
    }

    playlist.videos = reorderedVideos;
    await playlist.save();

    // Update playlist thumbnail after reordering (first video might have changed)
    await updatePlaylistThumbnail(playlistId);

    // Return updated playlist with populated videos
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos.video',
            select: 'title thumbnail duration view createdAt',
            match: { isPublished: true }
        })
        .populate('owner', 'username fullName avatar');

    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist videos reordered successfully!"));
});

const getPublicPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, sortBy = 'createdAt', sortType = 'desc', search = '' } = req.query;

    // Build match conditions for public playlists only
    const matchConditions = {
        privacy: 'public'
    };

    // Add search filter if provided
    if (search && search.trim() !== '') {
        matchConditions.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } }
        ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;

    const aggregationPipeline = [
        {
            $match: matchConditions
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
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
            $lookup: {
                from: "videos",
                localField: "videos.video",
                foreignField: "_id",
                as: "populatedVideos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            view: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoCount: { $size: "$populatedVideos" },
                firstVideoThumbnail: {
                    $cond: {
                        if: { $ne: ["$thumbnail", null] },
                        then: "$thumbnail",
                        else: {
                            $cond: {
                                if: { $gt: [{ $size: "$populatedVideos" }, 0] },
                                then: { $arrayElemAt: ["$populatedVideos.thumbnail", 0] },
                                else: null
                            }
                        }
                    }
                },
                owner: { $arrayElemAt: ["$ownerInfo", 0] }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                privacy: 1,
                thumbnail: 1,
                videoCount: 1,
                firstVideoThumbnail: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: sortOptions
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: 'totalPlaylists',
            docs: 'playlists'
        }
    };

    const result = await Playlist.aggregatePaginate(
        Playlist.aggregate(aggregationPipeline),
        options
    );

    res.status(200).json(new ApiResponse(200, result, "Public playlists fetched successfully!"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    toggleVideoInPlaylist,
    deletePlaylist,
    updatePlaylist,
    reorderPlaylistVideos,
    getPublicPlaylists
}