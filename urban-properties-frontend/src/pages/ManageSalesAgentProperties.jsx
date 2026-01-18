// src/pages/ManageSalesAgentProperties.jsx
import { useEffect, useMemo, useState } from "react";

import Card from "../components/Card";
import Modal from "../components/Modal";
import Button from "../components/Button";
import useRandomImage from "../hooks/useRandomImage";

/*
  Sales Agent -> Manage My Properties.
  - Backend već podržava filter: /api/properties?mine=true (filtrira sales_agent_id = ulogovani user)【PropertyController@index】
  - Frontend dodatno radi fallback filtriranje po sales_agent_id (ako imamo userId u sessionStorage).
  - Reuse Card.jsx (hideActions=true).
  - Ako nema nekretnina -> poruka.
  - Create new property via Modal.jsx (POST /api/properties).
*/

export default function ManageSalesAgentProperties() {
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all | available | reserved | sold
  const [sort, setSort] = useState("newest"); // newest | oldest

  const [page, setPage] = useState(1);
  const perPage = 4;

  const [toast, setToast] = useState({ open: false, message: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    address: "",
    city: "",
    area_m2: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    status: "available",
    d3: "", // 3d_image_url
  });

  const propertiesArray = Array.isArray(allProperties) ? allProperties : [];

  useEffect(() => {
    loadMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...propertiesArray];

    if (q) list = list.filter((p) => (p?.title || "").toLowerCase().includes(q));

    if (status !== "all") {
      list = list.filter((p) => String(p?.status || "").toLowerCase() === status);
    }

    list.sort((a, b) => {
      const ad = new Date(a?.created_at || 0).getTime();
      const bd = new Date(b?.created_at || 0).getTime();
      return sort === "newest" ? bd - ad : ad - bd;
    });

    return list;
  }, [propertiesArray, search, status, sort]);

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

  const openCreate = () => {
    setFormError("");
    setForm({
      title: "",
      description: "",
      type: "",
      address: "",
      city: "",
      area_m2: "",
      bedrooms: "",
      bathrooms: "",
      price: "",
      status: "available",
      d3: "",
    });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setFormError("");
  };

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submitCreate = async () => {
    setFormError("");

    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.type.trim()) return setFormError("Type is required.");
    if (!form.address.trim()) return setFormError("Address is required.");
    if (!form.city.trim()) return setFormError("City is required.");
    if (form.bedrooms === "" || Number(form.bedrooms) < 0) return setFormError("Bedrooms is required.");
    if (form.bathrooms === "" || Number(form.bathrooms) < 0) return setFormError("Bathrooms is required.");
    if (form.price === "" || Number(form.price) < 0) return setFormError("Price is required.");

    const token = sessionStorage.getItem("auth_token");
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        type: form.type.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        area_m2: form.area_m2 === "" ? null : Number(form.area_m2),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        price: Number(form.price),
        status: form.status || "available",
        "3d_image_url": form.d3?.trim() || null,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.errors?.authorization?.[0] ||
          json?.errors?.title?.[0] ||
          json?.errors?.type?.[0] ||
          json?.errors?.address?.[0] ||
          json?.errors?.city?.[0] ||
          json?.errors?.price?.[0] ||
          "Failed to create property.";
        setFormError(msg);
        return;
      }

      closeCreate();
      showToast("Property created successfully.");
      loadMyProperties();
    } catch {
      setFormError("Network error while creating the property.");
    } finally {
      setSaving(false);
    }
  };

  function getAuthUserId() {
    // Probaj nekoliko ključeva (zavisi kako si sačuvao user-a posle logina).
    const raw =
      sessionStorage.getItem("auth_user") ||
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("logged_user");

    if (!raw) return null;

    try {
      const u = JSON.parse(raw);
      const id = u?.id;
      return id != null ? Number(id) : null;
    } catch {
      return null;
    }
  }

  function extractItems(json) {
    if (Array.isArray(json?.data?.items)) return json.data.items;
    if (Array.isArray(json?.data)) return json.data;
    return [];
  }

  async function loadMyProperties() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");
    const myUserId = getAuthUserId();

    try {
      // mine=true (sigurno “truthy” za $request->boolean('mine'))
      const firstRes = await fetch("/api/properties?mine=true&page=1", {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      const firstJson = await firstRes.json().catch(() => null);

      if (!firstRes.ok) {
        throw new Error(firstJson?.message || "Failed to load properties.");
      }

      let firstItems = extractItems(firstJson);
      const lastPage = Number(firstJson?.data?.pagination?.last_page || 1);

      const promises = [];
      for (let p = 2; p <= lastPage; p++) {
        promises.push(
          fetch(`/api/properties?mine=true&page=${p}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((j) => extractItems(j))
        );
      }

      const restItems = (await Promise.all(promises)).flat();
      let merged = [...firstItems, ...restItems];

      // Fallback filter (ako backend iz nekog razloga ne filtrira, ili ako nisi agent ulogovan).
      if (myUserId != null) {
        merged = merged.filter((p) => Number(p?.sales_agent_id) === Number(myUserId));
      }

      setAllProperties(merged);
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

      <div className="sapWrap">
        <div className="sapHeader">
          <div>
            <h1 className="sapTitle">Manage My Properties</h1>
            <p className="sapSubtitle">Your properties are listed below. You can create a new one anytime.</p>
          </div>

          <div className="sapHeaderActions">
            <Button variant="outline" onClick={loadMyProperties}>
              Refresh
            </Button>
            <Button onClick={openCreate}>Create Property</Button>
          </div>
        </div>

        <div className="sapControls">
          <div className="ctrl" style={{ marginRight: "55px" }}>
            <label className="ctrlLabel">Search</label>
            <input
              className="ctrlInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Status</label>
            <select className="ctrlSelect" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="ctrl">
            <label className="ctrlLabel">Sort</label>
            <select className="ctrlSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {pageError ? <div className="sapError">{pageError}</div> : null}

        {loading ? (
          <div className="sapLoading">Loading properties...</div>
        ) : filtered.length === 0 ? (
          <div className="sapEmpty">
            <div className="sapEmptyTitle">Još uvek nema nekretnina.</div>
            <div className="sapEmptySub">Klikni “Create Property” da dodaš prvu nekretninu.</div>
          </div>
        ) : (
          <>
            <div className="grid">
              {pageItems.map((p) => (
                <AgentPropertyCard key={p.id} property={p} />
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

      <Modal open={createOpen} title="Create Property" onClose={closeCreate}>
        <div className="form">
          <div className="formGrid">
            <div className="ctrl">
              <label className="ctrlLabel">Title *</label>
              <input className="ctrlInput" value={form.title} onChange={onChange("title")} placeholder="e.g. Apartment in Niš" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Type *</label>
              <input className="ctrlInput" value={form.type} onChange={onChange("type")} placeholder="e.g. apartment / house" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">City *</label>
              <input className="ctrlInput" value={form.city} onChange={onChange("city")} placeholder="e.g. Belgrade" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Address *</label>
              <input className="ctrlInput" value={form.address} onChange={onChange("address")} placeholder="e.g. Main St 12" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Area (m²)</label>
              <input className="ctrlInput" value={form.area_m2} onChange={onChange("area_m2")} placeholder="e.g. 68" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Price *</label>
              <input className="ctrlInput" value={form.price} onChange={onChange("price")} placeholder="e.g. 120000" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Bedrooms *</label>
              <input className="ctrlInput" value={form.bedrooms} onChange={onChange("bedrooms")} placeholder="e.g. 2" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Bathrooms *</label>
              <input className="ctrlInput" value={form.bathrooms} onChange={onChange("bathrooms")} placeholder="e.g. 1" />
            </div>

            <div className="ctrl">
              <label className="ctrlLabel">Status</label>
              <select className="ctrlSelect" value={form.status} onChange={onChange("status")}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div className="ctrl ctrlWide">
              <label className="ctrlLabel">3D image URL</label>
              <input className="ctrlInput" value={form.d3} onChange={onChange("d3")} placeholder="https://..." />
            </div>

            <div className="ctrl ctrlWide">
              <label className="ctrlLabel">Description</label>
              <textarea
                className="ctrlTextarea"
                value={form.description}
                onChange={onChange("description")}
                placeholder="Short description..."
              />
            </div>
          </div>

          {formError ? <div className="formError">{formError}</div> : null}

          <div className="formActions">
            <Button variant="outline" onClick={closeCreate}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast.open ? <div className="toast">{toast.message}</div> : null}
    </>
  );
}

function AgentPropertyCard({ property }) {
  const { imageUrl } = useRandomImage(property?.type);
  const sellerName = property?.sales_agent?.name || "Sales Agent";
  return <Card property={property} imageUrl={imageUrl} sellerName={sellerName} hideActions />;
}

const css = `
  .sapWrap{
    border-radius: 22px;
    padding: 16px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
  }

  .sapHeader{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .sapTitle{
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .sapSubtitle{
    margin: 6px 0 0 0;
    opacity: 0.78;
    font-size: 13px;
  }

  .sapHeaderActions{
    display:flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content:flex-end;
  }

  .sapControls{
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

  .ctrlTextarea{
    width: 100%;
    min-height: 90px;
    border-radius: 14px;
    padding: 10px 12px;
    color: rgba(255,255,255,0.92);
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.18);
    outline: none;
    resize: vertical;
  }

  .ctrlInput:focus, .ctrlSelect:focus, .ctrlTextarea:focus{
    border: 1px solid rgba(232,91,90,0.45);
    box-shadow: 0 0 0 3px rgba(232,91,90,0.12);
  }

  .sapError{
    margin: 10px 0 0 0;
    padding: 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .sapLoading{
    padding: 18px 12px;
    opacity: 0.85;
    font-weight: 800;
  }

  .sapEmpty{
    padding: 18px 14px;
    border-radius: 18px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .sapEmptyTitle{
    font-weight: 1000;
    font-size: 16px;
    letter-spacing: 0.2px;
  }

  .sapEmptySub{
    margin-top: 6px;
    opacity: 0.78;
    font-size: 13px;
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

  .form{ display:grid; gap: 12px; }
  .formGrid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .ctrlWide{ grid-column: 1 / -1; }

  .formError{
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .formActions{
    display:flex;
    gap: 10px;
    justify-content:flex-end;
    margin-top: 6px;
  }

  @media (max-width: 980px){
    .sapControls{ grid-template-columns: 1fr; }
    .grid{ grid-template-columns: 1fr; }
    .formGrid{ grid-template-columns: 1fr; }
  }
`;
