import mongoose from "mongoose";
import { Follow } from "../models/followers.model.js";
import {FollowRequest} from "../models/followRequest.model.js"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification,NOTIFICATION_TYPES,entityTypeOptions} from "../models/notification.model.js"
import {ACCOUNT_TYPES} from "../models/user.model.js"

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;     // person who clicks follow (sender)
    const { followingId } = req.body;    // person being followed


    if (!mongoose.isValidObjectId(followingId)) {
      throw new ApiError(400, "Invalid following Id");
    }


    if (followerId.toString() === followingId) {
      throw new ApiError(400, "You cannot follow yourself");
    }

    
    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      throw new ApiError(404, "This account does not exist");
    }

    if (targetUser.accountType === ACCOUNT_TYPES.PRIVATE) {
      
       const existingRequest = await FollowRequest.findOne({
        sender: followerId,
        receiver: followingId,
      });

      if (existingRequest) {
        return res
          .status(200)
          .json(new ApiResponse(200, existingRequest, "Follow request already sent"));
      }
      
      const FollowRequestID = await FollowRequest.create({
        sender: followerId,
        receiver:followingId,
      });

      if (followerId.toString() != followingId) {

        const existingNotif = await Notification.findOne({
            receiver: followingId,
            sender: followerId,
            type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
            entityType: entityTypeOptions.FOLLOW,
            entityId: FollowRequestID._id,
        });


        if (!existingNotif) {
          await Notification.create({
            receiver: followingId,
            sender: followerId,
            type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
            entityType: entityTypeOptions.FOLLOW,
            entityId: FollowRequestID._id,
          });
        }
      }
      
      
      return res
        .status(200)
        .json(new ApiResponse(200, null, "follow request send succssfully"));
    }


    const followerDoc = await Follow.findOneAndUpdate(
      { user: followerId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true, new: true }
    );

  
    await Follow.findOneAndUpdate(
      { user: followingId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true }
    );

 
    const isFollowing = followerDoc.following.some((id) =>
      id.equals(followingId)
    );

    if (isFollowing) {
     

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
