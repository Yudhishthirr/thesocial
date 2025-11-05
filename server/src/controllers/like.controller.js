import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

import {Comment} from "../models/comment.model.js"

import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"

import { Post } from "../models/post.model.js"

const togglePostLike = async (req, res) => {

    const {postId} = req.params
    const user_id = req.user._id
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid postId Id");
    }
    const video = await Post.findById(postId);
    if (!video) {
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
        return (
            res
            .status(200)
            .json(new ApiResponse(200, newLike, "Like added successfully"))
        );
    }
}

// const getLikedPost = asyncHandler(async (req, res) => {
    
//     const user_id = req.user._id
    
//     const video = await Tweet.findById(tweetId);
//     if (!video) {
//         throw new ApiError(404, "Video not found");
//     }
//     const existingLike = await Like.findOne({ tweet: tweetId, likedBy: user_id });
//     if (existingLike){
//         // User has already liked the video, so remove the like
//         const removeLike = await Like.findByIdAndDelete(existingLike._id);
//         return (
//             res
//             .status(200)
//             .json(new ApiResponse(200, removeLike, "Like removed successfully"))
//         );
//     }else{
//         const newLike = await Like.create({ tweet: tweetId, likedBy: user_id});
//         return (
//             res
//             .status(200)
//             .json(new ApiResponse(200, newLike, "Like added successfully"))
//         );
//     }
// })
export {togglePostLike,toggleCommentLike}