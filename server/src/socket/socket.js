import { Server } from "socket.io";

let io;
const onlineUsers = new Map(); // store userId => socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  console.log("Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("🔥 New client connected:", socket.id);

    // When user comes online
    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected`);
    });

    // Send message event
    socket.on("sendMessage", (data) => {
      const { sender, receiver, message } = data;

      const receiverSocket = onlineUsers.get(receiver);

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", data);
      }
    });

    // Typing indicator
    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocket = onlineUsers.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { sender });
      }
    });

    // user left
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // remove from onlineUsers
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};

export const getIO = () => io;
