import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function RecruiterTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/recruiters`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const [filter, setFilter] = useState("all");

  const filteredData = data.filter((r) => {
    if (filter === "replied") return r.replied;
    if (filter === "opened") return r.opened;
    if (filter === "clicked") return r.clicked;
    if (filter === "followup") return r.followupSent;
    if (filter === "error") return r.status === "error";
    return true; // "all"
  });

  if (loading) return <p>Loading recruiters...</p>;

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {["all", "replied", "opened", "clicked", "followup", "error"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                border:
                  filter === f
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border)",
                background: filter === f ? "#eff6ff" : "var(--surface)",
                color: filter === f ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: 500,
                textTransform: "capitalize",
                fontSize: "13px",
                transition: "all 0.2s ease",
              }}
            >
              {f}
            </button>
          ),
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
              <th>Reply Date</th>
              <th>Reply Snippet</th>
              <th>Followup Date</th>
              <th>Stage</th>
              <th>Opened</th>
              <th>Clicked</th>
              <th>Error Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--text-muted)",
                  }}
                >
                  No recruiters match this filter.
                </td>
              </tr>
            ) : (
              filteredData.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: "500", color: "var(--text-main)" }}>
                    {r.email}
                  </td>
                  <td>{r.company || "-"}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.replyAt ? new Date(r.replyAt).toLocaleString() : "-"}
                  </td>
                  <td>{r.replySnippet ? r.replySnippet.slice(0, 80) : "-"}</td>
                  <td>
                    {r.followupAt
                      ? new Date(r.followupAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>{r.followupStage || 0}</td>
                  <td>
                    {r.openedAt ? new Date(r.openedAt).toLocaleString() : "-"}
                  </td>
                  <td>
                    {r.clickedAt ? new Date(r.clickedAt).toLocaleString() : "-"}
                  </td>
                  <td style={{ color: r.errorDetail ? "#b91c1c" : "inherit" }}>
                    {r.errorDetail ? r.errorDetail.slice(0, 80) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
