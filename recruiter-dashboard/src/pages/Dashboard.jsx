import { useState } from "react";
import Stats from "../components/Stats";
import RecruiterTable from "../components/RecruiterTable";
import CsvUpload from "../components/CsvUpload";
import TestPanel from "../components/TestPanel";
import TemplateManager from "../components/TemplateManager";
import AnalyticsCharts from "../components/AnalyticsCharts";
import DailyReport from "../components/DailyReport";
import QueuePanel from "../components/QueuePanel";
import LogPanel from "../components/LogPanel";
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
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          System Logs
        </button>
        <button
          className={`tab-btn ${activeTab === "queue" ? "active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          Queue
        </button>
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Stats
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "dailyReport" ? "active" : ""}`}
          onClick={() => setActiveTab("dailyReport")}
        >
          Daily Report
        </button>
        <button
          className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
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
        <button
          className={`tab-btn ${activeTab === "testing" ? "active" : ""}`}
          onClick={() => setActiveTab("testing")}
        >
          Tester
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "logs" && (
          <div className="fade-in">
            <LogPanel />
          </div>
        )}

        {activeTab === "queue" && (
          <div className="fade-in">
            <QueuePanel />
          </div>
        )}

        {activeTab === "overview" && (
          <div className="fade-in">
            <Stats />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="fade-in">
            <AnalyticsCharts />
          </div>
        )}

        {activeTab === "dailyReport" && (
          <div className="fade-in">
            <DailyReport />
          </div>
        )}

        {activeTab === "templates" && (
          <div className="fade-in">
            <TemplateManager />
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

        {activeTab === "testing" && (
          <div className="fade-in">
            <TestPanel />
          </div>
        )}
      </div>
    </div>
  );
}
