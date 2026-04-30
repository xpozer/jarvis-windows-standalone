import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BootSequence } from "./BootSequence";

function BootPreview() {
  const [runId, setRunId] = useState(0);

  return (
    <BootSequence
      key={runId}
      compact={false}
      onComplete={() => {
        window.setTimeout(() => setRunId((current) => current + 1), 900);
      }}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootPreview />
  </StrictMode>,
);
