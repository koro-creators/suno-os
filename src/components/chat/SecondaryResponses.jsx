import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AGENTS } from "../../config";

export default function SecondaryResponses({ responses }) {
  const [open, setOpen] = useState(false);

  if (!responses || responses.length === 0) return null;

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          color: "#aaa",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          padding: 0,
        }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {responses.length} resposta{responses.length > 1 ? "s" : ""} de outros agentes
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
          {responses.map((r) => {
            const agent = AGENTS.find((a) => a.id === r.agent_id);
            return (
              <div key={r.agent_id} style={{ paddingLeft: 12, borderLeft: `3px solid ${agent?.color || "#666"}` }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: agent?.color || "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {agent?.label || r.agent_id}
                </span>
                <div style={{ marginTop: 4, whiteSpace: "pre-wrap", fontSize: 14, color: "#ddd" }}>
                  {r.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
