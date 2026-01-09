
import mongoose, {Schema} from "mongoose";


const Aiprofile = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  systemPrompt: {
    type: String,
    required: true,
  },

  personality: {
    tone: {
      type: String,
      enum: ["romantic", "soft", "playful", "dominant"],
      default: "romantic",
    },
    energy: { type: Number, min: 1, max: 10, default: 7 },
    empathy: { type: Number, min: 1, max: 10, default: 8 },
    humor: { type: Number, min: 1, max: 10, default: 6 },
  },

  behavior: {
    jealousyLevel: { type: Number, min: 0, max: 10, default: 3 },
    clinginess: { type: Number, min: 0, max: 10, default: 4 },
    independence: { type: Number, min: 0, max: 10, default: 6 },
  },

  generationConfig: {
    temperature: { type: Number, default: 0.8 },
    topP: { type: Number, default: 0.9 },
    maxTokens: { type: Number, default: 512 },
  },

  safety: {
    nsfwAllowed: { type: Boolean, default: false },
    emotionalSupport: { type: Boolean, default: true },
    dependencyLimit: { type: Boolean, default: true },
  },

  memoryConfig: {
    enabled: { type: Boolean, default: true },
    maxMemories: { type: Number, default: 500 },
    decayRate: { type: Number, default: 0.02 },
  },

  version: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });


export const aiProfileSchema = mongoose.model("Aiprofile", Aiprofile);