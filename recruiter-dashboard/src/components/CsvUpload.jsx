import { useState } from "react";
import { API_BASE } from "../config";

export default function CsvUpload() {
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/recruiters/import-csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success: ${data.added} added, ${data.skipped} skipped.`);
        setFile(null);
        // Clear file input if possible
      } else {
        setMessage(`Error: ${data.detail || "Failed to upload"}`);
      }
    } catch (err) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTextImport = async () => {
    if (!csvText.trim()) {
      setMessage("Please paste CSV text first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/recruiters/import-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success: ${data.added} added, ${data.skipped} skipped.`);
        setCsvText("");
      } else {
        setMessage(`Error: ${data.detail || "Failed to import"}`);
      }
    } catch (err) {
      setMessage(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "24px",
      }}
    >
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
          Upload Recruiters CSV
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          Select a .csv file from your computer.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button
            className="primary-btn"
            onClick={handleUpload}
            disabled={loading || !file}
            style={{ width: "fit-content" }}
          >
            {loading ? "Uploading..." : "Upload CSV File"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Paste CSV Text</h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          Paste CSV data (e.g., Email,Name,Company).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            rows="4"
            placeholder="Email,Name,Company&#10;test@example.com,John Doe,Google"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontFamily: "monospace",
              fontSize: "13px",
              resize: "vertical",
            }}
          />
          <button
            className="primary-btn"
            onClick={handleTextImport}
            disabled={loading || !csvText.trim()}
            style={{ width: "fit-content" }}
          >
            {loading ? "Importing..." : "Import from Text"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "12px",
            borderRadius: "8px",
            background: message.includes("Success") ? "#f0fdf4" : "#fef2f2",
            color: message.includes("Success") ? "#166534" : "#991b1b",
            fontWeight: "500",
            border: `1px solid ${message.includes("Success") ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
