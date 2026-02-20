import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Conversation, User } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "email firstName lastName image")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ data: conversations }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { message: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { otherUserId, isGroup, members, name } = body;

    await dbConnect();

    if (isGroup) {
      if (!members || members.length < 2 || !name) {
        return NextResponse.json(
          { message: "Invalid data for group chat" },
          { status: 400 },
        );
      }

      const newConversation = await Conversation.create({
        name,
        isGroup: true,
        participants: [userId, ...members],
        groupAdmin: userId,
      });

      const populatedConversation = await newConversation.populate(
        "participants",
        "email firstName lastName image",
      );

      return NextResponse.json(
        { data: populatedConversation },
        { status: 201 },
      );
    }

    if (!otherUserId) {
      return NextResponse.json(
        { message: "Other user ID is required" },
        { status: 400 },
      );
    }

    const currentUser = await User.findById(userId);
    if (
      !currentUser?.connections?.some((id) => id.toString() === otherUserId)
    ) {
      return NextResponse.json(
        {
          message:
            "You must be connected with this user to start a conversation",
        },
        { status: 403 },
      );
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId], $size: 2 },
      isGroup: false,
    })
      .populate("participants", "email firstName lastName image")
      .populate("lastMessage");

    if (conversation) {
      return NextResponse.json({ data: conversation }, { status: 200 });
    }

    conversation = await Conversation.create({
      participants: [userId, otherUserId],
      isGroup: false,
    });

    conversation = await conversation.populate(
      "participants",
      "email firstName lastName image",
    );

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { message: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
