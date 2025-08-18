import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    title:{
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description:{
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    videos: [{
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    privacy: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    thumbnail: {
        type: String, // Custom thumbnail URL or will use first video's thumbnail
        default: null
    },
    videoCount: {
        type: Number,
        default: 0
    }
},{timestamps: true});

// Index for efficient queries
playlistSchema.index({ owner: 1, createdAt: -1 });
playlistSchema.index({ privacy: 1, createdAt: -1 });
playlistSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to update video count
playlistSchema.pre('save', function(next) {
    this.videoCount = this.videos.length;
    next();
});

// Virtual for getting first video thumbnail
playlistSchema.virtual('firstVideoThumbnail').get(function() {
    if (this.thumbnail) return this.thumbnail;
    if (this.videos && this.videos.length > 0 && this.videos[0].video && this.videos[0].video.thumbnail) {
        return this.videos[0].video.thumbnail;
    }
    return null;
});

// Ensure virtuals are included in JSON output
playlistSchema.set('toJSON', { virtuals: true });
playlistSchema.set('toObject', { virtuals: true });

// Add pagination plugin
playlistSchema.plugin(mongooseAggregatePaginate);

export const Playlist = mongoose.model("Playlist", playlistSchema);