import { useState } from "react";
import { API_BASE } from "../config";

export default function CsvUpload() {
  const [file, setFile] = useState(null);
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
        // Reload page or trigger refresh could go here
      } else {
        setMessage(`Error: ${data.detail || "Failed to upload"}`);
      }
    } catch (err) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#fafafa",
      }}
    >
      <h3>Upload Recruiters CSV</h3>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ padding: "6px 12px" }}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {message && (
        <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>
      )}
    </div>
  );
}
