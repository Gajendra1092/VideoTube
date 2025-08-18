import { Router } from "express";
import {
    recordVideoView,
    getVideoViewStats
} from "../controllers/videoView.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Record a video view
router.route("/record/:videoId").post(recordVideoView);

// Get view statistics for a video
router.route("/stats/:videoId").get(getVideoViewStats);

export default router;
