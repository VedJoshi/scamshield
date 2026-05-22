import { getFraudRadarStats } from "@/features/analysis/services/fraud-radar.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getFraudRadarStats();
  const total = Math.max(stats.totalCases, 1);
  const highRiskPercent = Math.round((stats.riskDistribution.high / total) * 100);
  const topSignal = stats.topSignals[0];
  const maxSignalCount = Math.max(...stats.topSignals.map((signal) => signal.count), 1);
  const maxDailyCount = Math.max(...stats.caseVolumeByDay.map((day) => day.count), 1);

  return (
    <main className="page-shell page-narrow">
      <section className="panel panel-strong">
        <p className="eyebrow">FraudRadar</p>
        <h1>Aggregate scam patterns from saved cases.</h1>
        <p>
          This dashboard reads Supabase case data through the server only. It stays empty until
          the database schema and secret key are configured.
        </p>
        {!stats.configured ? (
          <p className="inline-error">
            Supabase server credentials are not configured yet.
          </p>
        ) : null}
      </section>

      <section className="dashboard-grid">
        <article className="panel stat-card">
          <span>Total cases</span>
          <strong>{stats.totalCases}</strong>
        </article>
        <article className="panel stat-card">
          <span>High-risk cases</span>
          <strong>{stats.riskDistribution.high}</strong>
          <small>{highRiskPercent}% of saved cases</small>
        </article>
        <article className="panel stat-card">
          <span>Most common signal</span>
          <strong>{topSignal?.label ?? "No signals yet"}</strong>
          <small>{topSignal ? `${topSignal.count} occurrences` : "Save analyses to populate this"}</small>
        </article>
      </section>

      <section className="panel dashboard-section">
        <h2>Risk distribution</h2>
        {(["low", "medium", "high"] as const).map((level) => {
          const count = stats.riskDistribution[level];
          const percent = Math.round((count / total) * 100);
          return (
            <div className="risk-row" key={level}>
              <span>{level}</span>
              <div className="risk-bar-track">
                <div className={`risk-bar-fill risk-fill-${level}`} style={{ width: `${percent}%` }} />
              </div>
              <strong>{count}</strong>
              <small>{percent}%</small>
            </div>
          );
        })}
      </section>

      <section className="two-column dashboard-pair">
        <article className="panel dashboard-section">
          <h2>Top scam signals</h2>
          {stats.topSignals.length === 0 ? (
            <p>No saved signal data yet.</p>
          ) : (
            <ol className="signal-rank-list">
              {stats.topSignals.map((signal, index) => (
                <li key={signal.label}>
                  <span>{index + 1}</span>
                  <strong>{signal.label}</strong>
                  <small>{signal.count}</small>
                  <div className="thin-bar-track">
                    <div style={{ width: `${(signal.count / maxSignalCount) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="panel dashboard-section">
          <h2>Case volume</h2>
          <div className="volume-bars">
            {stats.caseVolumeByDay.map((day) => (
              <div className="volume-day" key={day.date}>
                <div style={{ height: `${Math.max((day.count / maxDailyCount) * 100, day.count ? 8 : 2)}%` }} />
                <span>{day.date.slice(5).replace("-", "/")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel dashboard-section">
        <h2>Recent high-risk cases</h2>
        {stats.recentHighRiskCases.length === 0 ? (
          <p>No high-risk saved cases yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Input type</th>
                  <th>Score</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentHighRiskCases.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td>{entry.inputType.replace("_", " ")}</td>
                    <td>{entry.riskScore}</td>
                    <td>{entry.shortReport.slice(0, 120)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
