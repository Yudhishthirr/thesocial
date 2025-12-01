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
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of message (text, post share etc.)
    messageType: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      required: true,
      default: MESSAGE_TYPE.TEXT,
    },

    // Text message body
    text: {
      type: String,
      default: "",
    },

    // For sharing content
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    sharedStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      default: null,
    },


    // Reply functionality
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Message status (sent/read)
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
    },

    // Delete options like Instagram
    isDeletedForSender: {
      type: Boolean,
      default: false,
    },
    isDeletedForReceiver: {
      type: Boolean,
      default: false,
    },
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
