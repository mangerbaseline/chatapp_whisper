import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Message } from "@/models";
import mongoose from "mongoose";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;
    const { emoji } = await req.json();

    if (!emoji) {
      return NextResponse.json(
        { message: "Emoji is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 },
      );
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    const reactionIndex = message.reactions.findIndex(
      (r: any) => r.emoji === emoji,
    );

    if (reactionIndex > -1) {
      const userIndex =
        message.reactions[reactionIndex].users.indexOf(userIdObj);

      if (userIndex > -1) {
        message.reactions[reactionIndex].users.splice(userIndex, 1);

        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        message.reactions[reactionIndex].users.push(userIdObj);
      }
    } else {
      message.reactions.push({
        emoji,
        users: [userIdObj],
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId).populate(
      "sender",
      "firstName lastName email image",
    );

    return NextResponse.json(
      { message: "Reaction updated", data: updatedMessage },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating reaction:", error);
    return NextResponse.json(
      { message: "Failed to update reaction" },
      { status: 500 },
    );
  }
}
