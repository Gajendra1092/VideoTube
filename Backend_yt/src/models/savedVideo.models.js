import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const savedVideoSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    // Optional: Add categories for saved videos
    category: {
        type: String,
        enum: ['general', 'favorites', 'educational', 'entertainment', 'music', 'sports', 'news'],
        default: 'general'
    },
    // Optional: Add notes for saved videos
    notes: {
        type: String,
        maxlength: 500,
        default: ''
    }
}, {timestamps: true});

// Compound index to ensure a user can't save the same video twice
savedVideoSchema.index({ user: 1, video: 1 }, { unique: true });

// Index for efficient queries
savedVideoSchema.index({ user: 1, addedAt: -1 });
savedVideoSchema.index({ user: 1, category: 1, addedAt: -1 });
savedVideoSchema.index({ video: 1 });

savedVideoSchema.plugin(mongooseAggregatePaginate);

export const SavedVideo = mongoose.model("SavedVideo", savedVideoSchema);
