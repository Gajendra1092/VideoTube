import { Router } from "express";
import {
    getVideoReports,
    reviewVideoReport,
    getReportStatistics
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Note: In a real application, you would add an admin role check middleware here
// For example: router.use(verifyAdmin);

// Video Reports routes
router.route("/reports").get(getVideoReports);
router.route("/reports/statistics").get(getReportStatistics);
router.route("/reports/:reportId/review").patch(reviewVideoReport);

export default router;
