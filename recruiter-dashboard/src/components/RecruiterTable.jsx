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
    if (filter === "top_tier") return r.companyType === "top_tier";
    if (filter === "startup") return r.companyType === "startup";
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
        {["all", "top_tier", "startup", "replied", "opened", "clicked", "followup", "error"].map(
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
              {f.replace("_", " ")}
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
                  <td style={{ 
                    fontWeight: "500", 
                    color: r.is_fake ? "#b91c1c" : r.is_risky ? "#854d0e" : "var(--text-main)",
                    backgroundColor: r.is_fake ? "#fef2f2" : r.is_risky ? "#fefce8" : "transparent",
                    borderRadius: "4px",
                    padding: "4px 8px"
                  }}>
                    {r.email}
                    {r.is_fake && <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.7}}>(Fake)</span>}
                    {r.is_risky && <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.7}}>(Risky)</span>}
                  </td>
                  <td>
                    {r.company || "-"}
                    <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {r.companyType === "top_tier" ? (
                        <span style={{ fontSize: "10px", padding: "2px 6px", background: "#e0e7ff", color: "#3730a3", borderRadius: "10px", fontWeight: 600 }}>Top Tier</span>
                      ) : (
                        <span style={{ fontSize: "10px", padding: "2px 6px", background: "#f3f4f6", color: "#4b5563", borderRadius: "10px", fontWeight: 600 }}>Startup</span>
                      )}
                      {r.companyType === "top_tier" && ["sent", "replied", "error"].includes(r.status) && (
                        <span style={{ fontSize: "10px", padding: "2px 6px", background: "#dcfce7", color: "#166534", borderRadius: "10px", fontWeight: 600 }}>✨ AI Sent</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${r.status} ${r.is_fake ? 'fake' : r.is_risky ? 'risky' : ''}`}>
                      {r.is_fake ? 'fake' : r.is_risky ? 'risky' : r.status}
                    </span>
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
