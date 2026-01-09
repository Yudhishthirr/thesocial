// routes/message.routes.js
import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  chatWithAI
} from "../controllers/message.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { Router } from 'express';

const router = Router();

// Send a message
router.post("/", verifyJWT,sendMessage);

// Get all messages of a conversation
router.get("/:otherUserId",verifyJWT, getMessages);

// Mark messages as read
router.put("/read/:conversationId",verifyJWT, markAsRead);

// Delete a message
router.delete("/:messageId",verifyJWT, deleteMessage);


// Ai 

router.post("/ai", verifyJWT,chatWithAI);

export default router;
