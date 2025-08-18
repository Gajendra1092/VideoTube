import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    updateVideoThumbnail,
    incrementViewCount
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// Public route - no authentication required for viewing videos
router.route("/").get(getAllVideos);

// Protected routes - authentication required
router
    .route("/")
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

// Public route for getting video by ID
router.route("/:videoId").get(getVideoById);

// Protected routes for video management
router
    .route("/:videoId")
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, updateVideo);

router.route("/:videoId/updateThumbnail").patch(verifyJWT, upload.single("thumbnail"), updateVideoThumbnail);
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// Test route for debugging view counts
router.route("/test/increment-views/:videoId").patch(verifyJWT, incrementViewCount);

export default router;