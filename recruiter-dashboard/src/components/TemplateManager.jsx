import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    htmlBody: "",
    type: "initial",
  });
  const [editingId, setEditingId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId
        ? `${API_BASE}/templates/${editingId}`
        : `${API_BASE}/templates`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", subject: "", htmlBody: "", type: "initial" });
        setEditingId(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name,
      subject: t.subject,
      htmlBody: t.htmlBody,
      type: t.type || "initial",
    });
    setEditingId(t._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete template?")) return;
    try {
      await fetch(`${API_BASE}/templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div className="card" style={{ flex: "1 1 400px" }}>
        <h3>{editingId ? "Edit Template" : "New Template"}</h3>
        <form
          onSubmit={handleSave}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text-muted)",
              }}
            >
              Template Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
              placeholder="e.g. Software Engineer Intro"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text-muted)",
              }}
            >
              Template Type
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
            >
              <option value="initial">Initial Email</option>
              <option value="followup1">Follow-up 1</option>
              <option value="breakup">Breakup</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text-muted)",
              }}
            >
              Subject (use {"{company}"} for dynamic company name)
            </label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
              placeholder="Application for {'{company}'}"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "var(--text-muted)",
              }}
            >
              HTML Body (use {"{name}"}, {"{company}"}, {"{resume_link}"} for
              link, {"{resume_url}"} for raw URL)
            </label>
            <textarea
              required
              rows={15}
              value={form.htmlBody}
              onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                fontFamily: "monospace",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
              placeholder="<p>Hi {'{name}'}, I'd love to join {'{company}'}...</p><p>Check my {'{resume_link}'}</p>"
            />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Template"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    subject: "",
                    htmlBody: "",
                    type: "initial",
                  });
                }}
                className="tab-btn"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="card" style={{ flex: "1 1 300px" }}>
        <h3>Existing Templates</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {templates.map((t) => (
            <div
              key={t._id}
              style={{
                border: "1px solid var(--border)",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <h4 style={{ margin: "0 0 4px 0" }}>
                {t.name}{" "}
                <span
                  style={{
                    fontSize: "12px",
                    background: "var(--border)",
                    padding: "2px 6px",
                    borderRadius: "12px",
                    marginLeft: "8px",
                    fontWeight: "normal",
                    color: "var(--text-muted)",
                  }}
                >
                  {t.type || "initial"}
                </span>
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  margin: "0 0 12px 0",
                }}
              >
                {t.subject}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleEdit(t)}
                  className="tab-btn"
                  style={{ padding: "4px 12px" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setPreviewId(previewId === t._id ? null : t._id)}
                  className="tab-btn"
                  style={{ 
                    padding: "4px 12px",
                    borderColor: previewId === t._id ? "var(--primary)" : "var(--border)",
                    color: previewId === t._id ? "var(--primary)" : "var(--text-muted)"
                  }}
                >
                  {previewId === t._id ? "Hide Preview" : "Preview"}
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="tab-btn"
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#bd1a38",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Delete
                </button>
              </div>
              {previewId === t._id && (
                <div className="fade-in">
                  <div 
                    className="template-preview-box"
                    dangerouslySetInnerHTML={{ __html: t.htmlBody }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    * Placeholders like <code>{'{'}name{'}'}</code> will be replaced during sending.
                  </div>
                </div>
              )}
            </div>
          ))}
          {templates.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              No templates found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
