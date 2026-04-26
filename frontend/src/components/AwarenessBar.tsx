// JARVIS AwarenessBar
// Zeigt aktive App + Kategorie unter der AgentStatusBar

import { DesktopContext } from "../hooks/useAwareness";

interface AwarenessBarProps {
  context: DesktopContext | null;
  online: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  sap: "SAP", email: "MAIL", browser: "WEB", document: "DOC",
  spreadsheet: "XLS", pdf: "PDF", ide: "CODE", chat: "CHAT",
  terminal: "TERM", filesystem: "FS", other: "APP",
};

const CATEGORY_COLORS: Record<string, string> = {
  sap: "#4ca8e8", email: "#e84c4c", browser: "#4ce8a0", document: "#6ec4ff",
  spreadsheet: "#4ce8a0", pdf: "#e8c44c", ide: "#c44ce8", chat: "#6ec4ff",
  terminal: "#4ce8a0", filesystem: "#e8c44c", other: "#4ca8e8",
};

export function AwarenessBar({ context, online }: AwarenessBarProps) {
  if (!online || !context) return null;

  const cat = context.category || "other";
  const color = CATEGORY_COLORS[cat] || "#4ca8e8";
  const icon = CATEGORY_ICONS[cat] || "APP";
  const title = context.windowTitle
    ? (context.windowTitle.length > 50 ? context.windowTitle.slice(0, 50) + "..." : context.windowTitle)
    : "";

  return (
    <div style={{
      position: "fixed", top: 76, left: 0, right: 0, zIndex: 27,
      height: 22, display: "flex", alignItems: "center",
      padding: "0 16px", gap: 10,
      background: "rgba(4,8,20,0.7)",
      borderBottom: `1px solid ${color}15`,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: color, boxShadow: `0 0 6px ${color}`,
      }}/>
      <span style={{
        fontFamily: "Share Tech Mono, monospace", fontSize: 8,
        letterSpacing: 2, color, fontWeight: 700,
      }}>
        {icon}
      </span>
      <span style={{
        fontFamily: "Share Tech Mono, monospace", fontSize: 8,
        letterSpacing: 1, color: "rgba(76,168,232,0.35)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {context.app}{title ? ` - ${title}` : ""}
      </span>
      {context.hints && context.hints.length > 0 && (
        <span style={{
          marginLeft: "auto",
          fontFamily: "Share Tech Mono, monospace", fontSize: 7,
          letterSpacing: 1, color: `${color}88`,
        }}>
          {context.hints.join(" | ")}
        </span>
      )}
    </div>
  );
}
