import mongoose from "mongoose";
import { Story } from "../models/story.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new story (supports multiple media items)
const postCreation = async (req, res) => {
  const userId = req.user._id
  const {
    caption,
    media,
    visibility = "followers",
    mentions = [],
    expiresAt, // optional custom expiry
  } = req.body;
  console.log(req.body)
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!Array.isArray(media) || media.length === 0) {
    throw new ApiError(400, "At least one media item is required");
  }

  const normalizedMedia = media.map((m) => ({
    url: String(m.url || "").trim(),
    type: m.type === "video" ? "video" : "image",
    width: m.width,
    height: m.height,
    durationMs: m.durationMs,
    thumbnailUrl: m.thumbnailUrl ? String(m.thumbnailUrl).trim() : undefined,
  }));

  if (normalizedMedia.some((m) => !m.url)) {
    throw new ApiError(400, "Media url is required");
  }

//   // default expiry 24h if not provided
  const expiry = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const story = await Story.create({
    author: userId,
    caption: caption?.trim?.() || undefined,
    media: normalizedMedia,
    visibility,
    mentions,
    expiresAt: expiry,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, story, "Story created successfully"));
};

// Mark story as viewed by current user (idempotent)
const viewStoy = async (req, res) => {
  const userId = req.user?._id;
  const { storyId } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.isValidObjectId(storyId)) throw new ApiError(400, "Invalid story id");

  const story = await Story.findById(storyId);
  if (!story) throw new ApiError(404, "Story not found");

  // avoid duplicate viewer entries
  const alreadyViewed = story.viewers.some((v) => v.user.equals(userId));
  if (!alreadyViewed) {
    story.viewers.push({ user: userId, viewedAt: new Date() });
    story.viewCount = story.viewers.length;
    await story.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { viewCount: story.viewCount }, "Marked as viewed"));
};

// // Add or update a reaction (one per user)
const reactStory = async (req, res) => {
  const userId = req.user?._id;
  const { storyId } = req.params;
  const { emoji } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.isValidObjectId(storyId)) throw new ApiError(400, "Invalid story id");
  if (!emoji || typeof emoji !== "string") throw new ApiError(400, "Emoji is required");

  const story = await Story.findById(storyId);
  if (!story) throw new ApiError(404, "Story not found");

  // replace existing reaction from this user
  story.reactions = story.reactions.filter((r) => !r.user.equals(userId));
  story.reactions.push({ user: userId, emoji, createdAt: new Date() });
  story.reactionCount = story.reactions.length;
  await story.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { reactionCount: story.reactionCount, reactions: story.reactions }, "Reaction updated"));
};



// // Add a comment to a story
const addCommentStory = async (req, res) => {
  const userId = req.user?._id;
  const { storyId } = req.params;
  const { text } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.isValidObjectId(storyId)) throw new ApiError(400, "Invalid story id");
  if (!text || !String(text).trim()) throw new ApiError(400, "Comment text is required");

  const story = await Story.findById(storyId);
  if (!story) throw new ApiError(404, "Story not found");

  story.comments.push({ user: userId, text: String(text).trim(), createdAt: new Date() });
  story.commentCount = story.comments.length;
  await story.save();

  return res
    .status(200)
    .json(new ApiResponse(200, story.comments[story.comments.length - 1], "Comment added"));
};


const deleteStory = async (req,res)=>{
    const userId = req.user?._id;
    const { storyId } = req.params;

    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!mongoose.isValidObjectId(storyId)) throw new ApiError(400, "Invalid story id");

    const story = await Story.findOne({_id:storyId,author:userId});
    if (!story) throw new ApiError(404, "Story not found");

    await Story.findByIdAndDelete(storyId);

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Story deleted successfully"));

}



export {postCreation,viewStoy,reactStory,addCommentStory,deleteStory}


