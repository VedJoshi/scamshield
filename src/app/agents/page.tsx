import { AgentCardList } from "@/features/analysis/components/AgentCardList";

export default function AgentsPage() {
  return (
    <main className="page-shell page-narrow">
      <section className="panel panel-strong">
        <p className="eyebrow">Platform roadmap</p>
        <h1>Three live agents now, with platform modules queued behind them.</h1>
        <p>
          LinkGuardian, VoiceShield, and ShopScan are wired into the analysis flow.
          FraudRadar and ReportSynth remain scaffolded as the next platform modules.
        </p>
      </section>
      <AgentCardList />
    </main>
  );
}
