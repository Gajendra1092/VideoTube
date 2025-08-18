import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
        content: {
            type: String,
            required: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"User",
            required: true
        },
        // Support for nested replies
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },
        // Track if this is a reply
        isReply: {
            type: Boolean,
            default: false
        }
    }, {
        timestamps: true
    }

);


commentSchema.plugin(mongooseAggregatePaginate);


export const Comment = mongoose.model("Comment", commentSchema);