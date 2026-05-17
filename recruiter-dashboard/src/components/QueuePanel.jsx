import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export default function QueuePanel() {
  const [queue, setQueue] = useState({ initial: [], followups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/queue`);
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading queue...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Email Sending Queue</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Here are the next emails scheduled to be sent by the internal APScheduler.
      </p>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            Next Initial Emails (Top 20)
          </h3>
          {queue.initial.length === 0 ? (
            <p>No new recruiters waiting.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Company</th>
                </tr>
              </thead>
              <tbody>
                {queue.initial.map((r, i) => (
                  <tr key={i}>
                    <td>{r.email}</td>
                    <td>{r.company} <span className="badge">{r.companyType}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "300px" }}>
          <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            Next Follow-ups (Top 20)
          </h3>
          {queue.followups.length === 0 ? (
            <p>No pending follow-ups right now.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {queue.followups.map((r, i) => (
                  <tr key={i}>
                    <td>{r.email}</td>
                    <td>{r.company}</td>
                    <td>Stage {r.followupStage + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <button onClick={fetchQueue} className="tab-btn" style={{ marginTop: "24px", background: "var(--card-bg)" }}>
        Refresh Queue
      </button>
    </div>
  );
}
