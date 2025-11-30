import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const followRequestSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
   
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,

    },
    status: {
      type: String,
      enum: REQUEST_STATUS,
      default: REQUEST_STATUS.PENDING,
    },
  },
  { timestamps: true }
);
followRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

followRequestSchema.plugin(mongooseAggregatePaginate);

export const FollowRequest = mongoose.model(
  "FollowRequest",
  followRequestSchema
);
