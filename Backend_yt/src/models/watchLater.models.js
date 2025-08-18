import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const watchLaterSchema = new Schema({
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
    }
}, {timestamps: true});

// Compound index to ensure a user can't add the same video twice to watch later
watchLaterSchema.index({ user: 1, video: 1 }, { unique: true });

// Index for efficient queries
watchLaterSchema.index({ user: 1, addedAt: -1 });
watchLaterSchema.index({ video: 1 });

watchLaterSchema.plugin(mongooseAggregatePaginate);

export const WatchLater = mongoose.model("WatchLater", watchLaterSchema);
