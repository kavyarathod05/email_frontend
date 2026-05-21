import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function GeneratedEmailsPanel() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewTab, setPreviewTab] = useState("preview"); // "preview" | "html" | "errors"

  // Fetch emails from backend
  const fetchEmails = () => {
    setLoading(true);
    fetch(`${API_BASE}/dashboard/generated-emails`)
      .then((res) => res.json())
      .then((data) => {
        setEmails(data);
        if (data.length > 0) {
          setSelectedEmail(data[0]);
        } else {
          setSelectedEmail(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching generated emails:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Filter emails based on search & category
  const filteredEmails = emails.filter((e) => {
    // Search filter
    const matchesSearch =
      (e.recruiterEmail && e.recruiterEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.company && e.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.subject && e.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.messageId && e.messageId.toLowerCase().includes(searchQuery.toLowerCase()));

    // Stage filter
    let matchesType = true;
    if (typeFilter === "initial") {
      matchesType = e.stage === 0 || e.stage === "0";
    } else if (typeFilter === "followup") {
      matchesType = e.stage === 1 || e.stage === "1" || e.stage === 2 || e.stage === "2";
    } else if (typeFilter === "test") {
      matchesType = typeof e.stage === "string" && e.stage.startsWith("test");
    }

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = e.status === statusFilter;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalCount = emails.length;
  const sentCount = emails.filter((e) => e.status === "sent").length;
  const errorCount = emails.filter((e) => e.status === "error").length;
  const topTierCount = emails.filter((e) => e.companyType === "top_tier" || e.companyType === "Top Tier").length;

  // Format type string
  const formatStageType = (stage) => {
    if (stage === 0 || stage === "0") return "Initial";
    if (stage === 1 || stage === "1") return "Follow-up 1";
    if (stage === 2 || stage === "2") return "Breakup";
    if (typeof stage === "string" && stage.startsWith("test_")) {
      return `Test (${stage.replace("test_", "")})`;
    }
    return stage;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1px solid #bfdbfe",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a8a" }}>Total Logged</span>
          <span style={{ fontSize: "28px", fontWeight: "800", color: "#1d4ed8" }}>{totalCount}</span>
        </div>

        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#14532d" }}>Sent Successfully</span>
          <span style={{ fontSize: "28px", fontWeight: "800", color: "#15803d" }}>{sentCount}</span>
        </div>

        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            border: "1px solid #fecaca",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#7f1d1d" }}>Failed (Errors)</span>
          <span style={{ fontSize: "28px", fontWeight: "800", color: "#b91c1c" }}>{errorCount}</span>
        </div>

        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
            border: "1px solid #e9d5ff",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#581c87" }}>Top Tier Outreach</span>
          <span style={{ fontSize: "28px", fontWeight: "800", color: "#7e22ce" }}>{topTierCount}</span>
        </div>
      </div>

      {/* Main Split Screen */}
      <div style={{ display: "flex", gap: "24px", minHeight: "600px", flexWrap: "wrap" }}>
        {/* Left List Pane (60%) */}
        <div style={{ flex: "2 1 600px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Controls Bar */}
          <div
            className="card"
            style={{
              padding: "16px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Search Input */}
            <div style={{ flex: "1 1 200px" }}>
              <input
                type="text"
                placeholder="Search email, company, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Type Filters */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Stages" },
                { id: "initial", label: "Initial" },
                { id: "followup", label: "Follow-ups" },
                { id: "test", label: "Tests" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTypeFilter(filter.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: typeFilter === filter.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: typeFilter === filter.id ? "#eff6ff" : "var(--surface)",
                    color: typeFilter === filter.id ? "var(--primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "13px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />

            {/* Status Filters */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "all", label: "All Status" },
                { id: "sent", label: "Sent" },
                { id: "error", label: "Errors" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: statusFilter === filter.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: statusFilter === filter.id ? "#eff6ff" : "var(--surface)",
                    color: statusFilter === filter.id ? "var(--primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "13px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchEmails}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ margin: 0, maxHeight: "550px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading outbox logs...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                No generated emails found matching criteria.
              </div>
            ) : (
              <table>
                <thead>
                  <tr style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <th>Recipient / Company</th>
                    <th>Stage</th>
                    <th>Subject Line</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmails.map((email) => {
                    const isSelected = selectedEmail && selectedEmail._id === email._id;
                    return (
                      <tr
                        key={email._id}
                        onClick={() => {
                          setSelectedEmail(email);
                          setPreviewTab(email.status === "error" ? "errors" : "preview");
                        }}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "#f1f5f9" : "inherit",
                          borderLeft: isSelected ? "4px solid var(--primary)" : "none",
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {email.recruiterEmail}
                          </div>
                          <div style={{ fontSize: "12px", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{email.company || "-"}</span>
                            {email.companyType === "top_tier" ? (
                              <span style={{ fontSize: "10px", padding: "1px 4px", background: "#e0e7ff", color: "#3730a3", borderRadius: "4px", fontWeight: 600 }}>Top Tier</span>
                            ) : (
                              <span style={{ fontSize: "10px", padding: "1px 4px", background: "#f3f4f6", color: "#4b5563", borderRadius: "4px", fontWeight: 600 }}>Startup</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--text-main)", fontWeight: 500 }}>
                            {formatStageType(email.stage)}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {email.subject}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px" }}>
                            {formatDate(email.sentAt)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${email.status}`}>
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Preview Pane (40%) */}
        <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {selectedEmail ? (
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", height: "100%", boxSizing: "border-box" }}>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>Email Preview</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>To:</span>{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {selectedEmail.recruiterName} ({selectedEmail.recruiterEmail})
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Company:</span>{" "}
                    <strong>{selectedEmail.company}</strong> ({selectedEmail.companyType === "top_tier" ? "Top Tier" : "Startup"})
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Stage:</span>{" "}
                    <strong>{formatStageType(selectedEmail.stage)}</strong>
                  </div>
                  {selectedEmail.templateName && (
                    <div>
                      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Template:</span>{" "}
                      <strong>{selectedEmail.templateName}</strong>
                    </div>
                  )}
                  {selectedEmail.messageId && (
                    <div>
                      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Message ID:</span>{" "}
                      <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 4px", borderRadius: "4px" }}>
                        {selectedEmail.messageId}
                      </code>
                    </div>
                  )}
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Date Logged:</span>{" "}
                    <strong>{new Date(selectedEmail.sentAt).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Tabs Switcher for preview pane */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "8px" }}>
                <button
                  onClick={() => setPreviewTab("preview")}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: previewTab === "preview" ? "2px solid var(--primary)" : "none",
                    color: previewTab === "preview" ? "var(--primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Live Render
                </button>
                <button
                  onClick={() => setPreviewTab("html")}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: previewTab === "html" ? "2px solid var(--primary)" : "none",
                    color: previewTab === "html" ? "var(--primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Raw HTML
                </button>
                {selectedEmail.status === "error" && (
                  <button
                    onClick={() => setPreviewTab("errors")}
                    style={{
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      borderBottom: previewTab === "errors" ? "2px solid var(--primary)" : "none",
                      color: previewTab === "errors" ? "#b91c1c" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ Delivery Fail Detail
                  </button>
                )}
              </div>

              {/* Subject box */}
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 14px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600" }}>SUBJECT:</span>
                <div style={{ fontWeight: "700", marginTop: "4px", fontSize: "14px", color: "var(--text-main)" }}>
                  {selectedEmail.subject}
                </div>
              </div>

              {/* Body Content */}
              <div style={{ flex: 1, minHeight: "350px", display: "flex", flexDirection: "column" }}>
                {previewTab === "preview" && (
                  <iframe
                    title="email-body-preview"
                    srcDoc={selectedEmail.body}
                    style={{
                      width: "100%",
                      height: "350px",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      background: "#ffffff",
                    }}
                  />
                )}

                {previewTab === "html" && (
                  <textarea
                    readOnly
                    value={selectedEmail.body}
                    style={{
                      width: "100%",
                      height: "350px",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "12px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      background: "#0f172a",
                      color: "#94a3b8",
                      boxSizing: "border-box",
                      resize: "none",
                    }}
                  />
                )}

                {previewTab === "errors" && (
                  <div
                    style={{
                      width: "100%",
                      height: "350px",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "16px",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      overflowY: "auto",
                      lineHeight: "1.5",
                    }}
                  >
                    <h5 style={{ margin: "0 0 10px 0", color: "#7f1d1d", fontWeight: "700" }}>Delivery Error Details</h5>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>
                      The system encountered an error while delivering this email outreach.
                    </p>
                    <pre style={{ margin: 0, padding: "10px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                      {selectedEmail.errorDetail || "Unknown/unrecorded connection error occurred during dispatch."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                height: "100%",
                padding: "40px",
                textAlign: "center",
              }}
            >
              Select an email from the log on the left to preview its content and personalization.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
