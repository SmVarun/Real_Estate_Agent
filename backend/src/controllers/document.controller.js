import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from "../services/document.service.js";

import { ingestDocument } from "../services/document-ingestion.service.js";

// for the creation of the document 

export const uploadDocumentHandler = async (req, res, next) => {
  try {
    const document = await uploadDocument({
      file: req.file,
      userId: req.user.id,
    });

    /*
     * Fired without awaiting: a single document can be dozens of
     * sequential Hugging Face embedding calls, and holding the upload
     * request open for that long would time out the client. The record
     * is returned as PENDING and the caller polls GET /documents/:id
     * for PROCESSING -> COMPLETED | FAILED.
     *
     * This is not a queue or a worker — it is the same process, and the
     * ingestion service still owns the status lifecycle. The catch only
     * exists because there is no response left to surface the error on;
     * ingestDocument has already recorded FAILED by the time it runs.
     */
    ingestDocument(document._id).catch((error) => {
      console.error(
        `[INGEST] background ingestion failed for ${document._id}:`,
        error.message
      );
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully. Ingestion has started.",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// get all document 

export const getDocumentsHandler = async (req, res, next) => {
  try {
    const documents = await getDocuments();

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};


// get one document 
export const getDocumentByIdHandler = async (req, res, next) => {
  try {
    const document = await getDocumentById(req.params.id);

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// delete a document 

export const deleteDocumentHandler = async (req, res, next) => {
  try {
    await deleteDocument(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};



