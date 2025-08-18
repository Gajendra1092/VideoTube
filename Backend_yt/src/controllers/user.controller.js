import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {User} from "../models/user.models.js";
import {Video} from "../models/video.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import { Subscription } from "../models/subscriptions.models.js";

function extractPublicId(url) {
    return url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/)[1];
}

const generateRefreshTokenandAccessToken = async (userId) => {
   try{
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});
    return {accessToken, refreshToken};

}

catch(error){
        throw new ApiError(500, "Failed to generate tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get details from user.
    // validate the data - not empty.
    // check if user already exists from email and username.
    // check for images and avatar.
    // upload them to cloudinary.
    // create user object - create entry in db.
    // remove password and refresh token field from response.
    // check for user creation.
    // return response.

    const {fullName, email, username, password}  = req.body // from .body by express, we can have form data or other json datas as well. Data can be send through URl.
    
    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }
    
    // Check for existing email
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
        throw new ApiError(409, "An account with this email address already exists. Please use a different email or sign in to your existing account.");
    }

    // Check for existing username
    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
        throw new ApiError(409, "This username is already taken. Please choose a different username.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;     // .files is given by multer.
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;



    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    // Use placeholder if Cloudinary upload fails
    let avatarUrl;
    if (!avatar) {
        avatarUrl = 'https://via.placeholder.com/150x150.png?text=Avatar';
    } else {
        avatarUrl = avatar.url;
    }
    

    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }

    // Generate tokens for immediate login after registration
    const {accessToken, refreshToken} = await generateRefreshTokenandAccessToken(createdUser._id);

    const loggedInUser = await User.findById(createdUser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        sameSite: 'lax', // Allow cross-site requests
    } // making this cookie can only be modified only from server not from frontend.

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            loggedInUser,
            refreshToken,
            accessToken
        }, "User created and logged in successfully"));

})

const loginUser = asyncHandler(async (req, res) => {
     // get email and password from the user.
     // if email and password are correct then give them access token.
     // redirect them to home page.
     // return response.

    const {email, username,  password} = req.body;
    
    if(!(username || email)) {
        throw new ApiError(400, "Either username or email are required!");
    }

    if(!password){
        throw new ApiError(400, "Password is required!");
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    });
    
    
    if(!user){
        throw new ApiError(404, "User not found!");
    }
 
    const validUser = await user.isPasswordCorrect(password);

    if(!validUser){
        throw new ApiError(401, "Invalid creditials!");
    }

    const {accessToken, refreshToken} = await generateRefreshTokenandAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); // as previously user do not have the refresh token.
 

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        sameSite: 'lax', // Allow cross-site requests
    } // making this cookie can only be modified only from server not from frontend.

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200,{ loggedInUser,refreshToken,accessToken}, "User logged in successfully")); // sending accesstoken and refresh token in api response as well because it is a good practice and can be used in mobile applications.

})

const logOutUser = asyncHandler(async (req, res) => {
    // remove the refresh token from the user.
    // remove the refresh token from the cookie.
    // return response.

    await User.findByIdAndUpdate(req.user._id,
        {
         $set: {
            refreshToken : undefined,
         }
    },{
        new: true, // set the refresh token to undefined otherwise old value will be there.
    }

);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"));
    
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;
    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized request!!");
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);
    
        if(!user){
            throw new ApiError(401, "User not found! Invalid refresh token!");
        }
        
        if(incommingRefreshToken != user?.refreshToken){
            throw new ApiError(401, "Invalid or expired refresh token! ");
        }
    
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        }
    
        const {accessToken, new_refreshToken} = await generateRefreshTokenandAccessToken(user._id); 
    
        return res.status(200).cookie("accessToken",accessToken, options).cookie("refreshToken", new_refreshToken, options).json(new ApiResponse(200, {accessToken, new_refreshToken}, "Access token refreshed!"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token!");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body;

    if(!(oldPassword && newPassword)){
        throw new ApiError(400, "All fields are required!");
    }

    const user = await User.findById(req.user?._id);
    const correctPassword = await user.isPasswordCorrect(oldPassword);

    if(!correctPassword){
        throw new ApiError(400, "Invalid old password!");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully!"));

    // return res.status(200).redirect('/register');  
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User found!"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "At least one field is required!");
    }

    console.log('🔄 Updating account details for user:', req.user?._id);
    console.log('📝 New data:', { fullName, email });

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found!");
    }

    console.log('✅ User updated successfully:', updatedUser.fullName);

    return res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully!"));

}); // professionally we should have different controllers for text and image uploads.


