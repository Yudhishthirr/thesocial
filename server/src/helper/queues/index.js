import { Queue } from "bullmq";
import { connection } from "../redis.js";

export const notificationQueue = new Queue("notificationQueue", {
  connection,
});


export const deadQueue = new Queue("emailDeadQueue", {
  connection,
});
