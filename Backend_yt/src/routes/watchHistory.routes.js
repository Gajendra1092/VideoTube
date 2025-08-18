import { Router } from "express";
import {
  recordWatchHistory,
  getWatchHistory,
  getWatchHistoryStats,
  clearWatchHistory,
  removeFromWatchHistory,
  pauseWatchHistory,
  resumeWatchHistory
} from "../controllers/watchHistory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Record watch progress for a video
router.route("/record/:videoId").post(recordWatchHistory);

// Get user's watch history with pagination and filters
router.route("/").get(getWatchHistory);

// Get watch history statistics
router.route("/stats").get(getWatchHistoryStats);

// Clear all watch history
router.route("/clear").delete(clearWatchHistory);

// Remove specific video from watch history
router.route("/remove/:videoId").delete(removeFromWatchHistory);

// Pause/resume watch history tracking
router.route("/pause").patch(pauseWatchHistory);
router.route("/resume").patch(resumeWatchHistory);

export default router;
