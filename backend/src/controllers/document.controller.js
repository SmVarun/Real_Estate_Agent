import { uploadDocument } from "../services/document.service.js";

export const uploadDocumentHandler = async (req, res, next) => {
  try {
    const document = await uploadDocument({
      file: req.file,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};