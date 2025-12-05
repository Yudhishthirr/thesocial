import mongoose, { isValidObjectId } from "mongoose"
import { Comment, commentOn } from "../models/comment.model.js"
import { Post } from "../models/post.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Notification, NOTIFICATION_TYPES, entityTypeOptions } from "../models/notification.model.js"

const addComment = async (req, res) => {

  const { postId } = req.params
  const user_id = req.user._id
  const { comment } = req.body

  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post Id");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (!comment) {
    throw new ApiError(404, "Please Enter comment");
  }
  const commentres = await Comment.create({
    content: comment,
    commentOnType: commentOn.POST,
    commentOnId: postId,
    owner: user_id
  });

  if (!commentres.owner.equals(user_id)) {

    // ❗ Check if notification already exists
    const existingNotif = await Notification.findOne({
      receiver: comment.owner,
      sender: user_id,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      entityType: entityTypeOptions.COMMENT,
      entityId: postId
    });

    // ❗ Only create notification if NONE exists
    if (!existingNotif) {
      await Notification.create({
        receiver: comment.owner,
        sender: user_id,
        type: NOTIFICATION_TYPES.COMMENT_ADDED,
        entityType: entityTypeOptions.COMMENT,
        entityId: postId,
        message: "comment add on your post",
      });
    }
  }
  if (!commentres) {
    throw new ApiError(404, "comment not added");
  }
  return (
    res
      .status(200)
      .json(new ApiResponse(200, commentres, "comment added successfully"))
  );
}

const updateComment = async (req, res) => {

  const { commentId } = req.params
  const { content } = req.body
  const user_id = req.user._id
  console.log(content)
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalied comment id")
  }

  if (!content) {
    throw new ApiError(400, "comment is requeird")
  }
  const findComment = await Comment.findById(commentId)
  if (!findComment) {
    throw new ApiError(400, "Cant find comment")
  }

  if (findComment.owner.equals(user_id.toString())) {
    const updatedcomment = await Comment.findByIdAndUpdate(commentId, { $set: { content } }, { new: true })
    if (!updatedcomment) {
      throw new ApiError(400, "comment not found")
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, updatedcomment, "comment updated successfully"))
    }
  } else {
    throw new ApiError(400, "Only can owner update comment")
  }
}

const deleteComment = async (req, res) => {

  const { commentId } = req.params
  const user_id = req.user._id
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalied comment id")
  }
  const findComment = await Comment.findById(commentId)
  if (!findComment) {
    throw new ApiError(400, "Cant find comment")
  }

  if (findComment.owner.equals(user_id.toString())) {
    const deletecomment = await Comment.deleteOne({ _id: commentId })
    if (!deletecomment) {
      throw new ApiError(400, "failled to delet comment")
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, deletecomment, "comment deleted successfully"))
    }
  } else {
    throw new ApiError(400, "Only can owner update comment")
  }
}

const getComments = async (req, res) => {

  const { id } = req.params;
  console.log(id)
  if (!id) {
    throw new ApiError(400, "Id is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Id");
  }

  // const Comments = await Comment.find({ post: id });
  const Comments = await Comment.aggregate([
    {
      $match: {
        post: new mongoose.Types.ObjectId(req.params.id),
      },
    },

    // 1️⃣ Lookup likes for each comment
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },

    // 2️⃣ Lookup owner (user) details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // 3️⃣ Add likeCount + isLiked fields
    {
      $addFields: {
        likeCount: { $size: "$likes" },
        isLiked: {
          $in: [
            new mongoose.Types.ObjectId(req.user._id),
            "$likes.likedBy",
          ],
        },

        // Pick only small data for user
        ownerData: {
          username: "$user.username",
          avatar: "$user.avatar",
        },
      },
    },

    // 4️⃣ Final clean projection
    {
      $project: {
        likes: 0,  // remove raw likes array
        user: 0,   // remove full user doc
      },
    },

    // 5️⃣ Sort comments: newest first
    { $sort: { createdAt: -1 } },
  ]);
  console.log(Comments)

  if (!Array.isArray(Comments) || Comments.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No posts found"));
  }


  return res
    .status(200)
    .json(new ApiResponse(200, Comments));
};


export { addComment, updateComment, deleteComment, getComments }