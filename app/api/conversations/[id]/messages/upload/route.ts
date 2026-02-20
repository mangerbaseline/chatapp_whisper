import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Conversation } from "@/models";
import { saveFile } from "@/lib/files";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = id;

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

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files uploaded" },
        { status: 400 },
      );
    }

    const uploadedAttachments = [];

    for (const file of files) {
      try {
        const fileUrl = await saveFile(file);
        uploadedAttachments.push({
          url: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } catch (saveError) {
        console.error("Error saving individual file:", saveError);
        throw saveError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: uploadedAttachments,
        message: "Files uploaded successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload files",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
