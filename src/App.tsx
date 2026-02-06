// Minimal Vite stub - the real app uses Next.js (app/ directory)
export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#050a0e",
      color: "#fafafa",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 500, padding: 32 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, background: "linear-gradient(135deg, #1db954, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          What A Match
        </h1>
        <p style={{ fontSize: 18, color: "#68808d", marginBottom: 32, lineHeight: 1.6 }}>
          Find your perfect match. Connect with people who share your interests.
        </p>
      </div>
    </div>
  );
}
