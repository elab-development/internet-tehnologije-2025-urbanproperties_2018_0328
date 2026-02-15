// src/pages/ManageMyViewingAppointments.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";

/*
  Sales Agent -> Manage My Viewing Appointments.

  Backend routes used:
  - GET   /api/agent/viewing-appointments
    returns: { data: { items: [...], pagination: {...} } }

  - PATCH /api/viewing-appointments/{id}/status
    body: { status: "completed" | "cancelled" }
    allowed transitions: scheduled -> completed/cancelled.
*/

export default function ManageMyViewingAppointments() {
  const navigate = useNavigate();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|scheduled|completed|cancelled
  const [sort, setSort] = useState("upcoming"); // upcoming|newest|oldest

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [toast, setToast] = useState({ open: false, message: "" });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [active, setActive] = useState(null);

  const itemsArray = Array.isArray(allItems) ? allItems : [];

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

  const stats = useMemo(() => {
    const total = itemsArray.length;
    const scheduled = itemsArray.filter((x) => (x?.status || "").toLowerCase() === "scheduled").length;
    const completed = itemsArray.filter((x) => (x?.status || "").toLowerCase() === "completed").length;
    const cancelled = itemsArray.filter((x) => (x?.status || "").toLowerCase() === "cancelled").length;
    return { total, scheduled, completed, cancelled };
  }, [itemsArray]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...itemsArray];

    if (q) {
      list = list.filter((va) => {
        const p = va?.property || {};
        const b = va?.buyer || {};
        const hay = [
          va?.id,
          p?.id,
          p?.title,
          p?.city,
          p?.address,
          b?.name,
          b?.email,
          b?.phone,
          va?.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((va) => String(va?.status || "").toLowerCase() === statusFilter);
    }

    list.sort((a, b) => {
      const at = new Date(a?.scheduled_at || 0).getTime();
      const bt = new Date(b?.scheduled_at || 0).getTime();

      if (sort === "oldest") return at - bt;
      if (sort === "newest") return bt - at;

      // upcoming: closest future first, then past.
      const now = Date.now();
      const aFuture = at >= now;
      const bFuture = bt >= now;

      if (aFuture && bFuture) return at - bt;
      if (!aFuture && !bFuture) return bt - at;
      return aFuture ? -1 : 1;
    });

    return list;
  }, [itemsArray, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const showToast = (message) => {
    setToast({ open: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ open: false, message: "" }), 2600);
  };

  const openDetails = (va) => {
    setActive(va);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActive(null);
  };

  const canChangeStatus = (va) => String(va?.status || "").toLowerCase() === "scheduled";

  const updateStatus = async (va, nextStatus) => {
    if (!va?.id) return;
    if (!canChangeStatus(va)) return;

    const confirmMsg =
      nextStatus === "completed"
        ? "Mark this appointment as completed?"
        : "Cancel this appointment?";

    if (!window.confirm(confirmMsg)) return;

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch(`/api/viewing-appointments/${va.id}/status`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.status?.[0] ||
          json?.errors?.authorization?.[0] ||
          "Failed to update status.";
        showToast(msg);
        return;
      }

      setAllItems((prev) =>
        prev.map((x) => (Number(x?.id) === Number(va.id) ? { ...x, status: nextStatus } : x))
      );

      showToast("Status updated.");
    } catch {
      showToast("Network error while updating status.");
    }
  };

  async function loadAll() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const items = await fetchAllPages("/api/agent/viewing-appointments", token);
      setAllItems(items);
    } catch (e) {
      setAllItems([]);
      setPageError(e?.message || "Failed to load viewing appointments.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="msvaWrap">
        <div className="msvaHeader">
          <div className="msvaHeaderText">
            <h1 className="msvaTitle">Manage Viewing Appointments</h1>
            <p className="msvaSubtitle">Review and update appointments for your properties.</p>
          </div>

          <div className="msvaHeaderActions">
            <Button
              variant="outline"
              className="msvaHeaderBtn"
              onClick={() => navigate("/sales-agent/manage-my-properties")}
            >
              Manage My Properties
            </Button>

            <Button variant="outline" className="msvaHeaderBtn" onClick={loadAll}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="msvaStats">
          <div className="msvaStatItem">
            <div className="msvaStatValue">{stats.total}</div>
            <div className="msvaStatLabel">Total</div>
          </div>
          <div className="msvaStatItem">
            <div className="msvaStatValue">{stats.scheduled}</div>
            <div className="msvaStatLabel">Scheduled</div>
          </div>
          <div className="msvaStatItem">
            <div className="msvaStatValue">{stats.completed}</div>
            <div className="msvaStatLabel">Completed</div>
          </div>
          <div className="msvaStatItem">
            <div className="msvaStatValue">{stats.cancelled}</div>
            <div className="msvaStatLabel">Cancelled</div>
          </div>
        </div>

        <div className="msvaControls">
          <div className="msvaCtrl">
            <label className="msvaCtrlLabel">Search</label>
            <input
              className="msvaCtrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property, buyer, notes..."
            />
          </div>

          <div className="msvaCtrl">
            <label className="msvaCtrlLabel">Status</label>
            <select
              className="msvaCtrlSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="msvaCtrl">
            <label className="msvaCtrlLabel">Sort</label>
            <select className="msvaCtrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="upcoming">Upcoming first</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="msvaError">{pageError}</div> : null}

        {loading ? (
          <div className="msvaLoading">Loading viewing appointments...</div>
        ) : pageItems.length === 0 ? (
          <div className="msvaEmpty">
            <div className="msvaEmptyTitle">No appointments found.</div>
            <div className="msvaEmptySubtitle">Try changing filters or refresh the page.</div>
          </div>
        ) : (
          <>
            <div className="msvaList">
              {pageItems.map((va) => {
                const p = va?.property || {};
                const buyer = va?.buyer || {};
                const pillClass = statusPillClass(va?.status);

                return (
                  <div className="msvaItem" key={va?.id}>
                    <div className="msvaItemCard">
                      <Card property={p} hideActions />
                    </div>

                    <div className="msvaItemMeta">
                      <div className="msvaMetaTop">
                        <span className={`msvaPill ${pillClass}`}>{formatStatus(va?.status)}</span>
                        <div className="msvaMetaDate">{formatDateTime(va?.scheduled_at)}</div>
                      </div>

                      <div className="msvaBuyer">
                        <div className="msvaBuyerTitle">Buyer</div>
                        <div className="msvaBuyerRow">
                          <span className="msvaBuyerName">{buyer?.name || "Unknown buyer"}</span>
                        </div>
                        <div className="msvaBuyerRow msvaBuyerMuted">
                          {buyer?.email || "—"} {buyer?.phone ? `• ${buyer.phone}` : ""}
                        </div>
                      </div>

                      <div className={`msvaNotes ${va?.notes ? "" : "msvaNotesMuted"}`}>
                        {va?.notes ? va.notes : "No notes provided."}
                      </div>

                      <div className="msvaActions">
                        <Button
                          variant="outline"
                          className="msvaActionBtn"
                          onClick={() => openDetails(va)}
                        >
                          View details
                        </Button>

                        <Button
                          className="msvaActionBtn"
                          onClick={() => updateStatus(va, "completed")}
                          disabled={!canChangeStatus(va)}
                        >
                          Mark completed
                        </Button>

                        <Button
                          variant="outline"
                          className="msvaActionBtn msvaCancelBtn"
                          onClick={() => updateStatus(va, "cancelled")}
                          disabled={!canChangeStatus(va)}
                        >
                          Cancel
                        </Button>
                      </div>

                      {!canChangeStatus(va) ? (
                        <div className="msvaHint">
                          Only scheduled appointments can be completed/cancelled.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="msvaPager">
              <Button
                variant="outline"
                onClick={() => setPage((x) => Math.max(1, x - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>

              <div className="msvaPagerMeta">
                Page <b>{page}</b> / {totalPages}
              </div>

              <Button
                variant="outline"
                onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={detailsOpen}
        title={active?.property?.title ? `Appointment — ${active.property.title}` : "Appointment"}
        onClose={closeDetails}
      >
        <div className="msvaModalGrid">
          <div className="msvaModalCard">
            <div className="msvaModalLabel">Appointment</div>

            <Row k="ID" v={active?.id ?? "-"} mono />
            <Row k="Status" v={formatStatus(active?.status)} />
            <Row k="Scheduled" v={formatDateTime(active?.scheduled_at)} mono />
            <Row k="Notes" v={active?.notes || "—"} />
          </div>

          <div className="msvaModalCard">
            <div className="msvaModalLabel">Buyer</div>

            <Row k="Name" v={active?.buyer?.name || "—"} />
            <Row k="Email" v={active?.buyer?.email || "—"} />
            <Row k="Phone" v={active?.buyer?.phone || "—"} />
          </div>

          <div className="msvaModalCard">
            <div className="msvaModalLabel">Property</div>

            <Row k="Title" v={active?.property?.title || "—"} />
            <Row k="City" v={active?.property?.city || "—"} />
            <Row k="Address" v={active?.property?.address || "—"} />
            <Row k="Price" v={formatMoney(active?.property?.price)} mono />
          </div>
        </div>

        <div className="msvaModalActions">
          <Button variant="outline" onClick={closeDetails}>
            Close
          </Button>
        </div>
      </Modal>

      {toast.open ? <div className="msvaToast">{toast.message}</div> : null}
    </>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="msvaRow">
      <span className="msvaRowK">{k}</span>
      <span className={`msvaRowV ${mono ? "msvaMono" : ""}`} title={String(v || "")}>
        {v}
      </span>
    </div>
  );
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "scheduled") return "msvaPill--scheduled";
  if (s === "completed") return "msvaPill--completed";
  if (s === "cancelled") return "msvaPill--cancelled";
  return "";
}

function formatStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "scheduled") return "Scheduled";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return status || "Unknown";
}

function formatDateTime(val) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB");
}

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

async function fetchAllPages(baseUrl, token) {
  const firstUrl = appendPage(baseUrl, 1);

  const firstRes = await fetch(firstUrl, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });

  const firstJson = await firstRes.json().catch(() => null);

  if (!firstRes.ok) {
    throw new Error(firstJson?.message || `Request failed (${firstRes.status}).`);
  }

  const firstItems = extractItems(firstJson);
  const lastPage = Number(firstJson?.data?.pagination?.last_page || 1);

  if (lastPage <= 1) return firstItems;

  const promises = [];
  for (let p = 2; p <= lastPage; p++) {
    promises.push(
      fetch(appendPage(baseUrl, p), {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((j) => extractItems(j))
    );
  }

  const rest = (await Promise.all(promises)).flat();
  return [...firstItems, ...rest];
}

function extractItems(json) {
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function appendPage(url, page) {
  return url.includes("?") ? `${url}&page=${page}` : `${url}?page=${page}`;
}
