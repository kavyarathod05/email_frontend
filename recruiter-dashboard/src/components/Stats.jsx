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
        gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <Stat label="Total" value={stats.total} />
      <Stat label="Top Tier" value={stats.top_tier || 0} color="#4f46e5" />
      <Stat label="Sent" value={stats.sent} />
      <Stat label="Replied" value={stats.replied} />
      <Stat label="New" value={stats.new} />
      <Stat label="Fake" value={stats.fake || 0} color="#b91c1c" />
      <Stat label="Risky" value={stats.risky || 0} color="#854d0e" />
      <Stat label="Errors" value={stats.errors || 0} />
      <Stat label="Followups" value={stats.followups || 0} />
      <Stat label="Opened" value={stats.opened || 0} />
      <Stat label="Clicked" value={stats.clicked || 0} />
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div
      className="card"
      style={{
        padding: "16px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderTop: color ? `4px solid ${color}` : "1px solid var(--border)",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          margin: "0 0 4px 0",
          color: color || "var(--primary)",
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
