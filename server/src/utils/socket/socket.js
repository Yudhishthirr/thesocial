import { Server } from "socket.io";
import {User} from "../../models/user.model.js";

let io; // 🔥 GLOBAL IO INSTANCE

const activeUsers = new Map();
const typingUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("user_connected", async (userId) => {
      socket.userId = userId;
      activeUsers.set(userId.toString(), socket.id);
      socket.join(userId.toString());

      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("active_users", { userId, isOnline: true });
    });

    


    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (!userId) return;

      activeUsers.delete(userId.toString());
      await User.findByIdAndUpdate(userId, { isOnline: false });

      io.emit("active_users", { userId, isOnline: false });
    });

    


  });

  return io;
};

// 👇 EXPORT A GETTER
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export { initSocket, getIO,activeUsers  };
