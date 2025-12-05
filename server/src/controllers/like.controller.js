import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

import {Comment} from "../models/comment.model.js"

import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import { Post } from "../models/post.model.js"
import { Notification,NOTIFICATION_TYPES,entityTypeOptions} from "../models/notification.model.js"



const togglePostLike = async (req, res) => {

    const {postId} = req.params
    const user_id = req.user._id
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid postId Id");
    }
    const post= await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    const existingLike = await Like.findOne({ post: postId, likedBy: user_id });

    if (existingLike){
        
        const removeLike = await Like.findByIdAndDelete(existingLike._id);
        return (
            res
            .status(200)
            .json(new ApiResponse(200, removeLike, "Like removed successfully"))
        );
    }else{
        const newLike = await Like.create({ post: postId, likedBy: user_id});

        if (!post.userId.equals(user_id)) {

        // ❗ Check if notification already exists
            const existingNotif = await Notification.findOne({
                receiver: post.userId,
                sender: user_id,
                type: NOTIFICATION_TYPES.POST_LIKE,
                entityId: postId
            });

            // ❗ Only create notification if NONE exists
            if (!existingNotif) {
                await Notification.create({
                    receiver: post.userId,
                    sender: user_id,
                    type: NOTIFICATION_TYPES.POST_LIKE,
                    entityType: entityTypeOptions.POST,
                    entityId: postId,
                    message: "liked your post",
                });
            }
        }

    return (
            res
            .status(200)
            .json(new ApiResponse(200, newLike, "Like added successfully"))
        );
    }
}

const toggleCommentLike = async (req, res) => {

    const {commentId} = req.params
    const user_id = req.user._id
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId Id");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    const existingLike = await Like.findOne({ comment: commentId, likedBy: user_id });
    if (existingLike){
        
        const removeLike = await Like.findByIdAndDelete(existingLike._id);
        return (
            res
            .status(200)
            .json(new ApiResponse(200, removeLike, "Like removed successfully"))
        );
    }else{
        const newLike = await Like.create({ comment: commentId, likedBy: user_id});

        if (!comment.owner.equals(user_id)) {

        // ❗ Check if notification already exists
            const existingNotif = await Notification.findOne({
                receiver: comment.owner,
                sender: user_id,
                type: NOTIFICATION_TYPES.COMMENT_LIKE,
                entityId: commentId
            });

            // ❗ Only create notification if NONE exists
            if (!existingNotif) {
                await Notification.create({
                    receiver: comment.owner,
                    sender: user_id,
                    type: NOTIFICATION_TYPES.COMMENT_LIKE,
                    entityType: entityTypeOptions.COMMENT,
                    entityId: commentId,
                    message: "liked your comment",
                });
            }
        }
        return (
            res
            .status(200)
            .json(new ApiResponse(200, newLike, "Like added successfully"))
        );
    }
}


export {togglePostLike,toggleCommentLike}