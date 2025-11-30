import { Block } from "../models/block.model.js";

export const checkBlock = async (req, res, next) => {
  try {

    const currentUser = req.user._id;

    const { followingId } = req.body || {};
    const { targetUserId, storyId } = req.params || {};

    let targetUser = followingId || targetUserId || null;


    console.log("Checking block between:", currentUser, "and", targetUser);
    if (!targetUser) return next();

    const block = await Block.findOne({
      $or: [
        { blocker: currentUser, blocked: targetUser },
        { blocker: targetUser, blocked: currentUser }
      ]
    });

    if (block) {
      return res.status(403).json({ message: "Access denied. User is blocked." });
    }

    next();
  } catch (err) {
    console.error("Error in checkBlock middleware:", err);
    res.status(500).json({ message: "Block check error" });
  }
};
