import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from "../services/document.service.js";

// for the creation of the document 

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



