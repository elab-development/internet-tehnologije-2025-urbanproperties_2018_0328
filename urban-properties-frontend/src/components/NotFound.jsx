// src/components/NotFound.jsx

/*
  Reusable NotFound component.
  - Koristi sliku iz: public/images/notFound.png
  - Jednostavno, čitljivo, moderno.
*/

export default function NotFound({
  title = "Page Not Found",
  subtitle = "The page you are looking for doesn’t exist or has been moved.",
}) {
  return (
    <>
      <style>{css}</style>

      <div className="nfWrap">
        <div className="nfCard">
          <img
            className="nfImg"
            src="/images/404.png"
            alt="Not found"
            loading="lazy"
          />

          <h1 className="nfTitle">{title}</h1>
          <p className="nfSubtitle">{subtitle}</p>
        </div>
      </div>
    </>
  );
}

const css = `
  .nfWrap{
    min-height: calc(100vh - 120px);
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 24px;
  }

  .nfCard{
    width: min(720px, 100%);
    border-radius: 22px;
    padding: 18px;

    background: rgba(11,16,32,0.55);
    border: 1px solid rgba(232,91,90,0.22);
    box-shadow: 0 18px 55px rgba(0,0,0,0.35);
    backdrop-filter: blur(12px);

    text-align: center;
  }

  .nfImg{
    width: min(520px, 100%);
    height: auto;
    display: block;
    margin: 0 auto 14px auto;
    border-radius: 18px;
    border: 1px solid rgba(156,175,183,0.18);
    box-shadow: 0 16px 45px rgba(0,0,0,0.35);
  }

  .nfTitle{
    margin: 0;
    font-size: 28px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.96);
  }

  .nfSubtitle{
    margin: 10px 0 0 0;
    font-size: 14px;
    opacity: 0.80;
    color: rgba(255,255,255,0.86);
    line-height: 1.5;
  }
`;
