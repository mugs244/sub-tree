// Pricing â two layouts toggled via Tweaks
// PricingTable  (layout = "table"): one bordered card, four columns, vertical dividers
// PricingCards  (layout = "cards"): four standalone cards, Pro highlighted
// Source for tier facts: sub-tree/docs/v2/V2-OVERVIEW.md

const TIERS = [
  {
    id: "free",
    name: "Free",
    blurb: "All your links, one page.",
    price: 0,
    cta: "Get started",
    features: {
      "Donation fee": "5%",
      "Themes": "5 presets",
      "Fundraiser campaigns": false,
      "Sell products": false,
      "Affiliate (promoter)": false,
      "Affiliate (merchant)": false,
      "Members on one account": "1",
    },
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Customise everything. Run campaigns.",
    price: 15000,
    cta: "Start Pro trial",
    highlight: true,
    features: {
      "Donation fee": "3%",
      "Themes": "Custom colours + fonts",
      "Fundraiser campaigns": true,
      "Sell products": false,
      "Affiliate (promoter)": true,
      "Affiliate (merchant)": false,
      "Members on one account": "1",
    },
  },
  {
    id: "business",
    name: "Business",
    blurb: "Sell, not just collect.",
    price: 40000,
    cta: "Start Business trial",
    features: {
      "Donation fee": "3%",
      "Themes": "Custom colours + fonts",
      "Fundraiser campaigns": true,
      "Sell products": true,
      "Affiliate (promoter)": true,
      "Affiliate (merchant)": true,
      "Members on one account": "1",
    },
  },
  {
    id: "house",
    name: "Content House",
    blurb: "For groups, labels and small teams.",
    price: 80000,
    cta: "Talk to us",
    features: {
      "Donation fee": "3%",
      "Themes": "Custom, shared",
      "Fundraiser campaigns": true,
      "Sell products": true,
      "Affiliate (promoter)": true,
      "Affiliate (merchant)": true,
      "Members on one account": "Up to 10",
    },
  },
];

const FEATURE_ROWS = Object.keys(TIERS[0].features);

function fmtPrice(n) {
  return n === 0 ? "Free" : "UGX " + n.toLocaleString("en-UG");
}

function PriceBlock({ tier, large }) {
  return (
    <div className={"pr-price" + (large ? " pr-price-lg" : "")}>
      {tier.price === 0 ? (
        <span className="pr-price-free">Free</span>
      ) : (
        <>
          <span className="pr-price-amount mono">UGX {tier.price.toLocaleString("en-UG")}</span>
          <span className="pr-price-period">/month</span>
        </>
      )}
    </div>
  );
}

function FeatureBullet({ value }) {
  if (value === true)  return <Icon name="check" size={14} strokeWidth={2.5} />;
  if (value === false) return <span className="pr-dash" aria-label="not included">â</span>;
  return <span className="pr-feature-val">{value}</span>;
}

/* âââââââââ Layout: TABLE (default) âââââââââ */
function PricingTable() {
  return (
    <div className="pr-table">
      <div className="pr-table-row pr-table-head">
        <div className="pr-table-cell pr-table-feature" />
        {TIERS.map(t => (
          <div key={t.id} className={"pr-table-cell pr-tier-head" + (t.highlight ? " hl" : "")}>
            {t.highlight && <span className="pr-flag">Most popular</span>}
            <p className="pr-tier-name">{t.name}</p>
            <PriceBlock tier={t} />
            <p className="pr-tier-blurb">{t.blurb}</p>
            <a href="#signup" className={"btn " + (t.highlight ? "primary" : "outline") + " sm"}>
              {t.cta}
            </a>
          </div>
        ))}
      </div>
      {FEATURE_ROWS.map((row, i) => (
        <div key={row} className="pr-table-row">
          <div className="pr-table-cell pr-table-feature">{row}</div>
          {TIERS.map(t => (
            <div key={t.id} className={"pr-table-cell" + (t.highlight ? " hl" : "")}>
              <FeatureBullet value={t.features[row]} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* âââââââââ Layout: CARDS (alt) âââââââââ */
function PricingCards() {
  return (
    <div className="pr-cards">
      {TIERS.map(t => (
        <div key={t.id} className={"pr-card" + (t.highlight ? " hl" : "")}>
          {t.highlight && <span className="pr-flag">Most popular</span>}
          <p className="pr-tier-name">{t.name}</p>
          <PriceBlock tier={t} large />
          <p className="pr-tier-blurb">{t.blurb}</p>
          <a href="#signup" className={"btn full " + (t.highlight ? "primary" : "outline")}>
            {t.cta}
          </a>
          <ul className="pr-card-list">
            {FEATURE_ROWS.map(row => {
              const v = t.features[row];
              return (
                <li key={row} className={v === false ? "muted" : ""}>
                  {v === false
                    ? <Icon name="x" size={14} strokeWidth={2} className="pr-dash-icon" />
                    : <Icon name="check" size={14} strokeWidth={2.5} className="pr-check-icon" />}
                  <span>{row}{typeof v === "string" ? <span className="mono pr-row-val"> Â· {v}</span> : null}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* âââââââââ Section wrapper used on the landing page âââââââââ */
function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update); // older Safari
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, [breakpoint]);
  return isMobile;
}

function PricingSection({ layout = "table", anchor = "pricing" }) {
  // On narrow screens the comparison table collapses badly (header row hides,
  // tier context disappears). Force the cards layout below 860px.
  const isMobile = useIsMobile(860);
  const actual = isMobile ? "cards" : layout;
  return (
    <section className="mkt-section" id={anchor} data-screen-label="Pricing">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <h2 className="mkt-h2">Simple pricing, in shillings</h2>
          <p className="mkt-section-sub">
            Start free. Upgrade when you outgrow it â we lower the donation fee on every paid plan.
          </p>
        </div>
        {actual === "cards" ? <PricingCards /> : <PricingTable />}
        <p className="pr-foot mono">
          All prices in UGX. Cancel any time. Donation fees stack on top â Sub-tree never holds your money.
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { PricingSection, PricingTable, PricingCards, TIERS, useIsMobile });
