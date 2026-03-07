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

  if (loading) return <p>Loading recruiters...</p>;

  return (
    <table
      border="1"
      cellPadding="8"
      style={{ width: "100%", borderCollapse: "collapse" }}
    >
      <thead style={{ background: "#f2f2f2" }}>
        <tr>
          <th>Email</th>
          <th>Company</th>
          <th>Status</th>
          <th>Reply Date</th>
          <th>Reply Snippet</th>
          <th>Followup Date</th>
          <th>Error Detail</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={r._id}>
            <td>{r.email}</td>
            <td>{r.company || "-"}</td>
            <td>{r.status}</td>
            <td>{r.replyAt ? new Date(r.replyAt).toLocaleString() : "-"}</td>
            <td>{r.replySnippet ? r.replySnippet.slice(0, 80) : "-"}</td>
            <td>
              {r.followupAt ? new Date(r.followupAt).toLocaleString() : "-"}
            </td>
            <td>{r.errorDetail ? r.errorDetail.slice(0, 80) : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
