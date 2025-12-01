
import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/send", verifyJWT, sendMessage);
router.get("/:userId", verifyJWT, getMessages);

export default router;
