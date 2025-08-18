import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweet } = req.body; // take tweet as string not object.
    const userId = req.user._id.toString();


    if (!tweet || tweet.trim() === ""){
        throw new ApiError(400, "Tweet content is required!");
    }

    const newTweet = await Tweet.create({
        owner: userId,
        tweet: tweet.trim(),
    })

    if(!newTweet){
        throw new ApiError(400, "Failed to create tweet!");
    }

    res.status(200).json(new ApiResponse(200, newTweet, "Tweet created successfully!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
   
    const { userId } = req.params;

    if(!userId){
        throw new ApiError(400, "User Id is required!");
    }

    const tweets = await Tweet.aggregate([{
        $match: {
            owner:new mongoose.Types.ObjectId(userId),
        }
    }
    ]);
    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully!"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { newtweet } = req.body; // take tweet as string not object.
    const {tweetId } = req.params;

    if(!newtweet || newtweet.trim() === ""){
        throw new ApiError(400, "Tweet content is required!");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400, "Tweet not found!");
    }

    tweet.tweet = newtweet.trim();
    await tweet.save({validateBeforeSave: false});
    
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully!"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
    if(!tweetId){
        throw new ApiError(400, "Enter a tweet Id!");
    }
    
    const delTweet = await Tweet.findByIdAndDelete(tweetId);
    if(!delTweet){
        throw new ApiError(400, "Tweet not found!");
    }

    res.status(200).json(new ApiResponse(200, delTweet, "Tweet deleted successfully!"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}