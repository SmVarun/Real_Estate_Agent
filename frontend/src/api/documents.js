import { api } from "./client.js";
import { normalizeDocument } from "./normalize.js";

/*
 * /api/v1/documents — admin only.
 *
 * Upload kicks off the ingestion pipeline (S3 -> extract -> chunk ->
 * embed -> Chroma) in the background and returns immediately with the
 * record in PENDING. Status is polled from the list.
 */

export const listDocuments = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/documents", { signal });
  return (response.data || []).map(normalizeDocument);
};

export const getDocument = async (id, { signal } = {}) => {
  const response = await api.get(`/api/v1/documents/${id}`, { signal });
  return normalizeDocument(response.data);
};

/*
 * Multipart, not JSON — a file cannot be JSON encoded. The field name
 * must be "file" to match the backend's multer single() config, and
 * the client deliberately leaves Content-Type unset so the browser
 * can add the multipart boundary.
 */
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/v1/documents", formData);
  return normalizeDocument(response.data);
};

export const deleteDocument = (id) => api.delete(`/api/v1/documents/${id}`);
