import mongoose, { Schema } from "mongoose";

const videoViewSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,
        index: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    // Track session info for analytics
    sessionInfo: {
        userAgent: String,
        ipAddress: String,
        platform: String,
        browser: String
    }
}, {
    timestamps: true
});

// Compound index to ensure one view per user per video
videoViewSchema.index({ video: 1, user: 1 }, { unique: true });

// Index for efficient queries
videoViewSchema.index({ video: 1, viewedAt: -1 });
videoViewSchema.index({ user: 1, viewedAt: -1 });

export const VideoView = mongoose.model("VideoView", videoViewSchema);
