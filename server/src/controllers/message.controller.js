

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {MESSAGE_STATUS} from "../models/message.model.js";


const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const senderId = req.user._id;
    const { text, messageType, sharedPost, sharedStory, replyTo } = req.body;

    // 1. Check conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(400, "Conversation not found");
      // return res.status(404).json({ message: "" });
    }

    // 2. Check if user is part of conversation
    if (!conversation.participants.includes(senderId)) {
       throw new ApiError(400, "Thrid Person Not allowed");
      // return res.status(403).json({ message: "Not allowed" });
    }

    // 3. Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      messageType,
      sharedPost,
      sharedStory,
      replyTo,
    });

    // 4. Update last message in conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    // 5. Populate sender for frontend
    const populated = await message.populate("sender", "username avatar");

    res.status(201).json(populated);
    return res
      .status(200)
      .json(new ApiResponse(200,populated,"message data"));
  } catch (error) {
    console.error("Send Message Error:", error);
    throw new ApiError(400, error);
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(400, "Conversation not found");
    }

    // Check user is participant
    if (!conversation.participants.includes(userId)) {
      throw new ApiError(400, "Thrid Person Not allowed");
     
    }

    // Fetch messages
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatar")
      .populate("replyTo")
      .sort({ createdAt: 1 });

   return res
      .status(200)
      .json(new ApiResponse(200,messages,"message fetch data"));
  } catch (error) {
    console.error("Get Messages Error:", error);
    throw new ApiError(400, "Get Messages Error");
    
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId }, // messages not sent by me
        status: MESSAGE_STATUS.SENT, // only update sent messages
      },
      { status: MESSAGE_STATUS.READ }
    );

    return res
      .status(200)
      .json(new ApiResponse(200,"Messages marked as read"));

  } catch (error) {
    console.error("Mark As Read Error:", error);
    throw new ApiError(400, "Mark As Read Error");
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Soft delete using deletedBy array
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
    }

    await message.save();

    res.json({ message: "Message deleted for you" });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { sendMessage, getMessages, markAsRead, deleteMessage };