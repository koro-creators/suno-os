import { AGENTS } from "../../config";

export default function PipelineProgress({ stages, stageAgents }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 8 }}>
      <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Pipeline
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
        {stages.map((stage) => {
          const isDone = stage.status === "done";
          const isRunning = stage.status === "running";
          const agents = stageAgents?.filter(sa => stage.agents.includes(sa.agent_id)) || [];

          return (
            <div
              key={stage.stage}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 8px", borderRadius: 6,
                background: isDone ? "rgba(34,197,94,0.08)" : isRunning ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isDone ? "rgba(34,197,94,0.2)" : isRunning ? "rgba(59,130,246,0.3)" : "#333"}`,
              }}
            >
              <span style={{ fontSize: 13 }}>
                {isDone ? "✓" : isRunning ? "⟳" : "○"}
              </span>
              <span style={{ fontSize: 13, color: isDone ? "#22c55e" : isRunning ? "#3b82f6" : "#888" }}>
                {stage.label}
              </span>
              <span style={{ fontSize: 11, color: "#666", marginLeft: "auto" }}>
                {stage.agents.map(aid => {
                  const agent = AGENTS.find(a => a.id === aid);
                  return agent?.label || aid;
                }).join(" + ")}
              </span>
              {agents.some(a => a.duration_ms) && (
                <span style={{ fontSize: 10, color: "#555" }}>
                  {Math.round(Math.max(...agents.map(a => a.duration_ms || 0)) / 1000)}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
