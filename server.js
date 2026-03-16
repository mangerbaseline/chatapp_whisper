const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("No cookies found"));
    }

    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      return next(new Error("No auth token"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  const userSockets = new Map();
  const activeCalls = new Map();

  function getUserModel() {
    const mongoose = require("mongoose");
    if (mongoose.models.User) return mongoose.models.User;
    const UserSchema = new mongoose.Schema(
      {
        lastSeen: { type: Date, default: Date.now },
        consecutiveLoginDays: { type: Number, default: 0 },
        lastLoginDate: { type: Date, default: Date.now },
        isDeactivated: { type: Boolean, default: false },
        deactivatedAt: { type: Date, default: null },
        connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      { timestamps: true, strict: false },
    );
    return mongoose.model("User", UserSchema);
  }

  function getMessageModel() {
    const mongoose = require("mongoose");
    if (mongoose.models.Message) return mongoose.models.Message;
    const MessageSchema = new mongoose.Schema(
      {
        conversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Conversation",
        },
        isPinned: { type: Boolean, default: false },
        text: String,
      },
      { timestamps: true, strict: false },
    );
    return mongoose.model("Message", MessageSchema);
  }

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    userSockets.set(socket.userId, socket.id);

    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState === 1) {
        const UserModel = getUserModel();
        await UserModel.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
        });
      }
    } catch (err) {
      console.error("[lastSeen update error]", err);
    }

    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit("online_users_list", { userIds: onlineUserIds });

    io.emit("user_online", { userId: socket.userId });

    socket.on("join_conversation", ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(
        `User ${socket.userId} joined conversation ${conversationId}`,
      );

      const activeCall = activeCalls.get(conversationId);
      if (activeCall && !activeCall.participants.has(socket.userId)) {
        socket.emit("call:active", {
          conversationId,
          isVideo: activeCall.isVideo,
          isGroup: activeCall.isGroup,
          participantCount: activeCall.participants.size,
        });
      }
    });

    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    socket.on("join_admin", () => {
      socket.join("admins");
      console.log(`User ${socket.userId} joined admins room`);
    });

    socket.on("admin:notify", (payload) => {
      io.to("admins").emit("admin:new_notification", payload);
    });

    socket.on("send_message", async (data) => {
      const { conversationId, message } = data;
      console.log(`User ${socket.userId} sent message in ${conversationId}`);

      const payload = {
        ...message,
      };

      if (!payload.sender) {
        payload.sender = socket.userId;
      }

      io.to(`conversation:${conversationId}`).emit("new_message", payload);
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    socket.on("mark_read", ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit("message_read", {
        messageId,
        readBy: socket.userId,
      });
    });

    socket.on("send_invite", ({ receiverId, invitation }) => {
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("invite:received", invitation);
      }
    });

    socket.on("accept_invite", ({ senderId, invitation }) => {
      const senderSocketId = userSockets.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("invite:accepted", invitation);
      }
    });

    socket.on("reject_invite", ({ senderId, invitation }) => {
      const senderSocketId = userSockets.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("invite:rejected", invitation);
      }
    });

    socket.on(
      "conversation_created",
      ({ conversation, otherUserId, participantIds }) => {
        const targetIds = participantIds || (otherUserId ? [otherUserId] : []);

        socket.emit("new_conversation", conversation);

        targetIds.forEach((id) => {
          if (id !== socket.userId) {
            const targetSocketId = userSockets.get(id);
            if (targetSocketId) {
              io.to(targetSocketId).emit("new_conversation", conversation);
            }
          }
        });
      },
    );

    socket.on(
      "call:initiate",
      ({ conversationId, participants, callerInfo, isVideo, isGroup }) => {
        console.log(
          `[SERVER] call:initiate in ${conversationId} from ${socket.userId}`,
        );

        activeCalls.set(conversationId, {
          isVideo: !!isVideo,
          isGroup: !!isGroup,
          participants: new Set([socket.userId]),
        });

        // Broadcast to everyone in the conversation that a call has started
        io.to(`conversation:${conversationId}`).emit("call:active", {
          conversationId,
          isVideo: !!isVideo,
          isGroup: !!isGroup,
          participantCount: 1,
        });

        participants.forEach((p) => {
          if (p.id !== socket.userId) {
            const targetSocketId = userSockets.get(p.id);
            if (targetSocketId) {
              io.to(targetSocketId).emit("call:incoming", {
                conversationId,
                participants,
                callerId: socket.userId,
                callerInfo,
                isVideo: !!isVideo,
                isGroup: !!isGroup,
              });
            }
          }
        });
      },
    );

    socket.on("call:join", ({ conversationId, userInfo }) => {
      console.log(
        `[SERVER] User ${socket.userId} joined call in ${conversationId}`,
      );

      const activeCall = activeCalls.get(conversationId);
      if (activeCall) {
        activeCall.participants.add(socket.userId);

        // Broadcast updated participant count
        io.to(`conversation:${conversationId}`).emit("call:active", {
          conversationId,
          isVideo: activeCall.isVideo,
          isGroup: activeCall.isGroup,
          participantCount: activeCall.participants.size,
        });
      }

      socket.to(`conversation:${conversationId}`).emit("call:peer_joined", {
        userId: socket.userId,
        userInfo,
      });
    });

    socket.on("call:accept", ({ conversationId, callerId, receiverInfo }) => {
      console.log(
        `[SERVER] Call accepted by ${socket.userId} in ${conversationId}`,
      );
      const callerSocketId = userSockets.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:accepted", {
          receiverId: socket.userId,
          receiverInfo,
        });
      }
    });

    socket.on("call:reject", ({ conversationId, callerId }) => {
      console.log(`Call rejected by ${socket.userId} in ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit("call:rejected", {
        receiverId: socket.userId,
      });
    });

    socket.on("call:leave", ({ conversationId }) => {
      console.log(
        `[SERVER] User ${socket.userId} left call in ${conversationId}`,
      );

      const activeCall = activeCalls.get(conversationId);
      if (activeCall) {
        activeCall.participants.delete(socket.userId);
        if (activeCall.participants.size === 0) {
          activeCalls.delete(conversationId);
          // Broadcast that the call has ended
          io.to(`conversation:${conversationId}`).emit("call:active", {
            conversationId,
            ended: true,
          });
        } else {
          // Broadcast updated participant count
          io.to(`conversation:${conversationId}`).emit("call:active", {
            conversationId,
            isVideo: activeCall.isVideo,
            isGroup: activeCall.isGroup,
            participantCount: activeCall.participants.size,
          });
        }
      }

      socket.to(`conversation:${conversationId}`).emit("call:peer_left", {
        userId: socket.userId,
      });
    });

    socket.on("webrtc:offer", ({ to, offer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:offer", {
          from: socket.userId,
          offer,
        });
      }
    });

    socket.on("webrtc:answer", ({ to, answer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:answer", {
          from: socket.userId,
          answer,
        });
      }
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:ice-candidate", {
          from: socket.userId,
          candidate,
        });
      }
    });

    socket.on("webrtc:screen_offer", ({ to, offer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:screen_offer", {
          from: socket.userId,
          offer,
        });
      }
    });

    socket.on("webrtc:screen_answer", ({ to, answer }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:screen_answer", {
          from: socket.userId,
          answer,
        });
      }
    });

    socket.on("webrtc:screen_ice-candidate", ({ to, candidate }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:screen_ice-candidate", {
          from: socket.userId,
          candidate,
        });
      }
    });

    socket.on("call:end", ({ to }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        console.log(`Call ended by ${socket.userId} with ${to}`);
        io.to(targetSocketId).emit("call:ended", { from: socket.userId });
      }
    });

    socket.on("webrtc:screen_started", ({ to, trackId }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:screen_started", {
          from: socket.userId,
          trackId,
        });
      }
    });

    socket.on("webrtc:screen_stopped", ({ to }) => {
      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:screen_stopped", {
          from: socket.userId,
        });
      }
    });

    socket.on(
      "pin_message",
      async ({ conversationId, messageId, isPinned }) => {
        try {
          const MessageModel = getMessageModel();
          const mongoose = require("mongoose");
          const ConversationModel = mongoose.models.Conversation;

          if (isPinned) {
            await MessageModel.updateMany(
              { conversationId, isPinned: true },
              { isPinned: false },
            );

            await MessageModel.findByIdAndUpdate(messageId, { isPinned: true });

            if (ConversationModel) {
              await ConversationModel.findByIdAndUpdate(conversationId, {
                pinnedMessage: messageId,
              });
            }
          } else {
            await MessageModel.findByIdAndUpdate(messageId, {
              isPinned: false,
            });

            if (ConversationModel) {
              await ConversationModel.findByIdAndUpdate(conversationId, {
                $unset: { pinnedMessage: 1 },
              });
            }
          }

          io.to(`conversation:${conversationId}`).emit(
            "pinned_message_updated",
            {
              messageId: isPinned ? messageId : null,
              isPinned,
            },
          );
        } catch (err) {
          console.error("Pin message error:", err);
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId} (${socket.id})`);
      userSockets.delete(socket.userId);

      // Clean up any active calls this user was in
      activeCalls.forEach((call, conversationId) => {
        if (call.participants.has(socket.userId)) {
          call.participants.delete(socket.userId);
          // Notify remaining participants
          socket
            .to(`conversation:${conversationId}`)
            .emit("call:peer_left", { userId: socket.userId });

          if (call.participants.size === 0) {
            activeCalls.delete(conversationId);
            io.to(`conversation:${conversationId}`).emit("call:active", {
              conversationId,
              ended: true,
            });
          } else {
            io.to(`conversation:${conversationId}`).emit("call:active", {
              conversationId,
              isVideo: call.isVideo,
              isGroup: call.isGroup,
              participantCount: call.participants.size,
            });
          }
        }
      });

      io.emit("user_offline", { userId: socket.userId });
    });
  });

  let eventCheckInterval;

  async function checkUpcomingEvents() {
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        if (process.env.MONGODB_URI) {
          await mongoose.connect(process.env.MONGODB_URI);
          console.log("🔌 MongoDB connected in server.js interval");
        } else {
          return;
        }
      }

      const EventModel =
        mongoose.models.Event ||
        mongoose.model(
          "Event",
          new mongoose.Schema(
            {
              title: String,
              description: String,
              date: Date,
              startTime: String,
              endTime: String,
              organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              participants: [
                { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              ],
              color: String,
              status: {
                type: String,
                default: "scheduled",
              },
              notified: { type: Boolean, default: false },
            },
            { timestamps: true },
          ),
        );

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const candidates = await EventModel.find({
        date: { $gte: windowStart, $lte: windowEnd },
        notified: false,
        status: "scheduled",
      }).populate("organizer", "firstName lastName");

      for (const event of candidates) {
        const eventDatePart = event.date.toISOString().split("T")[0];
        const eventTimePart = event.startTime;
        const eventDateTime = new Date(`${eventDatePart}T${eventTimePart}:00`);

        if (isNaN(eventDateTime.getTime())) continue;

        if (eventDateTime <= now) {
          const allUserIds = [
            event.organizer?._id?.toString(),
            ...event.participants.map((p) => p.toString()),
          ].filter(Boolean);

          const uniqueIds = [...new Set(allUserIds)];

          uniqueIds.forEach((userId) => {
            const socketId = userSockets.get(userId);
            if (socketId) {
              io.to(socketId).emit("event:reminder", {
                eventId: event._id.toString(),
                title: event.title,
                description: event.description || "",
                startTime: event.startTime,
                organizer: event.organizer?.firstName
                  ? `${event.organizer.firstName} ${event.organizer.lastName || ""}`
                  : "Someone",
              });
            }
          });

          event.notified = true;
          await event.save();
          console.log(
            `[Event Reminder] Notified for event: ${event.title} at ${eventDateTime.toLocaleString()}`,
          );
        }
      }
    } catch (err) {
      console.error("[Event Reminder Error]", err);
    }
  }

  eventCheckInterval = setInterval(checkUpcomingEvents, 60 * 1000);

  async function checkDeactivation() {
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        if (process.env.MONGODB_URI) {
          await mongoose.connect(process.env.MONGODB_URI);
        } else {
          return;
        }
      }

      const UserModel = getUserModel();

      const now = new Date();
      const fortyFiveDaysAgo = new Date(
        now.getTime() - 45 * 24 * 60 * 60 * 1000,
      );

      const deactivatedResult = await UserModel.updateMany(
        {
          lastSeen: { $lt: fortyFiveDaysAgo },
          isDeactivated: { $ne: true },
        },
        {
          $set: {
            isDeactivated: true,
            deactivatedAt: now,
            consecutiveLoginDays: 0,
          },
        },
      );

      console.log(
        `[Deactivation Check] Deactivated: ${deactivatedResult.modifiedCount} users`,
      );
    } catch (err) {
      console.error("[Deactivation Check Error]", err);
    }
  }

  const activityCheckInterval = setInterval(
    checkDeactivation,
    24 * 60 * 60 * 1000,
  );

  const mongoose = require("mongoose");
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
        console.log("🔌 MongoDB connected in server.js");
        checkUpcomingEvents();
        checkDeactivation();
      })
      .catch((err) => console.error("[server.js] MongoDB connect error:", err));
  } else {
    checkUpcomingEvents();
    checkDeactivation();
  }

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server is running`);
    });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    clearInterval(eventCheckInterval);
    clearInterval(activityCheckInterval);
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
});
