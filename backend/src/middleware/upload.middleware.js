import multer from "multer";

const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Invalid file type. Only PDF, TXT, DOC, DOCX, XLS, and XLSX files are allowed."
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter,
});

export const uploadSingleDocument = upload.single("file");