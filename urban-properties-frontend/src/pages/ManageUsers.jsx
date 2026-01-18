// src/pages/ManageUsers.jsx
import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button";
import Modal from "../components/Modal";

/*
  Admin -> Manage Users.
  - Dohvata korisnike sa GET /api/admin/users.
  - Backend format (AdminController::users):
    data: { sales_agents: [...], buyers: [...] }
  - Search (name/email/phone), filter (role), sort, pagination (4/page).
  - View Details otvara Modal.jsx sa detaljima iz UserResource.
*/

export default function ManageUsers() {
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [salesAgents, setSalesAgents] = useState([]);
  const [buyers, setBuyers] = useState([]);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all"); // all | buyer | sales_agent
  const [sort, setSort] = useState("newest"); // newest | oldest | name_asc | name_desc

  const [page, setPage] = useState(1);
  const perPage = 4;

  const [toast, setToast] = useState({ open: false, message: "" });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kad se promeni search/filter/sort -> vraćamo na prvu stranu.
  useEffect(() => {
    setPage(1);
  }, [search, role, sort]);

  const allUsers = useMemo(() => {
    const sa = Array.isArray(salesAgents) ? salesAgents : [];
    const b = Array.isArray(buyers) ? buyers : [];
    return [...sa, ...b];
  }, [salesAgents, buyers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = [...allUsers];

    // Filter by role.
    if (role !== "all") {
      list = list.filter((u) => String(u?.role || "").toLowerCase() === role);
    }

    // Search by name/email/phone.
    if (q) {
      list = list.filter((u) => {
        const name = String(u?.name || "").toLowerCase();
        const email = String(u?.email || "").toLowerCase();
        const phone = String(u?.phone || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }

    // Sort.
    list.sort((a, b) => {
      const aName = String(a?.name || "");
      const bName = String(b?.name || "");

      const aCreated = new Date(a?.created_at || 0).getTime();
      const bCreated = new Date(b?.created_at || 0).getTime();

      if (sort === "oldest") return aCreated - bCreated;
      if (sort === "newest") return bCreated - aCreated;

      if (sort === "name_desc") return bName.localeCompare(aName);
      return aName.localeCompare(bName);
    });

    return list;
  }, [allUsers, role, search, sort]);

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
    showToast._t = window.setTimeout(() => setToast({ open: false, message: "" }), 2400);
  };

  const openDetails = (u) => {
    setSelectedUser(u);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedUser(null);
  };

  async function loadUsers() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load users.");
      }

      // AdminController::users -> data: { sales_agents: [...], buyers: [...] }
      const sa = Array.isArray(json?.data?.sales_agents) ? json.data.sales_agents : [];
      const b = Array.isArray(json?.data?.buyers) ? json.data.buyers : [];

      setSalesAgents(sa);
      setBuyers(b);

      showToast("Users loaded successfully.");
    } catch (e) {
      setSalesAgents([]);
      setBuyers([]);
      setPageError(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="muWrap">
        <div className="muHeader">
          <div>
            <h1 className="muTitle">Manage Users</h1>
            <p className="muSubtitle">
              Browse all users. Use search, role filter, and sorting.
            </p>
          </div>

          <div className="muHeaderActions">
            <Button variant="outline" onClick={loadUsers}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="muStats">
          <div className="muStatCard">
            <div className="muStatLabel">Total</div>
            <div className="muStatValue">{allUsers.length}</div>
          </div>
          <div className="muStatCard">
            <div className="muStatLabel">Sales Agents</div>
            <div className="muStatValue">{(Array.isArray(salesAgents) ? salesAgents : []).length}</div>
          </div>
          <div className="muStatCard">
            <div className="muStatLabel">Buyers</div>
            <div className="muStatValue">{(Array.isArray(buyers) ? buyers : []).length}</div>
          </div>
        </div>

        <div className="muControls">
          <div className="ctrl" style={{ marginRight: "55px" }}>
            <label className="ctrlLabel">Search</label>
            <input
              className="ctrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
            />
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Role</label>
            <select className="ctrlSelect" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">All</option>
              <option value="buyer">Buyer</option>
              <option value="sales_agent">Sales Agent</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Sort</label>
            <select className="ctrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="muError">{pageError}</div> : null}

        {loading ? (
          <div className="muLoading">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="muEmpty">
            <div className="muEmptyTitle">No users found.</div>
            <div className="muEmptySub">Try changing search/filter criteria.</div>
          </div>
        ) : (
          <>
            <div className="tableWrap">
              <table className="muTable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th className="thActions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((u) => (
                    <tr key={u.id}>
                      <td className="tdStrong">{u?.name || "-"}</td>
                      <td className="tdMono">{u?.email || "-"}</td>
                      <td className="tdMono">{u?.phone || "-"}</td>
                      <td>
                        <span className="rolePill">{formatRole(u?.role)}</span>
                      </td>
                      <td className="tdMono">{formatDate(u?.created_at)}</td>
                      <td className="tdActions">
                        <Button variant="outline" onClick={() => openDetails(u)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <Button
                variant="outline"
                onClick={() => setPage((x) => Math.max(1, x - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>

              <div className="pagerMeta">
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
        title={selectedUser ? `User Details — ${selectedUser.name}` : "User Details"}
        onClose={closeDetails}
      >
        <div className="details">
          <div className="detailsGrid">
            <DetailItem label="Name" value={selectedUser?.name} />
            <DetailItem label="Email" value={selectedUser?.email} />
            <DetailItem label="Phone" value={selectedUser?.phone} />
            <DetailItem label="Role" value={formatRole(selectedUser?.role)} />
            <DetailItem label="Created At" value={formatDateTime(selectedUser?.created_at)} />
            <DetailItem label="Updated At" value={formatDateTime(selectedUser?.updated_at)} />

            {/* Ovi brojači su opcioni (UserResource supports them). Prikazaćemo ih ako postoje. */}
            {selectedUser?.properties_count !== undefined ? (
              <DetailItem label="Properties Count" value={String(selectedUser.properties_count)} />
            ) : null}
            {selectedUser?.viewing_appointments_count !== undefined ? (
              <DetailItem
                label="Viewing Appointments Count"
                value={String(selectedUser.viewing_appointments_count)}
              />
            ) : null}
            {selectedUser?.offers_count !== undefined ? (
              <DetailItem label="Offers Count" value={String(selectedUser.offers_count)} />
            ) : null}
            {selectedUser?.transactions_count !== undefined ? (
              <DetailItem label="Transactions Count" value={String(selectedUser.transactions_count)} />
            ) : null}
          </div>

          <div className="detailsActions">
            <Button variant="outline" onClick={closeDetails}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {toast.open ? <div className="toast">{toast.message}</div> : null}
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detailItem">
      <div className="detailLabel">{label}</div>
      <div className="detailValue">{value || "-"}</div>
    </div>
  );
}

function formatRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "sales_agent") return "Sales Agent";
  if (r === "buyer") return "Buyer";
  if (r === "administrator") return "Administrator";
  return role || "-";
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

const css = `
  .muWrap{
    border-radius: 22px;
    padding: 16px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
  }

  .muHeader{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .muTitle{
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .muSubtitle{
    margin: 6px 0 0 0;
    opacity: 0.78;
    font-size: 13px;
  }

  .muHeaderActions{
    display:flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content:flex-end;
  }

  .muStats{
    display:grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 10px 0 16px 0;
  }

  .muStatCard{
    border-radius: 18px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
    padding: 12px 14px;
  }

  .muStatLabel{
    font-size: 12px;
    opacity: 0.78;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .muStatValue{
    margin-top: 4px;
    font-size: 20px;
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .muControls{
    display:grid;
    grid-template-columns: 1.4fr 1fr 1fr;
    gap: 12px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(156,175,183,0.08);
    border: 1px solid rgba(156,175,183,0.16);
    margin-bottom: 16px;
  }

  .ctrlLabel{
    display:block;
    font-size: 12px;
    opacity: 0.85;
    margin-bottom: 6px;
    font-weight: 800;
    letter-spacing: 0.2px;
  }

  .ctrlInput, .ctrlSelect{
    width: 100%;
    height: 42px;
    border-radius: 14px;
    padding: 0 12px;
    color: rgba(255,255,255,0.92);
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.18);
    outline: none;
  }

  .ctrlInput:focus, .ctrlSelect:focus{
    border: 1px solid rgba(232,91,90,0.45);
    box-shadow: 0 0 0 3px rgba(232,91,90,0.12);
  }

  .muError{
    margin: 10px 0 0 0;
    padding: 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .muLoading{
    padding: 18px 12px;
    opacity: 0.85;
    font-weight: 800;
  }

  .muEmpty{
    padding: 18px 14px;
    border-radius: 18px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .muEmptyTitle{
    font-weight: 1000;
    font-size: 16px;
    letter-spacing: 0.2px;
  }

  .muEmptySub{
    margin-top: 6px;
    opacity: 0.78;
    font-size: 13px;
  }

  .tableWrap{
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(156,175,183,0.14);
    background: rgba(11,16,32,0.40);
  }

  .muTable{
    width: 100%;
    border-collapse: collapse;
  }

  .muTable thead th{
    text-align: left;
    padding: 12px 12px;
    font-size: 12px;
    letter-spacing: 0.2px;
    font-weight: 1000;
    opacity: 0.85;
    background: rgba(156,175,183,0.06);
    border-bottom: 1px solid rgba(156,175,183,0.14);
  }

  .muTable tbody td{
    padding: 12px 12px;
    border-bottom: 1px solid rgba(156,175,183,0.10);
    vertical-align: middle;
  }

  .muTable tbody tr:hover td{
    background: rgba(232,91,90,0.06);
  }

  .tdStrong{
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .tdMono{
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    opacity: 0.92;
  }

  .rolePill{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 1000;
    background: rgba(232, 91, 90, 0.14);
    border: 1px solid rgba(232, 91, 90, 0.22);
    color: rgba(255,255,255,0.92);
    white-space: nowrap;
  }

  .thActions{
    text-align: right;
  }

  .tdActions{
    text-align: right;
    white-space: nowrap;
  }

  .pager{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    margin-top: 16px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .pagerMeta{
    opacity: 0.85;
    font-weight: 800;
  }

  .details{
    display:grid;
    gap: 12px;
  }

  .detailsGrid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .detailItem{
    padding: 12px;
    border-radius: 16px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .detailLabel{
    font-size: 12px;
    opacity: 0.78;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .detailValue{
    margin-top: 6px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    word-break: break-word;
  }

  .detailsActions{
    display:flex;
    justify-content:flex-end;
  }

  .toast{
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    padding: 12px 16px;
    border-radius: 999px;
    background: rgba(11,16,32,0.92);
    border: 1px solid rgba(232,91,90,0.28);
    box-shadow: 0 18px 55px rgba(0,0,0,0.40);
    font-weight: 900;
  }

  @media (max-width: 980px){
    .muControls{ grid-template-columns: 1fr; }
    .muStats{ grid-template-columns: 1fr; }
    .detailsGrid{ grid-template-columns: 1fr; }
    .tdActions, .thActions{ text-align:left; }
  }
`;
