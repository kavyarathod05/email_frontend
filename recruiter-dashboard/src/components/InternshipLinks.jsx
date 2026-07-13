import { useCallback, useEffect, useState } from "react";
import { INTEL_API_BASE } from "../config";

export default function InternshipLinks() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newToday, setNewToday] = useState(true);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [tickMsg, setTickMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const path = newToday ? "/api/v1/jobs/today" : "/api/v1/jobs";
      const qs = new URLSearchParams({
        limit: "100",
        filter_pass: "true",
        status: "open",
      });
      if (!newToday && company.trim()) qs.set("company", company.trim());
      const res = await fetch(
        `${INTEL_API_BASE}${path}${newToday ? `?limit=100` : `?${qs}`}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobs(data.items || []);
      setTotal(data.total ?? (data.items || []).length);
    } catch (e) {
      setError(e.message || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [newToday, company]);

  useEffect(() => {
    load();
  }, [load]);

  const runTick = async () => {
    setBusy(true);
    setTickMsg("");
    try {
      const secret = import.meta.env.VITE_SCHEDULER_SECRET || "";
      const headers = { "Content-Type": "application/json" };
      if (secret) headers["X-Scheduler-Secret"] = secret;
      const res = await fetch(`${INTEL_API_BASE}/api/v1/scheduler/tick`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setTickMsg(data.message || "Crawl finished");
      await load();
    } catch (e) {
      setTickMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const copyLinks = () => {
    const text = jobs.map((j) => `${j.company_name} — ${j.title}\n${j.apply_url}`).join("\n\n");
    navigator.clipboard.writeText(text);
    alert(`Copied ${jobs.length} links`);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Internship Links</h2>
          <p style={{ color: "var(--text-muted)", margin: "6px 0 0" }}>
            Live apply URLs for SWE / AI / ML / infra internships (Summer 2027 · Class 2028). Same backend as outreach.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="primary-btn" onClick={runTick} disabled={busy}>
            {busy ? "Crawling…" : "Run crawl now"}
          </button>
          <button className="primary-btn" onClick={load} disabled={loading} style={{ background: "#334155" }}>
            Refresh
          </button>
          <button className="primary-btn" onClick={copyLinks} disabled={!jobs.length} style={{ background: "#0f766e" }}>
            Copy links
          </button>
        </div>
      </div>

      {tickMsg && (
        <p style={{ fontSize: 13, color: tickMsg.startsWith("Error") ? "#b91c1c" : "#0f766e" }}>{tickMsg}</p>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={newToday} onChange={(e) => setNewToday(e.target.checked)} />
          New today only
        </label>
        {!newToday && (
          <input
            placeholder="Filter company…"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", minWidth: 180 }}
          />
        )}
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{total} openings</span>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>
          No matching internships yet. Click <b>Run crawl now</b> (after seeding companies once via API).
        </p>
      )}

      {jobs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 8px" }}>Company</th>
                <th style={{ padding: "10px 8px" }}>Title</th>
                <th style={{ padding: "10px 8px" }}>Location</th>
                <th style={{ padding: "10px 8px" }}>Tags</th>
                <th style={{ padding: "10px 8px" }}>Apply</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>{j.company_name}</td>
                  <td style={{ padding: "10px 8px" }}>{j.title}</td>
                  <td style={{ padding: "10px 8px", color: "var(--text-muted)" }}>
                    {j.location_text || (j.is_remote ? "Remote" : "—")}
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <TagList job={j} />
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <a href={j.apply_url} target="_blank" rel="noreferrer">
                      Open →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TagList({ job }) {
  const tags = [];
  if (job.is_india) tags.push("India");
  if (job.is_remote) tags.push("Remote");
  if (job.grad_year_eligibility === "2028") tags.push("2028");
  if (job.season_tag === "summer_2027") tags.push("Sum27");
  if (job.role_family) tags.push(job.role_family);
  if (job.link_ok) tags.push("verified");
  return (
    <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: "#e2e8f0",
            color: "#334155",
          }}
        >
          {t}
        </span>
      ))}
    </span>
  );
}
