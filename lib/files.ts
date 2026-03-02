import mongoose from "mongoose";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import dbConnect from "./dbConnect";

export async function saveFile(file: File): Promise<{
  url: string;
  name: string;
  type: string;
  size: number;
}> {
  try {
    await dbConnect();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    const name = file.name || "uploaded-file";
    const ext = name.split(".").pop() || "bin";
    const uniqueName = `${Date.now()}-${randomUUID()}.${ext}`;

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const uploadStream = bucket.openUploadStream(uniqueName, {
      metadata: { contentType: file.type || "application/octet-stream" },
    });

    return new Promise((resolve, reject) => {
      stream
        .pipe(uploadStream)
        .on("finish", () => {
          resolve({
            url: `/api/file/${uniqueName}`,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
          });
        })
        .on("error", (error) => {
          console.error("GridFS upload error:", error);
          reject(new Error("Failed to save file to GridFS"));
        });
    });
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to save file");
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const filename = fileUrl.split("/").pop();
    if (!filename) return;

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return;

    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const files = await bucket.find({ filename }).toArray();
    if (files.length === 0) return;

    await bucket.delete(files[0]._id);
  } catch (error) {
    console.error("Error in deleteFile:", error);
  }
}

// To store files locally

// import { writeFile, mkdir, unlink, stat } from "fs/promises";
// import { join } from "path";
// import { randomUUID } from "crypto";

// export async function saveFile(file: File): Promise<{
//   url: string;
//   name: string;
//   type: string;
//   size: number;
// }> {
//   try {
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     const uploadDir = join(process.cwd(), "public", "uploads");
//     await mkdir(uploadDir, { recursive: true });

//     const name = file.name || "uploaded-file";
//     const ext = name.split(".").pop() || "bin";
//     const uniqueName = `${Date.now()}-${randomUUID()}.${ext}`;

//     const filePath = join(uploadDir, uniqueName);
//     await writeFile(filePath, buffer);

//     return {
//       url: `/api/file/${uniqueName}`,
//       name: file.name,
//       type: file.type || "application/octet-stream",
//       size: file.size,
//     };
//   } catch (error) {
//     console.error("Error saving file:", error);
//     throw new Error("Failed to save file");
//   }
// }

// export async function deleteFile(fileUrl: string): Promise<void> {
//   try {
//     const filename = fileUrl.split("/").pop();
//     if (!filename) return;

//     const filePath = join(process.cwd(), "public", "uploads", filename);

//     try {
//       await stat(filePath);
//       await unlink(filePath);
//     } catch (error: any) {
//       if (error.code !== "ENOENT") {
//         console.error("Error deleting file:", error);
//       }
//     }
//   } catch (error) {
//     console.error("Error in deleteFile:", error);
//   }
// }
