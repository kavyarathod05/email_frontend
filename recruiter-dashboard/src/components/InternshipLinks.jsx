import { useCallback, useEffect, useRef, useState } from "react";
import { INTEL_API_BASE } from "../config";

export default function InternshipLinks() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newToday, setNewToday] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [tickMsg, setTickMsg] = useState("");
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [crawlProgress, setCrawlProgress] = useState(null);
  const pollRef = useRef(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        limit: "100",
        filter_pass: "true",
        status: "open",
      });
      if (newToday) qs.set("new_today", "true");
      if (company.trim()) qs.set("company", company.trim());
      const path = newToday ? `/api/v1/jobs/today?limit=100` : `/api/v1/jobs?${qs}`;
      const res = await fetch(`${INTEL_API_BASE}${path}`);
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

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/crawlers/runs?limit=1`);
      if (!res.ok) return;
      const data = await res.json();
      const run = (data.runs || [])[0];
      if (!run) return;
      setCrawlStatus(run.status || "");
      setCrawlProgress(run.progress || run.result || null);
      setCrawlLogs(run.company_logs || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadJobs();
    loadRuns();
  }, [loadJobs, loadRuns]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const seedCompanies = async () => {
    setBusy(true);
    setTickMsg("Seeding companies…");
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/companies/seed`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setTickMsg(
        `Seeded: +${data.inserted} new, ${data.updated} updated, total ${data.total_in_db}`
      );
    } catch (e) {
      setTickMsg(`Seed error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const runCrawl = async () => {
    setBusy(true);
    setTickMsg("Crawl started — watching company logs…");
    setCrawlLogs([]);
    setCrawlStatus("running");

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadRuns, 2500);

    try {
      const secret = import.meta.env.VITE_SCHEDULER_SECRET || "";
      const headers = { "Content-Type": "application/json" };
      if (secret) headers["X-Scheduler-Secret"] = secret;

      // Prefer full tick; fall back to crawl-only if secret blocks tick
      let res = await fetch(`${INTEL_API_BASE}/api/v1/crawlers/run`, {
        method: "POST",
        headers,
      });
      let data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setCrawlLogs(data.company_logs || []);
      setTickMsg(
        `Done: ${data.companies_ok}/${data.companies_attempted} boards OK · ` +
          `${data.jobs_passed_filter} internships matched · ${data.jobs_new} new`
      );
      await loadRuns();
      await loadJobs();
    } catch (e) {
      setTickMsg(`Crawl error: ${e.message}`);
    } finally {
      if (pollRef.current) clearInterval(pollRef.current);
      setBusy(false);
      setCrawlStatus("done");
    }
  };

  const copyLinks = () => {
    const text = jobs.map((j) => `${j.company_name} — ${j.title}\n${j.apply_url}`).join("\n\n");
    navigator.clipboard.writeText(text);
    alert(`Copied ${jobs.length} links`);
  };

  return (
    <div className="intel-layout">
      <div className="card intel-panel">
        <div className="intel-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Internship Links</h2>
            <p className="intel-sub">
              Summer 2027 · Class of 2028 · India / Remote · live apply URLs
            </p>
          </div>
          <div className="intel-actions">
            <button className="primary-btn" onClick={seedCompanies} disabled={busy}>
              Seed companies
            </button>
            <button className="primary-btn" onClick={runCrawl} disabled={busy}>
              {busy ? "Crawling…" : "Run crawl"}
            </button>
            <button
              className="primary-btn btn-muted"
              onClick={loadJobs}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              className="primary-btn btn-teal"
              onClick={copyLinks}
              disabled={!jobs.length}
            >
              Copy links
            </button>
          </div>
        </div>

        {tickMsg && (
          <p className={tickMsg.includes("error") || tickMsg.includes("Error") ? "intel-msg err" : "intel-msg"}>
            {tickMsg}
          </p>
        )}

        <div className="intel-filters">
          <label>
            <input
              type="checkbox"
              checked={newToday}
              onChange={(e) => setNewToday(e.target.checked)}
            />
            New today only
          </label>
          <input
            className="intel-search"
            placeholder="Filter company…"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <span className="intel-count">{total} openings</span>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="intel-msg err">{error}</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="intel-sub">
            No matches yet. Click <b>Seed companies</b>, then <b>Run crawl</b>.
          </p>
        )}

        {jobs.length > 0 && (
          <div className="intel-table-wrap">
            <table className="intel-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Tags</th>
                  <th>Apply</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="cell-strong">{j.company_name}</td>
                    <td>{j.title}</td>
                    <td>{j.location_text || (j.is_remote ? "Remote" : "—")}</td>
                    <td>
                      <TagList job={j} />
                    </td>
                    <td>
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

      <div className="card intel-panel intel-log-panel">
        <div className="intel-toolbar">
          <div>
            <h3 style={{ margin: 0 }}>Crawl log</h3>
            <p className="intel-sub">
              Per company: boards hit, internships found
              {crawlStatus ? ` · status: ${crawlStatus}` : ""}
            </p>
          </div>
          {crawlProgress && (
            <span className="intel-count">
              ok {crawlProgress.ok ?? crawlProgress.companies_ok ?? "—"} /{" "}
              {crawlProgress.attempted ?? crawlProgress.companies_attempted ?? "—"}
              {" · "}
              matched {crawlProgress.passed ?? crawlProgress.jobs_passed_filter ?? "—"}
            </span>
          )}
        </div>

        <div className="intel-log-scroll">
          {crawlLogs.length === 0 && (
            <p className="intel-sub">No crawl yet. Run crawl to see live company results here.</p>
          )}
          {crawlLogs.map((row, i) => (
            <div key={`${row.slug}-${i}`} className={`crawl-row status-${row.status}`}>
              <div className="crawl-row-head">
                <strong>{row.company}</strong>
                <span className={`badge crawl-${row.status}`}>{row.status}</span>
                <span className="intel-sub">
                  {row.ats} · jobs {row.jobs_total} · interns {row.intern_found} · pass{" "}
                  {row.passed_filter}
                </span>
              </div>
              {row.error && <div className="intel-msg err">{row.error}</div>}
              {(row.samples || []).map((s) => (
                <div key={s.url} className="crawl-sample">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                  <span className="intel-sub">{s.location || ""}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
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
    <span className="tag-row">
      {tags.map((t) => (
        <span key={t} className="tag-pill">
          {t}
        </span>
      ))}
    </span>
  );
}
