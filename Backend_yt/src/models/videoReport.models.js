import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoReportSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: [
            'spam',
            'harassment',
            'hate_speech',
            'violence',
            'adult_content',
            'copyright',
            'misleading',
            'terrorism',
            'child_safety',
            'other'
        ],
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    adminNotes: {
        type: String,
        maxlength: 1000,
        default: ''
    },
    // Track if action was taken on the video
    actionTaken: {
        type: String,
        enum: ['none', 'warning', 'removed', 'restricted', 'channel_strike'],
        default: 'none'
    }
}, {timestamps: true});

// Compound index to prevent duplicate reports from same user for same video
videoReportSchema.index({ video: 1, reportedBy: 1 }, { unique: true });

// Index for efficient queries
videoReportSchema.index({ status: 1, createdAt: -1 });
videoReportSchema.index({ video: 1, status: 1 });
videoReportSchema.index({ reportedBy: 1, createdAt: -1 });
videoReportSchema.index({ category: 1, status: 1 });

videoReportSchema.plugin(mongooseAggregatePaginate);

export const VideoReport = mongoose.model("VideoReport", videoReportSchema);
