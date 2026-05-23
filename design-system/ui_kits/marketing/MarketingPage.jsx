// Marketing landing page components â recreates app/page.tsx
// Loaded as type="text/babel" alongside _shared.jsx

const { useState: useStateMkt } = React;

function MktHeader() {
  return (
    <header className="mkt-header">
      <div className="mkt-container mkt-header-row">
        <a href="#" aria-label="Sub-tree home"><Logo variant="lockup" /></a>
        <nav className="mkt-nav">
          <a href="#signin" className="mkt-nav-link">Sign in</a>
          <a href="#signup" className="btn primary sm">Get started</a>
        </nav>
      </div>
    </header>
  );
}

function OrbitRing() {
  const ICONS = ["youtube", "instagram", "tiktok", "twitter", "whatsapp", "spotify", "substack", "facebook"];
  const period = 30; // seconds per revolution
  return (
    <div className="orbit" aria-hidden="true">
      <div className="orbit-ring" />
      {ICONS.map((p, i) => (
        <span key={p} className="orbit-icon"
              style={{ animationDelay: `${-i * (period / ICONS.length)}s` }}>
          <PlatformIcon platform={p} size={18} />
        </span>
      ))}
    </div>
  );
}

function MktHero() {
  return (
    <section className="mkt-hero">
      <div className="mkt-container mkt-hero-row">
        <div className="mkt-hero-text">
          <span className="badge outline">
            <Icon name="globe" size={12} strokeWidth={2} />
            Built for East African creators
          </span>
          <div className="mkt-h1-wrap">
            <OrbitRing />
            <h1 className="mkt-h1">All your links.<br/>One page.</h1>
          </div>
          <p className="mkt-lede">
            Create, post â and we help you grow and monetize.
          </p>
          <div className="mkt-cta-row">
            <a href="#signup" className="btn primary lg">
              Claim your username
              <Icon name="arrowRight" size={16} />
            </a>
            <a href="#signin" className="btn outline lg">Sign in</a>
          </div>
        </div>
        <div className="mkt-hero-art"><ProfileMockup /></div>
      </div>
    </section>
  );
}

function MktStats() {
  return (
    <section className="mkt-stats">
      <div className="mkt-container mkt-stats-grid">
        <div><p className="mkt-stat-v">Free</p><p className="mkt-stat-l">to get started</p></div>
        <div><p className="mkt-stat-v">MTN + Airtel</p><p className="mkt-stat-l">mobile money</p></div>
        <div><p className="mkt-stat-v">1 link</p><p className="mkt-stat-l">for everything</p></div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="mkt-feature">
      <span className="mkt-feature-icon"><Icon name={icon} size={20} strokeWidth={1.5} /></span>
      <div>
        <h3 className="mkt-feature-title">{title}</h3>
        <p className="mkt-feature-body">{body}</p>
      </div>
    </div>
  );
}

function MktFeatures() {
  return (
    <section className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <h2 className="mkt-h2">Everything a creator needs</h2>
          <p className="mkt-section-sub">One link that does the work of a website, social profile, and payment page.</p>
        </div>
        <div className="mkt-feature-grid">
          <FeatureCard icon="link2" title="All your links, one place" body="Add unlimited links, reorder them in seconds, and choose a button style that fits your brand." />
          <FeatureCard icon="heart" title="Accept mobile money" body="Let supporters send donations straight to your MTN MoMo or Airtel Money number â no bank account needed." />
          <FeatureCard icon="bar" title="Know your audience" body="See how many people visit your page, which links they click, and where your donations come from." />
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body, connector }) {
  return (
    <div className="mkt-step">
      {connector && <span className="mkt-step-line" />}
      <span className="mkt-step-num mono">{n}</span>
      <h3 className="mkt-step-title">{title}</h3>
      <p className="mkt-step-body">{body}</p>
    </div>
  );
}

function MktHow() {
  return (
    <section className="mkt-section mkt-surface">
      <div className="mkt-container">
        <h2 className="mkt-h2 mkt-h2-center">Up in three steps</h2>
        <div className="mkt-step-grid">
          <Step n={1} connector title="Claim your @username" body="Pick a unique username â your Sub-tree link will be sub-tree.com/you." />
          <Step n={2} connector title="Add your links" body="Paste in your Instagram, YouTube, WhatsApp, website â anything you want to share." />
          <Step n={3} title="Share everywhere" body="One link in your bio does it all. Supporters can send you money while they're there." />
        </div>
      </div>
    </section>
  );
}

