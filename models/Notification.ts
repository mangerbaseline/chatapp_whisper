import mongoose from "mongoose";

export interface INotification extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  type: "new_ticket" | "ticket_message" | "new_refund_request";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["new_ticket", "ticket_message", "new_refund_request"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);
