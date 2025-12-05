import mongoose, { Schema } from "mongoose";


export const visibilityTypes = {
  PUBLIC: "public",
  FOLLOWERS: "followers",
  CLOSE_FRIENDS: "close_friends",
};



const storySchema = new Schema(
  {
    author: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    caption: { 
      type: String, 
      trim: true 
    },

    mentions: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "User" 
      }
    ],

    mediaUrl: { 
      type: String, 
      required: true, 
      
    },

   
    visibility: {
      type: String,
      enum: visibilityTypes,
      default: visibilityTypes.FOLLOWERS,
    },
  

    // Engagement
    viewers: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    }],


    viewCount: { type: Number, default: 0 },
   
    commentCount: { type: Number, default: 0 },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 }, // TTL index for auto deletion
    }

  },
  { timestamps: true }
);




export const Story = mongoose.model("Story", storySchema);


