import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleCommentDislike,
    toggleVideoLike,
    toggleVideoDislike,
    toggleTweetLike,
    getVideoLikeStatus
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// Public routes (no authentication required)
router.route("/status/:videoId").get(getVideoLikeStatus);

// Protected routes (authentication required)
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/dislike/v/:videoId").post(toggleVideoDislike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/dislike/c/:commentId").post(toggleCommentDislike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router