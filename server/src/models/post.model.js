import mongoose, {Schema} from "mongoose";


const postSchema = new Schema(
    {
        title: {
            type: String,
            lowercase: true,
            trim: true, 
            index: true
        },
        postUrl: {
            type: String,
            unique: false,
            lowecase: true,
            trim: true, 
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },{timestamps: true}
)




export const Post = mongoose.model("Post", postSchema);