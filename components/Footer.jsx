export default function Footer() {
  return (
    <footer
      className="no-print border-t py-8 px-4"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p
          className="text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Developed by
        </p>
        <p className="text-lg font-bold" style={{ color: "#0d6b0d" }}>
          Emteezet Technologies Ltd.
        </p>
        <p
          className="text-xs mt-4"
          style={{ color: "var(--text-muted)", opacity: 0.6 }}
        >
          © {new Date().getFullYear()} NIN Platform — All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
