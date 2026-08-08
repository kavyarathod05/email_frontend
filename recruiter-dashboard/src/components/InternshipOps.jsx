import { useCallback, useEffect, useRef, useState } from "react";
import { INTEL_API_BASE } from "../config";

const CRAWL_DEFAULTS = {
  indiaOnly: true,
  allowRemote: false,
};

const CUSTOM_ADAPTERS = ["json_ld", "sitemap", "playwright"];

export default function InternshipOps() {
  const [total, setTotal] = useState(0);
  const [crawlableTotal, setCrawlableTotal] = useState(null);
  const [providers, setProviders] = useState([]);
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [crawlBusy, setCrawlBusy] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState("");
  const [crawlProgress, setCrawlProgress] = useState(null);
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [links, setLinks] = useState([]);
  const [linksTotal, setLinksTotal] = useState(0);
  const [filters, setFilters] = useState(CRAWL_DEFAULTS);
  const pollRef = useRef(null);

  const loadFetchedLinks = useCallback(async () => {
    try {
      const qs = new URLSearchParams({
        limit: "100",
        show_held: "true",
        status: "open",
        exclude_tracked: "false",
        intern_only: "true",
        tech_only: "true",
      });
      // When India-only is on, still prefer India matches but include held via show_held
      if (filters.indiaOnly) qs.set("india_only", "false");
      if (filters.allowRemote) qs.set("allow_remote", "true");
      const res = await fetch(`${INTEL_API_BASE}/api/v1/jobs?${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      setLinks(data.items || []);
      setLinksTotal(data.total ?? (data.items || []).length);
    } catch {
      /* ignore */
    }
  }, [filters]);

  const refresh = useCallback(async () => {
    try {
      const [cRes, pRes, runRes] = await Promise.all([
        fetch(`${INTEL_API_BASE}/api/v1/companies?limit=1&active=true`),
        fetch(`${INTEL_API_BASE}/api/v1/crawlers/providers`),
        fetch(`${INTEL_API_BASE}/api/v1/crawlers/runs?limit=1`),
      ]);
      const cData = await cRes.json();
      const pData = await pRes.json();
      setTotal(cData.total || 0);
      setProviders(pData.providers || []);

      // Count crawlable custom adapters (cheap: three small queries)
      const customCounts = await Promise.all(
        CUSTOM_ADAPTERS.map(async (ats) => {
          const r = await fetch(
            `${INTEL_API_BASE}/api/v1/companies?limit=1&active=true&ats_provider=${ats}`
          );
          const d = await r.json();
          return d.total || 0;
        })
      );
      setCrawlableTotal(customCounts.reduce((a, b) => a + b, 0));

      if (runRes.ok) {
        const runData = await runRes.json();
        const run = (runData.runs || [])[0];
        if (run) {
          setCrawlProgress(run.progress || run.result || null);
          setCrawlLogs(run.company_logs || []);
        }
      }
      await loadFetchedLinks();
    } catch (e) {
      setMsg(`Load error: ${e.message}`);
    }
  }, [loadFetchedLinks]);

  useEffect(() => {
    refresh();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  const seed = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/companies/seed`, { method: "POST" });
      const data = await res.json();
      setMsg(
        `Seed: inserted ${data.inserted}, updated ${data.updated}, skipped ${data.skipped}, total ${data.total_in_db}`
      );
      await refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const importNames = async () => {
    if (!importText.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/companies/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText, source: "dashboard" }),
      });
      const data = await res.json();
      setMsg(
        `Import: inserted ${data.inserted}, updated ${data.updated}, total ${data.total_in_db}`
      );
      setImportText("");
      await refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const loadRun = async () => {
    const res = await fetch(`${INTEL_API_BASE}/api/v1/crawlers/runs?limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.runs || [])[0] || null;
  };

  const runCrawlAll = async () => {
    setCrawlBusy(true);
    setCrawlMsg("Starting full crawl (all companies, batched)…");
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const run = await loadRun();
        if (!run) return;
        setCrawlProgress(run.progress || run.result || null);
        setCrawlLogs(run.company_logs || []);
        if (run.status === "done" || run.status === "error") {
          clearInterval(pollRef.current);
          setCrawlBusy(false);
          const p = run.progress || {};
          setCrawlMsg(
            run.status === "error"
              ? `Crawl error: ${run.error || "failed"}`
              : `Done: ${p.ok ?? "—"}/${p.total ?? p.attempted ?? "—"} boards · ${p.passed ?? "—"} matched`
          );
          await loadFetchedLinks();
        } else {
          const p = run.progress || {};
          setCrawlMsg(
            `Crawling… ${p.attempted ?? 0}/${p.total ?? "?"} · OK ${p.ok ?? 0} · matched ${p.passed ?? 0}`
          );
        }
      } catch {
        /* ignore poll errors */
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
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setCrawlMsg(`Crawl started (run ${data.run_id}). Processing A→Z…`);
    } catch (e) {
      setCrawlMsg(`Crawl error: ${e.message}`);
      if (pollRef.current) clearInterval(pollRef.current);
      setCrawlBusy(false);
    }
  };

  const sampleLinks = crawlLogs.flatMap((row) =>
    (row.samples || []).map((s) => ({
      ...s,
      company: row.company,
      ats: row.ats,
      passed: s.passed,
    }))
  );

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Companies & Crawlers</h2>
      <p style={{ color: "var(--text-muted)" }}>
        {total} companies · {crawlableTotal != null ? `${crawlableTotal} custom scrapers` : "…"} ·{" "}
        {providers.length} adapters · {linksTotal} intern links in DB
      </p>

      <div className="intel-filter-panel" style={{ marginBottom: 16 }}>
        <div className="intel-filter-panel-head">
          <strong>Crawl filters</strong>
          <span className="intel-sub">Applied when you run crawl / when listing links</span>
        </div>
        <div className="intel-filters intel-filter-bar">
          <label>
            <input
              type="checkbox"
              checked={filters.indiaOnly}
              onChange={(e) => setFilters((f) => ({ ...f, indiaOnly: e.target.checked }))}
            />
            India only
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.allowRemote}
              onChange={(e) => setFilters((f) => ({ ...f, allowRemote: e.target.checked }))}
            />
            Allow remote
          </label>
        </div>
        <p className="intel-sub" style={{ margin: "8px 0 0" }}>
          After deploy: click <b>Seed companies</b> so custom careers URLs load, then crawl.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button className="primary-btn" onClick={seed} disabled={busy || crawlBusy}>
          Seed companies
        </button>
        <button className="primary-btn" onClick={runCrawlAll} disabled={busy || crawlBusy}>
          {crawlBusy ? "Crawling all…" : "Run crawl (all companies)"}
        </button>
        <button
          className="primary-btn"
          onClick={refresh}
          style={{ background: "#334155" }}
          disabled={crawlBusy}
        >
          Refresh links
        </button>
      </div>

      {crawlMsg && (
        <p
          className={
            crawlMsg.includes("error") || crawlMsg.includes("Error") ? "intel-msg err" : "intel-msg"
          }
        >
          {crawlMsg}
        </p>
      )}
      {crawlProgress && (
        <p className="intel-sub">
          Progress: attempted {crawlProgress.attempted ?? "—"} / {crawlProgress.total ?? "—"} · ok{" "}
          {crawlProgress.ok ?? "—"} · matched {crawlProgress.passed ?? "—"}
        </p>
      )}

      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

      <h3>Adapters</h3>
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{providers.join(" · ") || "—"}</p>

      <h3>Add companies (one name per line)</h3>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontFamily: "inherit",
          marginBottom: 8,
        }}
        placeholder={"Stripe\nNotion\nFreshworks"}
      />
      <button className="primary-btn" onClick={importNames} disabled={busy || !importText.trim()}>
        Import
      </button>

      <h3 style={{ marginTop: 24 }}>Fetched internship links</h3>
      <p className="intel-sub">
        Live apply URLs from the latest crawl / DB (intern + tech). Click a link to open.
      </p>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        {links.length === 0 ? (
          <p className="intel-sub">No links yet — seed, then run crawl.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: 8 }}>Company</th>
                <th style={{ padding: 8 }}>Title</th>
                <th style={{ padding: 8 }}>Source</th>
                <th style={{ padding: 8 }}>Location</th>
                <th style={{ padding: 8 }}>Filter</th>
                <th style={{ padding: 8 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {links.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 8 }}>{j.company_name}</td>
                  <td style={{ padding: 8 }}>{j.title}</td>
                  <td style={{ padding: 8 }}>{j.ats_provider || j.source || "—"}</td>
                  <td style={{ padding: 8 }}>{j.location_text || (j.is_remote ? "Remote" : "—")}</td>
                  <td style={{ padding: 8 }}>{j.filter_pass ? "pass" : "held"}</td>
                  <td style={{ padding: 8 }}>
                    <a href={j.apply_url} target="_blank" rel="noreferrer">
                      Open →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sampleLinks.length > 0 && (
        <>
          <h3>Latest crawl samples</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: 8 }}>Company</th>
                  <th style={{ padding: 8 }}>Adapter</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {sampleLinks.slice(0, 80).map((s, i) => (
                  <tr key={`${s.url}-${i}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 8 }}>{s.company}</td>
                    <td style={{ padding: 8 }}>{s.ats}</td>
                    <td style={{ padding: 8 }}>{s.title}</td>
                    <td style={{ padding: 8 }}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        Open →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
