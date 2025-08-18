import mongoose, {Schema} from "mongoose";

const likeSchema = new mongoose.Schema({

    video:{
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    // Add type field to distinguish between like and dislike
    type: {
        type: String,
        enum: ['like', 'dislike'],
        default: 'like'
    }

},{
    timestamps:true,
});

// Compound indexes to prevent duplicate likes/dislikes
likeSchema.index({ video: 1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ comment: 1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ tweet: 1, likedBy: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model("Like", likeSchema);