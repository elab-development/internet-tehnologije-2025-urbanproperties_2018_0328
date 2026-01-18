// src/pages/ManageOffers.jsx
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import Button from "../components/Button";

/*
  Manage Offers page.
  - Komentari su na srpskom.
  - Kod i natpisi su na engleskom.
  - Prikaz: tabela, 4 po strani, paginacija + filteri.
  - View Details otvara Modal i prikazuje podatke ponude.
  - Ne menja ništa u Offer modelu.
*/

export default function ManageOffers() {
  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const perPage = 4;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);

  // Učitaj rolu (buyer / sales_agent / administrator).
  const authUser = safeParse(sessionStorage.getItem("auth_user"));
  const role = String(authUser?.role || "").toLowerCase();

  // Zaštita: uvek radimo sa nizom.
  const offersArray = Array.isArray(allOffers) ? allOffers : [];

  useEffect(() => {
    loadAllOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kada se filteri promene, vrati na prvu stranu (bolji UX).
  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...offersArray];

    // Filter: search po naslovu property-ja.
    if (q) {
      list = list.filter((o) =>
        String(o?.property?.title || "").toLowerCase().includes(q)
      );
    }

    // Filter: status.
    if (status !== "all") {
      list = list.filter((o) => String(o?.status || "").toLowerCase() === status);
    }

    // Sortiranje.
    list.sort((a, b) => {
      if (sort === "amount_asc") return Number(a?.amount || 0) - Number(b?.amount || 0);
      if (sort === "amount_desc") return Number(b?.amount || 0) - Number(a?.amount || 0);

      const ad = new Date(a?.created_at || 0).getTime();
      const bd = new Date(b?.created_at || 0).getTime();

      // newest / oldest.
      return sort === "oldest" ? ad - bd : bd - ad;
    });

    return list;
  }, [offersArray, search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const openDetails = (offer) => {
    setActiveOffer(offer);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActiveOffer(null);
  };

  async function loadAllOffers() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    // Buyer vidi svoje ponude, Sales Agent vidi ponude za svoje nekretnine.
    // Ako ti se route razlikuje u api.php, promeni samo ove stringove.
    const OFFER_LIST_URLS =
      role === "sales_agent"
        ? ["/api/offers/for-my-properties", "/api/offers/forMyProperties"]
        : ["/api/offers/mine"];

    try {
      const items = await fetchAllPagesWithFallback(OFFER_LIST_URLS, token);
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
      <style>{css}</style>

      <div className="moWrap">
        <div className="moHeader">
          <div>
            <h1 className="moTitle">Manage Offers</h1>
            <p className="moSubtitle">
              Review your offers, filter them, and open details in a modal.
            </p>
          </div>

          <div className="moHeaderActions">
            <Button variant="outline" onClick={loadAllOffers}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="moControls">
          <div className="ctrl">
            <label className="ctrlLabel">Search</label>
            <input
              className="ctrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property title..."
            />
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Status</label>
            <select
              className="ctrlSelect"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Sort</label>
            <select className="ctrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_asc">Amount (Low → High)</option>
              <option value="amount_desc">Amount (High → Low)</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="moError">{pageError}</div> : null}

        {loading ? (
          <div className="moLoading">Loading offers...</div>
        ) : (
          <>
            <div className="tableWrap">
              <table className="moTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="thRight">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="emptyCell">
                        No offers found.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((o) => {
                      const p = o?.property;
                      return (
                        <tr key={o?.id || Math.random()}>
                          <td className="mono">{o?.id ?? "-"}</td>
                          <td>
                            <div className="propCell">
                              <div className="propTitle">{p?.title || "Untitled"}</div>
                              <div className="propMeta">
                                {(p?.city || "Unknown city") + ", " + (p?.address || "Unknown address")}
                              </div>
                            </div>
                          </td>
                          <td className="mono">{formatCurrency(o?.amount)}</td>
                          <td>
                            <span className={`badge badge_${String(o?.status || "pending").toLowerCase()}`}>
                              {String(o?.status || "pending")}
                            </span>
                          </td>
                          <td className="mono">{formatDate(o?.created_at)}</td>
                          <td className="tdRight">
                            <Button variant="outline" onClick={() => openDetails(o)}>
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
        title={activeOffer?.property?.title ? `Offer Details — ${activeOffer.property.title}` : "Offer Details"}
        onClose={closeDetails}
      >
        <div className="detailsGrid">
          <div className="detailsCard">
            <div className="detailsLabel">Offer</div>
            <div className="detailsRow">
              <span className="k">Offer ID</span>
              <span className="v mono">{activeOffer?.id ?? "-"}</span>
            </div>
            <div className="detailsRow">
              <span className="k">Amount</span>
              <span className="v mono">{formatCurrency(activeOffer?.amount)}</span>
            </div>
            <div className="detailsRow">
              <span className="k">Status</span>
              <span className="v">
                <span className={`badge badge_${String(activeOffer?.status || "pending").toLowerCase()}`}>
                  {String(activeOffer?.status || "pending")}
                </span>
              </span>
            </div>
            <div className="detailsRow">
              <span className="k">Created</span>
              <span className="v mono">{formatDate(activeOffer?.created_at)}</span>
            </div>
          </div>

          <div className="detailsCard">
            <div className="detailsLabel">Property</div>
            <div className="detailsRow">
              <span className="k">Title</span>
              <span className="v">{activeOffer?.property?.title || "Untitled"}</span>
            </div>
            <div className="detailsRow">
              <span className="k">Location</span>
              <span className="v">
                {(activeOffer?.property?.city || "Unknown city") +
                  ", " +
                  (activeOffer?.property?.address || "Unknown address")}
              </span>
            </div>
            <div className="detailsRow">
              <span className="k">Type</span>
              <span className="v">{formatType(activeOffer?.property?.type)}</span>
            </div>
            <div className="detailsRow">
              <span className="k">Price</span>
              <span className="v mono">{formatCurrency(activeOffer?.property?.price)}</span>
            </div>
          </div>
          {activeOffer?.transaction || activeOffer?.transaction_id ? (
            <div className="detailsCard">
              <div className="detailsLabel">Transaction</div>

              <div className="detailsRow">
                <span className="k">Transaction ID</span>
                <span className="v mono">
                  {activeOffer?.transaction?.id ?? activeOffer?.transaction_id ?? "-"}
                </span>
              </div>

              <div className="detailsRow">
                <span className="k">Payment Status</span>
                <span className="v">
                  {activeOffer?.transaction?.payment_status || "-"}
                </span>
              </div>

              <div className="detailsRow">
                <span className="k">Final Price</span>
                <span className="v mono">
                  {formatCurrency(activeOffer?.transaction?.final_price)}
                </span>
              </div>

              <div className="detailsRow">
                <span className="k">Signed At</span>
                <span className="v mono">
                  {formatDate(activeOffer?.transaction?.signed_at)}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="detailsActions">
          <Button variant="outline" onClick={closeDetails}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* Pokušaj više URL-ova (fallback) + povuci sve stranice. */
async function fetchAllPagesWithFallback(urls, token) {
  let lastErr = null;

  for (const baseUrl of urls) {
    try {
      const items = await fetchAllPages(baseUrl, token);
      return items;
    } catch (e) {
      lastErr = e;
      // Ako je 404, probaj sledeći URL.
      if (String(e?.message || "").includes("404")) continue;
    }
  }

  throw lastErr || new Error("Failed to load offers.");
}

/* Povuci sve stranice sa backend paginacije. */
async function fetchAllPages(baseUrl, token) {
  const firstUrl = appendPage(baseUrl, 1);

  const firstRes = await fetch(firstUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const firstJson = await firstRes.json().catch(() => null);

  if (!firstRes.ok) {
    throw new Error(firstJson?.message || `Request failed (${firstRes.status}).`);
  }

  const firstItems = Array.isArray(firstJson?.data?.items)
    ? firstJson.data.items
    : Array.isArray(firstJson?.data)
    ? firstJson.data
    : [];

  const lastPage = Number(firstJson?.data?.pagination?.last_page || 1);

  if (lastPage <= 1) return firstItems;

  const promises = [];
  for (let p = 2; p <= lastPage; p++) {
    promises.push(
      fetch(appendPage(baseUrl, p), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((r) => r.json())
        .then((j) =>
          Array.isArray(j?.data?.items) ? j.data.items : Array.isArray(j?.data) ? j.data : []
        )
    );
  }

  const restItems = (await Promise.all(promises)).flat();
  return [...firstItems, ...restItems];
}

/* Dodaj page param bez obzira da li URL već ima query string. */
function appendPage(url, page) {
  return url.includes("?") ? `${url}&page=${page}` : `${url}?page=${page}`;
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function formatCurrency(val) {
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

function formatDate(val) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB");
}

function formatType(type) {
  if (!type) return "-";
  return String(type)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const css = `
  .moWrap{
    border-radius: 22px;
    padding: 16px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
  }

  .moHeader{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .moTitle{
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .moSubtitle{
    margin: 6px 0 0 0;
    opacity: 0.78;
    font-size: 13px;
  }

  .moControls{
    display:grid;
    grid-template-columns: 1.4fr 1fr 1fr;
    gap: 12px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(156,175,183,0.08);
    border: 1px solid rgba(156,175,183,0.16);
    margin-bottom: 16px;
  }

  .ctrl{ width: 100%; }
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
    box-sizing: border-box;
  }

  .ctrlInput:focus, .ctrlSelect:focus{
    border: 1px solid rgba(232,91,90,0.45);
    box-shadow: 0 0 0 3px rgba(232,91,90,0.12);
  }

  .moError{
    margin: 10px 0 0 0;
    padding: 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .moLoading{
    padding: 18px 12px;
    opacity: 0.85;
    font-weight: 800;
  }

  .tableWrap{
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(156,175,183,0.14);
    background: rgba(11,16,32,0.42);
  }

  .moTable{
    width: 100%;
    border-collapse: collapse;
  }

  .moTable thead th{
    text-align: left;
    font-size: 12px;
    letter-spacing: 0.2px;
    opacity: 0.85;
    padding: 12px 12px;
    background: rgba(156,175,183,0.06);
    border-bottom: 1px solid rgba(156,175,183,0.14);
  }

  .moTable tbody td{
    padding: 12px 12px;
    border-bottom: 1px solid rgba(156,175,183,0.10);
    vertical-align: middle;
  }

  .moTable tbody tr:hover td{
    background: rgba(232,91,90,0.06);
  }

  .mono{
    font-variant-numeric: tabular-nums;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .propCell{ display:grid; gap: 4px; min-width: 0; }
  .propTitle{
    font-weight: 1000;
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .propMeta{
    font-size: 12px;
    opacity: 0.78;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    border: 1px solid rgba(156,175,183,0.18);
    background: rgba(156,175,183,0.10);
  }
  .badge_pending{ background: rgba(232,91,90,0.10); border-color: rgba(232,91,90,0.22); }
  .badge_accepted{ background: rgba(66,129,164,0.14); border-color: rgba(66,129,164,0.24); }
  .badge_rejected{ background: rgba(232,91,90,0.12); border-color: rgba(232,91,90,0.28); }
  .badge_withdrawn{ background: rgba(156,175,183,0.10); border-color: rgba(156,175,183,0.22); opacity: 0.9; }

  .thRight{ text-align: right; }
  .tdRight{ text-align: right; }

  .emptyCell{
    padding: 18px 12px;
    opacity: 0.85;
    text-align: center;
    font-weight: 900;
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

  .detailsGrid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .detailsCard{
    border-radius: 18px;
    padding: 12px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .detailsLabel{
    font-weight: 1000;
    letter-spacing: 0.2px;
    margin-bottom: 10px;
    opacity: 0.92;
  }

  .detailsRow{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .detailsRow:first-of-type{ border-top: 0; }

  .k{ opacity: 0.78; font-weight: 800; }
  .v{ text-align:right; font-weight: 900; }

  .detailsActions{
    display:flex;
    justify-content:flex-end;
    margin-top: 12px;
  }

  @media (max-width: 980px){
    .moControls{ grid-template-columns: 1fr; }
    .detailsGrid{ grid-template-columns: 1fr; }
    .thRight, .tdRight{ text-align: left; }
  }
`;
