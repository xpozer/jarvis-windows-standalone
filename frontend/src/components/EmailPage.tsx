// JARVIS EmailAgent - UI Komponente
// Einhaengen in ContentRouter.tsx und Sidebar.tsx

import { useEffect, useState } from "react";
import { useEmailAgent, MailEntry } from "../hooks/useEmailAgent";
import { useSettings } from "../hooks/useSettings";

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? "#e84c4c" : value >= 0.75 ? "#e8c44c" : "#4ca8e8";
  return (
    <span style={{
      fontFamily: "Share Tech Mono, monospace", fontSize: 9,
      letterSpacing: 2, color, border: `1px solid ${color}`,
      padding: "1px 6px", flexShrink: 0,
    }}>
      {pct}%
    </span>
  );
}

function MailRow({ mail, selected, onToggle }: { mail: MailEntry; selected: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid rgba(76,168,232,0.08)",
      background: selected ? "rgba(232,76,76,0.06)" : "transparent",
      transition: "background 0.2s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer" }}
           onClick={() => setExpanded(e => !e)}>
        {/* Checkbox */}
        <div onClick={e=>{e.stopPropagation();onToggle();}} style={{
          width:14, height:14, border:`1px solid ${selected?"#e84c4c":"rgba(76,168,232,0.3)"}`,
          background: selected?"rgba(232,76,76,0.2)":"transparent",
          flexShrink:0, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {selected && <span style={{color:"#e84c4c",fontSize:10,lineHeight:1}}>✕</span>}
        </div>

        <ConfidenceBadge value={mail.confidence} />

        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontFamily:"Share Tech Mono,monospace", fontSize:10,
            color:"rgba(76,168,232,0.5)", letterSpacing:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {mail.sender}
          </div>
          <div style={{
            fontFamily:"Rajdhani,sans-serif", fontSize:13, fontWeight:600,
            color:"rgba(200,220,240,0.85)", letterSpacing:0.5,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {mail.subject}
          </div>
        </div>

        <div style={{
          fontFamily:"Share Tech Mono,monospace", fontSize:8,
          color:"rgba(76,168,232,0.3)", letterSpacing:1, flexShrink:0,
        }}>
          {mail.received}
        </div>
      </div>

      {expanded && (
        <div style={{padding:"0 12px 10px 36px"}}>
          <div style={{
            fontFamily:"Share Tech Mono,monospace", fontSize:9,
            color:"rgba(76,168,232,0.45)", lineHeight:1.7, letterSpacing:0.5,
            borderLeft:"2px solid rgba(76,168,232,0.15)", paddingLeft:10,
          }}>
            <div style={{marginBottom:4}}>
              <span style={{color:"rgba(76,168,232,0.3)"}}>GRUND: </span>
              {mail.reason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmailPage() {
  const { settings } = useSettings();
  const {
    status, result, error, progress, selected, outlookOnline,
    checkStatus, scan, deleteSelected, toggleSelect, selectAll, selectNone,
  } = useEmailAgent(settings.apiUrl);

  const [maxMails,   setMaxMails]   = useState(30);
  const [threshold,  setThreshold]  = useState(0.75);
  const [permanent,  setPermanent]  = useState(false);
  const [showLegit,  setShowLegit]  = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setConfirmDel(false);
    await deleteSelected(permanent);
  };

  const spamAndUnknown = [...(result?.spam ?? []), ...(result?.unknown ?? [])];

  return (
    <div style={{
      position:"absolute", inset:0,
      display:"flex", flexDirection:"column",
      fontFamily:"Rajdhani,sans-serif",
      color:"rgba(76,168,232,0.85)",
      padding:"16px 20px",
      overflowY:"auto",
    }}>
      {/* Header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
        <div>
          <div style={{fontFamily:"Share Tech Mono,monospace", fontSize:11, letterSpacing:4, marginBottom:4}}>
            EMAIL AGENT
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{
              width:6, height:6, borderRadius:"50%",
              background: outlookOnline===null?"#4ca8e8":outlookOnline?"#4ce8a0":"#e84c4c",
              boxShadow:`0 0 6px ${outlookOnline===null?"#4ca8e8":outlookOnline?"#4ce8a0":"#e84c4c"}`,
            }}/>
            <span style={{fontFamily:"Share Tech Mono,monospace", fontSize:9, letterSpacing:2,
              color:"rgba(76,168,232,0.4)"}}>
              OUTLOOK {outlookOnline===null?"PRÜFE...":outlookOnline?"ONLINE":"OFFLINE"}
            </span>
          </div>
        </div>

        {/* Scan-Controls */}
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <span style={{fontFamily:"Share Tech Mono,monospace", fontSize:8, letterSpacing:1,
                color:"rgba(76,168,232,0.35)"}}>MAX</span>
              <select value={maxMails} onChange={e=>setMaxMails(+e.target.value)}
                style={{background:"rgba(4,14,30,0.8)", border:"1px solid rgba(76,168,232,0.2)",
                  color:"#4ca8e8", fontFamily:"Share Tech Mono,monospace", fontSize:9,
                  padding:"2px 6px", letterSpacing:1}}>
                {[20,30,50,100].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <span style={{fontFamily:"Share Tech Mono,monospace", fontSize:8, letterSpacing:1,
                color:"rgba(76,168,232,0.35)"}}>SCHWELLE</span>
              <select value={threshold} onChange={e=>setThreshold(+e.target.value)}
                style={{background:"rgba(4,14,30,0.8)", border:"1px solid rgba(76,168,232,0.2)",
                  color:"#4ca8e8", fontFamily:"Share Tech Mono,monospace", fontSize:9,
                  padding:"2px 6px", letterSpacing:1}}>
                {[[0.6,"60%"],[0.75,"75%"],[0.85,"85%"],[0.95,"95%"]].map(([v,l])=>
                  <option key={v as number} value={v as number}>{l}</option>)}
              </select>
            </div>
          </div>

          <button onClick={()=>scan(maxMails, threshold)}
            disabled={status==="scanning"||!outlookOnline}
            style={{
              background: status==="scanning"?"rgba(76,168,232,0.05)":"rgba(76,168,232,0.08)",
              border:`1px solid ${status==="scanning"?"rgba(76,168,232,0.2)":"rgba(76,168,232,0.4)"}`,
              color: outlookOnline?"#4ca8e8":"rgba(76,168,232,0.3)",
              fontFamily:"Share Tech Mono,monospace", fontSize:10, letterSpacing:2,
              padding:"8px 16px", cursor: outlookOnline?"pointer":"not-allowed",
            }}>
            {status==="scanning" ? "SCANNE..." : "SCANNEN"}
          </button>
        </div>
      </div>

      {/* Progress / Error */}
      {(status==="scanning"||progress) && (
        <div style={{
          fontFamily:"Share Tech Mono,monospace", fontSize:9, letterSpacing:2,
          color: error?"#e84c4c":"rgba(76,168,232,0.5)",
          padding:"8px 12px", borderLeft:"2px solid rgba(76,168,232,0.2)",
          marginBottom:12,
        }}>
          {error || progress}
        </div>
      )}

      {/* Stats */}
      {result && (
        <div style={{display:"flex", gap:12, marginBottom:16}}>
          {[
            {label:"GESCANNT",  val:result.total_scanned, color:"#4ca8e8"},
            {label:"SPAM",      val:result.spam.length,   color:"#e84c4c"},
            {label:"UNBEKANNT", val:result.unknown.length,color:"#e8c44c"},
            {label:"LEGITIM",   val:result.legitimate.length, color:"#4ce8a0"},
          ].map(({label,val,color})=>(
            <div key={label} style={{
              background:"rgba(4,14,30,0.6)", border:`1px solid ${color}22`,
              padding:"8px 14px", flex:1, textAlign:"center",
            }}>
              <div style={{fontFamily:"Share Tech Mono,monospace", fontSize:18,
                fontWeight:700, color, marginBottom:2}}>{val}</div>
              <div style={{fontFamily:"Share Tech Mono,monospace", fontSize:8,
                letterSpacing:2, color:`${color}88`}}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Spam-Liste */}
      {result && spamAndUnknown.length > 0 && (
        <div style={{marginBottom:16}}>
          {/* Toolbar */}
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"6px 12px", background:"rgba(4,14,30,0.6)",
            border:"1px solid rgba(76,168,232,0.15)", borderBottom:"none"}}>
            <div style={{display:"flex", gap:8}}>
              <button onClick={selectAll} style={{
                background:"transparent", border:"1px solid rgba(76,168,232,0.2)",
                color:"rgba(76,168,232,0.5)", fontFamily:"Share Tech Mono,monospace",
                fontSize:8, letterSpacing:1, padding:"3px 8px", cursor:"pointer"}}>
                ALLE
              </button>
              <button onClick={selectNone} style={{
                background:"transparent", border:"1px solid rgba(76,168,232,0.2)",
                color:"rgba(76,168,232,0.5)", fontFamily:"Share Tech Mono,monospace",
                fontSize:8, letterSpacing:1, padding:"3px 8px", cursor:"pointer"}}>
                KEINE
              </button>
              <span style={{fontFamily:"Share Tech Mono,monospace", fontSize:8,
                letterSpacing:1, color:"rgba(76,168,232,0.3)", alignSelf:"center"}}>
                {selected.size} AUSGEWÄHLT
              </span>
            </div>

            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <label style={{display:"flex", alignItems:"center", gap:4, cursor:"pointer",
                fontFamily:"Share Tech Mono,monospace", fontSize:8, letterSpacing:1,
                color:"rgba(232,76,76,0.5)"}}>
                <input type="checkbox" checked={permanent} onChange={e=>setPermanent(e.target.checked)}
                  style={{accentColor:"#e84c4c"}}/>
                PERMANENT
              </label>
              <button onClick={handleDelete} disabled={selected.size===0}
                style={{
                  background: confirmDel?"rgba(232,76,76,0.15)":"rgba(232,76,76,0.06)",
                  border:`1px solid ${confirmDel?"#e84c4c":"rgba(232,76,76,0.3)"}`,
                  color: selected.size===0?"rgba(232,76,76,0.25)":"#e84c4c",
                  fontFamily:"Share Tech Mono,monospace", fontSize:9, letterSpacing:2,
                  padding:"4px 12px", cursor:selected.size===0?"not-allowed":"pointer",
                  transition:"all 0.2s",
                }}>
                {confirmDel ? "SICHER?" : `LÖSCHEN (${selected.size})`}
              </button>
              {confirmDel && (
                <button onClick={()=>setConfirmDel(false)} style={{
                  background:"transparent", border:"1px solid rgba(76,168,232,0.2)",
                  color:"rgba(76,168,232,0.5)", fontFamily:"Share Tech Mono,monospace",
                  fontSize:9, letterSpacing:1, padding:"4px 10px", cursor:"pointer"}}>
                  ABBRECHEN
                </button>
              )}
            </div>
          </div>

          {/* Mail-Liste */}
          <div style={{border:"1px solid rgba(76,168,232,0.15)",
            background:"rgba(4,10,22,0.8)", maxHeight:400, overflowY:"auto"}}>
            {spamAndUnknown.map(mail=>(
              <MailRow key={mail.entryId} mail={mail}
                selected={selected.has(mail.entryId)}
                onToggle={()=>toggleSelect(mail.entryId)}/>
            ))}
          </div>
        </div>
      )}

      {/* Legitime Mails (einklappbar) */}
      {result && result.legitimate.length > 0 && (
        <div>
          <button onClick={()=>setShowLegit(l=>!l)} style={{
            background:"transparent", border:"1px solid rgba(76,232,160,0.2)",
            color:"rgba(76,232,160,0.5)", fontFamily:"Share Tech Mono,monospace",
            fontSize:9, letterSpacing:2, padding:"6px 14px", cursor:"pointer", marginBottom:8,
          }}>
            {showLegit?"▼":"▶"} LEGITIME MAILS ({result.legitimate.length})
          </button>
          {showLegit && (
            <div style={{border:"1px solid rgba(76,232,160,0.1)",
              background:"rgba(4,10,22,0.6)", maxHeight:300, overflowY:"auto"}}>
              {result.legitimate.map(mail=>(
                <MailRow key={mail.entryId} mail={mail}
                  selected={selected.has(mail.entryId)}
                  onToggle={()=>toggleSelect(mail.entryId)}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {status==="done" && result && spamAndUnknown.length===0 && (
        <div style={{textAlign:"center", padding:"40px 0",
          fontFamily:"Share Tech Mono,monospace", fontSize:10,
          letterSpacing:3, color:"rgba(76,232,160,0.4)"}}>
          ✓ INBOX SAUBER
        </div>
      )}

      {outlookOnline===false && status==="idle" && (
        <div style={{textAlign:"center", padding:"40px 0",
          fontFamily:"Share Tech Mono,monospace", fontSize:10,
          letterSpacing:2, color:"rgba(232,76,76,0.4)", lineHeight:2}}>
          OUTLOOK NICHT ERREICHBAR<br/>
          <span style={{fontSize:9, color:"rgba(232,76,76,0.3)"}}>
            Outlook öffnen, dann neu prüfen
          </span>
        </div>
      )}
    </div>
  );
}