const updateUserAvatar = asyncHandler(async(req, res) => {
    const currentAvatar = req.file?.path; // here only one file is present not files so file is written.
    if(!currentAvatar){
        throw new ApiError(400, "Avatar is required!");
    }
   
    // deleting the avatar
    const url = req.user.avatar;
    console.log(url);
    const publicId = extractPublicId(url);
    console.log(publicId);

    const delAvatar = await cloudinary.uploader.destroy(publicId);
    if(!delAvatar){
        console.log("Avatar not deleted!");
    }
    
    const avatar = await uploadOnCloudinary(currentAvatar);
    if(!avatar.url){
        throw new ApiError(400, "Failed to upload avatar!");
    }

    req.user.avatar = avatar.url;
    await req.user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, req.user, "Avatar updated successfully!"));

});


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const currentCoverImage = req.file?.path; // here only one file is present not files so file is written.
    if(!currentCoverImage){
        throw new ApiError(400, "Cover Image is required!");
    }

    const coverImage = await uploadOnCloudinary(currentCoverImage);
    if(!coverImage.url){
        throw new ApiError(400, "Failed to upload Cover Image!");
    }

    req.user.coverImage = coverImage.url;
    await req.user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, req.user, "Cover Image updated successfully!"));

});


const getUserChannelProfile = asyncHandler(async (req, res) => {
    console.log('🚨 getUserChannelProfile CALLED - THIS SHOULD APPEAR IN LOGS!');

    const {username} = req.params;
    if(!username){
        throw new ApiError(400, "Username is required!");
    }

    console.log('🔍 Fetching channel profile for username:', username);
    console.log('👤 Current user ID:', req.user?._id);

    // aggregation pipeline to get the channel profile.
    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    },{
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },{
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscriberTo"
        },
    },{
        $lookup: {
            from: "videos",
            localField: "_id",
            foreignField: "owner",
            as: "videos",
            pipeline: [
                {
                    $match: {
                        isPublished: true // Only include published videos
                    }
                },
                {
                    $sort: {
                        createdAt: -1 // Sort by newest first
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
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ]
        }
    },{
        $addFields:{
            subscribersCount: {$size: "$subscribers"},
            subscriberToCount: {$size: "$subscriberTo"},
            totalVideos: {$size: "$videos"},
            totalViews: {
                $sum: "$videos.view"
            },
            isSubscribed: {
                $cond: {
                    if: {
                        $and: [
                            { $ne: [req.user?._id, null] },
                            {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$subscribers",
                                                cond: { $eq: ["$$this.subscriber", req.user?._id] }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        ]
                    },
                    then: true,
                    else: false
                }
            },
        }
    },{
        $project: {
            fullName: 1,
            username: 1,
            avatar: 1,
            coverImage: 1,
            description: 1,
            socialLinks: 1,
            businessEmail: 1,
            location: 1,
            createdAt: 1,
            subscribersCount: 1,
            subscriberToCount: 1,
            totalVideos: 1,
            totalViews: 1,
            isSubscribed: 1,
            videos: 1,
        }
    }


]
);
   if(!channel?.length){
       throw new ApiError(404, "Channel not found!");
   }

   // Double-check subscription status with direct query to ensure consistency
   const directSubscriptionCheck = await Subscription.findOne({
       subscriber: req.user?._id,
       channel: channel[0]._id
   });

   const actualIsSubscribed = !!directSubscriptionCheck;

   console.log('🔍 Subscription status verification:', {
       aggregationResult: channel[0].isSubscribed,
       directQueryResult: actualIsSubscribed,
       match: channel[0].isSubscribed === actualIsSubscribed,
       userId: req.user?._id?.toString(),
       channelId: channel[0]._id?.toString(),
       directSubscriptionDoc: directSubscriptionCheck ? {
           id: directSubscriptionCheck._id?.toString(),
           subscriber: directSubscriptionCheck.subscriber?.toString(),
           channel: directSubscriptionCheck.channel?.toString()
       } : null
   });

   // Override aggregation result with direct query result for consistency
   channel[0].isSubscribed = actualIsSubscribed;

   console.log('✅ Channel profile found:', {
       username: channel[0].username,
       totalVideos: channel[0].totalVideos,
       videosCount: channel[0].videos?.length || 0,
       isSubscribed: channel[0].isSubscribed,
       subscribersCount: channel[0].subscribersCount,
       subscribersArray: channel[0].subscribers?.map(s => s.subscriber?.toString()) || []
   });

   return res.status(200).json(new ApiResponse(200, channel[0], "Channel found!"));

});


