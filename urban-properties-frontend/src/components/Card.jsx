// src/components/Card.jsx
import Button from "./Button";
import useRandomImage from "../hooks/useRandomImage";

/*
  Reusable Property Card.
  - Komentari su na srpskom.
  - Kod i natpisi su na engleskom.
  - Slika dolazi iz useRandomImage.js na osnovu property.type (+ "modern").
  - Seller je sales_agent (User) iz property.sales_agent.name.
*/

const FALLBACK_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#0B1020"/>
        <stop offset="1" stop-color="#1A2545"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="rgba(255,255,255,0.85)" font-family="Arial" font-size="44" font-weight="700">
      Property Image
    </text>
  </svg>
`);

export default function Card({
  property,
  sellerName, // optional override
  onMakeOffer,
  onBookViewing,
  onViewDetails,
  hideActions = false,
}) {
  const title = property?.title || "Untitled";
  const city = property?.city || "Unknown city";
  const address = property?.address || "Unknown address";

  const statusLabel = formatStatus(property?.status);
  const typeLabel = formatType(property?.type);
  const priceLabel = formatPrice(property?.price);

  // Slika ide iz Pexels hook-a, fallback je inline SVG da nema 404.
  const { imageUrl } = useRandomImage(property?.type, {
    fallbackUrl: FALLBACK_DATA_URL,
    size: "large",
  });

  // Sales Agent je User i backend ga vraća u polju "sales_agent".
  const sellerLabel =
    sellerName ||
    property?.sales_agent?.name ||
    property?.salesAgent?.name ||
    "Unknown seller";

  return (
    <>
      <style>{css}</style>

      <article className="upCard">
        {/* Gornji deo: slika. */}
        <div className="upCardMedia">
          <img
            className="upCardImg"
            src={imageUrl || FALLBACK_DATA_URL}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_DATA_URL;
            }}
          />
          <div className="upCardMediaShade" />
        </div>

        {/* Status + Seller. */}
        <div className="upCardChips">
          <span className="upChip upChipStatus">{statusLabel}</span>
          <span className="upChip upChipSeller" title={sellerLabel}>
            {sellerLabel}
          </span>
        </div>

        {/* Title/Address + Price/Type. */}
        <div className="upCardBody">
          <div className="upCardMain">
            <h3 className="upCardTitle" title={title}>
              {title}
            </h3>
            <p className="upCardLocation" title={`${city}, ${address}`}>
              {city}, {address}
            </p>
          </div>

          <div className="upCardSide">
            <div className="upCardPrice" title={priceLabel}>
              {priceLabel}
            </div>
            <div className="upCardType" title={typeLabel}>
              {typeLabel}
            </div>
          </div>
        </div>

        {/* Akcije. */}
        {!hideActions ? (
          <div className="upCardActions">
            <Button
              variant="outline"
              className="upActionBtn"
              onClick={() => onMakeOffer?.(property)}
            >
              Make an offer
            </Button>

            <Button className="upActionBtn" onClick={() => onBookViewing?.(property)}>
              Book a Viewing Appointment
            </Button>

            <Button
              variant="outline"
              className="upActionBtn"
              onClick={() => onViewDetails?.(property)}
            >
              View Details
            </Button>
          </div>
        ) : null}
      </article>
    </>
  );
}

/* Formatiranje statusa za prikaz. */
function formatStatus(status) {
  if (!status) return "Unknown";
  const s = String(status).toLowerCase();
  if (s === "available") return "Available";
  if (s === "reserved") return "Reserved";
  if (s === "sold") return "Sold";
  return status;
}

/* Formatiranje tipa za prikaz. */
function formatType(type) {
  if (!type) return "Type";
  return String(type)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Formatiranje cene. */
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
  .upCard {
    width: 100%;
    border-radius: 22px;
    overflow: hidden;
    background: rgba(11, 16, 32, 0.60);
    border: 1px solid rgba(232, 91, 90, 0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
    backdrop-filter: blur(14px);
    transition: transform 160ms ease, border 160ms ease, box-shadow 160ms ease;
  }

  .upCard:hover {
    transform: translateY(-2px);
    border: 1px solid rgba(232, 91, 90, 0.35);
    box-shadow: 0 22px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .upCardMedia {
    position: relative;
    height: 210px;
    background: rgba(0,0,0,0.2);
  }

  .upCardImg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.02);
    transition: transform 220ms ease, filter 220ms ease;
    filter: saturate(1.05) contrast(1.03);
  }

  .upCard:hover .upCardImg {
    transform: scale(1.05);
    filter: saturate(1.12) contrast(1.06);
  }

  .upCardMediaShade {
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.35) 70%);
    pointer-events: none;
  }

  .upCardChips {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(156, 175, 183, 0.14);
  }

  .upChip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 48%;
    padding: 8px 12px;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: rgba(156,175,183,0.10);
    border: 1px solid rgba(156,175,183,0.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .upChipStatus {
    background: rgba(232, 91, 90, 0.14);
    border: 1px solid rgba(232, 91, 90, 0.26);
  }

  .upCardBody {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 14px;
    align-items: start;
  }

  .upCardMain { min-width: 0; }

  .upCardTitle {
    margin: 0;
    font-size: 22px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.96);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .upCardLocation {
    margin: 6px 0 0 0;
    font-size: 13px;
    opacity: 0.82;
    color: rgba(255,255,255,0.86);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .upCardSide {
    text-align: right;
    display: grid;
    gap: 6px;
    padding-left: 8px;
  }

  .upCardPrice {
    font-size: 22px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.96);
    white-space: nowrap;
  }

  .upCardType {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.2px;
    opacity: 0.78;
    color: rgba(255,255,255,0.86);
    white-space: nowrap;
  }

  .upCardActions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    padding: 14px;
    border-top: 1px solid rgba(156, 175, 183, 0.14);
  }

  .upActionBtn { width: 100%; }

  @media (max-width: 900px) {
    .upCardMedia { height: 190px; }
    .upCardActions { grid-template-columns: 1fr; }
    .upCardBody { grid-template-columns: 1fr; }
    .upCardSide {
      text-align: left;
      padding-left: 0;
      grid-auto-flow: column;
      justify-content: space-between;
      align-items: baseline;
    }
  }
`;
