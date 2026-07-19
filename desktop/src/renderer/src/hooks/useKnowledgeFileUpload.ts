import { useCallback, useRef, useState, type DragEvent } from "react";
import { extractTextFromKnowledgeFile } from "../lib/parse-knowledge-doc";
import { MAX_KNOWLEDGE_DOCS } from "../lib/knowledge-documents";
import { useAppStore } from "../store/useAppStore";

function hasFilePayload(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function useKnowledgeFileUpload(options?: {
  maxDocsMessage?: string;
}) {
  const knowledgeFiles = useAppStore((s) => s.knowledgeFiles);
  const addKnowledgeDocument = useAppStore((s) => s.addKnowledgeDocument);
  const removeKnowledgeDocument = useAppStore((s) => s.removeKnowledgeDocument);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxDocsMessage =
    options?.maxDocsMessage ??
    `Maximum ${MAX_KNOWLEDGE_DOCS} file. Remove it to upload another.`;

  const canUpload = knowledgeFiles.length < MAX_KNOWLEDGE_DOCS && !uploading;

  const processFile = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;

      if (knowledgeFiles.length >= MAX_KNOWLEDGE_DOCS) {
        for (const doc of knowledgeFiles) {
          removeKnowledgeDocument(doc.id);
        }
      }

      setUploading(true);
      setUploadError(null);

      try {
        const text = await extractTextFromKnowledgeFile(file);
        if (!addKnowledgeDocument(file.name, text)) {
          setUploadError(maxDocsMessage);
        }
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Could not read this file.",
        );
      } finally {
        setUploading(false);
      }
    },
    [addKnowledgeDocument, knowledgeFiles, maxDocsMessage, removeKnowledgeDocument],
  );

  const openFilePicker = useCallback(() => {
    if (!canUpload) return;
    setUploadError(null);
    fileInputRef.current?.click();
  }, [canUpload]);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      event.target.value = "";
      if (!files?.length) return;
      await processFile(files);
    },
    [processFile],
  );

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!hasFilePayload(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!hasFilePayload(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = canUpload ? "copy" : "none";
  }, [canUpload]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!hasFilePayload(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      if (!hasFilePayload(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragging(false);

      if (!canUpload) {
        setUploadError(maxDocsMessage);
        return;
      }

      const files = event.dataTransfer.files;
      if (!files?.length) return;
      await processFile(files);
    },
    [canUpload, maxDocsMessage, processFile],
  );

  const dropzoneProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: (event: DragEvent<HTMLElement>) => void handleDrop(event),
  };

  return {
    knowledgeFiles,
    uploadError,
    uploading,
    isDragging,
    canUpload,
    fileInputRef,
    openFilePicker,
    handleFileSelected,
    dropzoneProps,
  };
}
