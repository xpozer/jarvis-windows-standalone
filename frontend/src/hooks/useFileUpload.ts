import { useState, useCallback } from "react";

export interface UploadedFile {
  name: string;
  type: "pdf" | "image";
  content: string;    // Für PDF: extrahierter Text; für Bild: base64 data URL
  size: number;
}

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (n: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
}

async function loadPDFJS(): Promise<typeof window.pdfjsLib> {
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("pdf.js nicht geladen"));
      }
    };
    script.onerror = () => reject(new Error("pdf.js CDN nicht erreichbar"));
    document.head.appendChild(script);
  });
}

async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<string> {
  const lib = await loadPDFJS();
  if (!lib) throw new Error("pdf.js nicht verfügbar");

  const doc = await lib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    if (text.trim()) pages.push(`[Seite ${i}]\n${text}`);
  }

  return pages.join("\n\n");
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useFileUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);

    try {
      const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isImage = file.type.startsWith("image/");

      if (!isPDF && !isImage) {
        setUploadError("Nur PDF und Bilder (JPG, PNG, WEBP) werden unterstützt.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Datei zu groß. Maximum 10 MB.");
        return;
      }

      if (isPDF) {
        const buffer = await readFileAsArrayBuffer(file);
        const text = await extractPDFText(buffer);
        setUploadedFile({
          name: file.name,
          type: "pdf",
          content: text.slice(0, 12000), // max 12k Zeichen
          size: file.size,
        });
      } else {
        const dataUrl = await readFileAsDataURL(file);
        setUploadedFile({
          name: file.name,
          type: "image",
          content: dataUrl,
          size: file.size,
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Fehler beim Lesen der Datei.");
    } finally {
      setUploading(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
  }, []);

  return { uploadedFile, uploading, uploadError, processFile, clearFile };
}
