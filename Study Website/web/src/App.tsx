import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        maxWidth: 1200,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Local Exam Builder</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/">Upload</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
