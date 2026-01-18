// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom";

/*
  Komponenta za zaštitu ruta.
  - Ako nema tokena u session storage-u, preusmeri na /login.
*/
export default function RequireAuth({ children }) {
  const token = sessionStorage.getItem("auth_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
