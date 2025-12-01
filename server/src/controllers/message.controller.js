import Message from "../models/message.model.js";
import { getIO } from "../socket/socket.js";
import mongoose from "mongoose";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const sendMessage = async (req, res) => {
  try {
    const { recipient, text } = req.body;
    const sender = req.user._id;

    const msg = await Message.create({
      sender,
      recipient,
      text:"Hello there!"
    });

    const io = getIO();
    io.emit("newMessage", msg); 

    res.status(201).json({
      success: true,
      message: msg,
    });
  } catch (error) {
    
    throw new ApiError(400, "Failed to send", error);
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;        
    const otherUserId = req.params.userId;
    const page = Number(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

  
    if (!otherUserId) {
      throw new ApiError(400, "User ID required", error);
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],

     
      $nor: [
        { isDeletedForSender: true, sender: userId },
        { isDeletedForReceiver: true, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 }) 
      .skip(skip)
      .limit(limit)
      .populate("sharedPost")    
      .populate("sharedStory")
      .populate("sharedReel")
      .lean();

   

    return res.status(200).json(new ApiResponse(200, "Post fetched successfully", messages));

  } catch (error) {
    console.error("Get Messages Error:", error);
    throw new ApiError(400, "Failed to fetch messages", error);
    
  }
};


export { sendMessage, getMessages };