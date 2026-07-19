import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

const DOCX_XML_PATH = "word/document.xml";

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function xmlToPlainText(xml: string): string {
  const withBreaks = xml.replace(/<\/w:p>/g, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return decodeXmlEntities(stripped)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DOCX decompression is not supported in this environment.");
  }

  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  await writer.write(data as unknown as BufferSource);
  await writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  ) >>> 0;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minOffset = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (readUint32LE(bytes, offset) === 0x06054b50) return offset;
  }
  return -1;
}

interface ZipEntryMetadata {
  compression: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function findZipEntryMetadata(
  bytes: Uint8Array,
  targetPath: string,
): ZipEntryMetadata | null {
  const endOffset = findEndOfCentralDirectory(bytes);
  if (endOffset < 0) return null;

  const centralDirectorySize = readUint32LE(bytes, endOffset + 12);
  const centralDirectoryOffset = readUint32LE(bytes, endOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  let offset = centralDirectoryOffset;
  while (offset + 46 <= centralDirectoryEnd && offset + 46 <= bytes.length) {
    if (readUint32LE(bytes, offset) !== 0x02014b50) break;

    const compression = readUint16LE(bytes, offset + 10);
    const compressedSize = readUint32LE(bytes, offset + 20);
    const fileNameLength = readUint16LE(bytes, offset + 28);
    const extraLength = readUint16LE(bytes, offset + 30);
    const commentLength = readUint16LE(bytes, offset + 32);
    const localHeaderOffset = readUint32LE(bytes, offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) break;

    const entryName = new TextDecoder().decode(bytes.subarray(nameStart, nameEnd));
    if (entryName === targetPath) {
      return { compression, compressedSize, localHeaderOffset };
    }

    offset = nameEnd + extraLength + commentLength;
  }

  return null;
}

/** Minimal ZIP reader — enough for standard DOCX files. */
async function readZipEntry(
  buffer: ArrayBuffer,
  targetPath: string,
): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(buffer);
  const metadata = findZipEntryMetadata(bytes, targetPath);

  if (metadata) {
    const offset = metadata.localHeaderOffset;
    if (offset + 30 > bytes.length) return null;
    if (readUint32LE(bytes, offset) !== 0x04034b50) return null;

    const fileNameLength = readUint16LE(bytes, offset + 26);
    const extraLength = readUint16LE(bytes, offset + 28);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + metadata.compressedSize;
    if (dataEnd > bytes.length) return null;

    const payload = bytes.subarray(dataStart, dataEnd);
    if (metadata.compression === 0) return payload;
    if (metadata.compression === 8) return inflateRaw(payload);
    throw new Error(`Unsupported DOCX compression method (${metadata.compression}).`);
  }

  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const signature = readUint32LE(bytes, offset);
    if (signature !== 0x04034b50) break;

    const compression = readUint16LE(bytes, offset + 8);
    const compressedSize = readUint32LE(bytes, offset + 18);
    const fileNameLength = readUint16LE(bytes, offset + 26);
    const extraLength = readUint16LE(bytes, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) break;

    const entryName = new TextDecoder().decode(bytes.subarray(nameStart, nameEnd));
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) break;

    const payload = bytes.subarray(dataStart, dataEnd);
    offset = dataEnd;

    if (entryName !== targetPath) continue;

    if (compression === 0) return payload;
    if (compression === 8) return inflateRaw(payload);
    throw new Error(`Unsupported DOCX compression method (${compression}).`);
  }

  return null;
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const xmlBytes = await readZipEntry(buffer, DOCX_XML_PATH);
  if (!xmlBytes) {
    throw new Error("Could not read document.xml from this DOCX file.");
  }

  const xml = new TextDecoder().decode(xmlBytes);
  const text = xmlToPlainText(xml);
  if (!text) {
    throw new Error("This DOCX file has no readable text.");
  }
  return text;
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "This PDF has no readable text. Try a text-based PDF or upload DOCX/TXT.",
    );
  }
  return text;
}

function extensionForFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (fromName) return fromName;

  if (file.type === "application/pdf") return "pdf";
  if (file.type.includes("wordprocessingml")) return "docx";
  if (file.type.startsWith("text/")) return "txt";
  return "";
}

export async function extractTextFromKnowledgeFile(file: File): Promise<string> {
  const ext = extensionForFile(file);

  if (ext === "txt" || ext === "md" || ext === "markdown") {
    const text = await file.text();
    if (!text.trim()) throw new Error("This file is empty.");
    return text.trim();
  }

  if (ext === "docx") {
    return extractDocxText(await file.arrayBuffer());
  }

  if (ext === "pdf") {
    return extractPdfText(await file.arrayBuffer());
  }

  throw new Error("Unsupported file type. Upload TXT, MD, DOCX, or PDF.");
}

export function formatKnowledgeFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
