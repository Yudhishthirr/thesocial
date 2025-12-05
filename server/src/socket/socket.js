

import { Server } from "socket.io";

let io;
const onlineUsers = new Map(); // store userId => socketId

export const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
    },
  });

  console.log("Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("🔥 New client connected:", socket.id);


    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected`);
    });

  
    socket.on("joinChat", ({ userId, otherUserId }) => {
      const roomId = [userId, otherUserId].sort().join("_");
      socket.join(roomId);
      console.log("Joined chat room:", roomId);
    });

    
    socket.on("sendMessage", (data) => {
      const { sender, recipient, text } = data;

      console.log("Message received:", data);

   
      const receiverSocket = onlineUsers.get(recipient);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          sender,
          text,
        });
      }


      const senderSocket = onlineUsers.get(sender);
      if (senderSocket) {
        io.to(senderSocket).emit("receiveMessage", {
          sender,
          text,
        });
      }
    });


    socket.on("typing", ({ sender, recipient }) => {
      const receiverSocket = onlineUsers.get(recipient);
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { sender });
      }
    });


    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

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
