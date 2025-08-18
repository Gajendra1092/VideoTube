import { Router } from 'express';
import {
    globalSearch,
    searchVideos,
    searchChannels,
    getSearchSuggestions
} from "../controllers/search.controller.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";

const router = Router();

// Public search routes (optional authentication for personalized results)
router.route("/").get(optionalAuth, globalSearch);
router.route("/videos").get(optionalAuth, searchVideos);
router.route("/channels").get(optionalAuth, searchChannels);
router.route("/suggestions").get(optionalAuth, getSearchSuggestions);

export default router;
