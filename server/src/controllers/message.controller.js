

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Conversation,{ conversationTypes } from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import {MESSAGE_STATUS} from "../models/message.model.js";
import { getIO,activeUsers } from "../utils/socket/socket.js";
import { buildSystemPrompt } from "../utils/ai/buildSystemPrompt.js";
import { User } from "../models/user.model.js";

import { aiProfileSchema } from "../models/aiProfile.js";
import { generateGeminiReply } from "../utils/ai/gemini.js";

const chatWithAI = async (req, res) => {
  try {
    const senderId = req.user._id;

    // const {
    //   text,
    //   otherUserId,        // ONLY for first message
    //   conversationId,     // used after first message
    //   sharedPost,
    //   sharedStory,
    //   replyTo,
    //   messageType = "TEXT",
    // } = req.body;
    const {text,otherUserId,conversationId,sharedPost,sharedStory,replyTo,messageType} = req.body;
    if (!text?.trim()) {
      throw new ApiError(400, "Message text is required");
    }

    let conversation;

    /* ────────────────────────────────
       1️⃣ FIND OR CREATE CONVERSATION
    ──────────────────────────────── */

    // CASE A: conversation already exists
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new ApiError(404, "Conversation not found");
      }
    }

    // CASE B: first message → create conversation
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

    /* ────────────────────────────────
       2️⃣ SECURITY CHECK
    ──────────────────────────────── */
    if (!conversation.participants.some(id => id.equals(senderId))) {
      throw new ApiError(403, "Third person not allowed");
    }

    /* ────────────────────────────────
       3️⃣ SAVE USER MESSAGE
    ──────────────────────────────── */
    const userMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      text,
      messageType,
      sharedPost,
      sharedStory,
      replyTo,
    });

    conversation.lastMessage = userMessage._id;
    await conversation.save();

  
    const aiUserId = conversation.participants.find(
      (id) => !id.equals(senderId)
    );

    if (!aiUserId) {
      throw new ApiError(400, "AI participant not found");
    }

    const aiUser = await User.findById(aiUserId).select("isAi");

    if (!aiUser?.isAi) {
      throw new ApiError(400, "Conversation does not contain a valid AI user");
    }

  
    const aiProfile = await aiProfileSchema.findOne({
      ownerUserId: aiUserId,
    });

    if (!aiProfile) {
      throw new ApiError(400, "AI profile not found");
    }

   
    const memories = [];
    
    const finalSystemPrompt = buildSystemPrompt(
      aiProfile,
      memories,
    );
    console.log("Final System Prompt:", finalSystemPrompt);
    
    const aiReplyText = await generateGeminiReply({
      systemPrompt: finalSystemPrompt,
      userMessage: text,
      // generationConfig: aiProfile.generationConfig,
    });

    console.log("AI Reply Text:", aiReplyText);
    

    
    const aiMessage = await Message.create({
      conversation: conversation._id,
      sender: aiUserId,             
      text: aiReplyText,
    });

    conversation.lastMessage = aiMessage._id;
    await conversation.save();

  
    return res.status(201).json(
      new ApiResponse(201, {
        conversationId: conversation._id,
        message: aiMessage,
      }, "Message sent successfully")
    );

  } catch (error) {
    console.error("chatWithAI Error:", error);

    return res.status(error.statusCode || 500).json(
      new ApiResponse(
        error.statusCode || 500,
        null,
        error.message || "AI chat failed"
      )
    );
  }
};


// const chatWithAI = async (req, res) => {
//   try {
//     const senderId = req.user._id;
//     const {text,otherUserId,conversationId,sharedPost,sharedStory,replyTo,messageType} = req.body;

//     let conversation;
//     console.log("conversationId",conversationId)
//     console.log("otherUserId",otherUserId)
   
//     if (conversationId) {
//       conversation = await Conversation.findById(conversationId);

//       if (!conversation) {
//         throw new ApiError(404, "Conversation not found");
//       }
//     }

//     // 2️⃣ If NO conversation → first message → find or create DIRECT chat
//     if (!conversation) {

//       if (!otherUserId) {
//         throw new ApiError(400, "otherUserId is required for first message");
//       }

