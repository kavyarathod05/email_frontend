import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config";

export default function LogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Live update every 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAutoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isAutoScroll]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: 0 }}>System Logs Console 📡</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
            <input 
              type="checkbox" 
              checked={isAutoScroll} 
              onChange={(e) => setIsAutoScroll(e.target.checked)} 
            />
            Auto-scroll
          </label>
          <button onClick={fetchLogs} className="tab-btn" style={{ background: "var(--card-bg)", margin: 0, padding: "6px 12px" }}>
            Force Refresh
          </button>
        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: 0, marginBottom: "20px" }}>
        Live system actions, SMTP transactions, scheduler triggers, and personalization records.
      </p>

      {loading && logs.length === 0 ? (
        <div>Loading logs...</div>
      ) : error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : (
        <div 
          style={{
            background: "#0c0f17",
            color: "#e2e8f0",
            fontFamily: "monospace",
            fontSize: "12.5px",
            lineHeight: "1.6",
            padding: "16px",
            borderRadius: "10px",
            height: "400px",
            overflowY: "auto",
            border: "1px solid #1e293b",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)"
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: "#64748b", fontStyle: "italic" }}>No logs captured yet. Trigger an action!</div>
          ) : (
            logs.map((log, i) => {
              let color = "#e2e8f0";
              if (log.includes(" - ERROR - ")) color = "#ef4444";
              else if (log.includes(" - WARNING - ")) color = "#f59e0b";
              else if (log.includes("SUCCESS") || log.includes("SENT") || log.includes("successfully")) color = "#10b981";
              else if (log.includes("AI Lead Agent")) color = "#a855f7";
              else if (log.includes("Scheduler")) color = "#3b82f6";
              
              return (
                <div key={i} style={{ color, whiteSpace: "pre-wrap", marginBottom: "4px" }}>
                  {log}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
