// src/pages/ManageProperties.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Modal from "../components/Modal";
import Button from "../components/Button";

/*
  Buyer -> Manage Properties.
  - Filteri: search (title), type, sort by price.
  - 4 kartice po strani.
  - Make an Offer otvara modal i kreira Offer.
  - Book a Viewing Appointment: navigacija ka buyer viewing appointments page (prefill property_id).
  - View Details: navigacija na details rutu.
*/
export default function ManageProperties() {
  const navigate = useNavigate();

  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sortPrice, setSortPrice] = useState("asc");

  const [page, setPage] = useState(1);
  const perPage = 4;

  const [toast, setToast] = useState({ open: false, message: "" });

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerProperty, setOfferProperty] = useState(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState("");

  const propertiesArray = Array.isArray(allProperties) ? allProperties : [];

  useEffect(() => {
    loadAllProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, type, sortPrice]);

  const uniqueTypes = useMemo(() => {
    const s = new Set(propertiesArray.map((p) => p?.type).filter(Boolean));
    return ["all", ...Array.from(s)];
  }, [propertiesArray]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...propertiesArray];

    // Search by title.
    if (q) list = list.filter((p) => (p?.title || "").toLowerCase().includes(q));

    // Filter by type.
    if (type !== "all") list = list.filter((p) => p?.type === type);

    // Sort by price.
    list.sort((a, b) => {
      const ap = Number(a?.price || 0);
      const bp = Number(b?.price || 0);
      return sortPrice === "asc" ? ap - bp : bp - ap;
    });

    return list;
  }, [propertiesArray, search, type, sortPrice]);

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
    showToast._t = window.setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2600);
  };

  const goToViewingAppointments = (property) => {
    const base = "/buyer/manage-my-viewing-appointments";
    const pid = property?.id;
    navigate(pid ? `${base}?property_id=${pid}` : base);
  };

  const openOffer = (property) => {
    setOfferProperty(property);
    setOfferAmount("");
    setOfferError("");
    setOfferModalOpen(true);
  };

  const closeOffer = () => {
    setOfferModalOpen(false);
    setOfferProperty(null);
    setOfferAmount("");
    setOfferError("");
  };

  const submitOffer = async () => {
    if (!offerProperty?.id) return;

    const amountNum = Number(String(offerAmount).replace(",", "."));
    if (!amountNum || amountNum <= 0) {
      setOfferError("Please enter a valid amount.");
      return;
    }

    setOfferSaving(true);
    setOfferError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: offerProperty.id,
          amount: amountNum,
          status: "pending",
          transaction_id: null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.errors?.authorization?.[0] ||
          data?.errors?.property?.[0] ||
          "Offer creation failed.";
        setOfferError(msg);
        return;
      }

      closeOffer();
      showToast("Offer created successfully.");
    } catch {
      setOfferError("Network error while creating the offer.");
    } finally {
      setOfferSaving(false);
    }
  };

  async function loadAllProperties() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const firstRes = await fetch("/api/properties?page=1", {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      const firstJson = await firstRes.json().catch(() => null);

      if (!firstRes.ok) {
        throw new Error(firstJson?.message || "Failed to load properties.");
      }

      // Podržavamo oba formata, da ne puca ako nešto promeniš na backendu.
      const firstItems = Array.isArray(firstJson?.data?.items)
        ? firstJson.data.items
        : Array.isArray(firstJson?.data)
        ? firstJson.data
        : [];

      const lastPage = Number(firstJson?.data?.pagination?.last_page || 1);

      if (lastPage <= 1) {
        setAllProperties(firstItems);
        return;
      }

      const promises = [];
      for (let p = 2; p <= lastPage; p++) {
        promises.push(
          fetch(`/api/properties?page=${p}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((j) =>
              Array.isArray(j?.data?.items) ? j.data.items : Array.isArray(j?.data) ? j.data : []
            )
        );
      }

      const restItems = (await Promise.all(promises)).flat();
      setAllProperties([...firstItems, ...restItems]);
    } catch (e) {
      setAllProperties([]);
      setPageError(e?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="mpWrap">
        <div className="mpHeader">
          <div>
            <h1 className="mpTitle">Manage Properties</h1>
            <p className="mpSubtitle">Search by title, filter by type, and sort by price.</p>
          </div>

          <div className="mpHeaderActions">
            <Button
              variant="outline"
              className="mpViewingsBtn"
              onClick={() => goToViewingAppointments(null)}
            >
              My Viewing Appointments
            </Button>
            <Button variant="outline" onClick={loadAllProperties}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mpControls" style={{ marginRight: "55px" }}>
          <div className="ctrl">
            <label className="ctrlLabel">Search</label>
            <input
              className="ctrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
          </div>

          <div className="ctrl" style={{ marginLeft: "55px" }}>
            <label className="ctrlLabel">Type</label>
            <select className="ctrlSelect" value={type} onChange={(e) => setType(e.target.value)}>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All" : t}
                </option>
              ))}
            </select>
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Sort by price</label>
            <select
              className="ctrlSelect"
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value)}
            >
              <option value="asc">Low to high</option>
              <option value="desc">High to low</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="mpError">{pageError}</div> : null}

        {loading ? (
          <div className="mpLoading">Loading properties...</div>
        ) : (
          <>
            <div className="grid">
              {pageItems.map((p) => (
                <Card
                  key={p.id}
                  property={p}
                  sellerName={p?.sales_agent?.name}
                  onMakeOffer={() => openOffer(p)}
                  onBookViewing={() => goToViewingAppointments(p)}
                  onViewDetails={() => navigate(`/buyer/manage-properties/property-details/${p.id}`)}
                />
              ))}
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
        open={offerModalOpen}
        title={offerProperty ? `Make an Offer — ${offerProperty.title}` : "Make an Offer"}
        onClose={closeOffer}
      >
        <div className="offerForm">
          <div className="ctrl">
            <label className="ctrlLabel">Amount</label>
            <input
              className="ctrlInput"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="e.g. 120000"
            />
          </div>

          {offerError ? <div className="offerError">{offerError}</div> : null}

          <div className="offerActions">
            <Button variant="outline" onClick={closeOffer}>
              Cancel
            </Button>
            <Button onClick={submitOffer} disabled={offerSaving}>
              {offerSaving ? "Saving..." : "Submit Offer"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast.open ? <div className="toast">{toast.message}</div> : null}
    </>
  );
}

const css = `
  .mpWrap{
    border-radius: 22px;
    padding: 16px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
  }

  .mpHeader{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .mpHeaderActions{
    display:flex;
    gap: 10px;
    justify-content:flex-end;
    flex-wrap: wrap;
  }

  .mpTitle{
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .mpSubtitle{
    margin: 6px 0 0 0;
    opacity: 0.78;
    font-size: 13px;
  }

  .mpControls{
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
    marginLeft: 13px;
    padding: 0 15px;
    color: rgba(255,255,255,0.92);
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.18);
    outline: none;
  }

  .ctrlInput:focus, .ctrlSelect:focus{
    border: 1px solid rgba(232,91,90,0.45);
    box-shadow: 0 0 0 3px rgba(232,91,90,0.12);
  }

  .mpError{
    margin: 10px 0 0 0;
    padding: 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .mpLoading{
    padding: 18px 12px;
    opacity: 0.85;
    font-weight: 800;
  }

  .grid{
    display:grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
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

  .offerForm{ display:grid; gap: 12px; }
  .offerError{
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }
  .offerActions{
    display:flex;
    gap: 10px;
    justify-content:flex-end;
    margin-top: 6px;
  }

  @media (max-width: 980px){
    .mpControls{ grid-template-columns: 1fr; }
    .grid{ grid-template-columns: 1fr; }
  }
`;
