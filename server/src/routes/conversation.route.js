
import {
  createDirectConversation,
  createGroupConversation,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { Router } from 'express';

const router = Router();
// Create / find DM
router.post("/direct/:otherUserId", verifyJWT,createDirectConversation);

// Create group chat
router.post("/group", verifyJWT,createGroupConversation);

// Get user's chat list
router.get("/",verifyJWT, getUserConversations);

export default router;
