import mongoose from "mongoose";
import { Follow } from "../models/followers.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;     // person who clicks follow
    const { followingId } = req.body;    // person being followed

    // Validate followingId
    if (!mongoose.isValidObjectId(followingId)) {
      throw new ApiError(400, "Invalid following Id");
    }

    // Prevent self follow
    if (followerId.toString() === followingId) {
      throw new ApiError(400, "You cannot follow yourself");
    }

    // Check target account exists
    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      throw new ApiError(404, "This account does not exist");
    }

    // 1️⃣ Ensure FOLLOW DOC exists for follower (current user)
    const followerDoc = await Follow.findOneAndUpdate(
      { user: followerId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true, new: true }
    );

    // 2️⃣ Ensure FOLLOW DOC exists for the target user
    await Follow.findOneAndUpdate(
      { user: followingId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true }
    );

    // Check if already following
    const isFollowing = followerDoc.following.some((id) =>
      id.equals(followingId)
    );

    if (isFollowing) {
      // 🔥 UNFOLLOW

      await Follow.findOneAndUpdate(
        { user: followerId },
        { $pull: { following: followingId } }
      );

      await Follow.findOneAndUpdate(
        { user: followingId },
        { $pull: { followers: followerId } }
      );

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Unfollowed successfully"));
    } else {
      // 🔥 FOLLOW

      await Follow.findOneAndUpdate(
        { user: followerId },
        { $addToSet: { following: followingId } }
      );

      await Follow.findOneAndUpdate(
        { user: followingId },
        { $addToSet: { followers: followerId } }
      );

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Followed successfully"));
    }
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Something went wrong"
        )
      );
  }
};

export { toggleFollow };
