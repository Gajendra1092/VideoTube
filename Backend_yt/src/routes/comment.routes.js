import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {optionalAuth} from "../middlewares/optionalAuth.middleware.js"

const router = Router();

// Public routes (optional authentication for user-specific data)
router.route("/:videoId").get(optionalAuth, getVideoComments);

// Protected routes (authentication required)
router.use(verifyJWT);

router.route("/:videoId").post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router