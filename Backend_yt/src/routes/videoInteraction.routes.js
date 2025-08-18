import { Router } from "express";
import {
    addToWatchLater,
    removeFromWatchLater,
    getWatchLaterVideos,
    saveVideo,
    unsaveVideo,
    getSavedVideos,
    reportVideo,
    getVideoInteractionStatus,
    getUserPlaylistsForVideo
} from "../controllers/videoInteraction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Watch Later routes
router.route("/watch-later").get(getWatchLaterVideos);
router.route("/watch-later/:videoId").post(addToWatchLater);
router.route("/watch-later/:videoId").delete(removeFromWatchLater);

// Saved Videos routes
router.route("/saved").get(getSavedVideos);
router.route("/saved/:videoId").post(saveVideo);
router.route("/saved/:videoId").delete(unsaveVideo);

// Video Report routes
router.route("/report/:videoId").post(reportVideo);

// Video interaction status
router.route("/status/:videoId").get(getVideoInteractionStatus);

// Get user playlists for video
router.route("/playlists/:videoId").get(getUserPlaylistsForVideo);

export default router;
