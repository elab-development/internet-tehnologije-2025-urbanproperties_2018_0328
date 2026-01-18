// src/components/Slider.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";

/*
  Urban Properties Slider (reusable).
  - Dizajn prati logo (tamno-plava + koralno/crvena + belo).
  - Strelice koriste Button.jsx da bude konzistentno kroz aplikaciju.
  - Kod je na engleskom, komentari su na srpskom.
*/

const BRAND = {
  navy900: "#0B1020",
  navy700: "#1A2545",
  coral500: "#E85B5A",
  whiteSoft: "rgba(255,255,255,0.85)",
  whiteMuted: "rgba(255,255,255,0.60)",
};

export default function Slider({
  images,
  autoPlay = true,
  intervalMs = 4500,
  showDots = true,
  showArrows = true,
  height = 460,
  rounded = 24,
  className = "",
}) {
  // Default slike iz /public/images.
  const defaultImages = useMemo(
    () => Array.from({ length: 10 }, (_, i) => `/images/slide${i + 1}.jpg`),
    []
  );

  const slides = images?.length ? images : defaultImages;

  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const intervalRef = useRef(null);

  const normalizeIndex = (value) => {
    const n = slides.length || 1;
    return (value + n) % n;
  };

  const goTo = (i) => setIndex(normalizeIndex(i));
  const next = () => setIndex((prev) => normalizeIndex(prev + 1));
  const prev = () => setIndex((prev) => normalizeIndex(prev - 1));

  // Preload slika radi glatkijeg prikaza.
  useEffect(() => {
    slides.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [slides]);

  // Keyboard navigation (levo/desno).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // Auto-play se pauzira na hover.
  useEffect(() => {
    if (!autoPlay || slides.length <= 1 || isHover) return;

    intervalRef.current = setInterval(() => {
      setIndex((prev) => normalizeIndex(prev + 1));
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, intervalMs, slides.length, isHover]);

  if (!slides.length) return null;

  const containerHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: containerHeight,
        borderRadius: rounded,
        overflow: "hidden",
        background: `radial-gradient(120% 100% at 50% 0%, ${BRAND.navy700} 0%, ${BRAND.navy900} 70%)`,
        boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      aria-roledescription="carousel"
    >
      {/* Track */}
      <div
        style={{
          display: "flex",
          width: `${slides.length * 100}%`,
          height: "100%",
          transform: `translateX(-${index * (100 / slides.length)}%)`,
          transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {slides.map((src, i) => (
          <div
            key={`${src}-${i}`}
            style={{
              width: `${100 / slides.length}%`,
              flex: `0 0 ${100 / slides.length}%`,
              height: "100%",
              position: "relative",
            }}
          >
            <img
              src={src}
              alt={`Slide ${i + 1}`}
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                userSelect: "none",
                filter: "contrast(1.02) saturate(1.05)",
              }}
            />

            {/* Overlay: tamna gradijent maska + crveni “glow” */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(180deg, rgba(11,16,32,0.10) 0%, rgba(11,16,32,0.62) 100%),
                  radial-gradient(40% 35% at 70% 20%, rgba(232,91,90,0.18) 0%, rgba(232,91,90,0) 65%)
                `,
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, ${BRAND.coral500} 0%, rgba(232,91,90,0) 100%)`,
          opacity: 0.95,
          pointerEvents: "none",
        }}
      />

      {/* Arrows (Button reusable) */}
      {showArrows && slides.length > 1 && (
        <>
          <div style={arrowWrapStyle("left")}>
            <Button
              variant="secondary"
              size="lg"
              ariaLabel="Previous slide"
              onClick={prev}
              style={arrowBtnInlineStyle}
            >
              ‹
            </Button>
          </div>

          <div style={arrowWrapStyle("right")}>
            <Button
              variant="secondary"
              size="lg"
              ariaLabel="Next slide"
              onClick={next}
              style={arrowBtnInlineStyle}
            >
              ›
            </Button>
          </div>
        </>
      )}

      {/* Dots */}
      {showDots && slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 14,
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 999,
            background: "rgba(11,16,32,0.55)",
            border: `1px solid rgba(232,91,90,0.25)`,
            boxShadow: "0 10px 26px rgba(0,0,0,0.30)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Slide indicators"
        >
          {slides.map((_, i) => {
            const active = i === index;

            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: active ? 20 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  background: active ? BRAND.coral500 : BRAND.whiteMuted,
                  boxShadow: active
                    ? "0 0 0 3px rgba(232,91,90,0.20)"
                    : "none",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Badge */}
      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 14,
          padding: "8px 10px",
          borderRadius: 12,
          background: "rgba(11,16,32,0.45)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: BRAND.whiteSoft,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          userSelect: "none",
        }}
      >
        Urban Properties
      </div>
    </div>
  );
}

function arrowWrapStyle(side) {
  const isLeft = side === "left";
  return {
    position: "absolute",
    top: "50%",
    [isLeft ? "left" : "right"]: 14,
    transform: "translateY(-50%)",
  };
}

// Dodatni inline stilovi za Button, da bude kao “circle icon button”.
const arrowBtnInlineStyle = {
  width: 48,
  height: 48,
  padding: 0,
  fontSize: 28,
  fontWeight: 700,
  lineHeight: "48px",
};
