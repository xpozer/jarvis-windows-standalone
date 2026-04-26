import { useState, useEffect } from "react";

// Electron API aus dem Preload-Script
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      platform: string;
      isElectron: boolean;
    };
  }
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = !!window.electronAPI?.isElectron;

  // Nur rendern wenn in Electron
  if (!isElectron) return null;

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized);
  }, []);

  function handleMaximize() {
    window.electronAPI?.maximize();
    // Kurze Verzögerung dann Status prüfen
    setTimeout(() => {
      window.electronAPI?.isMaximized().then(setIsMaximized);
    }, 100);
  }

  return (
    <div className="titlebar">
      {/* Drag-Bereich */}
      <div className="titlebar-drag">
        <span className="titlebar-appname">J A R V I S</span>
      </div>

      {/* Fenster-Buttons */}
      <div className="titlebar-buttons">
        <button
          className="titlebar-btn minimize"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimieren"
        >
          <svg viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="5.5" width="10" height="1" rx="0.5" />
          </svg>
        </button>

        <button
          className="titlebar-btn maximize"
          onClick={handleMaximize}
          title={isMaximized ? "Wiederherstellen" : "Maximieren"}
        >
          {isMaximized ? (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="1" width="8" height="8" rx="1" />
              <path d="M1 4v7h7" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="1" y="1" width="10" height="10" rx="1" />
            </svg>
          )}
        </button>

        <button
          className="titlebar-btn close"
          onClick={() => window.electronAPI?.close()}
          title="In Tray minimieren"
        >
          <svg viewBox="0 0 12 12" fill="currentColor">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
