import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

/*
  Register page.
  - Logo se učitava iz /public/images/logo.png (u kodu ide /images/logo.png).
  - Fix: input polja ne izlaze iz kartice (boxSizing + minWidth + maxWidth).
  - Role dropdown je custom i moderniji od native select-a.
  - Button.jsx se reusuje za akcije.
*/

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Stanje i ref za custom dropdown.
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleRef = useRef(null);

  const roleOptions = [
    { value: "buyer", label: "Buyer" },
    { value: "sales_agent", label: "Sales Agent" },
  ];

  const selectedRoleLabel =
    roleOptions.find((x) => x.value === role)?.label || "Select role";

  useEffect(() => {
    // Zatvaranje dropdown-a klikom van njega.
    const handleClickOutside = (e) => {
      if (!roleRef.current) return;
      if (!roleRef.current.contains(e.target)) setIsRoleOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: phone || null,
          role,
          email,
          password,
        }),
      });

      const json = await response.json();

      // Ako backend vrati grešku, prikaži poruku.
      if (!response.ok || json?.success === false) {
        const message =
          json?.message ||
          json?.errors?.email?.[0] ||
          json?.errors?.role?.[0] ||
          "Registration failed. Please try again.";
        setError(message);
        return;
      }

      // Nakon uspešne registracije, preusmeri na Login i popuni email.
      navigate("/login", { state: { prefillEmail: email } });
    } catch {
      setError("The system cannot process registration right now.");
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

        <h1 style={styles.title}>Register</h1>
        <p style={styles.subtitle}>Create a new account.</p>

        {error ? <div style={styles.error}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Phone (optional)
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+381..."
              autoComplete="tel"
              style={styles.input}
            />
          </label>

          {/* Role dropdown */}
          <div style={styles.label}>
            Role
            <div ref={roleRef} style={styles.dropdownWrap}>
              <button
                type="button"
                onClick={() => setIsRoleOpen((v) => !v)}
                style={styles.dropdownTrigger}
                aria-expanded={isRoleOpen}
              >
                <span style={styles.dropdownValue}>{selectedRoleLabel}</span>
                <span style={styles.chevron}>{isRoleOpen ? "▲" : "▼"}</span>
              </button>

              {isRoleOpen ? (
                <div style={styles.dropdownMenu}>
                  {roleOptions.map((opt) => {
                    const active = opt.value === role;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRole(opt.value);
                          setIsRoleOpen(false);
                        }}
                        style={{
                          ...styles.dropdownItem,
                          background: active
                            ? "rgba(232,91,90,0.16)"
                            : "transparent",
                          borderColor: active
                            ? "rgba(232,91,90,0.45)"
                            : "transparent",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

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
              autoComplete="new-password"
              style={styles.input}
            />
          </label>

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Register"}
          </Button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account?</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Login
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
    maxWidth: 560,
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

  /* Dropdown styles */
  dropdownWrap: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  },
  dropdownTrigger: {
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
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dropdownValue: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  chevron: {
    fontSize: 12,
    opacity: 0.85,
  },
  dropdownMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    zIndex: 20,
    borderRadius: 14,
    overflow: "hidden",
    background: "rgba(11,16,32,0.92)",
    border: "1px solid rgba(232,91,90,0.28)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 12px",
    border: "1px solid transparent",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
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
