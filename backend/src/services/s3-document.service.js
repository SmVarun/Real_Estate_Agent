import { GetObjectCommand } from "@aws-sdk/client-s3";

import s3Client from "../config/s3.js";

export const downloadDocumentFromS3 = async ({
  bucket,
  key,
}) => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body) {
    const error = new Error("S3 object has no body");
    error.statusCode = 404;
    throw error;
  }

  const bytes = await response.Body.transformToByteArray();

  return Buffer.from(bytes);
};