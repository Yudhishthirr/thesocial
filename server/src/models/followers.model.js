import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followSchema = new Schema(
  {
    // ✅ Store multiple followers for a user
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✅ Store multiple users that this user follows
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

followSchema.plugin(mongooseAggregatePaginate);

export const Follow = mongoose.model("Follow", followSchema);
