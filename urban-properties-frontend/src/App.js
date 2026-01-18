// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminHome from "./pages/AdminHome";
import SalesAgentHome from "./pages/SalesAgentHome";
import BuyerHome from "./pages/BuyerHome";
import ManageProperties from "./pages/ManageProperties";
import PropertyDetails from "./pages/PropertyDetails";
import ManageOffers from "./pages/ManageOffers";
import NotFound from "./components/NotFound";
import ManageSalesAgentProperties from "./pages/ManageSalesAgentProperties";
import ManageUsers from "./pages/ManageUsers";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Layout routes. */}
        <Route element={<AppLayout />}>
          <Route
            path="/admin/home"
            element={
              <RequireAuth>
                <AdminHome />
              </RequireAuth>
            }
          />

          <Route
            path="/sales_agent/home"
            element={
              <RequireAuth>
                <SalesAgentHome />
              </RequireAuth>
            }
          />

          <Route
            path="/buyer/home"
            element={
              <RequireAuth>
                <BuyerHome />
              </RequireAuth>
            }
          />

          <Route
            path="/buyer/manage-properties"
            element={
              <RequireAuth>
                <ManageProperties />
              </RequireAuth>
            }
          />

          <Route
            path="/buyer/manage-properties/property-details/:id"
            element={
              <RequireAuth>
                <PropertyDetails />
              </RequireAuth>
            }
          />
          
        <Route
            path="/buyer/manage-my-offers"
            element={
              <RequireAuth>
                <ManageOffers />
              </RequireAuth>
            }
          />

          <Route
            path="/buyer/manage-my-viewing-appointments"
            element={
              <RequireAuth>
                <NotFound
                title="Under Development"
                subtitle="Manage Viewing Appointments page is currently under development."
              />
              </RequireAuth>
            }
          />

          <Route
            path="/sales-agent/manage-my-properties"
            element={
              <RequireAuth>
                <ManageSalesAgentProperties />
              </RequireAuth>
            }
          />

          <Route
            path="/sales-agent/manage-my-viewing-appointments"
            element={
              <RequireAuth>
                <NotFound
                title="Under Development"
                subtitle="Manage Viewing Appointments page is currently under development."
              />
              </RequireAuth>
            }
          />

          <Route
            path="/admin/manage-users"
            element={
              <RequireAuth>
                <ManageUsers/>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/metrics"
            element={
              <RequireAuth>
                <NotFound
                title="Under Development"
                subtitle="Manage Viewing Appointments page is currently under development."
              />
              </RequireAuth>
            }
          />

        </Route>



        {/* Fallback. */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
