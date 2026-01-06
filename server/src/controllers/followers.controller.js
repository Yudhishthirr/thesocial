import mongoose from "mongoose";
import { Follow } from "../models/followers.model.js";
import {FollowRequest, REQUEST_STATUS} from "../models/followRequest.model.js"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import {ACCOUNT_TYPES} from "../models/user.model.js"

import { notificationQueue } from "../helper/queues/index.js";

const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;     // person who clicks follow (sender)
    
    const {followingId}  = req.params;
    console.log("want to follow this user",followingId);

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
      
      const followRequest  = await FollowRequest.create({
        sender: followerId,
        receiver:followingId,
      });

       // 🔥 ONLY enqueue event (no notification DB work here)
      await notificationQueue.add(
        "FOLLOW_REQUEST",
        {
          receiver: followingId,
          sender: followerId,
          entityId: followRequest._id,
        },
        {
          attempts: 5,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      console.log("Follow request created:", followRequest._id);
      // if (followerId.toString() != followingId) {
      //   const existingNotif = await Notification.findOne({
      //       receiver: followingId,
      //       sender: followerId,
      //       type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
      //       entityType: entityTypeOptions.FOLLOW,
      //       entityId: FollowRequestID._id,
      //   });


      //   if (!existingNotif) {
      //     await Notification.create({
      //       receiver: followingId,
      //       sender: followerId,
      //       type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
      //       entityType: entityTypeOptions.FOLLOW,
      //       entityId: FollowRequestID._id,
      //     });
      //   }
      // }
      


      
      return res
        .status(200)
        .json(new ApiResponse(200, null, "follow request send succssfully"));
    }


    const followerDoc = await Follow.findOneAndUpdate(
      { user: followerId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true, new: true }
    );
    // here we craating the docs for the follow 
  
    await Follow.findOneAndUpdate(
      { user: followingId },
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true }
    );
    // // here we craating the docs for the following 
 
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

const getFollowRequest = async (req, res) => {
  try {
    const userAccountType = req.user.accountType;
    const userId = req.user._id;

    // Only private accounts receive follow requests
    if (userAccountType !== ACCOUNT_TYPES.PRIVATE) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No follow requests (public account)"));
    }

    // Fetch follow requests where the current user is the receiver
    const requests = await FollowRequest.find({ receiver: userId, status: REQUEST_STATUS.PENDING })
      .populate("sender", "username fullName avatar") // show user details
      .select("-receiver") // exclude receiver field
      .sort({ createdAt: -1 }); // newest first

    return res
      .status(200)
      .json(new ApiResponse(200, requests, "Follow requests fetched"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching requests");
  }
};


const acceptedFollowRequest = async (req, res) => {

  const {id}  = req.params;  
  const userId = req.user._id;    

  console.log("Target ID:", id);
  console.log("User ID:", userId);

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid targetId");
  }

  try {
   
    const request = await FollowRequest.findOne({
      _id: id,     // A
      receiver: userId,     // B
      status: REQUEST_STATUS.PENDING,
    });

    if (!request) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No pending follow request found"));
    }

    // 2️⃣ Accept the request
    let senderId = request.sender 
   

    // 3️⃣ Ensure both users have Follow docs
    await Follow.findOneAndUpdate(
      { user: userId }, // B
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true }
    );

    await Follow.findOneAndUpdate(
      { user: senderId }, // A
      { $setOnInsert: { followers: [], following: [] } },
      { upsert: true }
    );

    // 4️⃣ Add A → to B's followers
    await Follow.findOneAndUpdate(
      { user: userId },
      { $addToSet: { followers: senderId } }
    );

    // 5️⃣ Add B → to A's following
    await Follow.findOneAndUpdate(
      { user: senderId },
      { $addToSet: { following: userId } }
    );

    request.status = REQUEST_STATUS.ACCEPTED;
    await request.save();

    // await Notification.create({
    //   receiver: senderId,
    //   sender: receiverId,
    //   type: "FOLLOW_ACCEPTED",
    //   entityId: receiverId,
    //   message: "accepted your follow request",
    // });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Follow request accepted successfully"));

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


export { toggleFollow,getFollowRequest,acceptedFollowRequest };
