import { useEffect, useState } from "react";
import { Textarea } from "../ui";
import {
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_FORMATS_LABEL,
  MAX_KNOWLEDGE_DOC_CHARS,
} from "../../lib/knowledge-documents";
import { formatKnowledgeFileSize } from "../../lib/parse-knowledge-doc";
import { useKnowledgeFileUpload } from "../../hooks/useKnowledgeFileUpload";
import { useAppStore } from "../../store/useAppStore";

function modeTitle(name: string): string {
  return name.replace(/^Landed for /, "");
}

function FilesIcon() {
  return (
    <svg
      className="h-10 w-10 text-zinc-300"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="10" y="8" width="22" height="28" rx="3" fill="currentColor" opacity="0.35" />
      <rect x="16" y="12" width="22" height="28" rx="3" fill="currentColor" opacity="0.55" />
      <path
        d="M22 20h10M22 25h10M22 30h6"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CompanyPanel() {
  const {
    customSystemPrompt,
    setCustomSystemPrompt,
    removeKnowledgeDocument,
    getActiveModeConfig,
  } = useAppStore();

  const mode = getActiveModeConfig();
  const [contextDraft, setContextDraft] = useState(customSystemPrompt);

  const {
    knowledgeFiles,
    uploadError,
    uploading,
    isDragging,
    canUpload,
    fileInputRef,
    openFilePicker,
    handleFileSelected,
    dropzoneProps,
  } = useKnowledgeFileUpload({
    maxDocsMessage: "Remove the current file to upload a different one.",
  });

  const uploadedDoc = knowledgeFiles[0] ?? null;

  useEffect(() => {
    setContextDraft(customSystemPrompt);
  }, [customSystemPrompt]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (contextDraft !== customSystemPrompt) {
        setCustomSystemPrompt(contextDraft);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [contextDraft, customSystemPrompt, setCustomSystemPrompt]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900">
          {modeTitle(mode.name)}
        </h2>
        <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white">
          Active
        </span>
      </div>

      <section className="mb-8">
        <label
          htmlFor="interview-context"
          className="text-[13px] font-medium text-zinc-700"
        >
          Technical interview context
        </label>
        <Textarea
          id="interview-context"
          className="mt-2 min-h-[220px] resize-y text-[13px] leading-relaxed"
          value={contextDraft}
          onChange={(e) => setContextDraft(e.target.value)}
          placeholder="Describe how Landed should help in technical interviews — your stack, target roles, tone, and what to prioritise when answering about the problem on screen."
        />
      </section>

      <section className="flex-1">
        <p className="text-[13px] font-medium text-zinc-700">
          Prep file (deferred for v1)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={KNOWLEDGE_ACCEPT}
          className="hidden"
          onChange={(e) => void handleFileSelected(e)}
        />

        {uploadedDoc ? (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-zinc-900">
                  {uploadedDoc.name}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {uploadedDoc.text.length.toLocaleString()} chars ·{" "}
                  {formatKnowledgeFileSize(uploadedDoc.text.length)} · Indexed
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeKnowledgeDocument(uploadedDoc.id)}
                className="shrink-0 text-[12px] font-medium text-zinc-500 transition-colors hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="mt-3 text-[12px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Replace file
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={!canUpload}
            {...dropzoneProps}
            className={`mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isDragging && canUpload
                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 hover:bg-zinc-100"
            }`}
          >
            <FilesIcon />
            <p className="mt-4 text-[13px] font-medium text-zinc-800">
              {uploading
                ? "Reading file..."
                : isDragging && canUpload
                  ? "Drop file here"
                  : "Adding a file gives more context to Landed"}
            </p>
            {!uploading && (
              <p className="mt-1 text-[12px] text-zinc-500">
                Drag & drop a file here, or{" "}
                <span className="font-medium text-zinc-700">browse files</span>
              </p>
            )}
          </button>
        )}

        <p className="mt-3 text-[11px] text-zinc-400">
          One file · {KNOWLEDGE_FORMATS_LABEL} · up to{" "}
          {MAX_KNOWLEDGE_DOC_CHARS.toLocaleString()} characters
        </p>

        {uploadedDoc ? (
          <p className="mt-2 text-[11px] font-medium text-emerald-600">
            Landed will use this file when answering questions about your screen.
          </p>
        ) : null}

        {uploadError ? (
          <p className="mt-2 text-[11px] text-red-600">{uploadError}</p>
        ) : null}
      </section>
    </div>
  );
}