//       conversation = await Conversation.findOne({
//         conversationTypes: "DIRECT",
//         participants: { $all: [senderId, otherUserId] },
//       });

//       if (!conversation) {
//         conversation = await Conversation.create({
//           conversationTypes: "DIRECT",
//           participants: [senderId, otherUserId],
//         });
//       }
//     }

//     // 3️⃣ Security check
//     if (!conversation.participants.some(id => id.equals(senderId))) {
//       throw new ApiError(403, "Third person not allowed");
//     }

//     // 4️⃣ Create message (IMPORTANT FIX)
//     const message = await Message.create({
//       conversation: conversation._id, // ❗ FIXED
//       sender: senderId,
//       text,
//       messageType,
//       sharedPost,
//       sharedStory,
//       replyTo,
//     });

//     // 5️⃣ Update lastMessage
//     conversation.lastMessage = message._id;
//     await conversation.save();

//     // ai works 






//     const aiUser = await User.findById(otherUserId).populate("aiProfile");
//     // console.log("AI User:", aiUser);

//     if (!aiUser || !aiUser.isAi || !aiUser.aiProfile) {
//       throw new ApiError(400, "Target user is not a valid AI profile");
//     }

//     const aiProfile = aiUser.aiProfile;
//     // console.log("AI Profile:", aiProfile);

//     const memories = []; 
//     // console.log("Memories:", memories);


//     const finalSystemPrompt = buildSystemPrompt(aiProfile,memories);

//     console.log("Final System Prompt:", finalSystemPrompt);



//     const populated = await message.populate("sender", "username avatar");
//     // console.log("Populated Message:", populated);

//     return res.status(201).json(
//       new ApiResponse(201, {
//         conversationId: conversation._id,
//         message: populated,
//       }, "Message sent successfully")
//     );

//   } catch (error) {
//     console.error("Send Message Error:", error);
//     throw new ApiError(400, error.message || "Send message failed");
//   }
// };



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
    const userId = req.user._id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      throw new ApiError(400, "otherUserId is required");
    }

    // 1️⃣ Find conversation using both users
    let conversation = await Conversation.findOne({
      conversationTypes: "DIRECT",
      participants: { $all: [userId, otherUserId] },
    });

    // 2️⃣ If no conversation → create one
    if (!conversation) {
      conversation = await Conversation.create({
        conversationTypes: "DIRECT",
        participants: [userId, otherUserId],
      });
    }

    // 3️⃣ Security check (ObjectId safe)
    if (!conversation.participants.some(id => id.equals(userId))) {
      throw new ApiError(403, "Third person not allowed");
    }

    // 4️⃣ Fetch messages
    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "username avatar")
      .populate("replyTo")
      .sort({ createdAt: 1 });

    // 5️⃣ Response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          conversationId: conversation._id,
          messages,
        },
        "Messages fetched successfully"
      )
    );

  } catch (error) {
    console.error("Get Messages Error:", error);

    return res.status(error.statusCode || 500).json(
      new ApiResponse(
        error.statusCode || 500,
        null,
        error.message || "Get Messages Error"
      )
    );
  }
};


// const getMessages = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const userId = req.user._id;

//     // Check conversation exists
//     const conversation = await Conversation.findById(conversationId);
//     if (!conversation) {
//       // throw new ApiError(400, "Conversation not found");
//       conversation = await Conversation.create({
//           participants: [userId, otherUserId],
//       });
//     }

//     // Check user is participant
//     if (!conversation.participants.includes(userId)) {
//       throw new ApiError(400, "Thrid Person Not allowed");
     
//     }

//     // Fetch messages
//     const messages = await Message.find({ conversation: conversationId })
//       .populate("sender", "username avatar")
//       .populate("replyTo")
//       .sort({ createdAt: 1 });

//    return res
//       .status(200)
//       .json(new ApiResponse(200,messages,"message fetch data"));
//   } catch (error) {
//     console.error("Get Messages Error:", error);
//     throw new ApiError(400, "Get Messages Error");
    
//   }
// };

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

export { sendMessage, getMessages, markAsRead, deleteMessage,chatWithAI };