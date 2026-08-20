import crypto from "crypto";
import path from "path";

import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import s3Client from "../config/s3.js";
import credential from "../config/config.js";
import Document from "../models/document.model.js";

const generateS3Key = (userId, originalName) => {
  const extension = path.extname(originalName);
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const uniqueId = crypto.randomUUID();

  return `documents/${userId}/${uniqueId}-${baseName}${extension}`;
};

export const uploadDocument = async ({ file, userId }) => {
  if (!file) {
    const error = new Error("File is required");
    error.statusCode = 400;
    throw error;
  }

  const s3Key = generateS3Key(userId, file.originalname);

  try {
    // Upload actual file to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: credential.awsbucketname,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    // Store only metadata in MongoDB
    const document = await Document.create({
      originalName: file.originalname,
      fileName: path.basename(s3Key),
      mimeType: file.mimetype,
      size: file.size,
      s3Key,
      s3Bucket: credential.awsbucketname,
      uploadedBy: userId,
      ingestionStatus: "PENDING",
    });

    return document;
  } catch (error) {
    // If MongoDB fails after S3 upload,
    // remove the orphaned S3 object.
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket:credential.awsbucketname,
          Key: s3Key,
        })
      );
    } catch (cleanupError) {
      console.error(
        "Failed to clean up S3 object:",
        cleanupError.message
      );
    }

    throw error;
  }
};