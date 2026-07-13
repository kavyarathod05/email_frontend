import { useEffect, useState } from "react";
import { INTEL_API_BASE } from "../config";

export default function InternshipOps() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [providers, setProviders] = useState([]);
  const [importText, setImportText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
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
    } catch (e) {
      setMsg(`Load error: ${e.message}`);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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

  const withBoard = companies.filter((c) => c.board_token).length;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Companies & Crawlers</h2>
      <p style={{ color: "var(--text-muted)" }}>
        {total} companies in DB · {withBoard} on this page with board tokens · {providers.length} ATS
        providers
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button className="primary-btn" onClick={seed} disabled={busy}>
          Seed companies
        </button>
        <button className="primary-btn" onClick={refresh} style={{ background: "#334155" }}>
          Refresh
        </button>
      </div>

      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

      <h3>ATS providers</h3>
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
              <th style={{ padding: 8 }}>ATS</th>
              <th style={{ padding: 8 }}>Board</th>
              <th style={{ padding: 8 }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: 8 }}>{c.name}</td>
                <td style={{ padding: 8 }}>{c.ats_provider}</td>
                <td style={{ padding: 8, color: "var(--text-muted)" }}>{c.board_token || "—"}</td>
                <td style={{ padding: 8 }}>{c.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
