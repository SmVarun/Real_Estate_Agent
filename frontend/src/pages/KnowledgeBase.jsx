import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Library,
  Loader2,
  RefreshCw,
} from "lucide-react";

import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import Badge from "../components/common/Badge.jsx";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
} from "../api/documents.js";
import { ApiError } from "../api/client.js";
import { useCrm } from "../context/CrmContext.jsx";
import { formatDateTime } from "../utils/helpers.js";
import {
  INGESTION_STATUS,
  INGESTION_STATUS_LABELS,
  isIngestionInProgress,
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "../constants/index.js";

/*
 * How often to re-check a document that is still being ingested.
 * Ingestion runs in the same process as the API and can take a while
 * on a long file, so this is a poll rather than a push.
 */
const POLL_INTERVAL_MS = 4000;

const STATUS_TONE = {
  [INGESTION_STATUS.PENDING]: "neutral",
  [INGESTION_STATUS.PROCESSING]: "neutral",
  [INGESTION_STATUS.COMPLETED]: "success",
  [INGESTION_STATUS.FAILED]: "danger",
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * The document library behind the AI assistant.
 *
 * Every status shown here is the backend's own `ingestionStatus`. A
 * file is never described as indexed until the server says COMPLETED —
 * uploading only starts the pipeline, it does not finish it.
 */
export default function KnowledgeBase() {
  const { pushToast } = useCrm();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async ({ signal, quiet = false } = {}) => {
    if (!quiet) {
      setLoading(true);
      setError(null);
    }

    try {
      const fetched = await listDocuments({ signal });
      setDocuments(fetched);
      return fetched;
    } catch (caught) {
      if (caught?.name === "AbortError") {
        return null;
      }

      /*
       * A background poll must not wipe the list that is already on
       * screen just because one refresh failed.
       */
      if (!quiet) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load the knowledge base."
        );
        setDocuments([]);
      }

      return null;
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  /*
   * Poll only while something is actually in flight, and stop as soon
   * as every document has reached a terminal status.
   *
   * A plain boolean rather than a derived object, so the effect below
   * re-runs when ingestion starts or finishes — not on every poll that
   * merely returns the same in-progress state.
   */
  const hasPendingWork = documents.some((document) =>
    isIngestionInProgress(document.ingestionStatus)
  );

  useEffect(() => {
    if (!hasPendingWork) {
      return undefined;
    }

    /*
     * No AbortController tied to this effect.
     *
     * Each poll updates `documents`, which recomputes hasPendingWork
     * and re-runs this effect. Aborting on cleanup would therefore
     * cancel the very request that reports COMPLETED, and the status
     * would never settle. `cancelled` guards the unmount case instead,
     * and the request itself is allowed to finish.
     */
    let cancelled = false;

    const timer = setInterval(() => {
      if (!cancelled) {
        load({ quiet: true });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [hasPendingWork, load]);

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];

    /*
     * Reset immediately so selecting the same file twice in a row
     * still fires a change event.
     */
    event.target.value = "";

    if (!file) return;

    /*
     * Checked here as well as on the server so an oversized file is
     * refused before it is uploaded, not after.
     */
    if (file.size > MAX_DOCUMENT_BYTES) {
      pushToast("That file is larger than the 10 MB limit.", "error");
      return;
    }

    setUploading(true);

    try {
      const created = await uploadDocument(file);

      setDocuments((current) => [created, ...current]);

      /*
       * Deliberately not "Indexed": at this point the backend has the
       * file and has started ingestion. The row's status badge will
       * report what actually happens.
       */
      pushToast(`${file.name} uploaded — indexing has started`);
    } catch (caught) {
      pushToast(
        caught instanceof ApiError ? caught.message : "Upload failed.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      await deleteDocument(confirmDelete.id);

      setDocuments((current) =>
        current.filter((document) => document.id !== confirmDelete.id)
      );

      pushToast(`${confirmDelete.originalName} removed`, "info");
      setConfirmDelete(null);
    } catch (caught) {
      pushToast(
        caught instanceof ApiError ? caught.message : "Could not delete it.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  const indexedCount = documents.filter(
    (document) => document.ingestionStatus === INGESTION_STATUS.COMPLETED
  ).length;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Knowledge Base"
        subtitle="Documents the AI assistant answers from."
        actions={
          <>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => load()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="brass"
              icon={uploading ? Loader2 : Upload}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload Document"}
            </Button>
          </>
        }
      />

      {/*
        A real multipart upload: the file goes into FormData and the
        browser sets the Content-Type boundary itself.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES}
        onChange={handleFileSelected}
        className="hidden"
      />

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <LoadingState rows={4} />
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load documents"
          description={error}
          actionLabel="Try again"
          onAction={() => load()}
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No documents uploaded"
          description="Upload a PDF, Word, Excel or text file. Once it has been indexed, the AI assistant can answer questions from it."
          actionLabel="Upload Document"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-ink-400">
            {indexedCount} of {documents.length} documents indexed
            {hasPendingWork && " · checking for updates…"}
          </p>

          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3">Document</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded By</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {documents.map((document) => (
                    <tr
                      key={document.id}
                      className="text-sm transition-colors hover:bg-ink-50/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                            <FileText size={16} />
                          </div>
                          <p className="min-w-0 truncate font-medium text-ink-800">
                            {document.originalName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-500">
                        {formatBytes(document.size)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-500">
                        {document.uploader?.username || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-400">
                        {formatDateTime(document.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={STATUS_TONE[document.ingestionStatus]}>
                            {isIngestionInProgress(document.ingestionStatus) && (
                              <Loader2 size={10} className="animate-spin" />
                            )}
                            {INGESTION_STATUS_LABELS[document.ingestionStatus]}
                          </Badge>
                          {/*
                            The backend records why ingestion failed;
                            showing it is what makes the failure
                            actionable.
                          */}
                          {document.ingestionStatus === INGESTION_STATUS.FAILED &&
                            document.ingestionError && (
                              <span className="max-w-[220px] text-[10.5px] leading-snug text-red-500">
                                {document.ingestionError}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setConfirmDelete(document)}
                          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete document"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this document?"
        message={
          confirmDelete
            ? `${confirmDelete.originalName} will be removed from storage and the assistant will no longer answer from it.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
