import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Notification, User } from "@/models";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import { UserRole } from "@/models/User";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user || user.role !== UserRole.ADMIN) {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const unreadOnly = searchParams.get("unread") === "true";

  const query: any = { user: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return apiSuccess(200, notifications, "Fetched admin notifications");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { type, title, message, link, relatedId } = await req.json();

  if (!type || !title || !message || !link) {
    throw new ApiError(400, "Missing required fields");
  }

  const admins = await User.find({ role: UserRole.ADMIN }).select("_id");

  if (admins.length === 0) {
    return apiSuccess(200, [], "No admins to notify");
  }

  const notificationDocs = admins.map((admin) => ({
    user: admin._id,
    type,
    title,
    message,
    link,
    relatedId,
  }));

  const createdNotifications = await Notification.insertMany(notificationDocs);

  const socketPayload = {
    type,
    title,
    message,
    link,
    relatedId,
    createdAt: new Date().toISOString(),
  };

  return apiSuccess(201, socketPayload, "Notifications persisted successfully");
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  await dbConnect();
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const body = await req.json();
  const { notificationId, markAllRead } = body;

  if (markAllRead) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true },
    );
    return apiSuccess(
      200,
      { success: true },
      "All notifications marked as read",
    );
  }

  if (!notificationId) {
    throw new ApiError(400, "Notification ID is required");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return apiSuccess(200, notification, "Notification marked as read");
});
