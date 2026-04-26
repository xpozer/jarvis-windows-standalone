import { ChangeEvent, Dispatch, SetStateAction, useRef } from "react";

type Role = "operator" | "jarvis";

type Message = {
  role: Role;
  time: string;
  text: string;
  link?: string;
  file?: boolean;
};

type UploadApiResponse = {
  ok?: boolean;
  summary?: string;
  extracted_chars?: number;
  file?: {
    filename?: string;
    size_bytes?: number;
  };
};

type Props = {
  disabled: boolean;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setThinking: Dispatch<SetStateAction<boolean>>;
  setLastAgent: Dispatch<SetStateAction<string>>;
};

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtBytes(value: number | null | undefined) {
  if (typeof value !== "number") return "unbekannte Größe";
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

export function FileUploadButton({ disabled, setMessages, setThinking, setLastAgent }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function uploadAndAnalyze(file: File) {
    if (disabled) return;
    setMessages((prev) => [...prev, {
      role: "operator",
      time: now(),
      text: `Datei hochgeladen: ${file.name} (${fmtBytes(file.size)})`,
    }]);
    setThinking(true);
    setLastAgent("file");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/files/upload?analyze=true", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : `HTTP ${response.status}`;
        throw new Error(detail);
      }
      const result = data as UploadApiResponse;
      const filename = result.file?.filename || file.name;
      const size = fmtBytes(result.file?.size_bytes ?? file.size);
      const chars = typeof result.extracted_chars === "number" ? result.extracted_chars : 0;
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: now(),
        text: `Datei analysiert: ${filename}\nGröße: ${size}\nExtrahierte Zeichen: ${chars}\n\n${result.summary || "Keine Analyse erhalten."}`,
        file: true,
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: now(),
        text: `Fehler beim Datei Upload: ${error instanceof Error ? error.message : String(error)}`,
      }]);
    } finally {
      setThinking(false);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadAndAnalyze(file);
  }

  return (
    <>
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={onChange} />
      <button className="plus-btn" disabled={disabled} onClick={() => inputRef.current?.click()} title="Datei analysieren">＋</button>
    </>
  );
}
