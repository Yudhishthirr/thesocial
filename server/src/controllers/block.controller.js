

import {Block} from "../models/block.model.js"
import {Follow} from "../models/followers.model.js"
import {POWER_TYPE, ACCOUNT_TYPES} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const blockUser = async (req, res) => {
  try {
    const blocker = req.user._id;
    const currentUserPowerType = req.user?.accountPower;
    const { blocked } = req.params;

    // ❌ Cannot block yourself
    if (blocker.toString() === blocked) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    // ❌ Target user with ULTRA account cannot be blocked
    if (currentUserPowerType === POWER_TYPE.ULTRA) {
      return res.status(400).json({ message: "You cannot block this account" });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({ blocker, blocked });

    // ==========================
    // 🟦 ALREADY BLOCKED → UNBLOCK
    // ==========================
    if (existingBlock) {
      await Block.deleteOne({ blocker, blocked });
      return res.status(200).json(
        new ApiResponse(200, null, "User unblocked successfully")
      );
    }

    // ==========================
    // 🟥 NOT BLOCKED → BLOCK
    // ==========================
    await Block.create({ blocker, blocked });

    // Remove any follow relations between both users
   

    // Remove any follow relations between both users
    await Follow.updateOne(
      { user: blocker },
      {
        $pull: {
          followers: blocked,
          following: blocked,
        },
      }
    );

    await Follow.updateOne(
      { user: blocked },
      {
        $pull: {
          followers: blocker,
          following: blocker,
        },
      }
    );


    return res.status(200).json(
      new ApiResponse(200, null, "User blocked successfully")
    );

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error toggling block" });
  }
};

export { blockUser };