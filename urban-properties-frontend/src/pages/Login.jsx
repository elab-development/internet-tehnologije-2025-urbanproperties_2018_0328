import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";

/*
  Login page.
  - Logo se učitava iz /public/images/logo.png (u kodu ide /images/logo.png).
  - Fix: input polja ne izlaze iz kartice (boxSizing + minWidth + maxWidth).
  - Button.jsx se reusuje za akcije.
*/

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Email se može proslediti sa Register stranice.
  const prefillEmail = location.state?.prefillEmail || "";

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preusmeravanje na osnovu role iz backend-a.
  const getHomeRoute = (role) => {
    if (role === "admin" || role === "administrator") return "/admin/home";
    if (role === "sales_agent") return "/sales_agent/home";
    if (role === "buyer") return "/buyer/home";
    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      // Ako backend vrati grešku, prikaži poruku.
      if (!response.ok || json?.success === false) {
        const message =
          json?.message ||
          json?.errors?.auth?.[0] ||
          "Login failed. Please check your credentials.";
        setError(message);
        return;
      }

      const user = json?.data?.user;
      const token = json?.data?.token;

      // Čuvamo token i user u session storage.
      sessionStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_user", JSON.stringify(user));

      navigate(getHomeRoute(user?.role), { replace: true });
    } catch {
      setError("The system cannot process login right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/images/urban_properties_logo.png"
            alt="Urban Properties"
            style={styles.logo}
            draggable={false}
          />
        </div>

        <h1 style={styles.title}>Login</h1>
        <p style={styles.subtitle}>Sign in to your account.</p>

        {error ? <div style={styles.error}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ana@gmail.com"
              required
              autoComplete="email"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={styles.input}
            />
          </label>

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>No account?</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/register")}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background:
      "radial-gradient(120% 100% at 50% 0%, #1A2545 0%, #0B1020 70%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    boxSizing: "border-box",
    padding: 22,
    borderRadius: 22,
    overflow: "hidden",
    background: "rgba(11,16,32,0.55)",
    border: "1px solid rgba(232,91,90,0.22)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)",
  },
  logoWrap: {
    display: "grid",
    placeItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 170,
    height: "auto",
    filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.30))",
    userSelect: "none",
  },
  title: {
    margin: 0,
    textAlign: "center",
    color: "white",
    fontSize: 26,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
  },
  error: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(232,91,90,0.12)",
    border: "1px solid rgba(232,91,90,0.35)",
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 12,
    width: "100%",
  },
  label: {
    display: "grid",
    gap: 8,
    width: "100%",
    minWidth: 0,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  input: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    height: 44,
    padding: "0 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
  },
  footer: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    color: "rgba(255,255,255,0.75)",
  },
};