const getWatchHistory = asyncHandler(async (req, res) => {
      const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[{
                                $project:{
                                    username:1,
                                    fullName:1,
                                    avatar:1,
                                }
                            },{
                                $addFields:{
                                    owner:{
                                        $first: "$owner"
                                    }
                                }
                            }]
                        }
            }]
        }}
      ])
      return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history found!"));
});


const googleAuth = asyncHandler(async (req, res) => {
    const { fullName, email, avatar, googleId } = req.body;

    if (!fullName || !email || !googleId) {
        throw new ApiError(400, "Full name, email, and Google ID are required");
    }

    // Check if user already exists with this email or Google ID
    let user = await User.findOne({
        $or: [{ email }, { googleId }]
    });

    if (user) {
        // User exists, log them in
        console.log('✅ Existing Google user found, logging in:', user.email);

        const { accessToken, refreshToken } = await generateRefreshTokenandAccessToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        loggedInUser, accessToken, refreshToken, isExistingUser: true
                    },
                    "Account exists. Signing you in..."
                )
            );
    } else {
        // User doesn't exist, create new user
        console.log('🆕 Creating new Google user:', email);

        // Generate a unique username based on email
        let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;

        // Ensure username is unique
        while (await User.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        const newUser = await User.create({
            fullName,
            avatar: avatar || 'https://via.placeholder.com/150x150.png?text=Avatar', // Use Google avatar URL or placeholder
            email,
            username,
            googleId,
            password: Math.random().toString(36).substring(2, 15) // Random password for Google users
        });

        const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        const { accessToken, refreshToken } = await generateRefreshTokenandAccessToken(createdUser._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    201,
                    {
                        loggedInUser: createdUser, accessToken, refreshToken, isNewUser: true
                    },
                    "Account created successfully with Google"
                )
            );
    }
});

const updateChannelInfo = asyncHandler(async (req, res) => {
    const { description, businessEmail, location, socialLinks } = req.body;

    console.log('🔄 Updating channel info for user:', req.user._id);
    console.log('📝 New data:', { description, businessEmail, location, socialLinks });

    // Validate email format if provided
    if (businessEmail && businessEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(businessEmail.trim())) {
            throw new ApiError(400, "Invalid business email format!");
        }
    }

    // Validate social links format if provided
    if (socialLinks) {
        const urlRegex = /^https?:\/\/.+/;
        for (const [platform, url] of Object.entries(socialLinks)) {
            if (url && url.trim() !== '' && !urlRegex.test(url.trim())) {
                throw new ApiError(400, `Invalid URL format for ${platform}!`);
            }
        }
    }

    // Prepare update data
    const updateData = {};

    if (description !== undefined) {
        updateData.description = description.trim();
    }

    if (businessEmail !== undefined) {
        updateData.businessEmail = businessEmail.trim();
    }

    if (location !== undefined) {
        updateData.location = location.trim();
    }

    if (socialLinks) {
        updateData.socialLinks = {};
        for (const [platform, url] of Object.entries(socialLinks)) {
            updateData.socialLinks[platform] = url ? url.trim() : '';
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found!");
    }

    console.log('✅ Channel info updated successfully');

    return res.status(200).json(new ApiResponse(200, updatedUser, "Channel information updated successfully!"));
});

