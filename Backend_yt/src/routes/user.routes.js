import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccountDetails, getUserChannelProfile, updateUserAvatar, updateUserCoverImage, getWatchHistory, googleAuth, updateChannelInfo, checkUsernameAvailability, getUsernameSuggestions, sendVerificationEmail, verifyEmail, resendVerificationEmail, updatePrivacySettings, getPrivacySettings } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { User } from "../models/user.models.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser);





router.route("/login").post(loginUser);
router.route("/google-auth").post(googleAuth);

//secured routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refreshToken").post(refreshAccessToken); // it only works one time after login.
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/current_user").post(verifyJWT, getCurrentUser);
router.route("/update_account_detail").patch(verifyJWT, updateAccountDetails); // patch to update only selected details not full account detail.
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); // cover image is also avatar in the database. So, we can use the same function to update the cover image.
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").patch(verifyJWT, getWatchHistory);
router.route("/update-channel-info").patch(verifyJWT, updateChannelInfo);

// Privacy settings routes (secured)
router.route("/privacy-settings").get(verifyJWT, getPrivacySettings);
router.route("/privacy-settings").patch(verifyJWT, updatePrivacySettings);

// Username availability routes (public)
router.route("/check-username/:username").get(checkUsernameAvailability);
router.route("/username-suggestions/:username").get(getUsernameSuggestions);

// Email verification routes (public)
router.route("/send-verification-email").post(sendVerificationEmail);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-verification-email").post(resendVerificationEmail);

export default router;