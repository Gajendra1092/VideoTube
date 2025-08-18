import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { VideoReport } from "../models/videoReport.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { isValidObjectId } from "mongoose";

// Get all video reports with pagination and filtering
const getVideoReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, category } = req.query;

    console.log('🔄 Fetching video reports:', { page, limit, status, category });

    const matchStage = {};
    
    if (status && status !== 'all') {
        matchStage.status = status;
    }
    
    if (category && category !== 'all') {
        matchStage.category = category;
    }

    const aggregateQuery = VideoReport.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            view: 1,
                            isPublished: 1,
                            owner: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reportedBy",
                foreignField: "_id",
                as: "reporterDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reviewedBy",
                foreignField: "_id",
                as: "reviewerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoDetails: { $first: "$videoDetails" },
                reporterDetails: { $first: "$reporterDetails" },
                reviewerDetails: { $first: "$reviewerDetails" }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const reports = await VideoReport.aggregatePaginate(aggregateQuery, options);

    console.log('✅ Video reports fetched successfully:', { count: reports.docs.length });

    return res.status(200).json(new ApiResponse(200, reports, "Video reports fetched successfully!"));
});

// Review a video report
const reviewVideoReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status, adminNotes, actionTaken } = req.body;

    console.log('🔄 Reviewing video report:', { reportId, status, actionTaken });

    if (!reportId || !isValidObjectId(reportId)) {
        throw new ApiError(400, "Valid report ID is required!");
    }

    if (!status || !['reviewed', 'resolved', 'dismissed'].includes(status)) {
        throw new ApiError(400, "Valid status is required (reviewed, resolved, dismissed)!");
    }

    // Find the report
    const report = await VideoReport.findById(reportId);
    if (!report) {
        throw new ApiError(404, "Report not found!");
    }

    // Update the report
    const updatedReport = await VideoReport.findByIdAndUpdate(
        reportId,
        {
            status,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            adminNotes: adminNotes || '',
            actionTaken: actionTaken || 'none'
        },
        { new: true }
    ).populate([
        {
            path: 'video',
            select: 'title thumbnail duration view isPublished owner',
            populate: {
                path: 'owner',
                select: 'username fullName avatar'
            }
        },
        {
            path: 'reportedBy',
            select: 'username fullName avatar'
        },
        {
            path: 'reviewedBy',
            select: 'username fullName avatar'
        }
    ]);

    // If action is taken on the video, update the video accordingly
    if (actionTaken && actionTaken !== 'none') {
        const video = await Video.findById(report.video);
        if (video) {
            switch (actionTaken) {
                case 'removed':
                    await Video.findByIdAndUpdate(report.video, { isPublished: false });
                    break;
                case 'restricted':
                    // In a real implementation, you might add age restrictions or other limitations
                    console.log('Video restricted:', report.video);
                    break;
                case 'channel_strike':
                    // In a real implementation, you might add strikes to the channel owner
                    console.log('Channel strike issued for video:', report.video);
                    break;
                default:
                    break;
            }
        }
    }

    console.log('✅ Video report reviewed successfully');

    return res.status(200).json(new ApiResponse(200, updatedReport, "Video report reviewed successfully!"));
});

// Get report statistics
const getReportStatistics = asyncHandler(async (req, res) => {
    console.log('🔄 Fetching report statistics');

    const stats = await VideoReport.aggregate([
        {
            $group: {
                _id: null,
                totalReports: { $sum: 1 },
                pendingReports: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                    }
                },
                reviewedReports: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0]
                    }
                },
                resolvedReports: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
                    }
                },
                dismissedReports: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0]
                    }
                }
            }
        }
    ]);

    const categoryStats = await VideoReport.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    const result = {
        overview: stats[0] || {
            totalReports: 0,
            pendingReports: 0,
            reviewedReports: 0,
            resolvedReports: 0,
            dismissedReports: 0
        },
        categoryBreakdown: categoryStats
    };

    console.log('✅ Report statistics fetched successfully');

    return res.status(200).json(new ApiResponse(200, result, "Report statistics fetched successfully!"));
});

export {
    getVideoReports,
    reviewVideoReport,
    getReportStatistics
};
