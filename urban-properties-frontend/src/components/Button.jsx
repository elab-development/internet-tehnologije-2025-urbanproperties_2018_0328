/*
  Reusable Button (Urban Properties).
  - Komponenta je generička i može se koristiti svuda (forme, toolbar, slider strelice, itd.).
  - Dizajn prati boje loga (tamno-plava + koralno/crvena + belo).
  - Kod je na engleskom, komentari su na srpskom.
*/

const BRAND = {
  navy900: "#0B1020",
  navy700: "#1A2545",
  coral500: "#E85B5A",
  coral600: "#D94E52",
  white: "#FFFFFF",
};

const VARIANTS = {
  primary: {
    background: `linear-gradient(135deg, ${BRAND.coral600} 0%, ${BRAND.coral500} 100%)`,
    color: BRAND.white,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  secondary: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(11,16,32,0.55) 100%)`,
    color: BRAND.white,
    border: "1px solid rgba(232,91,90,0.28)",
  },
  ghost: {
    background: "transparent",
    color: BRAND.white,
    border: "1px solid rgba(255,255,255,0.18)",
  },
};

const SIZES = {
  sm: { height: 34, px: 12, fontSize: 13 },
  md: { height: 40, px: 14, fontSize: 14 },
  lg: { height: 46, px: 16, fontSize: 15 },
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary | secondary | ghost
  size = "md", // sm | md | lg
  fullWidth = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ariaLabel,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      style={{
        height: s.height,
        padding: `0 ${s.px}px`,
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        userSelect: "none",
        outline: "none",
        border: v.border,
        background: v.background,
        color: v.color,
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: 0.2,
        boxShadow: disabled
          ? "none"
          : "0 10px 26px rgba(0,0,0,0.30)",
        transition: "transform 120ms ease, box-shadow 200ms ease, opacity 200ms ease",
        ...style,
      }}
      onMouseDown={(e) => {
        // Mala animacija “press” efekta.
        if (!disabled) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {leftIcon ? <span style={{ display: "inline-flex" }}>{leftIcon}</span> : null}
      <span style={{ lineHeight: 1 }}>{children}</span>
      {rightIcon ? <span style={{ display: "inline-flex" }}>{rightIcon}</span> : null}
    </button>
  );
}
