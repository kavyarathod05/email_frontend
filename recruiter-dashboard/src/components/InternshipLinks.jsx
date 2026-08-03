import { useCallback, useEffect, useRef, useState } from "react";
import { INTEL_API_BASE } from "../config";
import ReferralPanel from "./ReferralPanel";

const FILTER_DEFAULTS = {
  indiaOnly: true,
  allowRemote: false,
  internOnly: true,
  techOnly: true,
};

function formatPosted(job) {
  const raw = job.posted_at || job.first_seen_at;
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function loadSavedFilters() {
  try {
    const raw = localStorage.getItem("intel_job_filters");
    if (!raw) return { ...FILTER_DEFAULTS };
    return { ...FILTER_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...FILTER_DEFAULTS };
  }
}

export default function InternshipLinks() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newToday, setNewToday] = useState(false);
  const [company, setCompany] = useState("");
  const [showTracked, setShowTracked] = useState(false);
  const [filters, setFilters] = useState(loadSavedFilters);
  const [busy, setBusy] = useState(false);
  const [tickMsg, setTickMsg] = useState("");
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [crawlProgress, setCrawlProgress] = useState(null);
  const [referralJob, setReferralJob] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("intel_job_filters", JSON.stringify(filters));
  }, [filters]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        limit: "100",
        filter_pass: "true",
        status: "open",
        exclude_tracked: "true",
        india_only: String(filters.indiaOnly),
        allow_remote: String(filters.allowRemote),
        intern_only: String(filters.internOnly),
        tech_only: String(filters.techOnly),
      });
      if (newToday) qs.set("new_today", "true");
      if (company.trim()) qs.set("company", company.trim());
      const path = newToday
        ? `/api/v1/jobs/today?${qs}`
        : `/api/v1/jobs?${qs}`;
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
  }, [newToday, company, filters]);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/jobs/applications?limit=200`);
      if (!res.ok) return;
      const data = await res.json();
      setApplications(data.items || []);
    } catch {
      /* ignore */
    }
  }, []);

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
      return run;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadRuns();
  }, [loadJobs, loadApplications, loadRuns]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const markApplied = async (job, tracked) => {
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/jobs/${job.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      await loadJobs();
      await loadApplications();
    } catch (e) {
      alert(`Could not update: ${e.message}`);
    }
  };

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
    setTickMsg("Starting full crawl of all companies (batched + concurrent)…");
    setCrawlLogs([]);
    setCrawlStatus("running");

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const run = await loadRuns();
      if (run && (run.status === "done" || run.status === "error")) {
        if (pollRef.current) clearInterval(pollRef.current);
        setBusy(false);
        const p = run.progress || run.result || {};
        setTickMsg(
          run.status === "error"
            ? `Crawl error: ${run.error || "failed"}`
            : `Done: ${p.ok ?? "—"}/${p.total ?? p.attempted ?? "—"} boards · ` +
                `${p.passed ?? run.result?.jobs_passed_filter ?? "—"} India tech interns matched.`
        );
        await loadJobs();
      } else if (run?.progress) {
        const p = run.progress;
        setTickMsg(
          `Crawling… ${p.attempted ?? 0}/${p.total ?? "?"} companies · ` +
            `${p.ok ?? 0} OK · ${p.passed ?? 0} matched`
        );
      }
    }, 2500);

    try {
      const qs = new URLSearchParams({
        batch_size: "30",
        concurrency: "6",
        require_india: String(filters.indiaOnly),
        allow_remote: String(filters.allowRemote),
      });
      const res = await fetch(`${INTEL_API_BASE}/api/v1/crawlers/run-all?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setTickMsg(`Crawl started (run ${data.run_id}). Fetching all companies A→Z…`);
    } catch (e) {
      setTickMsg(`Crawl error: ${e.message}`);
      if (pollRef.current) clearInterval(pollRef.current);
      setBusy(false);
      setCrawlStatus("error");
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
              Tech interns · India{filters.allowRemote ? " / Remote" : ""} · live apply URLs
            </p>
          </div>
          <div className="intel-actions">
            <button className="primary-btn" onClick={seedCompanies} disabled={busy}>
              Seed companies
            </button>
            <button className="primary-btn" onClick={runCrawl} disabled={busy}>
              {busy ? "Crawling all…" : "Run crawl (all)"}
            </button>
            <button className="primary-btn btn-muted" onClick={loadJobs} disabled={loading}>
              Refresh
            </button>
            <button className="primary-btn btn-teal" onClick={copyLinks} disabled={!jobs.length}>
              Copy links
            </button>
          </div>
        </div>

        {tickMsg && (
          <p
            className={
              tickMsg.includes("error") || tickMsg.includes("Error")
                ? "intel-msg err"
                : "intel-msg"
            }
          >
            {tickMsg}
          </p>
        )}

        <div className="intel-filter-panel">
          <div className="intel-filter-panel-head">
            <strong>Filters</strong>
            <span className="intel-sub">Defaults: India · Interns · Tech only (no trading)</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => setFilters({ ...FILTER_DEFAULTS })}
            >
              Reset to defaults
            </button>
          </div>
          <div className="intel-filters intel-filter-bar">
            <label title="Strict India locations">
              <input
                type="checkbox"
                checked={filters.indiaOnly}
                onChange={(e) => setFilter("indiaOnly", e.target.checked)}
              />
              India only
            </label>
            <label title="Also keep generic Remote (not US/UK-only)">
              <input
                type="checkbox"
                checked={filters.allowRemote}
                onChange={(e) => setFilter("allowRemote", e.target.checked)}
              />
              Allow remote
            </label>
            <label title="Intern / co-op / trainee titles only">
              <input
                type="checkbox"
                checked={filters.internOnly}
                onChange={(e) => setFilter("internOnly", e.target.checked)}
              />
              Interns only
            </label>
            <label title="Drop trading / quant / HFT">
              <input
                type="checkbox"
                checked={filters.techOnly}
                onChange={(e) => setFilter("techOnly", e.target.checked)}
              />
              Tech only (no trading)
            </label>
            <label>
              <input
                type="checkbox"
                checked={newToday}
                onChange={(e) => setNewToday(e.target.checked)}
              />
              New today
            </label>
            <label>
              <input
                type="checkbox"
                checked={showTracked}
                onChange={(e) => setShowTracked(e.target.checked)}
              />
              My applications ({applications.length})
            </label>
            <input
              className="intel-search"
              placeholder="Filter company…"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <span className="intel-count">{total} openings</span>
          </div>
        </div>

        {showTracked && (
          <div className="intel-apps-section">
            <h3 style={{ margin: "0 0 8px" }}>Saved applications</h3>
            <p className="intel-sub">
              Checked jobs are saved here and hidden from the main list. Uncheck to show again.
            </p>
            {applications.length === 0 ? (
              <p className="intel-sub">No applications tracked yet.</p>
            ) : (
              <div className="intel-table-wrap">
                <table className="intel-table">
                  <thead>
                    <tr>
                      <th>Applied</th>
                      <th>Posted</th>
                      <th>Company</th>
                      <th>Title</th>
                      <th>Link</th>
                      <th>Referral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((j) => (
                      <tr key={j.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked
                            title="Uncheck to restore to feed"
                            onChange={() => markApplied(j, false)}
                          />
                        </td>
                        <td className="cell-muted">{formatPosted(j)}</td>
                        <td className="cell-strong">{j.company_name}</td>
                        <td>{j.title}</td>
                        <td>
                          <a href={j.apply_url} target="_blank" rel="noreferrer">
                            Open →
                          </a>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => setReferralJob(j)}
                          >
                            Find &amp; refer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {loading && <p>Loading…</p>}
        {error && <p className="intel-msg err">{error}</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="intel-sub">
            No matches yet. Click <b>Seed companies</b>, then <b>Run crawl (all)</b>.
          </p>
        )}

        {jobs.length > 0 && (
          <div className="intel-table-wrap">
            <table className="intel-table">
              <thead>
                <tr>
                  <th title="Mark applied — hides from list">Applied</th>
                  <th>Posted</th>
                  <th>Company</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Tags</th>
                  <th>Apply</th>
                  <th>Referral</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={false}
                        title="Mark as applied (saves link, hides from feed)"
                        onChange={() => markApplied(j, true)}
                      />
                    </td>
                    <td className="cell-muted">{formatPosted(j)}</td>
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
                    <td>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setReferralJob(j)}
                      >
                        Find &amp; refer
                      </button>
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
              All companies A→Z · concurrent batches
              {crawlStatus ? ` · status: ${crawlStatus}` : ""}
            </p>
          </div>
          {crawlProgress && (
            <span className="intel-count">
              {crawlProgress.attempted ?? crawlProgress.ok ?? "—"} /{" "}
              {crawlProgress.total ?? crawlProgress.companies_attempted ?? "—"}
              {" · matched "}
              {crawlProgress.passed ?? crawlProgress.jobs_passed_filter ?? "—"}
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

      {referralJob && (
        <ReferralPanel job={referralJob} onClose={() => setReferralJob(null)} />
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
    <span className="tag-row">
      {tags.map((t) => (
        <span key={t} className="tag-pill">
          {t}
        </span>
      ))}
    </span>
  );
}
