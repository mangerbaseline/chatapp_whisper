import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Conversation } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: paramsId } = await params;
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const conversation = await Conversation.findOne({
      _id: paramsId,
      participants: userId,
    }).populate("participants", "email firstName lastName image");

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: conversation }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { message: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}
