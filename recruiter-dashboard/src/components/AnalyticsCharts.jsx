import { useState, useEffect } from "react";
import { API_BASE } from "../config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsCharts() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/analytics`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data)
    return (
      <div style={{ color: "var(--text-muted)" }}>Loading analytics...</div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card">
        <h3 style={{ margin: "0 0 16px 0" }}>Emails Sent Per Day</h3>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          Track your daily outreach volume.
        </p>
        <div style={{ height: 300, width: "100%" }}>
          <ResponsiveContainer>
            <LineChart
              data={data.sentPerDay}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#f8fafc" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Emails Sent"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 16px 0" }}>Performance by Template</h3>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          Compare conversion metrics across different email templates.
        </p>
        <div style={{ height: 400, width: "100%" }}>
          <ResponsiveContainer>
            <BarChart
              data={data.templateMetrics}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#f8fafc" }}
                cursor={{ fill: "#334155", opacity: 0.4 }}
              />
              <Legend />
              <Bar
                dataKey="sent"
                name="Sent"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="opened"
                name="Opened"
                fill="#eab308"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="clicked"
                name="Clicked"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="replied"
                name="Replied"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
