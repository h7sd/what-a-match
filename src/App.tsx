export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "hsl(200 25% 3%)",
      color: "hsl(0 0% 98%)",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 500, padding: 32 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, background: "linear-gradient(135deg, hsl(160 85% 45%), hsl(195 90% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          What A Match
        </h1>
        <p style={{ fontSize: 18, color: "hsl(195 15% 55%)", marginBottom: 32, lineHeight: 1.6 }}>
          Find your perfect match and connect with people who share your interests.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a href="/dashboard" style={{ padding: "12px 24px", borderRadius: 12, background: "hsl(160 85% 45%)", color: "white", textDecoration: "none", fontWeight: 600 }}>
            Get Started
          </a>
          <a href="/auth" style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid hsl(195 20% 15%)", color: "hsl(0 0% 98%)", textDecoration: "none", fontWeight: 600 }}>
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