function MktMoMoHighlight() {
  return (
    <section className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-momo">
          <div className="mkt-momo-text">
            <span className="badge outline">
              <Icon name="smart" size={12} strokeWidth={2} />
              Mobile money built in
            </span>
            <h2 className="mkt-h2">Get paid on MTN MoMo<br/>and Airtel Money</h2>
            <p className="mkt-section-sub">
              Your supporters enter their phone number and approve the payment from their mobile. Donations go directly to your registered MoMo number â no bank, no delay, no middleman.
            </p>
          </div>
          <div className="mkt-momo-art"><DonatePreviewCard /></div>
        </div>
      </div>
    </section>
  );
}

function MktCTA() {
  return (
    <section className="mkt-section mkt-cta-section">
      <div className="mkt-container mkt-cta-inner">
        <h2 className="mkt-h2">Ready to grow your audience?</h2>
        <p className="mkt-section-sub">Create your Sub-tree page in minutes. Free to start, no credit card required.</p>
        <a href="#signup" className="btn primary lg" style={{ marginTop: 24 }}>
          Get started â it's free
          <Icon name="arrowRight" size={16} />
        </a>
      </div>
    </section>
  );
}

function MktFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container mkt-footer-row">
        <Logo variant="lockup" />
        <nav className="mkt-footer-nav">
          <a href="#signup">Sign up</a>
          <a href="#signin">Sign in</a>
          <a href="mailto:hello@sub-tree.com">Contact</a>
        </nav>
        <p className="mkt-copy">Â© 2026 Sub-tree</p>
      </div>
    </footer>
  );
}

/* ââ Mini visual mockups (used in hero + momo highlight) ââ */
function ProfileMockup() {
  return (
    <div className="pm">
      <div className="pm-top" />
      <div className="pm-body">
        <div className="pm-head">
          <div className="pm-av">A</div>
          <p className="pm-name">Amara Naledi</p>
          <p className="pm-handle mono">@amara</p>
          <p className="pm-bio">Content creator Â· Kampala</p>
        </div>
        <div className="pm-stack">
          {["YouTube Channel","Instagram","WhatsApp"].map(l => <div key={l} className="pm-link">{l}</div>)}
        </div>
        <div className="pm-donate">Support Amara</div>
        <p className="pm-powered">Powered by Sub-tree</p>
      </div>
    </div>
  );
}

function DonatePreviewCard() {
  return (
    <div className="dp">
      <p className="dp-label">Amount (UGX)</p>
      <div className="dp-grid">
        {["2,000","5,000","10,000"].map((a, i) => (
          <div key={a} className={"dp-chip" + (i === 1 ? " sel" : "")}>{a}</div>
        ))}
      </div>
      <p className="dp-label">Mobile money number</p>
      <div className="dp-input mono">07XX XXX XXX</div>
      <div className="dp-cta">Donate UGX 5,000</div>
      <p className="dp-meta">MTN MoMo Â· Airtel Money</p>
    </div>
  );
}

function MarketingPage() {
  return (
    <div className="mkt-root">
      <MktHeader />
      <main>
        <MktHero />
        <LogoBar />
        <MktFeatures />
        <MktHow />
        <MktMoMoHighlight />
        <Testimonials />
        <PricingSection layout="table" />
        <div className="pr-teaser">
          <a href="./pricing.html">
            Compare every plan in detail
            <Icon name="arrowRight" size={14} />
          </a>
        </div>
        <MktCTA />
      </main>
      <MktFooter />
    </div>
  );
}

function PricingPage({ layout = "table", onLayoutChange }) {
  return (
    <div className="mkt-root">
      <MktHeader />
      <main>
        <section className="mkt-hero" style={{ paddingBottom: 32 }}>
          <div className="mkt-container" style={{ textAlign: "center" }}>
            <span className="badge outline">
              <Icon name="smart" size={12} strokeWidth={2} />
              Built for East African creators
            </span>
            <h1 className="mkt-h1" style={{ fontSize: 44 }}>Simple pricing,<br/>in shillings.</h1>
            <p className="mkt-lede" style={{ margin: "0 auto 32px" }}>
              Start free. Upgrade when you outgrow it â every paid plan drops your donation fee from 5% to 3%.
            </p>
            <div className="pr-layout-toggle" role="tablist" aria-label="Pricing layout">
              <button type="button" className={layout === "table" ? "active" : ""}
                      onClick={() => onLayoutChange("table")}>Comparison table</button>
              <button type="button" className={layout === "cards" ? "active" : ""}
                      onClick={() => onLayoutChange("cards")}>Plan cards</button>
            </div>
          </div>
        </section>
        <section className="mkt-section" style={{ paddingTop: 16 }}>
          <div className="mkt-container">
            {layout === "cards" ? <PricingCards /> : <PricingTable />}
            <p className="pr-foot mono">
              All prices in UGX. Cancel any time. Donation fees stack on top â Sub-tree never holds your money.
            </p>
          </div>
        </section>
        <Testimonials />
        <MktCTA />
      </main>
      <MktFooter />
    </div>
  );
}

Object.assign(window, { MarketingPage, PricingPage });
