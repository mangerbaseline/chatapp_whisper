import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Message, Conversation } from "@/models";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

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

    if (!message.sender || message.sender.toString() !== userId) {
      return NextResponse.json(
        { message: "You can only delete your own messages" },
        { status: 403 },
      );
    }

    if (message.isPinned) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $unset: { pinnedMessage: 1 },
      });
    }

    await Message.findByIdAndDelete(messageId);

    return NextResponse.json(
      { message: "Message deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { message: "Failed to delete message" },
      { status: 500 },
    );
  }
}
