import mongoose, { Schema } from "mongoose";

export const NOTIFICATION_TYPES = {
  STORY_MENTION: "STORY_MENTION",
  POST_MENTION: "POST_MENTION",

  POST_LIKE: "POST_LIKE",
  COMMENT_LIKE: "COMMENT_LIKE",

  COMMENT_REPLY: "COMMENT_REPLY",
  STORY_REPLY: "STORY_REPLY",

  FOLLOW_REQUEST: "FOLLOW_REQUEST",
  FOLLOW_ACCEPTED: "FOLLOW_ACCEPTED",
  NEW_FOLLOWER: "NEW_FOLLOWER",
  
  COMMENT_ADDED: "COMMENT_ADDED",

  
};

export const entityTypeOptions ={
    POST: "Post",
    STORY: "Story",
    COMMENT: "Comment",
    FOLLOW: "Follow",
    NONE: null, 
}

const notificationSchema = new Schema(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },

    // Which entity does this notification refer to?
    entityType: {
      type: String,
      enum: entityTypeOptions,
      default: entityTypeOptions.NONE,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    // Extra data (optional)
    notificationMessage: { 
        type: String 
    }, // “liked your post”, “sent you a follow request”

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
