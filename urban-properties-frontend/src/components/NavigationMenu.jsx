// src/components/NavigationMenu.jsx
import { NavLink, useNavigate } from "react-router-dom";
import Button from "./Button";

/*
  Modern top navigation.
  - Logo levo, linkovi u sredini (wrap da sve stane), user + role + logout desno.
  - Email se ne prikazuje (samo name + role).
  - Logout:
    1) Pozove /api/auth/logout
    2) Obriše sessionStorage
    3) Navigira na /login
*/
export default function NavigationMenu() {
  const navigate = useNavigate();
  const user = safeParse(sessionStorage.getItem("auth_user"));
  const role = user?.role;

  const links = getLinksByRole(role);

  const handleLogout = async () => {
    const token = sessionStorage.getItem("auth_token");

    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Namerno ignorišemo grešku, svakako čistimo session.
    } finally {
      sessionStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  return (
    <>
      <style>{css}</style>

      <header className="navWrap">
        <div className="navLeft" onClick={() => navigate("/buyer/home")} role="button" tabIndex={0}>
          <img className="navLogo" src="/images/urban_properties_logo.png" alt="Urban Properties" />
        </div>

        <nav className="navLinks" aria-label="Primary navigation">
          {links.map((l) => (
            <NavLink
              key={l.path}
              to={l.path}
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navRight">
          <div className="userPill">
            <div className="userName" title={user?.name || "Guest"}>
              {user?.name || "Guest"}
            </div>
            <div className="userRole">{formatRole(role)}</div>
          </div>

          {user ? (
            <Button onClick={handleLogout}>Logout</Button>
          ) : (
            <Button onClick={() => navigate("/login")}>Login</Button>
          )}
        </div>
      </header>
    </>
  );
}

/* Uloga -> linkovi (tačno po specifikaciji). */
function getLinksByRole(role) {
  if (role === "buyer") {
    return [
      { label: "Manage Properties", path: "/buyer/manage-properties" },
      { label: "Manage My Viewing Appointments", path: "/buyer/manage-my-viewing-appointments" },
      { label: "Manage My Offers", path: "/buyer/manage-my-offers" },
    ];
  }

  if (role === "sales_agent") {
    return [
      { label: "Manage My Properties", path: "/sales-agent/manage-my-properties" },
      { label: "Manage My Viewing Appointments", path: "/sales-agent/manage-my-viewing-appointments" },
    ];
  }

  if (role === "administrator") {
    return [
      { label: "Manage Users", path: "/admin/manage-users" },
      { label: "Metrics", path: "/admin/metrics" },
    ];
  }

  return [
    { label: "Login", path: "/login" },
    { label: "Register", path: "/register" },
  ];
}

/* Bezbedno parsiranje JSON-a iz storage-a. */
function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/* Lepši prikaz uloge. */
function formatRole(role) {
  if (role === "sales_agent") return "Sales Agent";
  if (role === "administrator") return "Administrator";
  if (role === "buyer") return "Buyer";
  return "Guest";
}

const css = `
  .navWrap{
    position: sticky;
    top: 12px;
    z-index: 50;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
    padding:14px 16px;
    border-radius:22px;
    background: rgba(11,16,32,0.60);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
    backdrop-filter: blur(14px);
  }

  .navLeft{
    display:flex;
    align-items:center;
    gap:10px;
    cursor:pointer;
    user-select:none;
    min-width: 170px;
  }

  .navLogo{
    width: 150px;
    height:auto;
    object-fit:contain;
    filter: drop-shadow(0 10px 22px rgba(0,0,0,0.35));
  }

  .navLinks{
    flex: 1 1 auto;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    flex-wrap: wrap;
    padding: 0 10px;
  }

  .navLink{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding: 10px 14px;
    border-radius: 999px;
    text-decoration:none;
    color: rgba(255,255,255,0.92);
    background: rgba(156,175,183,0.10);
    border: 1px solid rgba(156,175,183,0.18);
    font-weight: 800;
    font-size: 13px;
    white-space: nowrap;
    transition: transform 140ms ease, background 140ms ease, border 140ms ease, box-shadow 140ms ease;
  }

  .navLink:hover{
    transform: translateY(-2px);
    background: rgba(232,91,90,0.14);
    border: 1px solid rgba(232,91,90,0.36);
    box-shadow: 0 10px 25px rgba(0,0,0,0.22);
  }

  .navLink.active{
    background: rgba(232,91,90,0.18);
    border: 1px solid rgba(232,91,90,0.40);
  }

  .navRight{
    display:flex;
    align-items:center;
    gap:10px;
    min-width: 230px;
    justify-content:flex-end;
  }

  .userPill{
    padding: 10px 12px;
    border-radius: 18px;
    background: rgba(156,175,183,0.08);
    border: 1px solid rgba(156,175,183,0.18);
    min-width: 140px;
  }

  .userName{
    font-weight: 900;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .userRole{
    margin-top: 2px;
    opacity: 0.80;
    font-size: 12px;
    font-weight: 700;
  }

  @media (max-width: 820px){
    .navWrap{ gap:10px; }
    .navLeft{ min-width: 140px; }
    .navLogo{ width: 130px; }
    .navRight{ min-width: auto; }
    .userPill{ display:none; }
    .navLinks{ justify-content:flex-start; }
  }
`;