// Check username availability
const checkUsernameAvailability = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username || username.length < 3) {
        throw new ApiError(400, "Username must be at least 3 characters long");
    }

    // Check if username exists (case-insensitive)
    const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    const available = !existingUser;

    return res.status(200).json(new ApiResponse(200, { available }, available ? "Username is available" : "Username is taken"));
});

// Get username suggestions
const getUsernameSuggestions = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username || username.length < 3) {
        throw new ApiError(400, "Username must be at least 3 characters long");
    }

    const suggestions = [];
    const baseUsername = username.toLowerCase();

    // Generate suggestions with numbers
    for (let i = 1; i <= 10; i++) {
        const suggestion = `${baseUsername}${i}`;
        const exists = await User.findOne({
            username: { $regex: new RegExp(`^${suggestion}$`, 'i') }
        });

        if (!exists) {
            suggestions.push(suggestion);
            if (suggestions.length >= 3) break;
        }
    }

    // If we don't have enough suggestions, add some with random numbers
    if (suggestions.length < 3) {
        for (let i = 0; i < 5; i++) {
            const randomNum = Math.floor(Math.random() * 1000) + 100;
            const suggestion = `${baseUsername}${randomNum}`;

            const exists = await User.findOne({
                username: { $regex: new RegExp(`^${suggestion}$`, 'i') }
            });

            if (!exists && !suggestions.includes(suggestion)) {
                suggestions.push(suggestion);
                if (suggestions.length >= 3) break;
            }
        }
    }

    return res.status(200).json(new ApiResponse(200, { suggestions }, "Username suggestions generated"));
});

// Send verification email
const sendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // For now, we'll simulate email sending
    // In a real implementation, you would:
    // 1. Generate a verification token
    // 2. Save it to the database with expiration
    // 3. Send email with verification link

    console.log(`📧 Simulating verification email sent to: ${email}`);

    return res.status(200).json(new ApiResponse(200, {}, "Verification email sent successfully"));
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    // For now, we'll simulate email verification
    // In a real implementation, you would:
    // 1. Verify the token
    // 2. Check if it's not expired
    // 3. Update user's email verification status

    console.log(`✅ Simulating email verification for token: ${token}`);

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

// Resend verification email
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // For now, we'll simulate email resending
    console.log(`📧 Simulating verification email resent to: ${email}`);

    return res.status(200).json(new ApiResponse(200, {}, "Verification email resent successfully"));
});

// Update privacy settings
const updatePrivacySettings = asyncHandler(async (req, res) => {
    const { profileVisibility, showEmail } = req.body;

    if (profileVisibility && !['public', 'private'].includes(profileVisibility)) {
        throw new ApiError(400, "Profile visibility must be 'public' or 'private'");
    }

    if (showEmail !== undefined && typeof showEmail !== 'boolean') {
        throw new ApiError(400, "Show email must be a boolean value");
    }

    const updateData = {};
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (showEmail !== undefined) updateData.showEmail = showEmail;

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedUser, "Privacy settings updated successfully"));
});

// Get privacy settings
const getPrivacySettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("profileVisibility showEmail");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, {
        profileVisibility: user.profileVisibility || 'public',
        showEmail: user.showEmail || false
    }, "Privacy settings retrieved successfully"));
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    googleAuth,
    updateChannelInfo,
    checkUsernameAvailability,
    getUsernameSuggestions,
    sendVerificationEmail,
    verifyEmail,
    resendVerificationEmail,
    updatePrivacySettings,
    getPrivacySettings
};
