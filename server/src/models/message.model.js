import mongoose, { Schema } from "mongoose";

export const MESSAGE_STATUS = {
  SENT: "sent",
  READ: "read",
};

export const MESSAGE_TYPE = {
  TEXT: "text",
  STORY: "story",
  POST: "post",
};

const messageSchema = new Schema(
  {
    // 🔥 MOST IMPORTANT FIELD
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      required: true,
      default: MESSAGE_TYPE.TEXT,
    },
    text:{
      type: String,
    },

    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    sharedStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
    },

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
