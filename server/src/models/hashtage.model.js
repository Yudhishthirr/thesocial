import mongoose, { Schema } from "mongoose";

const hashtagsSchema = new Schema(
  {
    hashtags: {
      type: [String], // 👈 store all hashtags in one array
      required: true,
      lowercase: true,
      trim: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      unique: true, // one hashtags doc per post
    },
  },
  { timestamps: true }
);

export const Hashtags = mongoose.model("Hashtags", hashtagsSchema);
