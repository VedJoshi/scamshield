"use client";

import { CaseHistoryList } from "@/features/analysis/components/CaseHistoryList";
import { useCaseHistory } from "@/features/analysis/hooks/useCaseHistory";

export function CaseHistoryClientPage() {
  const { cases } = useCaseHistory();

  return (
    <main className="page-shell page-narrow">
      <section className="panel panel-strong">
        <p className="eyebrow">Case history</p>
        <h1>Saved mentor-demo cases and recent checks.</h1>
        <p>
          Saved checks persist through the server-backed case store when Supabase is configured,
          with local fallback during development.
        </p>
      </section>
      <CaseHistoryList cases={cases} />
    </main>
  );
}
