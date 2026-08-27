import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Library, ArrowUpRight } from "lucide-react";

import { listDocuments } from "../../api/documents.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { isAdmin, INGESTION_STATUS } from "../../constants/index.js";

/*
 * The right rail of the assistant: the documents the answers on screen
 * were actually drawn from.
 *
 * It deliberately does NOT list the document library. Showing every
 * uploaded file here made it look as though those files were sources
 * for the current conversation when they were not — the Knowledge Base
 * page is where the library belongs. All that is kept from it is a
 * one-line count, so an empty rail can be told apart from an empty
 * knowledge base.
 *
 * Every name shown comes from the chat response's own `sources`.
 */
export default function KnowledgePanel({ sources }) {
  const { user } = useAuth();
  const [documentCount, setDocumentCount] = useState(null);
  const [indexedCount, setIndexedCount] = useState(null);

  /*
   * The documents API is admin-only, so a manager or rep would get a
   * 403. They still see cited sources, which come from the chat
   * response and need no extra permission.
   */
  const canListDocuments = isAdmin(user);

  useEffect(() => {
    if (!canListDocuments) {
      return undefined;
    }

    const controller = new AbortController();

    listDocuments({ signal: controller.signal })
      .then((documents) => {
        setDocumentCount(documents.length);
        setIndexedCount(
          documents.filter(
            (document) =>
              document.ingestionStatus === INGESTION_STATUS.COMPLETED
          ).length
        );
      })
      .catch(() => {
        /*
         * A count is a nicety. Failing to fetch it must not put an
         * error in a panel whose job is to show sources.
         */
      });

    return () => controller.abort();
  }, [canListDocuments]);

  /* The same document can back several retrieved chunks in one answer. */
  const uniqueSources = Array.from(
    new Map((sources || []).map((source) => [source.source, source])).values()
  );

  return (
    <div className="hidden h-full flex-col overflow-y-auto border-l border-ink-100 bg-white lg:flex">
      <div className="border-b border-ink-100 px-5 py-4">
        <h3 className="font-display text-sm font-semibold text-ink-900">Sources</h3>
        <p className="text-xs text-ink-400">Documents behind these answers</p>
      </div>

      <div className="flex-1 px-5 py-4">
        {uniqueSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 px-3 py-5 text-center">
            <Library size={16} className="mx-auto mb-2 text-ink-300" />
            <p className="text-xs leading-relaxed text-ink-400">
              {/*
                Distinguishes "nothing asked yet" from "nothing to ask
                about", which are very different problems for the user.
              */}
              {documentCount === 0
                ? "No documents have been uploaded, so the assistant has nothing to answer from."
                : "Sources will appear here once the assistant answers from a document."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {uniqueSources.map((source, index) => (
              <li
                key={`${source.documentId ?? "doc"}-${index}`}
                className="flex items-start gap-2"
              >
                <FileText size={13} className="mt-0.5 shrink-0 text-brass-500" />
                {/* The document name exactly as the backend reported it. */}
                <span className="min-w-0 break-words text-xs leading-relaxed text-ink-600">
                  {source.source}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canListDocuments && indexedCount !== null && (
        <div className="border-t border-ink-100 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-400">
              {indexedCount} of {documentCount} documents indexed
            </p>
            <Link
              to="/knowledge-base"
              className="flex items-center gap-0.5 text-[11px] font-semibold text-brass-600 hover:text-brass-700"
            >
              Manage <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
