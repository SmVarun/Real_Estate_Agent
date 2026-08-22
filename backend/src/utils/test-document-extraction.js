import Document from "../models/document.model.js";
import connectDatabase from "../config/mongodb.js";
import { chunkText } from "../services/text-chunking.service.js";
import { downloadDocumentFromS3 } from "../services/s3-document.service.js";
import { extractText } from "../services/document-extractor.js";

const test = async () => {
  try {
    await connectDatabase();

    const document = await Document.findOne({
      ingestionStatus: "PENDING",
    });

    if (!document) {
      throw new Error("No pending document found");
    }

    console.log("Document:", document.originalName);

    const buffer = await downloadDocumentFromS3({
      bucket: document.s3Bucket,
      key: document.s3Key,
    });

    console.log("Downloaded:", buffer.length, "bytes");

    const text = await extractText({
      buffer,
      mimeType: document.mimeType,
    });

    // making the chunks : 
    const chunks = chunkText({
  text,
  chunkSize: 1000,
  chunkOverlap: 200,
});

console.log("Total chunks:", chunks.length);

chunks.forEach((chunk, index) => {
  console.log(`\n========== CHUNK ${index + 1} ==========\n`);
  console.log(chunk);
});

    console.log("\n========== EXTRACTED TEXT ==========\n");
    console.log(text.slice(0, 5000));
    console.log("\n====================================\n");

    console.log("Extraction successful ✅");
  } catch (error) {
    console.error("Extraction failed ❌");
    console.error(error);
  }

  process.exit(0);
};

test();