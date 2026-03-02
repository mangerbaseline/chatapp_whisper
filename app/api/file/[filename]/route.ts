import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 },
      );
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const files = await bucket.find({ filename }).toArray();
    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(file._id);

    return new NextResponse(downloadStream as any, {
      headers: {
        "Content-Type":
          file.metadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file from GridFS:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// for local file fetching

// import { NextRequest, NextResponse } from "next/server";
// import { join } from "path";
// import { readFile, stat } from "fs/promises";

// const getMimeType = (filename: string) => {
//   const ext = filename.split(".").pop()?.toLowerCase();
//   switch (ext) {
//     case "jpg":
//     case "jpeg":
//       return "image/jpeg";
//     case "png":
//       return "image/png";
//     case "gif":
//       return "image/gif";
//     case "webp":
//       return "image/webp";
//     case "svg":
//       return "image/svg+xml";
//     case "pdf":
//       return "application/pdf";
//     case "mp4":
//       return "video/mp4";
//     case "webm":
//       return "video/webm";
//     case "mp3":
//       return "audio/mpeg";
//     case "json":
//       return "application/json";
//     case "txt":
//       return "text/plain";
//     default:
//       return "application/octet-stream";
//   }
// };

// export async function GET(
//   _request: NextRequest,
//   { params }: { params: Promise<{ filename: string }> },
// ) {
//   try {
//     const { filename } = await params;

//     if (
//       filename.includes("..") ||
//       filename.includes("/") ||
//       filename.includes("\\")
//     ) {
//       return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
//     }

//     const filePath = join(process.cwd(), "public", "uploads", filename);

//     try {
//       await stat(filePath);
//     } catch (err) {
//       return NextResponse.json({ error: "File not found" }, { status: 404 });
//     }
//     const fileBuffer = await readFile(filePath);
//     const mimeType = getMimeType(filename);

//     return new NextResponse(fileBuffer, {
//       headers: {
//         "Content-Type": mimeType,
//         "Cache-Control": "public, max-age=31536000, immutable",
//       },
//     });
//   } catch (error) {
//     console.error("Error serving file:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 },
//     );
//   }
// }
