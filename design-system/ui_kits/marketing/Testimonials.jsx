// Testimonials â three short quotes, restrained voice.

const QUOTES = [
  {
    quote: "I used to send five different links to anyone who asked. Now there's just one. My MoMo number stays private and the money still lands.",
    name: "Amara Naledi",
    role: "Food creator Â· Kampala",
    handle: "@amara",
    initial: "A",
  },
  {
    quote: "The donation fee on Pro paid for itself in the first week. Supporters from the diaspora send larger amounts when they don't have to use a card.",
    name: "Joel Mukasa",
    role: "Musician",
    handle: "@joelm",
    initial: "J",
  },
  {
    quote: "We run a small youth choir. Sub-tree gave us one page for the schedule, the donate button and a way to sell rehearsal recordings â all in shillings.",
    name: "St. Andrew's Voices",
    role: "Choir Â· Entebbe",
    handle: "@standrews",
    initial: "S",
  },
];

function Testimonial({ q }) {
  return (
    <figure className="mkt-tm">
      <blockquote className="mkt-tm-quote">{q.quote}</blockquote>
      <figcaption className="mkt-tm-caption">
        <span className="mkt-tm-avatar">{q.initial}</span>
        <span className="mkt-tm-meta">
          <span className="mkt-tm-name">{q.name}</span>
          <span className="mkt-tm-role">
            <span className="mono">{q.handle}</span>
            <span className="mkt-tm-dot">Â·</span>
            {q.role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

function Testimonials() {
  return (
    <section className="mkt-section mkt-surface">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <h2 className="mkt-h2">Quiet wins from real creators</h2>
          <p className="mkt-section-sub">Three early users, in their own words.</p>
        </div>
        <div className="mkt-tm-grid">
          {QUOTES.map(q => <Testimonial key={q.handle} q={q} />)}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Testimonials });
