import Stats from "../components/Stats";
import RecruiterTable from "../components/RecruiterTable";
import CsvUpload from "../components/CsvUpload";

export default function Dashboard() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Recruiter Outreach Dashboard</h1>
      <CsvUpload />
      <Stats />
      <RecruiterTable />
    </div>
  );
}
