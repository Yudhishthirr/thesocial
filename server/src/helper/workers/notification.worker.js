import { Worker } from "bullmq";
import mongoose from "mongoose";
import { connection } from "../redis.js";
import connectDB from "../../db/dbconfig.js";

import {
  Notification,
  NOTIFICATION_TYPES,
  entityTypeOptions,
} from "../../models/notification.model.js";
import { User } from "../../models/user.model.js";
import { deadQueue } from "../queues/index.js"; // ✅ IMPORT


const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// https://exp.host/--/api/v2/push/send

const startWorker = async () => {
  try {
    await connectDB();
    console.log("✅ Worker MongoDB connected");

    const worker = new Worker(
      "notificationQueue",
      async (job) => {
        try {
          const { receiver, sender, entityId } = job.data;

          const notification = await Notification.create({
            receiver: new mongoose.Types.ObjectId(receiver),
            sender: new mongoose.Types.ObjectId(sender),
            type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
            entityType: entityTypeOptions.FOLLOW,
            entityId: new mongoose.Types.ObjectId(entityId),
            notificationMessage: "sent you a follow request",
          });

          console.log("✅ Notification inserted:", notification._id);


           // 2️⃣ Get receiver push token
          const receiverUser = await User.findById(receiver).select("expoPushToken");

          if (!receiverUser?.expoPushToken) {
            console.log("⚠️ No Expo push token found for user:", receiver);
            return notification;
          }

          // 3️⃣ Send Expo Push Notification (OFFLINE CASE)
          const pushPayload = {
            to: receiverUser.expoPushToken,
            sound: "default",
            title: "New Follow Request",
            body: "Someone sent you a follow request",
            data: {
              type: NOTIFICATION_TYPES.FOLLOW_REQUEST,
              entityId,
              sender,
            },
          };

          const pushRes = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(pushPayload),
          });

          const pushResult = await pushRes.json();
          console.log("📲 Expo push response:", pushResult);

          return notification;





          // return notification;

        } catch (err) {
          console.error("❌ Job processing error:", err.message);
          throw err;
        }
      },
      { connection }
    );

    console.log("👷 Notification worker started");

    // 🔥 DLQ handling
    worker.on("failed", async (job, err) => {
      console.error(`❌ Job ${job.id} failed`, err.message);

      if (job.attemptsMade >= job.opts.attempts) {
        await deadQueue.add("NOTIFICATION_DLQ", {
          originalJobId: job.id,
          name: job.name,
          data: job.data,
          error: err.message,
          failedAt: new Date(),
        });

        console.log("☠️ Job moved to Dead Letter Queue");
      }
    });

  } catch (err) {
    console.error("❌ Worker startup failed:", err);
    process.exit(1);
  }
};

startWorker();
