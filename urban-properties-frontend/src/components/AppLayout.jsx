// src/components/AppLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import NavigationMenu from "./NavigationMenu";

/*
  AppLayout (reusable layout za sve rute osim /login i /register).
  - Komentari na srpskom.
  - Kod i natpisi na engleskom.
  - Renderuje NavigationMenu na vrhu i sadržaj stranice ispod (Outlet).
  - Uključuje moderan background + centriran container + spacing.
*/
export default function AppLayout() {
  const location = useLocation();

  // Dodatna zaštita (ako neko slučajno ubaci /login ili /register u layout).
  const hideNav =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  return (
    <>
      <style>{css}</style>

      <div className="appShell">
        {/* Gornji deo: NavigationMenu */}
        {!hideNav ? (
          <div className="navWrap">
            <NavigationMenu />
          </div>
        ) : null}

        {/* Sadržaj: sve stranice ispod menija */}
        <main className="contentWrap">
          <div className="contentInner">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}

const css = `
  /* Osnovna pozadina aplikacije */
  .appShell{
    min-height: 100vh;
    color: rgba(255,255,255,0.92);
    background:
      radial-gradient(120% 120% at 20% 0%, rgba(66,129,164,0.22) 0%, rgba(11,16,32,0) 55%),
      radial-gradient(120% 120% at 80% 0%, rgba(254,147,140,0.20) 0%, rgba(11,16,32,0) 55%),
      radial-gradient(120% 120% at 50% 110%, rgba(230,184,156,0.12) 0%, rgba(11,16,32,0) 60%),
      linear-gradient(180deg, #0B1020 0%, #070A14 100%);
    padding: 18px;
  }

  /* Wrapper za meni (sticky feel + blur) */
  .navWrap{
    position: sticky;
    top: 12px;
    z-index: 50;
    max-width: 1200px;
    margin: 0 auto 16px auto;
  }

  /* Glavni sadržaj */
  .contentWrap{
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Unutrašnji container sa finim razmakom */
  .contentInner{
    padding: 6px 0 20px 0;
  }

  /* Selektovan tekst lepši kontrast */
  ::selection{
    background: rgba(254,147,140,0.25);
  }

  /* Scrollbar (opciono, ali izgleda modernije u dark UI) */
  *::-webkit-scrollbar{
    width: 10px;
    height: 10px;
  }
  *::-webkit-scrollbar-track{
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
  }
  *::-webkit-scrollbar-thumb{
    background: rgba(254,147,140,0.28);
    border-radius: 999px;
    border: 2px solid rgba(11,16,32,0.55);
  }
  *::-webkit-scrollbar-thumb:hover{
    background: rgba(254,147,140,0.38);
  }

  /* Responsive padding */
  @media (max-width: 700px){
    .appShell{ padding: 12px; }
    .navWrap{ top: 8px; }
  }
`;
