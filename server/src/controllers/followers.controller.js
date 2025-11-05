import mongoose from "mongoose";
import { Follow } from "../models/followers.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { followingId } = req.body;

   
    if (!mongoose.isValidObjectId(followingId)) {
      throw new ApiError(400, "Invalid following Id");
    }

    
    if (followerId.toString() === followingId) {
      throw new ApiError(400, "You cannot follow yourself");
    }

    
    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      throw new ApiError(404, "This Account does not exist");
    }

    
    const followerDoc = await Follow.findByIdAndUpdate(
      followerId,
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true, new: true }
    );

    
    const isFollowing = followerDoc.following.some((id) => id.equals(followingId));

    if (isFollowing) {
      await Follow.findByIdAndUpdate(followerId, {
        $pull: { following: followingId },
      });
      await Follow.findByIdAndUpdate(followingId, {
        $pull: { followers: followerId },
      });

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Unfollowed successfully"));
    } else {
     
      await Follow.findByIdAndUpdate(followerId, {
        $addToSet: { following: followingId },
      });
      await Follow.findByIdAndUpdate(followingId, {
        $addToSet: { followers: followerId },
      });

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Followed successfully"));
    }
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }
};

export { toggleFollow };
