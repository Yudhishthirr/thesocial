
import Conversation, { conversationTypes } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const createDirectConversation = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { otherUserId } = req.params;

    if (userId.toString() === otherUserId.toString()) {

      throw new ApiError(400, "Cannot chat with yourself");
    }

    const checkUserExsit = await User.findById(otherUserId);
    if(!checkUserExsit){
      throw new ApiError(400, "User not found");
    }
    // 1. Find if DM already exists
    let conversation = await Conversation.findOne({
      conversationTypes: conversationTypes.DIRECT,
      participants: {
        $all: [userId, otherUserId],
        $size: 2,
      },
    }).populate("participants", "username avatar")



    if (conversation) {
      return res
      .status(200)
      .json(new ApiResponse(200,conversation,"conversation already exists"));
    }

    // 3. Create new DM conversation
    conversation = await Conversation.create({
      participants: [userId, otherUserId],
    });

    const populated = await conversation.populate(
      "participants", "username avatar"
    );

    return res
      .status(200)
      .json(new ApiResponse(200,populated,"conversation data"));
  } catch (error) {
    console.error("Create DM Error:", error);
    throw new ApiError(400, error)
  }
};

const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200,conversations,"conversation data"));
  } catch (error) {
    console.error("Get Conversations Error:", error);
    throw new ApiError(400, error)
  }
};


const createGroupConversation = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { name, image, members } = req.body;

    if (!members || members.length < 2) {
      return res.status(400).json({
        message: "Group must have at least 2 members",
      });
    }

    const conversation = await Conversation.create({
      type: "GROUP",
      groupName: name,
      groupImage: image,
      participants: [creatorId, ...members],
      admins: [creatorId],
    });

    const populated = await conversation.populate(
      "participants",
      "username avatar"
    );

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create Group Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createDirectConversation,getUserConversations,createGroupConversation };