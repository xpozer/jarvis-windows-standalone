import { RechnerPage } from "./RechnerPage";
import { TerminePage } from "./TerminePage";
import { SAPPage } from "./SAPPage";
import { AufgabenPage } from "./AufgabenPage";
import { EinstellungenPage } from "./EinstellungenPage";
import { GedaechtnisPage } from "./GedaechtnisPage";
import { AgentSystemPage } from "./AgentSystemPage";
import { EmailPage } from "./EmailPage";
import { NotizenPage } from "./NotizenPage";
import { WindowsPage } from "./WindowsPage";
import { SystemPage } from "./SystemPage";
import { WorkModePage } from "./WorkModePage";
import { FilesPage } from "./FilesPage";
import { WorkMemoryPage } from "./WorkMemoryPage";
import { VDEPage } from "./VDEPage";
import { SelfCheckPage } from "./SelfCheckPage";
import { TechCorePage } from "./TechCorePage";
import { WorkAgentPage } from "./WorkAgentPage";
import { AutomationPage } from "./AutomationPage";
import { UIOptionsPage } from "./UIOptionsPage";
import { AuditLogPage } from "./AuditLogPage";
import { AgentRegistryPage } from "./AgentRegistryPage";
import { ToolRegistryPage } from "./ToolRegistryPage";
import { DiagCenterPage } from "./DiagCenterPage";
import { VoicePage } from "./VoicePage";
import { VoiceCorePage } from "./VoiceCorePage";
import { VoiceInterfacePage } from "./VoiceInterfacePage";
import { DashboardPage } from "./DashboardPage";
import { KnowledgePage } from "./KnowledgePage";
import { SystemCenterPage } from "./SystemCenterPage";
import { DeepControlPage } from "./DeepControlPage";
import { JarvisSettings } from "../hooks/useSettings";
import { MemoryFact } from "../hooks/useMemory";

interface ContentRouterProps {
  activeItem: string;
  settings: JarvisSettings;
  onUpdate: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onReset: () => void;
  memory: {
    facts: MemoryFact[];
    addFact: (text: string, source: "explicit") => void;
    removeFact: (id: number) => void;
    clearFacts: () => void;
  };
}

export function ContentRouter({ activeItem, settings, onUpdate, onReset, memory }: ContentRouterProps) {
  if (activeItem === "Rechner")       return <div className="jv-content-panel"><RechnerPage /></div>;
  if (activeItem === "Termine")       return <div className="jv-content-panel"><TerminePage /></div>;
  if (activeItem === "SAP Werkzeuge") return <div className="jv-content-panel"><SAPPage /></div>;
  if (activeItem === "Aufgaben")      return <div className="jv-content-panel"><AufgabenPage /></div>;
  if (activeItem === "Wissen")        return <div className="jv-content-panel"><GedaechtnisPage facts={memory.facts} onAdd={memory.addFact} onRemove={memory.removeFact} onClear={memory.clearFacts} /></div>;
  if (activeItem === "Agenten")       return <div className="jv-content-panel"><AgentSystemPage /></div>;
  if (activeItem === "Einstellungen") return <div className="jv-content-panel"><EinstellungenPage settings={settings} onUpdate={onUpdate} onReset={onReset} /></div>;
  if (activeItem === "Email")         return <div className="jv-content-panel"><EmailPage /></div>;
  if (activeItem === "Notizen")       return <div className="jv-content-panel"><NotizenPage /></div>;
  if (activeItem === "Windows")       return <div className="jv-content-panel"><WindowsPage /></div>;
  if (activeItem === "Systemstatus")  return <div className="jv-content-panel"><SystemPage /></div>;
  if (activeItem === "Arbeitsmodus") return <div className="jv-content-panel"><WorkModePage /></div>;
  if (activeItem === "Dateien")       return <div className="jv-content-panel"><FilesPage /></div>;
  if (activeItem === "Arbeitswissen") return <div className="jv-content-panel"><WorkMemoryPage /></div>;
  if (activeItem === "VDE Normen")    return <div className="jv-content-panel"><VDEPage /></div>;
  if (activeItem === "Self Check")    return <div className="jv-content-panel"><SelfCheckPage /></div>;
  if (activeItem === "Tech Core")     return <div className="jv-content-panel"><TechCorePage /></div>;
  if (activeItem === "Work Agent")    return <div className="jv-content-panel"><WorkAgentPage /></div>;
  if (activeItem === "Automationen")  return <div className="jv-content-panel"><AutomationPage /></div>;
  if (activeItem === "System Center") return <div className="jv-content-panel"><SystemCenterPage /></div>;
  if (activeItem === "Local Knowledge") return <div className="jv-content-panel"><KnowledgePage /></div>;
  if (activeItem === "Dashboard") return <div className="jv-content-panel"><DashboardPage /></div>;
  if (activeItem === "Voice Core") return <div className="jv-content-panel"><VoiceCorePage /></div>;
  if (activeItem === "Voice Interface") return <div className="jv-content-panel"><VoiceInterfacePage /></div>;
  if (activeItem === "Voice Lab") return <div className="jv-content-panel"><VoicePage /></div>;
  if (activeItem === "UI Optionen") return <div className="jv-content-panel"><UIOptionsPage /></div>;

  if (activeItem === "Audit Log")       return <div className="jv-content-panel"><AuditLogPage /></div>;
  if (activeItem === "Agent Registry")  return <div className="jv-content-panel"><AgentRegistryPage /></div>;
  if (activeItem === "Tool Registry")    return <div className="jv-content-panel"><ToolRegistryPage /></div>;
  if (activeItem === "Deep Control")     return <div className="jv-content-panel"><DeepControlPage /></div>;
  if (activeItem === "Diag Center")      return <div className="jv-content-panel"><DiagCenterPage /></div>;
  if (activeItem !== "Dialog") return (
    <div className="jv-content-panel jv-content-placeholder">
      <div className="jv-placeholder-label">{activeItem.toUpperCase()}</div>
      <div className="jv-placeholder-hint">Noch nicht implementiert</div>
    </div>
  );
  return null;
}
