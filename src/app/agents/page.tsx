import { AgentCardList } from "@/features/analysis/components/AgentCardList";
import Link from "next/link";

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
        <div className="hero-links">
          <Link href="/api-docs">View API docs -&gt;</Link>
          <Link href="/dashboard">View dashboard -&gt;</Link>
        </div>
      </section>
      <AgentCardList />
    </main>
  );
}
