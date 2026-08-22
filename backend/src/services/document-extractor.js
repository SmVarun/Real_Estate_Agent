import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";

const extractTextFromPdf = async (buffer) => {
  // pdf-parse takes ownership of the TypedArray it is given, so hand it a
  // copy instead of the pooled ArrayBuffer backing the incoming Buffer.
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};

const extractTextFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({
    buffer,
  });

  return result.value;
};

const extractTextFromSpreadsheet = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheets = workbook.SheetNames;

  return sheets
    .map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];

      return `\n--- Sheet: ${sheetName} ---\n${XLSX.utils.sheet_to_csv(
        sheet
      )}`;
    })
    .join("\n");
};

const extractTextFromTxt = (buffer) => {
  return buffer.toString("utf-8");
};

export const extractText = async ({ buffer, mimeType }) => {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPdf(buffer);

    case "text/plain":
      return extractTextFromTxt(buffer);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractTextFromDocx(buffer);

    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return extractTextFromSpreadsheet(buffer);

    default: {
      const error = new Error(
        `Text extraction is not supported for: ${mimeType}`
      );

      error.statusCode = 400;

      throw error;
    }
  }
};