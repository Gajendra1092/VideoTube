import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    toggleVideoInPlaylist,
    updatePlaylist,
    reorderPlaylistVideos,
    getPublicPlaylists
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// Public routes (no authentication required)
router.route("/public").get(getPublicPlaylists);
router.route("/:playlistId").get(getPlaylistById); // Allow public access to view playlists

// Protected routes (authentication required)
router.use(verifyJWT); // Apply verifyJWT middleware to routes below

router.route("/").post(createPlaylist);

router
    .route("/:playlistId")
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/:playlistId/reorder").patch(reorderPlaylistVideos);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/toggle/:videoId/:playlistId").patch(toggleVideoInPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router