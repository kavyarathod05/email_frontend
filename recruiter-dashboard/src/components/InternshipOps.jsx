import { useCallback, useEffect, useRef, useState } from "react";
import { INTEL_API_BASE } from "../config";

const CRAWL_DEFAULTS = {
  indiaOnly: true,
  allowRemote: false,
};

const CUSTOM_ADAPTERS = ["json_ld", "sitemap", "playwright"];

export default function InternshipOps() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [boardsTotal, setBoardsTotal] = useState(null);
  const [providers, setProviders] = useState([]);
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [crawlBusy, setCrawlBusy] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState("");
  const [crawlProgress, setCrawlProgress] = useState(null);
  const [filters, setFilters] = useState(CRAWL_DEFAULTS);
  const [edits, setEdits] = useState({});
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${INTEL_API_BASE}/api/v1/companies?limit=50&active=true`),
        fetch(`${INTEL_API_BASE}/api/v1/crawlers/providers`),
      ]);
      const cData = await cRes.json();
      const pData = await pRes.json();
      setCompanies(cData.items || []);
      setTotal(cData.total || 0);
      setProviders(pData.providers || []);
      const crawlable = (cData.items || []).filter(
        (c) =>
          c.board_token ||
          (CUSTOM_ADAPTERS.includes(c.ats_provider) && c.careers_url)
      ).length;
      setBoardsTotal(crawlable);
      setEdits({});
    } catch (e) {
      setMsg(`Load error: ${e.message}`);
    }
  }, []);

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
        if (run.status === "done" || run.status === "error") {
          clearInterval(pollRef.current);
          setCrawlBusy(false);
          const p = run.progress || {};
          setCrawlMsg(
            run.status === "error"
              ? `Crawl error: ${run.error || "failed"}`
              : `Done: ${p.ok ?? "—"}/${p.total ?? p.attempted ?? "—"} boards · ${p.passed ?? "—"} matched`
          );
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

  const editFor = (c) =>
    edits[c.id] || {
      ats_provider: c.ats_provider || "unknown",
      careers_url: c.careers_url || "",
    };

  const setEdit = (id, patch) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  };

  const saveCompany = async (c) => {
    const body = editFor(c);
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/companies/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ats_provider: body.ats_provider,
          careers_url: body.careers_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setMsg(`Updated ${data.name}`);
      await refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const withBoard = companies.filter(
    (c) =>
      c.board_token || (CUSTOM_ADAPTERS.includes(c.ats_provider) && c.careers_url)
  ).length;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Companies & Crawlers</h2>
      <p style={{ color: "var(--text-muted)" }}>
        {total} companies in DB · {withBoard} crawlable on this page
        {boardsTotal != null ? ` (sample)` : ""} · {providers.length} adapters
      </p>

      <div className="intel-filter-panel" style={{ marginBottom: 16 }}>
        <div className="intel-filter-panel-head">
          <strong>Crawl filters</strong>
          <span className="intel-sub">Applied when you run crawl</span>
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
          Tech-only + interns-only are always enforced by the crawler. Custom pages use{" "}
          <code>json_ld</code> / <code>sitemap</code> / <code>playwright</code> + careers URL.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button className="primary-btn" onClick={seed} disabled={busy || crawlBusy}>
          Seed companies
        </button>
        <button
          className="primary-btn"
          onClick={runCrawlAll}
          disabled={busy || crawlBusy}
        >
          {crawlBusy ? "Crawling all…" : "Run crawl (all companies)"}
        </button>
        <button className="primary-btn" onClick={refresh} style={{ background: "#334155" }}>
          Refresh
        </button>
      </div>

      {crawlMsg && (
        <p className={crawlMsg.includes("error") || crawlMsg.includes("Error") ? "intel-msg err" : "intel-msg"}>
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
        rows={5}
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

      <h3 style={{ marginTop: 24 }}>Sample companies</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Adapter</th>
              <th style={{ padding: 8 }}>Board / Careers URL</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const e = editFor(c);
              const isCustom = CUSTOM_ADAPTERS.includes(e.ats_provider);
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>
                    <select
                      value={e.ats_provider}
                      onChange={(ev) => setEdit(c.id, { ats_provider: ev.target.value })}
                      style={{ maxWidth: 140 }}
                    >
                      {[
                        ...new Set([
                          e.ats_provider,
                          ...(providers.length ? providers : CUSTOM_ADAPTERS),
                          "unknown",
                        ]),
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8, minWidth: 220 }}>
                    {isCustom ? (
                      <input
                        type="url"
                        value={e.careers_url}
                        placeholder="https://…/careers"
                        onChange={(ev) => setEdit(c.id, { careers_url: ev.target.value })}
                        style={{ width: "100%", padding: 6 }}
                      />
                    ) : (
                      <span>{c.board_token || c.careers_url || "—"}</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      className="primary-btn"
                      style={{ background: "#334155", padding: "4px 10px", fontSize: 12 }}
                      disabled={busy}
                      onClick={() => saveCompany(c)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
