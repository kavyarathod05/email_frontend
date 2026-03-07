import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
      <Stat label="Total" value={stats.total} />
      <Stat label="Sent" value={stats.sent} />
      <Stat label="Replied" value={stats.replied} />
      <Stat label="New" value={stats.new} />
      <Stat label="Errors" value={stats.errors || 0} />
      <Stat label="Followups" value={stats.followups || 0} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "8px",
        minWidth: "110px",
        textAlign: "center",
        background: "#fafafa",
      }}
    >
      <h2>{value}</h2>
      <p>{label}</p>
    </div>
  );
}
