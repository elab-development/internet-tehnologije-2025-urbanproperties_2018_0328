// src/pages/admin/AdminMetrics.jsx
import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";

import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/*
  Admin Metrics page.
  - Koristi GET /api/admin/metrics (backend already has it).
  - Opcionalno učitava /api/admin/users da mapira sales_agent_id -> ime.
  - Prikazuje grafikone preko MUI X Charts (BarChart, LineChart).
*/

export default function AdminMetrics() {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [metrics, setMetrics] = useState(null);
  const [agentNameById, setAgentNameById] = useState({});

  const [toast, setToast] = useState({ open: false, message: "" });

  // MUI dark theme (da chart tekst bude čitljiv na dark pozadini).
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: "dark" },
      }),
    []
  );

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message) => {
    setToast({ open: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ open: false, message: "" }), 2600);
  };

  async function loadAll() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      // Učitamo metrics + users paralelno (users je samo za mapiranje ID->ime).
      const [mRes, uRes] = await Promise.all([
        fetch("/api/admin/metrics", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/admin/users", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null),
      ]);

      const mJson = await mRes.json().catch(() => null);
      if (!mRes.ok) {
        const msg =
          mJson?.message ||
          mJson?.errors?.authorization?.[0] ||
          `Failed to load metrics (${mRes.status}).`;
        throw new Error(msg);
      }

      setMetrics(mJson?.data || null);

      // Users endpoint je “nice to have” (ako failuje, nastavljamo).
      if (uRes && uRes.ok) {
        const uJson = await uRes.json().catch(() => null);
        const agents = uJson?.data?.sales_agents;
        const list = Array.isArray(agents) ? agents : [];

        const map = {};
        list.forEach((a) => {
          if (a?.id) map[a.id] = a?.name || `Agent #${a.id}`;
        });
        setAgentNameById(map);
      }
    } catch (e) {
      setMetrics(null);
      setPageError(e?.message || "Failed to load admin metrics.");
    } finally {
      setLoading(false);
    }
  }

  // ----- Transformations for charts -----

  const propertiesPerAgent = useMemo(() => {
    const raw = metrics?.properties_per_agent;
    const list = Array.isArray(raw) ? raw : [];

    // backend returns: [{ sales_agent_id, total }, ...]
    const labels = list.map((x) => agentNameById[x.sales_agent_id] || `Agent #${x.sales_agent_id}`);
    const values = list.map((x) => Number(x.total || 0));

    return { labels, values, hasData: values.length > 0 };
  }, [metrics, agentNameById]);

  const appointmentsByMonth = useMemo(() => {
    const raw = metrics?.viewing_appointments_by_month;
    const list = Array.isArray(raw) ? raw : [];
    const months = list.map((x) => String(x.month || ""));
    const totals = list.map((x) => Number(x.total || 0));
    return { months, totals, hasData: totals.length > 0 };
  }, [metrics]);

  const offersByMonth = useMemo(() => {
    const raw = metrics?.offers_by_month;
    const list = Array.isArray(raw) ? raw : [];
    const months = list.map((x) => String(x.month || ""));
    const totals = list.map((x) => Number(x.total || 0));
    const sumAmount = list.map((x) => Number(x.sum_amount || 0));
    return { months, totals, sumAmount, hasData: totals.length > 0 };
  }, [metrics]);

  const transactionsByMonth = useMemo(() => {
    const raw = metrics?.transactions_by_month;
    const list = Array.isArray(raw) ? raw : [];
    const months = list.map((x) => String(x.month || ""));
    const totals = list.map((x) => Number(x.total || 0));
    const sumFinal = list.map((x) => Number(x.sum_final_price || 0));
    return { months, totals, sumFinal, hasData: totals.length > 0 };
  }, [metrics]);

  // Totals for small cards
  const totals = useMemo(() => {
    const sum = (arr) => (Array.isArray(arr) ? arr.reduce((a, x) => a + Number(x?.total || 0), 0) : 0);

    return {
      properties: Array.isArray(metrics?.properties_per_agent)
        ? metrics.properties_per_agent.reduce((a, x) => a + Number(x?.total || 0), 0)
        : 0,
      appointments: sum(metrics?.viewing_appointments_by_month),
      offers: sum(metrics?.offers_by_month),
      transactions: sum(metrics?.transactions_by_month),
    };
  }, [metrics]);

  // Shared chart styling (da label/tick bude svetao).
  const chartSx = {
    "& .MuiChartsAxis-tickLabel": { fill: "rgba(255,255,255,0.82)" },
    "& .MuiChartsAxis-label": { fill: "rgba(255,255,255,0.86)" },
    "& .MuiChartsLegend-label": { fill: "rgba(255,255,255,0.82)" },
    "& .MuiChartsTooltip-root": { color: "rgba(255,255,255,0.92)" },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.headerCard}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>ADMIN</span>
              <span style={styles.badgeSoft}>Metrics</span>
            </div>

            <h1 style={styles.title}>Admin Metrics</h1>
            <p style={styles.subtitle}>
              Charts based on platform activity (properties, appointments, offers, transactions).
            </p>

            <div style={styles.headerActions}>
              <Button variant="outline" onClick={loadAll}>
                Refresh
              </Button>
            </div>
          </header>

          {pageError ? <div style={styles.error}>{pageError}</div> : null}

          {loading ? (
            <div style={styles.loading}>Loading metrics...</div>
          ) : !metrics ? (
            <div style={styles.empty}>
              <div style={styles.emptyTitle}>No metrics available.</div>
              <div style={styles.emptySub}>Try refresh, or check backend logs.</div>
            </div>
          ) : (
            <>
              {/* Small summary cards */}
              <div style={styles.statsGrid}>
                <StatCard label="Total properties" value={totals.properties} />
                <StatCard label="Total viewing appointments" value={totals.appointments} />
                <StatCard label="Total offers" value={totals.offers} />
                <StatCard label="Total transactions" value={totals.transactions} />
              </div>

              {/* Charts grid */}
              <div style={styles.grid}>
                <Panel title="Properties per sales agent">
                  {propertiesPerAgent.hasData ? (
                    <BarChart
                      xAxis={[
                        {
                          data: propertiesPerAgent.labels,
                          scaleType: "band",
                          height: 28,
                        },
                      ]}
                      series={[
                        {
                          data: propertiesPerAgent.values,
                          label: "Properties",
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>

                <Panel title="Viewing appointments by month (count)">
                  {appointmentsByMonth.hasData ? (
                    <LineChart
                      xAxis={[
                        {
                          data: appointmentsByMonth.months,
                          scaleType: "point",
                        },
                      ]}
                      series={[
                        {
                          data: appointmentsByMonth.totals,
                          label: "Appointments",
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>

                <Panel title="Offers by month (count)">
                  {offersByMonth.hasData ? (
                    <BarChart
                      xAxis={[
                        {
                          data: offersByMonth.months,
                          scaleType: "band",
                          height: 28,
                        },
                      ]}
                      series={[
                        {
                          data: offersByMonth.totals,
                          label: "Offers",
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>

                <Panel title="Offers by month (sum amount)">
                  {offersByMonth.hasData ? (
                    <LineChart
                      xAxis={[
                        {
                          data: offersByMonth.months,
                          scaleType: "point",
                        },
                      ]}
                      series={[
                        {
                          data: offersByMonth.sumAmount,
                          label: "Sum amount",
                          valueFormatter: (v) => formatMoney(v),
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>

                <Panel title="Transactions by month (count)">
                  {transactionsByMonth.hasData ? (
                    <BarChart
                      xAxis={[
                        {
                          data: transactionsByMonth.months,
                          scaleType: "band",
                          height: 28,
                        },
                      ]}
                      series={[
                        {
                          data: transactionsByMonth.totals,
                          label: "Transactions",
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>

                <Panel title="Transactions by month (sum final price)">
                  {transactionsByMonth.hasData ? (
                    <LineChart
                      xAxis={[
                        {
                          data: transactionsByMonth.months,
                          scaleType: "point",
                        },
                      ]}
                      series={[
                        {
                          data: transactionsByMonth.sumFinal,
                          label: "Sum final price",
                          valueFormatter: (v) => formatMoney(v),
                        },
                      ]}
                      height={320}
                      sx={chartSx}
                    />
                  ) : (
                    <Muted>No data.</Muted>
                  )}
                </Panel>
              </div>
            </>
          )}
        </div>

        {toast.open ? <div style={styles.toast}>{toast.message}</div> : null}
      </div>
    </ThemeProvider>
  );
}

/* ---------- Small UI helpers ---------- */

function Panel({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "22px",
        padding: "14px",
        background: "rgba(11,16,32,0.60)",
        border: "1px solid rgba(232,91,90,0.18)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 900, letterSpacing: 0.2 }}>{title}</Typography>
      </Box>

      <Box sx={{ mt: 1 }}>{children}</Box>
    </Paper>
  );
}

function StatCard({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        padding: "12px",
        background: "rgba(156,175,183,0.08)",
        border: "1px solid rgba(156,175,183,0.16)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.2 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, marginTop: 6 }}>{label}</div>
    </Paper>
  );
}

function Muted({ children }) {
  return <div style={{ opacity: 0.78, padding: "10px 6px" }}>{children}</div>;
}

/* ---------- Utils ---------- */

function formatMoney(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `€${Math.round(n).toLocaleString("en-US")}`;
  }
}

/* ---------- Inline styles (same vibe as AdminHome) ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    padding: 22,
    color: "#fff",
    background: "radial-gradient(120% 110% at 50% 0%, #1A2545 0%, #0B1020 72%)",
  },
  container: {
    maxWidth: 1200,
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
    boxShadow: "0 22px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
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
  title: { margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: 0.3 },
  subtitle: { margin: "10px auto 0", maxWidth: 820, opacity: 0.82, fontSize: 15, lineHeight: 1.6 },
  headerActions: { marginTop: 14, display: "flex", justifyContent: "center" },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  error: {
    padding: 12,
    borderRadius: 16,
    background: "rgba(232,91,90,0.10)",
    border: "1px solid rgba(232,91,90,0.22)",
    fontWeight: 800,
  },
  loading: { padding: 18, opacity: 0.85, fontWeight: 800 },
  empty: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(156,175,183,0.06)",
    border: "1px solid rgba(156,175,183,0.14)",
  },
  emptyTitle: { fontWeight: 900, fontSize: 16 },
  emptySub: { marginTop: 6, opacity: 0.82, fontSize: 13 },

  toast: {
    position: "fixed",
    bottom: 22,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 300,
    padding: "12px 16px",
    borderRadius: 999,
    background: "rgba(11,16,32,0.92)",
    border: "1px solid rgba(232,91,90,0.28)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.40)",
    fontWeight: 900,
  },
};

// Basic responsive tweaks for inline styles:
if (typeof window !== "undefined") {
  const mq = window.matchMedia?.("(max-width: 980px)");
  if (mq?.matches) {
    styles.statsGrid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    styles.grid.gridTemplateColumns = "1fr";
  }
}
