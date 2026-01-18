// src/pages/admin/AdminHome.jsx
import Slider from "../components/Slider";

/*
  Admin home page.
  - Fokus: pregled sistema i metrika (kasnije).
  - UI natpisi na engleskom, komentari na srpskom.
*/

export default function AdminHome() {
  const user = safeParse(sessionStorage.getItem("auth_user"));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>ADMIN</span>
            <span style={styles.badgeSoft}>System Overview</span>
          </div>

          <h1 style={styles.title}>Admin Home</h1>
          <p style={styles.subtitle}>
            Review platform activity and system data. Reports and analytics will
            be available here.
          </p>

          {user?.name ? (
            <p style={styles.meta}>
              Signed in as <b>{user.name}</b>.
            </p>
          ) : null}
        </header>

        <section style={styles.sliderCard}>
          <Slider height={520} />
        </section>
      </div>
    </div>
  );
}

function safeParse(value) {
  // Bezbedno parsiranje sessionStorage vrednosti.
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 22,
    color: "#fff",
    background:
      "radial-gradient(120% 110% at 50% 0%, #1A2545 0%, #0B1020 72%)",
  },
  container: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },

  headerCard: {
    textAlign: "center",
    borderRadius: 26,
    padding: "26px 18px",
    background: "rgba(11,16,32,0.55)",
    border: "1px solid rgba(232,91,90,0.22)",
    boxShadow:
      "0 22px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
  },
  logo: {
    width: 170,
    height: "auto",
    marginBottom: 10,
    filter: "drop-shadow(0 12px 26px rgba(0,0,0,0.45))",
  },
  badgeRow: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    background: "rgba(232,91,90,0.18)",
    border: "1px solid rgba(232,91,90,0.35)",
  },
  badgeSoft: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    background: "rgba(156,175,183,0.14)",
    border: "1px solid rgba(156,175,183,0.22)",
    color: "rgba(255,255,255,0.85)",
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  subtitle: {
    margin: "10px auto 0",
    maxWidth: 760,
    opacity: 0.82,
    fontSize: 15,
    lineHeight: 1.6,
  },
  meta: {
    margin: "12px 0 0 0",
    opacity: 0.78,
    fontSize: 13,
  },

  sliderCard: {
    borderRadius: 26,
    padding: 16,
    background: "rgba(11,16,32,0.60)",
    border: "1px solid rgba(232,91,90,0.20)",
    boxShadow:
      "0 22px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
  },
};
