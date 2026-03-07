import { useState } from "react";
import Stats from "../components/Stats";
import RecruiterTable from "../components/RecruiterTable";
import CsvUpload from "../components/CsvUpload";
import "../style.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Recruiter Outreach Dashboard</h1>
        <p>
          Manage your email campaigns, track opens and clicks, and automate
          follow-ups.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Stats
        </button>
        <button
          className={`tab-btn ${activeTab === "recruiters" ? "active" : ""}`}
          onClick={() => setActiveTab("recruiters")}
        >
          Recruiter Database
        </button>
        <button
          className={`tab-btn ${activeTab === "actions" ? "active" : ""}`}
          onClick={() => setActiveTab("actions")}
        >
          Import Contacts
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="fade-in">
            <Stats />
          </div>
        )}

        {activeTab === "recruiters" && (
          <div className="fade-in">
            <RecruiterTable />
          </div>
        )}

        {activeTab === "actions" && (
          <div className="fade-in">
            <CsvUpload />
          </div>
        )}
      </div>
    </div>
  );
}
