// src/components/Modal.jsx
import Button from "./Button";

/*
  Reusable modal.
  - Jednostavan overlay + kartica u centru.
  - Fix: sadržaj u modalu (npr. input) sada zauzima 100% širine.
*/
export default function Modal({ open, title = "Modal", children, onClose }) {
  if (!open) return null;

  return (
    <>
      <style>{css}</style>

      <div className="modalOverlay" onMouseDown={onClose} >
        <div className="modalCard" onMouseDown={(e) => e.stopPropagation()} style={{ marginTop: '60px', marginBottom: '60px' }}>
          <div className="modalHeader">
            <div className="modalTitle">{title}</div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="modalBody">{children}</div>
        </div>
      </div>
    </>
  );
}

const css = `
  .modalOverlay{
    position: fixed;
    inset: 0;
    z-index: 200;
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 18px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(10px);
  }

  .modalCard, .modalCard *{
    box-sizing: border-box;
  }

  .modalCard{
    width: min(720px, 100%);
    border-radius: 22px;
    background: rgba(11,16,32,0.92);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 22px 70px rgba(0,0,0,0.45);
    padding: 16px;
    marginTop: 140px;
    marginBottom: 140px;
  }

  .modalHeader{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 12px;
  }

  .modalTitle{
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.2px;
  }

  .modalBody{
    width: 100%;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;
