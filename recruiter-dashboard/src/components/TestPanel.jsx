import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config";

export default function TestPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Kavya");
  const [company, setCompany] = useState("Test Inc");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const sendCountRef = useRef({ initial: 0, followup1: 0, breakup: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then((res) => res.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  const handleTest = async (templateType) => {
    if (!email) {
      setResponse({ error: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Round-robin: if no template explicitly selected, cycle through DB templates
      let templateId = selectedTemplateId || null;

      if (!templateId) {
        const typeTemplates = templates.filter((t) => {
          if (templateType === "initial")
            return t.type === "initial" || !t.type;
          return t.type === templateType;
        });

        if (typeTemplates.length > 0) {
          const idx = sendCountRef.current[templateType] % typeTemplates.length;
          templateId = typeTemplates[idx]._id;
          sendCountRef.current[templateType]++;
        }
      }

      const res = await fetch(`${API_BASE}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          templateType,
          templateId,
        }),
      });
      const data = await res.json();
      // Show which template was used
      if (templateId && !selectedTemplateId) {
        const usedTemplate = templates.find((t) => t._id === templateId);
        data._rotatedTemplate = usedTemplate?.name || templateId;
      }
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateOpen = async () => {
    if (!email) {
      setResponse({ error: "Please enter an email address" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test/open/${email}`, {
        method: "POST",
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateClick = async () => {
    if (!email) {
      setResponse({ error: "Please enter an email address" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test/click/${email}`, {
        method: "POST",
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "24px", maxWidth: "800px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Live Email Tester</h3>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "20px",
          fontSize: "14px",
        }}
      >
        Instantly send specific templates to any email address to test
        formatting and tracking without adding them to the database.
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          marginBottom: "24px",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
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
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            style={{
              boxSizing: "border-box",
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
            }}
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
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              boxSizing: "border-box",
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
            }}
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
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              boxSizing: "border-box",
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "6px",
            color: "var(--text-muted)",
          }}
        >
          Select Template (auto-rotates when none selected)
        </label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            fontFamily: "inherit",
          }}
        >
          <option value="">-- Auto-Rotate All Templates --</option>

          <optgroup label="Initial Email Templates">
            {templates
              .filter((t) => t.type === "initial" || !t.type)
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
          </optgroup>

          <optgroup label="Follow-up 1 Templates">
            {templates
              .filter((t) => t.type === "followup1")
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
          </optgroup>

          <optgroup label="Breakup Templates">
            {templates
              .filter((t) => t.type === "breakup")
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="primary-btn"
          onClick={() => handleTest("initial")}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Initial Email"}
        </button>
        <button
          className="primary-btn"
          onClick={() => handleTest("followup1")}
          disabled={loading}
          style={{ background: "#4f46e5" }}
        >
          {loading ? "Sending..." : "Send Follow-up 1"}
        </button>
        <button
          className="primary-btn"
          onClick={() => handleTest("breakup")}
          disabled={loading}
          style={{ background: "#bd1a38" }}
        >
          {loading ? "Sending..." : "Send Breakup"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="tab-btn"
          onClick={handleSimulateOpen}
          disabled={loading}
          style={{ padding: "8px 16px", background: "var(--card-bg)" }}
        >
          Simulate Open
        </button>
        <button
          className="tab-btn"
          onClick={handleSimulateClick}
          disabled={loading}
          style={{ padding: "8px 16px", background: "var(--card-bg)" }}
        >
          Simulate Click
        </button>
      </div>

      {response && (
        <div
          style={{
            background: "#1e293b",
            color: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#94a3b8",
            }}
          >
            API RESPONSE
          </div>
          <pre style={{ margin: 0, fontSize: "13px", fontFamily: "monospace" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
