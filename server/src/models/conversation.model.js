import mongoose, { Schema } from "mongoose";

export const conversationTypes ={
  DIRECT: "DIRECT",
  GROUP: "GROUP",
}



const conversationSchema = new Schema(
  {
    conversationTypes: {
      type: String,
      enum: conversationTypes,
      default: conversationTypes.DIRECT,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // group only
    groupName: String,
    groupImage: String,
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // For faster chat list loading
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
