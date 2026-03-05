import mongoose from "mongoose";
import { string } from "zod";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: string,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: string,
      required: true,
    },
    status: {
      type: string,
      enum: ["open", "fulfilled"],
      default: "open",
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
