import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { Hashtags } from "../models/hashtage.model.js";
import mongoose from "mongoose";

const postCreation = async (req, res) => {
  const { title, postUrl, hashtags } = req.body;
  const userId = req.user._id;

  if ([title, postUrl].some((f) => typeof f !== "string" || f.trim() === "")) {
    throw new ApiError(400, "Title and Post URL are required");
  }

  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    throw new ApiError(400, "At least one hashtag is required");
  }
  if (!userId) {
    throw new ApiError(401, "User not found");
  }

  if (hashtags.some((t) => typeof t !== "string" || t.trim() === "")) {
    throw new ApiError(400, "Invalid hashtag format");
  }

  // Step 1: Create post
  const post = await Post.create({
    title: title.toLowerCase(),
    postUrl: postUrl.toLowerCase().trim(),
    userId: userId,
  });

  if (!post) throw new ApiError(500, "Failed to create post");

  // Step 2: Create hashtags document linked to post
  const hashtagsDoc = await Hashtags.create({
    hashtags: hashtags.map((tag) => tag.toLowerCase().trim()),
    postId: post._id,
  });

  return res.status(201).json(
    new ApiResponse(201, "Post and Hashtags created successfully", {
      post,
      hashtagsDoc,
    })
  );
};

const getPosts = async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();

  if (!Array.isArray(posts) || posts.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No posts found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts fetched successfully"));
};

const getPostById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID");
  }

  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Post fetched successfully", post));
};

const deletePostById = async (req,res)=>{
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID");
  }
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  await Hashtags.findOneAndDelete({ postId: id });
  await Post.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Post deleted successfully", { id }));
}
export { postCreation, getPosts,getPostById,deletePostById };
