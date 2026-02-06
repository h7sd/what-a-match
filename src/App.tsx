export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #050a0e 0%, #0a1628 100%)",
      color: "#fafafa",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 540, padding: 32 }}>
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          marginBottom: 20,
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, #1db954 0%, #1ed760 40%, #38bdf8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          What A Match
        </h1>
        <p style={{ fontSize: 18, color: "#7a8fa0", marginBottom: 40, lineHeight: 1.7 }}>
          Find your perfect match. Connect with people who share your interests.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
          <a href="/dashboard" style={{
            padding: "14px 28px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #1db954, #1ed760)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 15,
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 0 30px -5px rgba(29,185,84,0.4)",
          }}>
            Get Started
          </a>
          <a href="/auth" style={{
            padding: "14px 28px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fafafa",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 15,
            background: "rgba(255,255,255,0.04)",
          }}>
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
