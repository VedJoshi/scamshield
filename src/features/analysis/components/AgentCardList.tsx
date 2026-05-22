import { analyzerRegistry } from "@/agents/core/registry";
import { VoiceShieldPreview } from "@/features/analysis/components/VoiceShieldPreview";

export function AgentCardList() {
  return (
    <section className="agent-grid">
      {analyzerRegistry.map((agent) => (
        <article className="panel agent-card" key={agent.id}>
          <div className="history-topline">
            <p className="eyebrow">{agent.enabled ? "Active now" : "Planned next"}</p>
            <span className={`risk-badge ${agent.enabled ? "risk-low" : ""}`}>
              {agent.enabled ? "live" : "planned"}
            </span>
          </div>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <strong>Why it can make money</strong>
          <p>{agent.monetizationAngle}</p>
          {agent.id === "voice-shield" ? <VoiceShieldPreview /> : null}
        </article>
      ))}
    </section>
  );
}
