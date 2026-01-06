

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Conversation,{ conversationTypes } from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {MESSAGE_STATUS} from "../models/message.model.js";
import { getIO,activeUsers } from "../utils/socket/socket.js";






const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const {
      text,
      messageType,
      sharedPost,
      sharedStory,
      replyTo,
      conversationId,
      otherUserId,
    } = req.body;

    let conversation;
    console.log("conversationId",conversationId)
    console.log("otherUserId",otherUserId)
    // 1️⃣ If conversationId exists → use it
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new ApiError(404, "Conversation not found");
      }
    }

    // 2️⃣ If NO conversation → first message → find or create DIRECT chat
    if (!conversation) {

      if (!otherUserId) {
        throw new ApiError(400, "otherUserId is required for first message");
      }

      conversation = await Conversation.findOne({
        conversationTypes: "DIRECT",
        participants: { $all: [senderId, otherUserId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          conversationTypes: "DIRECT",
          participants: [senderId, otherUserId],
        });
      }
    }

    // 3️⃣ Security check
    if (!conversation.participants.some(id => id.equals(senderId))) {
      throw new ApiError(403, "Third person not allowed");
    }

    // 4️⃣ Create message (IMPORTANT FIX)
    const message = await Message.create({
      conversation: conversation._id, // ❗ FIXED
      sender: senderId,
      text,
      messageType,
      sharedPost,
      sharedStory,
      replyTo,
    });

    // 5️⃣ Update lastMessage
    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await message.populate("sender", "username avatar");
    console.log("Populated Message:", populated);
  
    const io = getIO();

    const receivers = conversation.participants.filter(
      (id) => !id.equals(senderId)
    );
    console.log("Receivers:", receivers);
    
    receivers.forEach((receiverId) => {
      io.to(receiverId.toString()).emit("receive_message", {
        conversationId: conversation._id,
        message: populated,
      });
    });
    

    // 🔥 SOCKET EMIT (FIXED)
    // const io = getIO();

    // const receivers = conversation.participants.filter(
    //   (id) => !id.equals(senderId)
    // );

    // receivers.forEach((receiverId) => {
    //   const receiverSockets = activeUsers.get(receiverId.toString());

    //   if (receiverSockets) {
    //     receiverSockets.forEach((socketId) => {
    //       io.to(socketId).emit("receive_message", {
    //         conversationId: conversation._id,
    //         message: populated,
    //       });
    //     });
    //   }
    // });


    return res.status(201).json(
      new ApiResponse(201, {
        conversationId: conversation._id,
        message: populated,
      }, "Message sent successfully")
    );

  } catch (error) {
    console.error("Send Message Error:", error);
    throw new ApiError(400, error.message || "Send message failed");
  }
};


const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      // throw new ApiError(400, "Conversation not found");
      conversation = await Conversation.create({
          participants: [userId, otherUserId],
      });
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