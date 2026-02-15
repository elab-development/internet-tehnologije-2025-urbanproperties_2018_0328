// src/pages/ManageSellerOffers.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Modal from "../components/Modal";
import Button from "../components/Button";

/*
  Manage Offers.

  Sales Agent routes:
  - GET   /api/agent/offers
  - PATCH /api/offers/{offer}/status   body: { status: "accepted" | "rejected" }

  Buyer routes:
  - GET   /api/offers/mine
  - PATCH /api/offers/{offer}/withdraw

  This file supports both roles automatically based on sessionStorage auth_user.role.
*/

export default function ManageSellerOffers() {
  const navigate = useNavigate();

  const authUser = safeParse(sessionStorage.getItem("auth_user"));
  const role = String(authUser?.role || "").toLowerCase();

  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|pending|accepted|rejected|withdrawn
  const [sort, setSort] = useState("newest"); // newest|oldest|amount_desc|amount_asc

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [toast, setToast] = useState({ open: false, message: "" });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [active, setActive] = useState(null);

  const [savingOfferId, setSavingOfferId] = useState(null);

  const offersArray = Array.isArray(allOffers) ? allOffers : [];

  useEffect(() => {
    loadAllOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

  const isBuyer = role === "buyer";
  const isAgent = role === "sales_agent";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...offersArray];

    if (q) {
      list = list.filter((o) => {
        const p = o?.property || {};
        const b = o?.buyer || {};
        const t = o?.transaction || {};
        const hay = [
          o?.id,
          p?.id,
          p?.title,
          p?.city,
          p?.address,
          b?.name,
          b?.email,
          b?.phone,
          o?.status,
          o?.amount,
          t?.id,
          t?.payment_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((o) => String(o?.status || "").toLowerCase() === statusFilter);
    }

    list.sort((a, b) => {
      if (sort === "amount_asc") return Number(a?.amount || 0) - Number(b?.amount || 0);
      if (sort === "amount_desc") return Number(b?.amount || 0) - Number(a?.amount || 0);

      const ad = new Date(a?.created_at || 0).getTime();
      const bd = new Date(b?.created_at || 0).getTime();
      return sort === "oldest" ? ad - bd : bd - ad;
    });

    return list;
  }, [offersArray, search, statusFilter, sort]);

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

  const openDetails = (offer) => {
    setActive(offer);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActive(null);
  };

  const isPending = (offer) => String(offer?.status || "").toLowerCase() === "pending";

  const withdrawOffer = async (offer) => {
    if (!offer?.id) return;
    if (!isPending(offer)) return;

    if (!window.confirm("Withdraw this offer?")) return;

    const token = sessionStorage.getItem("auth_token");

    try {
      setSavingOfferId(offer.id);

      const res = await fetch(`/api/offers/${offer.id}/withdraw`, {
        method: "PATCH",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.status?.[0] ||
          json?.errors?.authorization?.[0] ||
          "Failed to withdraw offer.";
        showToast(msg);
        return;
      }

      // Local update is enough here.
      setAllOffers((prev) =>
        prev.map((x) => (Number(x?.id) === Number(offer.id) ? { ...x, status: "withdrawn" } : x))
      );

      // If modal is open on the same item.
      setActive((prev) =>
        prev && Number(prev?.id) === Number(offer.id) ? { ...prev, status: "withdrawn" } : prev
      );

      showToast("Offer withdrawn.");
    } catch {
      showToast("Network error while withdrawing offer.");
    } finally {
      setSavingOfferId(null);
    }
  };

  const updateOfferStatusAsAgent = async (offer, nextStatus) => {
    if (!offer?.id) return;
    if (!isAgent) return;
    if (!isPending(offer)) return;

    const label = nextStatus === "accepted" ? "accept" : "cancel (reject)";
    if (!window.confirm(`Are you sure you want to ${label} this offer?`)) return;

    const token = sessionStorage.getItem("auth_token");

    try {
      setSavingOfferId(offer.id);

      const res = await fetch(`/api/offers/${offer.id}/status`, {
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
          "Failed to update offer status.";
        showToast(msg);
        return;
      }

      // Important: backend may auto-reject other offers for same property when accepting.
      // Reload list so UI matches backend state.
      showToast("Offer status updated.");
      await loadAllOffers();
      closeDetails();
    } catch {
      showToast("Network error while updating offer status.");
    } finally {
      setSavingOfferId(null);
    }
  };

  async function loadAllOffers() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const endpoint =
        role === "sales_agent"
          ? "/api/agent/offers"
          : role === "buyer"
          ? "/api/offers/mine"
          : null;

      if (!endpoint) {
        setAllOffers([]);
        setPageError("This page is available only for buyer or sales agent roles.");
        setLoading(false);
        return;
      }

      const items = await fetchAllPages(endpoint, token);
      setAllOffers(items);
    } catch (e) {
      setAllOffers([]);
      setPageError(e?.message || "Failed to load offers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="msorWrap">
        <div className="msorHeader">
          <div className="msorHeaderText">
            <h1 className="msorTitle">Manage Offers</h1>
            <p className="msorSubtitle">
              {isAgent ? "Review and manage offers for your properties." : "Review and manage your offers."}
            </p>
          </div>

          <div className="msorHeaderActions">
            {isAgent ? (
              <Button
                variant="outline"
                className="msorHeaderBtn"
                onClick={() => navigate("/sales-agent/manage-my-properties")}
              >
                Manage My Properties
              </Button>
            ) : null}

            <Button variant="outline" className="msorHeaderBtn" onClick={loadAllOffers}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="msorControls">
          <div className="msorCtrl">
            <label className="msorCtrlLabel">Search</label>
            <input
              className="msorCtrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property, buyer, status..."
            />
          </div>

          <div className="msorCtrl">
            <label className="msorCtrlLabel">Status</label>
            <select
              className="msorCtrlSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="msorCtrl">
            <label className="msorCtrlLabel">Sort</label>
            <select className="msorCtrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount (High → Low)</option>
              <option value="amount_asc">Amount (Low → High)</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="msorError">{pageError}</div> : null}

        {loading ? (
          <div className="msorLoading">Loading offers...</div>
        ) : pageItems.length === 0 ? (
          <div className="msorEmpty">
            <div className="msorEmptyTitle">No offers found.</div>
            <div className="msorEmptySubtitle">Try changing filters or refresh the page.</div>
          </div>
        ) : (
          <>
            <div className="msorList">
              {pageItems.map((o) => {
                const p = o?.property || {};
                const buyer = o?.buyer || {};
                const tx = o?.transaction || null;

                const pillClass = offerPillClass(o?.status);
                const pending = isPending(o);
                const busy = Number(savingOfferId) === Number(o?.id);

                return (
                  <div className="msorItem" key={o?.id}>
                    <div className="msorItemCard">
                      <Card property={p} hideActions />
                    </div>

                    <div className="msorItemMeta">
                      <div className="msorMetaTop">
                        <span className={`msorPill ${pillClass}`}>{formatOfferStatus(o?.status)}</span>
                        <div className="msorMetaAmount">{formatMoney(o?.amount)}</div>
                      </div>

                      <div className="msorMetaRow">
                        <span className="msorMetaK">Created</span>
                        <span className="msorMetaV msorMono">{formatDateTime(o?.created_at)}</span>
                      </div>

                      {isAgent ? (
                        <div className="msorBuyer">
                          <div className="msorBuyerTitle">Buyer</div>
                          <div className="msorBuyerRow">
                            <span className="msorBuyerName">{buyer?.name || "Unknown buyer"}</span>
                          </div>
                          <div className="msorBuyerRow msorBuyerMuted">
                            {buyer?.email || "—"} {buyer?.phone ? `• ${buyer.phone}` : ""}
                          </div>
                        </div>
                      ) : null}

                      {tx ? (
                        <div className="msorTx">
                          <div className="msorTxTitle">Transaction</div>
                          <div className="msorMetaRow">
                            <span className="msorMetaK">Payment</span>
                            <span className="msorMetaV">{tx?.payment_status || "—"}</span>
                          </div>
                          <div className="msorMetaRow">
                            <span className="msorMetaK">Final price</span>
                            <span className="msorMetaV msorMono">{formatMoney(tx?.final_price)}</span>
                          </div>
                        </div>
                      ) : null}

                      <div className="msorActions">
                        <Button
                          variant="outline"
                          className="msorActionBtn"
                          onClick={() => openDetails(o)}
                        >
                          View details
                        </Button>

                        {isBuyer ? (
                          <Button
                            className="msorActionBtn"
                            onClick={() => withdrawOffer(o)}
                            disabled={!pending || busy}
                          >
                            Withdraw
                          </Button>
                        ) : null}

                        {isAgent ? (
                          <>
                            <Button
                              className="msorActionBtn"
                              onClick={() => updateOfferStatusAsAgent(o, "accepted")}
                              disabled={!pending || busy}
                            >
                              Accept
                            </Button>

                            <Button
                              variant="outline"
                              className="msorActionBtn"
                              onClick={() => updateOfferStatusAsAgent(o, "rejected")}
                              disabled={!pending || busy}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                      </div>

                      {(isBuyer || isAgent) && !pending ? (
                        <div className="msorHint">Only pending offers can be changed.</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="msorPager">
              <Button
                variant="outline"
                onClick={() => setPage((x) => Math.max(1, x - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>

              <div className="msorPagerMeta">
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
        title={active?.property?.title ? `Offer — ${active.property.title}` : "Offer"}
        onClose={closeDetails}
      >
        <div className="msorModalGrid">
          <div className="msorModalCard">
            <div className="msorModalLabel">Offer</div>
            <Row k="ID" v={active?.id ?? "-"} mono />
            <Row k="Amount" v={formatMoney(active?.amount)} mono />
            <Row k="Status" v={formatOfferStatus(active?.status)} />
            <Row k="Created" v={formatDateTime(active?.created_at)} mono />
          </div>

          <div className="msorModalCard">
            <div className="msorModalLabel">Property</div>
            <Row k="Title" v={active?.property?.title || "—"} />
            <Row k="City" v={active?.property?.city || "—"} />
            <Row k="Address" v={active?.property?.address || "—"} />
            <Row k="Price" v={formatMoney(active?.property?.price)} mono />
          </div>

          {active?.buyer ? (
            <div className="msorModalCard">
              <div className="msorModalLabel">Buyer</div>
              <Row k="Name" v={active?.buyer?.name || "—"} />
              <Row k="Email" v={active?.buyer?.email || "—"} />
              <Row k="Phone" v={active?.buyer?.phone || "—"} />
            </div>
          ) : null}

          {active?.transaction ? (
            <div className="msorModalCard">
              <div className="msorModalLabel">Transaction</div>
              <Row k="ID" v={active?.transaction?.id ?? active?.transaction_id ?? "-"} mono />
              <Row k="Payment" v={active?.transaction?.payment_status || "—"} />
              <Row k="Final price" v={formatMoney(active?.transaction?.final_price)} mono />
              <Row k="Signed" v={formatDateTime(active?.transaction?.signed_at)} mono />
            </div>
          ) : null}
        </div>

        <div className="msorModalActions">
          {isAgent && isPending(active) ? (
            <>
              <Button
                onClick={() => updateOfferStatusAsAgent(active, "accepted")}
                disabled={Number(savingOfferId) === Number(active?.id)}
              >
                Accept
              </Button>

              <Button
                variant="outline"
                onClick={() => updateOfferStatusAsAgent(active, "rejected")}
                disabled={Number(savingOfferId) === Number(active?.id)}
              >
                Cancel
              </Button>
            </>
          ) : null}

          {isBuyer && isPending(active) ? (
            <Button
              onClick={() => withdrawOffer(active)}
              disabled={Number(savingOfferId) === Number(active?.id)}
            >
              Withdraw
            </Button>
          ) : null}

          <Button variant="outline" onClick={closeDetails}>
            Close
          </Button>
        </div>
      </Modal>

      {toast.open ? <div className="msorToast">{toast.message}</div> : null}
    </>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="msorRow">
      <span className="msorRowK">{k}</span>
      <span className={`msorRowV ${mono ? "msorMono" : ""}`} title={String(v || "")}>
        {v}
      </span>
    </div>
  );
}

function offerPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "msorPill--pending";
  if (s === "accepted") return "msorPill--accepted";
  if (s === "rejected") return "msorPill--rejected";
  if (s === "withdrawn") return "msorPill--withdrawn";
  return "";
}

function formatOfferStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  if (s === "withdrawn") return "Withdrawn";
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

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
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
