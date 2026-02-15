import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/Button";
import Modal from "../components/Modal";
import useRandomImage from "../hooks/useRandomImage";
import useRandom3DImage from "../hooks/useRandom3DImage";

/*
  Property Details page.
  - Komentari su na srpskom.
  - Kod i natpisi su na engleskom.
  - Učitavanje property-ja po ID iz backend-a.
  - Prikaz Sales Agent (UserResource) detalja iz property.sales_agent.
  - Make an Offer otvara reusable Modal.
  - Book a Viewing Appointment vodi na buyer viewing appointments page (prefill property_id).
*/

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [toast, setToast] = useState({ open: false, message: "" });

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerError, setOfferError] = useState("");

  // Slika za property karticu (Pexels) na osnovu type + "modern".
  const { imageUrl } = useRandomImage(property?.type);

  // 3D model (stabilan po property.id).
  const { title: modelTitle, embedUrl } = useRandom3DImage(property?.id ?? id);

  // Sales agent je UserResource i dolazi kao property.sales_agent.
  const agent = property?.sales_agent || null;

  useEffect(() => {
    loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openOffer = () => {
    setOfferAmount("");
    setOfferError("");
    setOfferModalOpen(true);
  };

  const closeOffer = () => {
    setOfferModalOpen(false);
    setOfferAmount("");
    setOfferError("");
  };

  const showToast = (message) => {
    setToast({ open: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2600);
  };

  const submitOffer = async () => {
    if (!property?.id) return;

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
          property_id: property.id,
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

  async function loadProperty() {
    setLoading(true);
    setPageError("");

    const token = sessionStorage.getItem("auth_token");

    try {
      const res = await fetch(`/api/properties/${id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load property details.");
      }

      // Backend show() vraća data.property, ali ostavljamo fallback da bude robustno.
      const prop = json?.data?.property || json?.data || json?.property || null;

      if (!prop) throw new Error("Property not found.");

      setProperty(prop);
    } catch (e) {
      setProperty(null);
      setPageError(e?.message || "Failed to load property details.");
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = useMemo(() => formatStatus(property?.status), [property?.status]);
  const typeLabel = useMemo(() => formatType(property?.type), [property?.type]);
  const priceLabel = useMemo(() => formatPrice(property?.price), [property?.price]);
  const areaLabel = useMemo(() => formatArea(property?.area_m2), [property?.area_m2]);

  const title = property?.title || "Untitled";
  const city = property?.city || "Unknown city";
  const address = property?.address || "Unknown address";
  const description = property?.description || "No description provided.";
  const bedrooms = property?.bedrooms ?? "—";
  const bathrooms = property?.bathrooms ?? "—";

  const agentName = agent?.name || "Unknown Sales Agent";
  const agentEmail = agent?.email || "—";
  const agentPhone = agent?.phone || "—";

  return (
    <>
      <style>{css}</style>

      <div className="pdWrap">
        <div className="pdTopBar">
          <div className="pdTopLeftActions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>

            <Button
              variant="secondary"
              className="pdViewingsBtn"
              onClick={() => navigate("/buyer/manage-my-viewing-appointments")}
            >
              My Viewing Appointments
            </Button>
          </div>

          <div className="pdTopMeta">
            <span className="pdPill">{statusLabel}</span>
            <span className="pdPill pdPillGhost">{typeLabel}</span>
          </div>
        </div>

        {pageError ? <div className="pdError">{pageError}</div> : null}

        {loading ? (
          <div className="pdLoading">Loading property details...</div>
        ) : property ? (
          <>
            <div className="pdGrid">
              {/* Leva strana: property. */}
              <section className="pdLeft">
                <div className="pdImageBox">
                  <img
                    className="pdImage"
                    src={imageUrl || "/images/slider1.png"}
                    alt={title}
                    loading="lazy"
                  />
                  <div className="pdImageShade" />
                  <div className="pdStatusBadge">{statusLabel}</div>
                </div>

                <div className="pdInfoRow">
                  <div className="pdMain">
                    <h1 className="pdTitle" title={title}>
                      {title}
                    </h1>
                    <p className="pdLocation" title={`${city}, ${address}`}>
                      {city}, {address}
                    </p>
                  </div>

                  <div className="pdRightMeta">
                    <div className="pdMetaItem">
                      <div className="pdMetaLabel">Type</div>
                      <div className="pdMetaValue">{typeLabel}</div>
                    </div>
                    <div className="pdMetaItem">
                      <div className="pdMetaLabel">Area</div>
                      <div className="pdMetaValue">{areaLabel}</div>
                    </div>
                  </div>
                </div>

                <div className="pdDesc">
                  <div className="pdSectionTitle">Description</div>
                  <div className="pdDescBox">{description}</div>
                </div>

                <div className="pdStats">
                  <div className="pdStat">
                    <div className="pdStatLabel">Bedrooms</div>
                    <div className="pdStatValue">{bedrooms}</div>
                  </div>

                  <div className="pdStat">
                    <div className="pdStatLabel">Bathrooms</div>
                    <div className="pdStatValue">{bathrooms}</div>
                  </div>

                  <div className="pdStat pdStatPrice">
                    <div className="pdStatLabel">Price</div>
                    <div className="pdStatValue">{priceLabel}</div>
                  </div>
                </div>
              </section>

              {/* Desna strana: Sales agent. */}
              <aside className="pdAgent">
                <div className="pdAgentHeader">
                  <div className="pdAvatar">{getInitials(agentName)}</div>
                  <div className="pdAgentInfo">
                    <div className="pdAgentName">{agentName}</div>
                    <div className="pdAgentRole">Sales Agent</div>
                  </div>
                </div>

                <div className="pdAgentRows">
                  <AgentRow label="Email" value={agentEmail} />
                  <AgentRow label="Phone" value={agentPhone} />
                </div>
              </aside>
            </div>

            {/* 3D embed. */}
            <section className="pd3d">
              <div className="pd3dHeader">
                <div className="pd3dTitle">Property 3D Model</div>
                <div className="pd3dTag">{modelTitle}</div>
              </div>

              <div className="pd3dFrameWrap">
                <iframe
                  className="pd3dFrame"
                  title={modelTitle}
                  src={embedUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
              </div>
            </section>

            {/* Akcije. */}
            <div className="pdActions">
              <Button onClick={openOffer}>Make an Offer</Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/buyer/manage-my-viewing-appointments?property_id=${property?.id ?? id}`)
                }
              >
                Book a Viewing Appointment
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {/* Modal za offer. */}
      <Modal
        open={offerModalOpen}
        title={property ? `Make an Offer — ${property.title}` : "Make an Offer"}
        onClose={closeOffer}
      >
        <div className="pdOfferForm">
          <div className="pdField">
            <label className="pdLabel">Amount</label>
            <input
              className="pdInput"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="e.g. 120000"
            />
          </div>

          {offerError ? <div className="pdOfferError">{offerError}</div> : null}

          <div className="pdOfferActions">
            <Button variant="secondary" onClick={closeOffer}>
              Cancel
            </Button>
            <Button onClick={submitOffer} disabled={offerSaving}>
              {offerSaving ? "Saving..." : "Submit Offer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast. */}
      {toast.open ? <div className="pdToast">{toast.message}</div> : null}
    </>
  );
}

function AgentRow({ label, value }) {
  return (
    <div className="pdRow">
      <div className="pdRowLabel">{label}</div>
      <div className="pdRowValue" title={String(value || "")}>
        {value}
      </div>
    </div>
  );
}

function CountBox({ label, value }) {
  return (
    <div className="pdCountBox">
      <div className="pdCountValue">{value}</div>
      <div className="pdCountLabel">{label}</div>
    </div>
  );
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function formatStatus(status) {
  if (!status) return "Unknown";
  const s = String(status).toLowerCase();
  if (s === "available") return "Available";
  if (s === "reserved") return "Reserved";
  if (s === "sold") return "Sold";
  return status;
}

function formatType(type) {
  if (!type) return "Type";
  return String(type)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatArea(area) {
  const n = Number(area);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${Math.round(n)} m²`;
}

function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return "Price";
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

const css = `
  .pdWrap{
    border-radius: 22px;
    padding: 16px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);
  }

  .pdTopBar{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .pdTopLeftActions{
    display:flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items:center;
  }

  .pdTopMeta{ display:flex; gap: 8px; flex-wrap: wrap; justify-content:flex-end; }

  .pdPill{
    display:inline-flex;
    align-items:center;
    height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.92);
    background: rgba(232,91,90,0.14);
    border: 1px solid rgba(232,91,90,0.26);
  }

  .pdPillGhost{
    background: rgba(156,175,183,0.10);
    border: 1px solid rgba(156,175,183,0.18);
  }

  .pdError{
    margin-top: 10px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .pdLoading{
    padding: 18px 12px;
    opacity: 0.85;
    font-weight: 800;
  }

  .pdGrid{
    display:grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 14px;
  }

  .pdLeft, .pdAgent{
    border-radius: 22px;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.14);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    overflow:hidden;
  }

  .pdImageBox{
    position: relative;
    height: 240px;
    background: rgba(0,0,0,0.2);
  }

  .pdImage{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display:block;
    transform: scale(1.02);
    filter: saturate(1.05) contrast(1.03);
  }

  .pdImageShade{
    position:absolute;
    inset:0;
    background: radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.40) 70%);
    pointer-events:none;
  }

  .pdStatusBadge{
    position:absolute;
    left: 14px;
    bottom: 14px;
    padding: 8px 12px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.92);
    background: rgba(11,16,32,0.75);
    border: 1px solid rgba(232,91,90,0.28);
    backdrop-filter: blur(10px);
  }

  .pdInfoRow{
    display:grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 14px;
    border-top: 1px solid rgba(156,175,183,0.14);
  }

  .pdTitle{
    margin: 0;
    font-size: 26px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.96);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pdLocation{
    margin: 6px 0 0 0;
    font-size: 13px;
    opacity: 0.82;
    color: rgba(255,255,255,0.86);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pdRightMeta{
    display:grid;
    gap: 10px;
    text-align:right;
    align-content:start;
  }

  .pdMetaLabel{
    font-size: 12px;
    opacity: 0.75;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .pdMetaValue{
    margin-top: 4px;
    font-size: 14px;
    font-weight: 900;
  }

  .pdDesc{
    padding: 0 14px 14px 14px;
  }

  .pdSectionTitle{
    font-size: 13px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    opacity: 0.9;
    margin-bottom: 8px;
  }

  .pdDescBox{
    border-radius: 16px;
    padding: 12px;
    background: rgba(156,175,183,0.08);
    border: 1px solid rgba(156,175,183,0.14);
    color: rgba(255,255,255,0.88);
    font-size: 13px;
    line-height: 1.55;
    min-height: 72px;
  }

  .pdStats{
    display:grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    padding: 0 14px 14px 14px;
  }

  .pdStat{
    border-radius: 16px;
    padding: 12px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .pdStatPrice{
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.20);
  }

  .pdStatLabel{
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.2px;
    opacity: 0.8;
  }

  .pdStatValue{
    margin-top: 6px;
    font-size: 16px;
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .pdAgent{
    padding: 14px;
  }

  .pdAgentHeader{
    display:flex;
    align-items:center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(156,175,183,0.14);
    margin-bottom: 12px;
  }

  .pdAvatar{
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight: 1000;
    letter-spacing: 0.4px;
    color: rgba(255,255,255,0.95);
    background: rgba(232,91,90,0.16);
    border: 1px solid rgba(232,91,90,0.26);
  }

  .pdAgentName{
    font-size: 16px;
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .pdAgentRole{
    margin-top: 3px;
    font-size: 12px;
    opacity: 0.78;
    font-weight: 900;
  }

  .pdRow{
    display:flex;
    justify-content:space-between;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(156,175,183,0.14);
  }

  .pdRowLabel{
    font-size: 12px;
    opacity: 0.8;
    font-weight: 900;
  }

  .pdRowValue{
    max-width: 62%;
    text-align:right;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255,255,255,0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pdAgentDivider{
    height: 1px;
    background: rgba(156,175,183,0.14);
    margin: 12px 0;
  }

  .pdAgentCountsTitle{
    font-size: 13px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    opacity: 0.9;
    margin-bottom: 10px;
  }

  .pdAgentCounts{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .pdCountBox{
    border-radius: 16px;
    padding: 12px;
    background: rgba(156,175,183,0.06);
    border: 1px solid rgba(156,175,183,0.14);
  }

  .pdCountValue{
    font-size: 18px;
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .pdCountLabel{
    margin-top: 6px;
    font-size: 11px;
    opacity: 0.8;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .pd3d{
    margin-top: 14px;
    border-radius: 22px;
    overflow:hidden;
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.14);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .pd3dHeader{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(156,175,183,0.14);
  }

  .pd3dTitle{
    font-weight: 1000;
    letter-spacing: 0.2px;
  }

  .pd3dTag{
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    background: rgba(156,175,183,0.10);
    border: 1px solid rgba(156,175,183,0.18);
  }

  .pd3dFrameWrap{
    height: 360px;
    background: rgba(0,0,0,0.25);
  }

  .pd3dFrame{
    width: 100%;
    height: 100%;
    display:block;
  }

  .pdActions{
    margin-top: 14px;
    display:flex;
    gap: 12px;
    justify-content:center;
    flex-wrap: wrap;
  }

  .pdToast{
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

  .pdOfferForm{ display:grid; gap: 12px; }

  .pdField{ display:grid; gap: 8px; }

  .pdLabel{
    font-size: 12px;
    opacity: 0.85;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .pdInput{
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    height: 46px;
    border-radius: 16px;
    padding: 0 12px;
    color: rgba(255,255,255,0.92);
    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(156,175,183,0.18);
    outline: none;
  }

  .pdInput:focus{
    border: 1px solid rgba(232,91,90,0.45);
    box-shadow: 0 0 0 3px rgba(232,91,90,0.12);
  }

  .pdOfferError{
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(232,91,90,0.10);
    border: 1px solid rgba(232,91,90,0.22);
    font-weight: 800;
  }

  .pdOfferActions{
    display:flex;
    gap: 10px;
    justify-content:flex-end;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  @media (max-width: 980px){
    .pdGrid{ grid-template-columns: 1fr; }
    .pdRightMeta{ text-align:left; grid-auto-flow: column; justify-content:space-between; }
    .pdStats{ grid-template-columns: 1fr; }
    .pdAgentCounts{ grid-template-columns: 1fr; }
    .pd3dFrameWrap{ height: 280px; }
  }
`;
