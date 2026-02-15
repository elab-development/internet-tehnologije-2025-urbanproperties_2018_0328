import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";

/*
  Manage Buyer Viewing Appointments.

  Buyer routes used:
  - GET  /api/me/activities                      -> viewing_appointments
  - POST /api/viewing-appointments               -> create appointment
  - PATCH /api/viewing-appointments/{id}/cancel  -> cancel appointment
*/

export default function ManageBuyerViewingAppointments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const prefillPropertyId =
    searchParams.get("property_id") || searchParams.get("propertyId") || "";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date_desc");

  const [toast, setToast] = useState({ open: false, message: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user navigates here from a property page with ?property_id=..., prefill and open modal.
  useEffect(() => {
    if (!prefillPropertyId) return;
    setFormPropertyId(prefillPropertyId);
    if (!formScheduledAt) setFormScheduledAt(defaultLocalDateTime(24));
    setFormNotes("");
    setFormError("");
    setCreateOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPropertyId]);

  const showToast = (message) => {
    setToast({ open: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2600);
  };

  const openCreate = () => {
    setFormPropertyId(prefillPropertyId || "");
    setFormScheduledAt(defaultLocalDateTime(24));
    setFormNotes("");
    setFormError("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setFormError("");
  };

  const clearPrefill = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("property_id");
    next.delete("propertyId");
    setSearchParams(next);
    setFormPropertyId("");
  };

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = Array.isArray(appointments) ? [...appointments] : [];

    if (q) {
      list = list.filter((a) => {
        const p = a?.property || {};
        const hay = `${p?.title || ""} ${p?.city || ""} ${p?.address || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (status !== "all") {
      list = list.filter((a) => String(a?.status || "").toLowerCase() === status);
    }

    list.sort((a, b) => {
      const ad = new Date(a?.scheduled_at || 0).getTime();
      const bd = new Date(b?.scheduled_at || 0).getTime();
      return sort === "date_asc" ? ad - bd : bd - ad;
    });

    return list;
  }, [appointments, search, status, sort]);

  const stats = useMemo(() => {
    const list = Array.isArray(appointments) ? appointments : [];
    const out = { total: list.length, scheduled: 0, completed: 0, cancelled: 0 };
    for (const a of list) {
      const s = String(a?.status || "").toLowerCase();
      if (s === "scheduled") out.scheduled++;
      else if (s === "completed") out.completed++;
      else if (s === "cancelled") out.cancelled++;
    }
    return out;
  }, [appointments]);

  async function loadActivities() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch("/api/me/activities", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.authorization?.[0] ||
          "Failed to load activities.";
        throw new Error(msg);
      }

      const list = Array.isArray(json?.data?.viewing_appointments)
        ? json.data.viewing_appointments
        : [];

      setAppointments(list);
    } catch (e) {
      setAppointments([]);
      setPageError(e?.message || "Failed to load viewing appointments.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCreate() {
    const token = sessionStorage.getItem("auth_token");

    const pid = Number(String(formPropertyId).trim());
    if (!pid || pid <= 0) {
      setFormError("Please enter a valid Property ID.");
      return;
    }

    if (!formScheduledAt) {
      setFormError("Please select a date and time.");
      return;
    }

    const dt = new Date(formScheduledAt);
    if (Number.isNaN(dt.getTime())) {
      setFormError("Invalid date/time.");
      return;
    }

    const payload = {
      property_id: pid,
      scheduled_at: dt.toISOString(),
      notes: formNotes?.trim() ? formNotes.trim() : null,
    };

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/viewing-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.authorization?.[0] ||
          json?.errors?.property_id?.[0] ||
          json?.errors?.scheduled_at?.[0] ||
          "Failed to create a viewing appointment.";
        setFormError(msg);
        return;
      }

      showToast("Viewing appointment created successfully.");
      closeCreate();

      // If we came from a property page with a prefilled property_id, clear it after successful booking.
      if (prefillPropertyId) clearPrefill();

      await loadActivities();
    } catch {
      setFormError("Network error while creating the viewing appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(appointment) {
    const id = appointment?.id;
    if (!id) return;

    const ok = window.confirm("Cancel this viewing appointment?");
    if (!ok) return;

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch(`/api/viewing-appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.authorization?.[0] ||
          json?.errors?.status?.[0] ||
          json?.errors?.scheduled_at?.[0] ||
          "Failed to cancel the appointment.";
        showToast(msg);
        return;
      }

      showToast("Viewing appointment cancelled.");
      await loadActivities();
    } catch {
      showToast("Network error while cancelling the appointment.");
    }
  }

  return (
    <div className="mbvaWrap">
      <div className="mbvaHeader">
        <div className="mbvaHeaderText">
          <h1 className="mbvaTitle">Manage Viewing Appointments</h1>
          <p className="mbvaSubtitle">Create, review, and cancel your viewing appointments.</p>
        </div>

        <div className="mbvaHeaderActions">
          <Button variant="secondary" className="mbvaHeaderBtn" onClick={openCreate}>
            Schedule new
          </Button>
          <Button
            variant="ghost"
            className="mbvaHeaderBtn"
            onClick={() => navigate("/buyer/manage-properties")}
          >
            Browse properties
          </Button>
          <Button variant="ghost" className="mbvaHeaderBtn" onClick={loadActivities}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mbvaStats">
        <div className="mbvaStatItem">
          <div className="mbvaStatValue">{stats.total}</div>
          <div className="mbvaStatLabel">Total</div>
        </div>
        <div className="mbvaStatItem">
          <div className="mbvaStatValue">{stats.scheduled}</div>
          <div className="mbvaStatLabel">Scheduled</div>
        </div>
        <div className="mbvaStatItem">
          <div className="mbvaStatValue">{stats.completed}</div>
          <div className="mbvaStatLabel">Completed</div>
        </div>
        <div className="mbvaStatItem">
          <div className="mbvaStatValue">{stats.cancelled}</div>
          <div className="mbvaStatLabel">Cancelled</div>
        </div>
      </div>

      <div className="mbvaControls">
        <div className="mbvaCtrl">
          <label className="mbvaCtrlLabel">Search</label>
          <input
            className="mbvaCtrlInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title/city/address..."
          />
        </div>

        <div className="mbvaCtrl">
          <label className="mbvaCtrlLabel">Status</label>
          <select
            className="mbvaCtrlSelect"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mbvaCtrl">
          <label className="mbvaCtrlLabel">Sort</label>
          <select className="mbvaCtrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </select>
        </div>
      </div>

      {pageError ? <div className="mbvaError">{pageError}</div> : null}

      {loading ? (
        <div className="mbvaLoading">Loading viewing appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="mbvaEmpty">
          <div className="mbvaEmptyTitle">No viewing appointments found.</div>
          <div className="mbvaEmptySubtitle">
            Schedule a new appointment or browse properties to book one.
          </div>
          <div className="mbvaEmptyActions">
            <Button variant="secondary" onClick={openCreate}>
              Schedule new
            </Button>
            <Button variant="ghost" onClick={() => navigate("/buyer/manage-properties")}>
              Browse properties
            </Button>
          </div>
        </div>
      ) : (
        <div className="mbvaList">
          {filteredAppointments.map((a) => {
            const p = a?.property || {
              id: a?.property_id,
              title: `Property #${a?.property_id ?? "—"}`,
              city: "",
              address: "",
              status: "available",
            };

            const statusKey = String(a?.status || "unknown").toLowerCase();
            const canCancel = canCancelAppointment(a);

            return (
              <div key={a?.id} className="mbvaItem">
                <div className="mbvaItemCard">
                  <Card property={p} hideActions />
                </div>

                <div className="mbvaItemMeta">
                  <div className="mbvaMetaTop">
                    <span className={`mbvaPill mbvaPill--${statusKey}`}>
                      {formatApptStatus(a?.status)}
                    </span>
                    <span className="mbvaMetaDate" title={String(a?.scheduled_at || "")}>
                      {formatDateTime(a?.scheduled_at)}
                    </span>
                  </div>

                  {a?.notes ? (
                    <div className="mbvaNotes" title={String(a?.notes)}>
                      {a.notes}
                    </div>
                  ) : (
                    <div className="mbvaNotes mbvaNotesMuted">No notes.</div>
                  )}

                  <div className="mbvaActions">
                    <Button
                      variant="ghost"
                      className="mbvaActionBtn"
                      onClick={() =>
                        navigate(`/buyer/manage-properties/property-details/${a?.property_id}`)
                      }
                    >
                      View property
                    </Button>

                    <Button
                      variant="secondary"
                      className="mbvaActionBtn mbvaCancelBtn"
                      disabled={!canCancel}
                      onClick={() => cancelAppointment(a)}
                    >
                      Cancel
                    </Button>
                  </div>

                  {!canCancel ? (
                    <div className="mbvaHint">
                      Cancellation is only available for future appointments with status <b>Scheduled</b>.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} title="Schedule a Viewing Appointment" onClose={closeCreate}>
        <div className="mbvaForm">
          <div className="mbvaField">
            <label className="mbvaLabel">Property ID</label>
            <div className="mbvaInline">
              <input
                className="mbvaInput"
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                placeholder="e.g. 12"
                disabled={Boolean(prefillPropertyId)}
              />

              {prefillPropertyId ? (
                <Button variant="ghost" className="mbvaSmallBtn" onClick={clearPrefill}>
                  Change
                </Button>
              ) : null}
            </div>

            <div className="mbvaHelp">
              Tip: You can open this page from a property card and we’ll prefill the ID.
            </div>
          </div>

          <div className="mbvaField">
            <label className="mbvaLabel">Date & time</label>
            <input
              className="mbvaInput"
              type="datetime-local"
              value={formScheduledAt}
              onChange={(e) => setFormScheduledAt(e.target.value)}
            />
          </div>

          <div className="mbvaField">
            <label className="mbvaLabel">Notes (optional)</label>
            <textarea
              className="mbvaTextarea"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Anything you want the sales agent to know..."
              rows={4}
            />
          </div>

          {formError ? <div className="mbvaFormError">{formError}</div> : null}

          <div className="mbvaFormActions">
            <Button variant="ghost" onClick={closeCreate}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast.open ? <div className="mbvaToast">{toast.message}</div> : null}
    </div>
  );
}

function formatApptStatus(status) {
  if (!status) return "Unknown";
  const s = String(status).toLowerCase();
  if (s === "scheduled") return "Scheduled";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return status;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function canCancelAppointment(a) {
  const s = String(a?.status || "").toLowerCase();
  if (s !== "scheduled") return false;

  const d = new Date(a?.scheduled_at || 0);
  if (Number.isNaN(d.getTime())) return false;

  return d.getTime() > Date.now();
}

function defaultLocalDateTime(hoursAhead = 24) {
  const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
