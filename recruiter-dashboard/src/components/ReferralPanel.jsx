import { useEffect, useState } from "react";
import { INTEL_API_BASE } from "../config";

/**
 * Auto-discovers company employees (with LinkedIn when found),
 * then sends referral emails for a specific job.
 */
export default function ReferralPanel({ job, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState({});
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [resumeLink, setResumeLink] = useState(
    () => localStorage.getItem("referral_resume_link") || ""
  );
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [discoverInfo, setDiscoverInfo] = useState(null);

  const applyContacts = (list) => {
    setContacts(list);
    const sel = {};
    list.forEach((c) => {
      sel[c.email] = !!c.can_email;
    });
    setSelected(sel);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDiscovering(true);
      setError("");
      setMsg("Looking up saved contacts, then finding employees + LinkedIn…");
      try {
        const tRes = await fetch(`${INTEL_API_BASE}/api/v1/referrals/templates`);
        const tData = await tRes.json();
        if (!cancelled) {
          const tpls = tData.items || [];
          setTemplates(tpls);
          if (tpls[0]) setTemplateId(tpls[0]._id);
        }

        const res = await fetch(`${INTEL_API_BASE}/api/v1/referrals/discover`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: job.id,
            company: job.company_name,
            limit: 12,
            force: false,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        applyContacts(data.contacts || []);
        setDiscoverInfo(data.discover || null);
        const d = data.discover || {};
        if (d.ran) {
          setMsg(
            `Found ${data.count} people` +
              (d.count_added ? ` · +${d.count_added} new` : "") +
              (d.domain ? ` · domain ${d.domain}` : "") +
              (d.error ? ` · discover warning: ${d.error}` : "")
          );
        } else {
          setMsg(`Showing ${data.count} saved contacts for ${data.company}`);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to find employees");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDiscovering(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job.id, job.company_name]);

  const rediscover = async () => {
    setDiscovering(true);
    setError("");
    setMsg("Re-scanning web for employees + LinkedIn…");
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/referrals/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          company: job.company_name,
          limit: 12,
          force: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      applyContacts(data.contacts || []);
      setDiscoverInfo(data.discover || null);
      const d = data.discover || {};
      setMsg(
        `Refresh done · ${data.count} people` +
          (d.count_added ? ` · +${d.count_added} new` : "")
      );
    } catch (e) {
      setError(e.message || "Discover failed");
    } finally {
      setDiscovering(false);
    }
  };

  const toggle = (email) => {
    setSelected((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const toggleAll = (on) => {
    const next = {};
    contacts.forEach((c) => {
      next[c.email] = on && !!c.can_email;
    });
    setSelected(next);
  };

  const send = async (dryRun) => {
    const emails = Object.keys(selected).filter(
      (e) => selected[e] && contacts.find((c) => c.email === e)?.can_email
    );
    if (!emails.length) {
      setError("Select at least one contact with an email");
      return;
    }
    if (!resumeLink.trim()) {
      setError("Paste your resume link first");
      return;
    }
    if (!templateId && templates.length === 0) {
      setError("Create a Referral template under Templates first");
      return;
    }
    setSending(true);
    setError("");
    localStorage.setItem("referral_resume_link", resumeLink.trim());
    try {
      const res = await fetch(`${INTEL_API_BASE}/api/v1/referrals/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          resume_link: resumeLink.trim(),
          template_id: templateId || undefined,
          emails,
          dry_run: dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || `HTTP ${res.status}`);
      setMsg(
        dryRun
          ? `Preview OK — would send ${data.sent} emails with job link included.`
          : `Sent ${data.sent} referral(s)${data.failed ? `, ${data.failed} failed` : ""}.`
      );
    } catch (e) {
      setError(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const emailable = contacts.filter((c) => c.can_email).length;

  return (
    <div className="referral-overlay" onClick={onClose}>
      <div className="referral-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="intel-toolbar">
          <div>
            <h3 style={{ margin: 0 }}>Employees & referral</h3>
            <p className="intel-sub">
              {job.company_name} · {job.title}
            </p>
            <p className="intel-sub">
              Job link:{" "}
              <a href={job.apply_url} target="_blank" rel="noreferrer">
                {job.apply_url}
              </a>
            </p>
          </div>
          <div className="intel-actions">
            <button
              type="button"
              className="primary-btn btn-muted"
              onClick={rediscover}
              disabled={discovering}
            >
              {discovering ? "Finding…" : "Find more"}
            </button>
            <button type="button" className="primary-btn btn-muted" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="referral-fields">
          <label>
            Your resume link
            <input
              type="url"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </label>
          <label>
            Referral template
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.length === 0 && (
                <option value="">No referral templates — create one in Templates</option>
              )}
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(loading || discovering) && (
          <p className="intel-msg">
            Searching for employees at {job.company_name} (LinkedIn + email guesses)…
          </p>
        )}
        {error && <p className="intel-msg err">{error}</p>}
        {msg && !loading && <p className="intel-msg">{msg}</p>}

        {!loading && contacts.length === 0 && (
          <p className="intel-sub">
            No employees found yet. Click <b>Find more</b> to re-scan, or import contacts
            manually.
          </p>
        )}

        {contacts.length > 0 && (
          <>
            <div className="intel-filters" style={{ marginBottom: 8 }}>
              <button type="button" className="link-btn" onClick={() => toggleAll(true)}>
                Select emailable
              </button>
              <button type="button" className="link-btn" onClick={() => toggleAll(false)}>
                Clear
              </button>
              <span className="intel-count">
                {contacts.length} people · {emailable} with email
                {discoverInfo?.domain ? ` · ${discoverInfo.domain}` : ""}
              </span>
            </div>
            <div className="intel-table-wrap referral-contacts">
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Send</th>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Email</th>
                    <th>LinkedIn</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.email}>
                      <td>
                        <input
                          type="checkbox"
                          disabled={!c.can_email}
                          checked={!!selected[c.email] && !!c.can_email}
                          onChange={() => toggle(c.email)}
                          title={
                            c.can_email
                              ? "Include in referral email"
                              : "No email guess — open LinkedIn instead"
                          }
                        />
                      </td>
                      <td>{c.name || "—"}</td>
                      <td className="cell-muted">{c.title || "—"}</td>
                      <td className="cell-muted">
                        {c.can_email ? c.email : <span title={c.email}>email unknown</span>}
                      </td>
                      <td>
                        {c.linkedin ? (
                          <a href={c.linkedin} target="_blank" rel="noreferrer">
                            Profile →
                          </a>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="intel-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="primary-btn btn-muted"
            disabled={sending || !emailable}
            onClick={() => send(true)}
          >
            Preview (dry run)
          </button>
          <button
            type="button"
            className="primary-btn"
            disabled={sending || !emailable}
            onClick={() => send(false)}
          >
            {sending ? "Sending…" : "Send referral emails"}
          </button>
        </div>
      </div>
    </div>
  );
}
