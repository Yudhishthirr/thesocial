import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export const commentOn = {
    POST: "Post",
    STORY: "Story"
};

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },

        // 👇 Store where the comment belongs (Post or Story)
        commentOnType: {
            type: String,
            required: true,
            enum: Object.values(commentOn) // ["Post", "Story"]
        },

        // 👇 Dynamic reference to either Post or Story
        commentOnId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "commentOnType" // <-- Magic, Mongoose decides model automatically
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
