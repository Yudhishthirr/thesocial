import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    durationMs: { type: Number }, // for videos
    thumbnailUrl: { type: String, trim: true }, // for videos
  },
  { _id: false }
);

const viewerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true }, // store unicode emoji or shortname
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const storySchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    caption: { type: String, trim: true },

    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],

    media: { type: [mediaItemSchema], required: true, validate: v => v.length > 0 },

    // Visibility controls similar to Instagram
    visibility: {
      type: String,
      enum: ["public", "followers", "close_friends", "custom"],
      default: "followers",
    },
  

    // Engagement
    viewers: { type: [viewerSchema], default: [] },
    reactions: { type: [reactionSchema], default: [] },
    comments: { type: [commentSchema], default: [] },

    viewCount: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

   

    // Auto-expire after 24h via TTL index on expiresAt
    expiresAt: { type: Date, required: true },
    isArchived: { type: Boolean, default: false }, // keep past stories if you add archive feature
  },
  { timestamps: true }
);

// TTL index to delete story when expiresAt is reached
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helpful secondary indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ visibility: 1, createdAt: -1 });

// Maintain denormalized counters
storySchema.pre("save", function (next) {
  this.viewCount = this.viewers?.length || 0;
  this.reactionCount = this.reactions?.length || 0;
  this.commentCount = this.comments?.length || 0;
  // ensure expiresAt if not provided
  if (!this.expiresAt) {
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + twentyFourHoursMs);
  }
  next();
});

storySchema.plugin(mongooseAggregatePaginate);

export const Story = mongoose.model("Story", storySchema);


