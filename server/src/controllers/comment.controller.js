import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Post} from "../models/post.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const addComment = async (req, res) => {

    const {postId} = req.params
    const user_id = req.user._id
    const {comment} = req.body
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post Id");
    }
    const video = await Post.findById(postId);
    if (!video) {
        throw new ApiError(404, "Post not found");
    }
    if (!comment) {
        throw new ApiError(404, "Please Enter comment");
    }
    const commentres = await Comment.create({content:comment,post:postId,owner:user_id});
    if (!commentres) {
        throw new ApiError(404, "post not found");
    }
    return (
        res
        .status(200)
        .json(new ApiResponse(200, commentres, "comment added successfully"))
    );    
}

const updateComment = async (req, res) => {

    const {commentId} = req.params
    const {content} = req.body
    const user_id = req.user._id
    console.log(content)
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalied comment id")
    }
    
    if(!content){
        throw new ApiError(400, "comment is requeird")
    }
    const findComment = await Comment.findById(commentId)
    if(!findComment){
        throw new ApiError(400,"Cant find comment")
    }
   
    if(findComment.owner.equals(user_id.toString()))
    {
        const updatedcomment = await Comment.findByIdAndUpdate(commentId,{$set:{content}},{new:true})
        if(!updatedcomment)
        {
            throw new ApiError(400, "comment not found")
        }else{
            return res
            .status(200)
            .json(new ApiResponse(200,updatedcomment,"comment updated successfully"))
        }
    }else{
        throw new ApiError(400, "Only can owner update comment")
    }    
}

const deleteComment = async (req, res) => {

    const {commentId} = req.params
    const user_id = req.user._id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalied comment id")
    }
    const findComment = await Comment.findById(commentId)
    if(!findComment){
        throw new ApiError(400,"Cant find comment")
    }
    
    if(findComment.owner.equals(user_id.toString()))
    {
        const deletecomment = await Comment.deleteOne({_id:commentId})
        if(!deletecomment)
        {
            throw new ApiError(400, "failled to delet comment")
        }else{
            return res
            .status(200)
            .json(new ApiResponse(200,deletecomment,"comment deleted successfully"))
        }
    }else{
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
  
    const Comments = await Comment.find({ post: id });
    console.log(Comments)

    if (!Array.isArray(Comments) || Comments.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "No posts found"));
    }
    
  
    return res
      .status(200)
      .json(new ApiResponse(200, "Comments fetched successfully", Comments));
  };
  

export {addComment,updateComment,deleteComment,getComments}