import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Message, Conversation } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before");

    await dbConnect();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found or unauthorized" },
        { status: 404 },
      );
    }

    const query: any = { conversationId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "email firstName lastName image");

    return NextResponse.json({ data: messages.reverse() }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = id;
    const body = await req.json();
    const { text, attachments } = body;
    const hasText = text && text.trim() !== "";
    const hasAttachments =
      attachments && Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasAttachments) {
      return NextResponse.json(
        { message: "Message text or attachments are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found or unauthorized" },
        { status: 404 },
      );
    }

    const message = await Message.create({
      conversationId,
      sender: userId,
      text: text?.trim() || "",
      attachments: attachments || [],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    const populatedMessage = await message.populate(
      "sender",
      "email firstName lastName image",
    );

    return NextResponse.json({ data: populatedMessage }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 },
    );
  }
}
