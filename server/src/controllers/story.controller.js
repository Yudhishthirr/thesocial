import mongoose from "mongoose";
import { Story, visibilityTypes } from "../models/story.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js";
import {commentOn} from "../models/comment.model.js";

import { Follow } from "../models/followers.model.js";

const addStory = async (req, res) => {
  
  const userId = req.user?._id;
  let FileUrl = null;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const {caption, mentions = []} = req.body;
  const file = req.files?.MediaFile?.[0];
 
  // console.log("Caption:", caption);
  // console.log("Mentions:", mentions);
 
  if (!file) {
    throw new ApiError(400, "MediaFile is required");
  }
  const uploaded = await uploadOnCloudinary(file.path);
  FileUrl = uploaded.secure_url;  // <<< SAVE THIS IN DB
 
  // Create story
  const story = await Story.create({
    author: userId,
    caption: caption?.trim(),
    mediaUrl: FileUrl.trim(),
    mentions,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, story, "Story created successfully"));
};


const viewStory = async (req, res) => {
  const userId = req.user?._id;
  const { storyId } = req.params;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!mongoose.isValidObjectId(storyId)) {
    throw new ApiError(400, "Invalid story id");
  }

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  // ⚠️ If user is the author → do not count view
  if (story.author.equals(userId)) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { viewCount: story.viewCount },
        "Owner viewing their own story"
      )
    );
  }

  // Check if already viewed
  const alreadyViewed = story.viewers.some((viewerId) =>
    viewerId.equals(userId)
  );

  if (!alreadyViewed) {
    story.viewers.push(userId);        // Add viewer
    story.viewCount = story.viewers.length;  // Update count
    await story.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { viewCount: story.viewCount },
      "Marked as viewed"
    )
  );
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

  if (!mongoose.isValidObjectId(storyId))
    throw new ApiError(400, "Invalid story id");

  if (!text || !String(text).trim())
    throw new ApiError(400, "Comment text is required");

  const story = await Story.findById(storyId);
  if (!story) throw new ApiError(404, "Story not found");

  if (story.author.equals(userId)) {
    throw new ApiError(403, "You cannot comment on your own story");
  }

  // 1️⃣ Create comment in Comment collection
  const newComment = await Comment.create({
    content: String(text).trim(),
    commentOnType: commentOn.STORY,
    commentOnId: storyId,
    owner: userId,
  });

  // 2️⃣ Update comment count in story
  story.commentCount += 1;
  await story.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      newComment,
      "Comment added successfully"
    )
  );
};


const getFollowingStories = async (req, res) => {
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  // 1️⃣ Get list of users current user is following
  const followDoc = await Follow.findOne({ user: userId });

  const followingUsers = followDoc?.following || [];

 
  const allowedAuthors = [...followingUsers, userId];
  

  // // 3️⃣ Fetch stories with visibility rules & not expired
  const stories = await Story.find({
    author: { $in: allowedAuthors },
    expiresAt: { $gt: new Date() }, // not expired
    $or: [
      { visibility: visibilityTypes.FOLLOWERS },
    ]
  }).populate("author", "username fullName avatar accountType")
    .select("author caption mentions mediaUrl visibility createdAt")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, stories, "Stories fetched successfully"));
};


const deleteStory = async (req, res) => {
  const userId = req.user?._id;
  const { storyId } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.isValidObjectId(storyId))
    throw new ApiError(400, "Invalid story id");

  // ✔ Validate story & ownership
  const story = await Story.findOne({ _id: storyId, author: userId });
  if (!story) {
    throw new ApiError(404, "Story not found or unauthorized");
  }

  // 1️⃣ Delete the story
  await Story.findByIdAndDelete(storyId);

  // 2️⃣ Delete comments linked to this story
  await Comment.deleteMany({
    commentOnType: "Story",
    commentOnId: storyId,
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Story deleted successfully")
  );
};




export {addStory,viewStory,reactStory,addCommentStory,deleteStory,getFollowingStories}


