import { useEffect, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: unknown;
  timestamp?: number;
}

interface ChatLayerProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function normalizeMessageContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map((item) => normalizeMessageContent(item)).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["content", "response", "text", "message", "answer", "output", "result", "delta", "value"]) {
      if (key in obj && obj[key] !== value) {
        const normalized = normalizeMessageContent(obj[key]);
        if (normalized.trim()) return normalized;
      }
    }
    try {
      return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// ── Minimal Markdown renderer ─────────────────────────────────────────────────
// Handles: **bold**, `inline code`, ```code blocks```, # headings, - lists
function renderMarkdown(text: unknown): React.ReactNode[] {
  const lines = normalizeMessageContent(text).split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      nodes.push(
        <pre key={i} className="jv-code-block">
          {lang && <span className="jv-code-lang">{lang}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      nodes.push(<div key={i} className={`jv-h jv-h${level}`}>{renderInline(headingMatch[2])}</div>);
      i++;
      continue;
    }

    if (line.match(/^[-*]\s+/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i] ?? "").match(/^[-*]\s+/)) {
        items.push(<li key={i}>{renderInline((lines[i] ?? "").replace(/^[-*]\s+/, ""))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="jv-list">{items}</ul>);
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i] ?? "").match(/^\d+\.\s+/)) {
        items.push(<li key={i}>{renderInline((lines[i] ?? "").replace(/^\d+\.\s+/, ""))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="jv-list">{items}</ol>);
      continue;
    }

    if (line.trim() === "") {
      nodes.push(<div key={i} className="jv-spacer" />);
      i++;
      continue;
    }

    nodes.push(<p key={i} className="jv-p">{renderInline(line)}</p>);
    i++;
  }

  return nodes;
}

function renderInline(text: unknown): React.ReactNode {
  const parts = normalizeMessageContent(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={idx}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={idx} className="jv-inline-code">{part.slice(1, -1)}</code>;
    return part;
  });
}

function formatTime(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="jv-msg jv-msg-typing">
      <span className="who">JARVIS</span>
      <div className="jv-typing-dots"><span /><span /><span /></div>
    </div>
  );
}

export function ChatLayer({ messages, isLoading }: ChatLayerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="jv-chat">
      {messages.map((msg, i) => (
        <div key={i} className={`jv-msg ${msg.role === "user" ? "user" : ""}`}>
          <div className="jv-msg-header">
            <span className="who">{msg.role === "user" ? "JULIEN" : "JARVIS"}</span>
            <span className="jv-ts">{formatTime(msg.timestamp)}</span>
          </div>
          <div className="jv-msg-body">
            {msg.role === "assistant" ? renderMarkdown(msg.content) : normalizeMessageContent(msg.content)}
          </div>
        </div>
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
