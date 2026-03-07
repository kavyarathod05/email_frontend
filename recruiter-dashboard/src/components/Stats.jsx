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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "20px",
        marginBottom: "24px",
      }}
    >
      <Stat label="Total" value={stats.total} />
      <Stat label="Sent" value={stats.sent} />
      <Stat label="Replied" value={stats.replied} />
      <Stat label="New" value={stats.new} />
      <Stat label="Errors" value={stats.errors || 0} />
      <Stat label="Followups" value={stats.followups || 0} />
      <Stat label="Opened" value={stats.opened || 0} />
      <Stat label="Clicked" value={stats.clicked || 0} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      className="card"
      style={{
        padding: "20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          fontSize: "32px",
          margin: "0 0 8px 0",
          color: "var(--primary)",
        }}
      >
        {value}
      </h2>
      <p
        style={{
          margin: 0,
          color: "var(--text-muted)",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {label}
      </p>
    </div>
  );
}
