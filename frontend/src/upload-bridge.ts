type UploadApiResponse = {
  ok?: boolean;
  summary?: string;
  extracted_chars?: number;
  file?: { filename?: string; size_bytes?: number };
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

function addMessage(role: "operator" | "jarvis", text: string, file = false) {
  const list = document.querySelector(".jarvis-message-list");
  if (!list) return;
  const card = document.createElement("article");
  card.className = "jarvis-message-card";
  const avatarClass = role === "jarvis" ? "jarvis" : "operator";
  const name = role === "jarvis" ? "JARVIS" : "OPERATOR";
  const avatarText = role === "operator" ? "●" : "";
  const fileHtml = file
    ? `<div class="jarvis-file"><span>▤</span><div><b>uploaded_file_analysis.txt</b><small>Lokale Analyse</small></div><button>⇩</button><button>↗</button></div>`
    : "";
  card.innerHTML = `
    <div class="jarvis-avatar ${avatarClass}">${avatarText}</div>
    <div class="jarvis-message-body">
      <div class="jarvis-message-meta"><b class="${role === "jarvis" ? "cyan" : ""}">${name}</b><span>${now()}</span></div>
      <p></p>
      ${fileHtml}
    </div>
    <button class="jarvis-dots">•••</button>
  `;
  const p = card.querySelector("p");
  if (p) p.textContent = text;
  list.appendChild(card);
  list.scrollTop = list.scrollHeight;
}

async function uploadFile(file: File) {
  const root = document.querySelector(".jarvis-screen");
  root?.classList.add("is-thinking");
  addMessage("operator", `Datei hochgeladen: ${file.name} (${fmtBytes(file.size)})`);
  try {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/files/upload?analyze=true", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : `HTTP ${response.status}`;
      throw new Error(detail);
    }
    const result = data as UploadApiResponse;
    const filename = result.file?.filename || file.name;
    const size = fmtBytes(result.file?.size_bytes ?? file.size);
    const chars = typeof result.extracted_chars === "number" ? result.extracted_chars : 0;
    addMessage(
      "jarvis",
      `Datei analysiert: ${filename}\nGröße: ${size}\nExtrahierte Zeichen: ${chars}\n\n${result.summary || "Keine Analyse erhalten."}`,
      true,
    );
  } catch (error) {
    addMessage("jarvis", `Fehler beim Datei Upload: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    root?.classList.remove("is-thinking");
  }
}

function installUploadBridge() {
  let input = document.getElementById("jarvis-upload-input") as HTMLInputElement | null;
  if (!input) {
    input = document.createElement("input");
    input.id = "jarvis-upload-input";
    input.type = "file";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input?.files?.[0];
      if (input) input.value = "";
      if (file) void uploadFile(file);
    });
    document.body.appendChild(input);
  }

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest(".plus-btn") as HTMLButtonElement | null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    input?.click();
  }, true);
}

installUploadBridge();
