// Logo bar â "Trusted by creators and organisations across East Africa"
// Plausible Ugandan-flavoured creator + org names rendered as typeset wordmarks.
// We have no real customer logos yet â purposeful typographic treatment instead of fake imagery.

const LOGOS = [
  { name: "Kampala Eats", style: "wt-serif" },
  { name: "BORN HERE", style: "wt-mono" },
  { name: "rolex daily", style: "wt-italic" },
  { name: "Mama Asha", style: "wt-script" },
  { name: "Naks FM", style: "wt-bold" },
  { name: "OliMu", style: "wt-tight" },
];

function LogoBar() {
  return (
    <section className="mkt-logobar">
      <div className="mkt-container">
        <p className="mkt-logobar-lead">Trusted by creators and organisations across East Africa</p>
        <ul className="mkt-logobar-list">
          {LOGOS.map(l => (
            <li key={l.name} className={"mkt-wordmark " + l.style}>{l.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

Object.assign(window, { LogoBar });
