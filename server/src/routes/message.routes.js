// routes/message.routes.js
import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
} from "../controllers/message.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { Router } from 'express';

const router = Router();

// Send a message
router.post("/:conversationId", verifyJWT,sendMessage);

// Get all messages of a conversation
router.get("/:conversationId",verifyJWT, getMessages);

// Mark messages as read
router.put("/read/:conversationId",verifyJWT, markAsRead);

// Delete a message
router.delete("/:messageId",verifyJWT, deleteMessage);

export default router;
