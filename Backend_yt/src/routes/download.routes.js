import { Router } from 'express';
import {
    getVideoDownloadInfo,
    downloadVideo,
    getVideoFormats
} from "../controllers/download.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

// Public routes (no authentication required for downloads)
router.route("/info/:videoId").get(getVideoDownloadInfo);
router.route("/formats/:videoId").get(getVideoFormats);
router.route("/file/:videoId").get(downloadVideo);

// Protected routes (authentication required)
// You might want to add authentication for download tracking
// router.use(verifyJWT);

export default router;
