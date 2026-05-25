import { useState } from "react";

function Icon({ name, size = 20, className = "", style = {} }) {
  const icons = {
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    feed: <><path d="M4 6h16M4 12h16M4 18h10"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    history: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
    star: <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    externalLink: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    shop: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    package: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
    creditCard: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    logOut: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    billing: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    page: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className} style={style}>
      {icons[name]}
    </svg>
  );
}

function Logo({ size = "md" }) {
  const s = size === "sm" ? 28 : 36;
  const t = size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: s, height: s, background: "#111827", borderRadius: s * 0.18 }}
        className="flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" style={{ width: s * 0.6, height: s * 0.6 }}
          fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 L9 7 L12 7 L15 7 L12 3 Z" fill="white" />
          <path d="M8 10 L12 6 L16 10" />
          <path d="M7 14 L12 9 L17 14" />
          <path d="M6 18 L12 12 L18 18" />
          <path d="M12 18 L12 21" strokeWidth="2" />
        </svg>
      </div>
      <span className={`${t} font-semibold tracking-tight text-gray-900`}>Sub-tree</span>
    </div>
  );
}

function Avatar({ initials, color, size = 40, ring = false }) {
  return (
    <div style={{
      width: size, height: size, background: color, borderRadius: "50%", flexShrink: 0,
      border: ring ? "2px solid white" : "none",
      boxShadow: ring ? "0 0 0 2px " + color : "none",
    }} className="flex items-center justify-center">
      <span style={{ fontSize: size * 0.35, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>
        {initials}
      </span>
    </div>
  );
}

function Badge({ label, color = "#111827" }) {
  return (
    <span style={{ background: color + "15", color, fontSize: 10, fontWeight: 600,
      padding: "2px 8px", borderRadius: 100, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const CREATORS = [
  { handle: "mugisha_beats", name: "Mugisha Beats", avatar: "MB", color: "#7C3AED" },
  { handle: "kampala_art", name: "Kampala Art House", avatar: "KA", color: "#DC2626" },
  { handle: "tech_ug", name: "TechUG Podcast", avatar: "TU", color: "#0891B2" },
  { handle: "lilian_creates", name: "Lilian Creates", avatar: "LC", color: "#059669" },
  { handle: "dj_ronnie", name: "DJ Ronnie", avatar: "DR", color: "#D97706" },
];

const FEED_POSTS = [
  { id: 1, creator: CREATORS[0], time: "2h ago", type: "post",
    content: "Just dropped the new Afrobeats EP! 🎵 6 tracks recorded right here in Kampala. Link in bio to stream.", likes: 124 },
  { id: 2, creator: CREATORS[3], time: "5h ago", type: "fundraiser",
    content: "My studio equipment fundraiser just hit 60% of the goal! UGX 1.8M raised of UGX 3M. Thank you everyone 🙏", likes: 89 },
  { id: 3, creator: CREATORS[1], time: "1d ago", type: "post",
    content: "New prints available in the shop. Limited run of 50 — each hand-signed.", likes: 67 },
  { id: 4, creator: CREATORS[2], time: "1d ago", type: "post",
    content: "Episode 42 is live: The state of fintech in Uganda in 2026 🎙️", likes: 45 },
];

const EXCLUSIVE_POSTS = [
  { id: 101, creator: CREATORS[0], time: "3h ago",
    title: "Studio Session — Raw Footage",
    preview: "Behind the scenes from last night's recording. You can hear the tracks before anyone else...",
    type: "video", hasAccess: true },
  { id: 102, creator: CREATORS[3], time: "1d ago",
    title: "Next collection — early preview",
    preview: "Subscriber-only look at the next fashion drop before it goes public.",
    type: "image", hasAccess: true },
  { id: 103, creator: CREATORS[2], time: "2d ago",
    title: "Full interview — uncut version",
    preview: "The 2-hour version of Episode 42 with everything that was edited out.",
    type: "audio", hasAccess: false },
  { id: 104, creator: CREATORS[0], time: "4d ago",
    title: "Unreleased track — demo",
    preview: "This one didn't make the EP but I want subscribers to hear it.",
    type: "audio", hasAccess: true },
];

const ORDERS = [
  {
    id: "ORD-001", type: "subscription", creator: CREATORS[0],
    name: "Mugisha Beats — Pro Supporter",
    amount: "UGX 20,000/mo", date: "May 1, 2026",
    nextRenewal: "Jun 1, 2026", status: "active",
    detail: "Monthly subscription · Auto-renews via MTN MoMo",
  },
  {
    id: "ORD-002", type: "digital", creator: CREATORS[3],
    name: "Fashion Design Template Pack",
    amount: "UGX 45,000", date: "May 10, 2026",
    status: "delivered", downloadExpiry: "May 12, 2026",
    downloadsLeft: 2, downloadsMax: 3,
    detail: "ZIP file · 156MB · Instant download",
    fileSize: "156MB", fileType: "ZIP",
  },
  {
    id: "ORD-003", type: "physical", creator: CREATORS[1],
    name: "Hand-signed Print #023 — Limited Edition",
    amount: "UGX 75,000", date: "May 15, 2026",
    status: "in_transit",
    detail: "A3 print, matte finish · Tracked shipping",
    trackingNote: "Creator confirmed dispatch on May 17",
    deliveryEstimate: "May 28 – Jun 2, 2026",
  },
  {
    id: "ORD-004", type: "digital", creator: CREATORS[2],
    name: "TechUG Episode Pack — S1 Complete",
    amount: "UGX 15,000", date: "Apr 28, 2026",
    status: "delivered", downloadExpiry: "expired",
    downloadsLeft: 0, downloadsMax: 3,
    detail: "MP3 files · 12 episodes · 2.4GB total",
    fileSize: "2.4GB", fileType: "MP3",
  },
  {
    id: "ORD-005", type: "subscription", creator: CREATORS[3],
    name: "Lilian Creates — Insider",
    amount: "UGX 12,000/mo", date: "Apr 15, 2026",
    nextRenewal: "Jun 15, 2026", status: "active",
    detail: "Monthly subscription · Auto-renews via Airtel Money",
  },
];

// ─── Hamburger Nav ─────────────────────────────────────────────────────────────
function HamburgerMenu({ open, onClose, onNavigate }) {
  if (!open) return null;
  const sections = [
    {
      items: [
        { icon: "home", label: "Home", action: "feed" },
        { icon: "page", label: "Your page", action: "profile" },
        { icon: "settings", label: "Settings", action: "settings" },
      ]
    },
    {
      label: "My support",
      items: [
        { icon: "shop", label: "Payments & orders", action: "orders" },
        { icon: "message", label: "Messages", action: "messages" },
      ]
    },
    {
      items: [
        { icon: "billing", label: "Account & billing", action: "billing" },
        { icon: "help", label: "Help", action: "help" },
        { icon: "logOut", label: "Log out", action: "logout" },
      ]
    },
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Logo size="sm" />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 p-1">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section, si) => (
            <div key={si}>
              {si > 0 && <div className="my-2 border-t border-gray-100" />}
              {section.label && (
                <p className="px-5 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.label}
                </p>
              )}
              {section.items.map(item => (
                <button key={item.action}
                  onClick={() => { onNavigate(item.action); onClose(); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                  <Icon name={item.icon} size={18} className="text-gray-500" />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="p-5 border-t border-gray-100 space-y-3">
          <button
            onClick={() => { onNavigate("become"); onClose(); }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Become a creator
          </button>
          <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 mx-auto">
            <Icon name="moon" size={14} />
            Dark mode
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, liked, onLike }) {
  const typeColors = { post: "#6B7280", fundraiser: "#059669" };
  const typeLabels = { post: "Post", fundraiser: "Fundraiser update" };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Avatar initials={post.creator.avatar} color={post.creator.color} size={36} />
        <div>
          <p className="text-sm font-semibold text-gray-900">{post.creator.name}</p>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 11, color: typeColors[post.type], fontWeight: 600 }}>
              {typeLabels[post.type]}
            </span>
            <span className="text-xs text-gray-400">· {post.time}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: liked ? "#DC2626" : "#9CA3AF" }}>
          <Icon name="heart" size={14} className={liked ? "fill-current" : ""} />
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          View page <Icon name="arrowRight" size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Exclusive Content Card ────────────────────────────────────────────────────
function ExclusiveCard({ post }) {
  const typeIcons = { video: "image", audio: "music", image: "image" };
  const typeColors = { video: "#7C3AED", audio: "#D97706", image: "#DC2626" };
  const typeLabels = { video: "Video", audio: "Audio", image: "Photos" };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {/* Content preview area */}
      <div className="relative h-28 flex items-center justify-center"
        style={{ background: post.hasAccess ? post.creator.color + "15" : "#F9FAFB" }}>
        {!post.hasAccess && (
          <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Icon name="lock" size={20} className="text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-medium">Subscribe to unlock</p>
            </div>
          </div>
        )}
        <Icon name={typeIcons[post.type]} size={32}
          style={{ color: post.hasAccess ? post.creator.color : "#D1D5DB" }} />
        <div className="absolute top-2 left-2">
          <Badge label={typeLabels[post.type]} color={typeColors[post.type]} />
        </div>
        {post.hasAccess && (
          <div className="absolute top-2 right-2">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <Icon name="star" size={11} style={{ fill: "white", color: "white" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar initials={post.creator.avatar} color={post.creator.color} size={22} />
          <span className="text-xs text-gray-500">{post.creator.name} · {post.time}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">{post.title}</p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.preview}</p>
        {post.hasAccess && (
          <button className="mt-2.5 w-full py-2 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: post.creator.color }}>
            {post.type === "audio" ? "▶ Play now" : post.type === "video" ? "▶ Watch now" : "View photos"}
          </button>
        )}
        {!post.hasAccess && (
          <button className="mt-2.5 w-full py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Subscribe to {post.creator.name.split(" ")[0]}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, expanded, onToggle }) {
  const statusConfig = {
    active: { label: "Active", color: "#059669", bg: "#DCFCE7" },
    delivered: { label: "Delivered", color: "#0891B2", bg: "#E0F2FE" },
    in_transit: { label: "In transit", color: "#D97706", bg: "#FEF3C7" },
    expired: { label: "Expired", color: "#9CA3AF", bg: "#F3F4F6" },
  };
  const typeConfig = {
    subscription: { icon: "refresh", color: "#7C3AED", label: "Subscription" },
    digital: { icon: "download", color: "#0891B2", label: "Digital" },
    physical: { icon: "package", color: "#D97706", label: "Physical" },
  };

  const sc = statusConfig[order.status];
  const tc = typeConfig[order.type];

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button className="w-full p-4 text-left" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: tc.color + "15" }}>
            <Icon name={tc.icon} size={18} style={{ color: tc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{order.name}</p>
              <span className="text-sm font-bold text-gray-900 shrink-0">{order.amount.split("/")[0]}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Avatar initials={order.creator.avatar} color={order.creator.color} size={16} />
              <span className="text-xs text-gray-500">{order.creator.name}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{order.date}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge label={tc.label} color={tc.color} />
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: sc.bg, color: sc.color }}>
                {sc.label}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Icon name="shop" size={12} />
            <span>{order.detail}</span>
          </div>

          {/* Subscription detail */}
          {order.type === "subscription" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Renewal amount</span>
                <span className="font-semibold text-gray-900">{order.amount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Next renewal</span>
                <span className="font-semibold text-gray-900">{order.nextRenewal}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-gray-400">{order.id}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-white">
                  Manage subscription
                </button>
                <button className="flex-1 py-2 text-xs font-semibold border border-red-200 rounded-lg text-red-500 hover:bg-red-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Digital detail */}
          {order.type === "digital" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">File size</span>
                <span className="font-semibold text-gray-900">{order.fileSize}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">File type</span>
                <span className="font-semibold text-gray-900">{order.fileType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Downloads used</span>
                <span className="font-semibold text-gray-900">{order.downloadsMax - order.downloadsLeft} of {order.downloadsMax}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Link expires</span>
                <span className="font-semibold" style={{ color: order.downloadExpiry === "expired" ? "#DC2626" : "#111827" }}>
                  {order.downloadExpiry === "expired" ? "Expired" : order.downloadExpiry}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-gray-400">{order.id}</span>
              </div>
              {order.downloadsLeft > 0 ? (
                <button className="w-full py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#0891B2" }}>
                  <Icon name="download" size={14} />
                  Download ({order.downloadsLeft} remaining)
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100 text-center">
                  Download expired · Contact creator
                </div>
              )}
            </div>
          )}

          {/* Physical detail */}
          {order.type === "physical" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Estimated delivery</span>
                <span className="font-semibold text-gray-900">{order.deliveryEstimate}</span>
              </div>
              <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                📦 {order.trackingNote}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-gray-400">{order.id}</span>
              </div>
              {/* Delivery timeline */}
              <div className="pt-1 space-y-2">
                {[
                  { label: "Order placed", date: order.date, done: true },
                  { label: "Creator confirmed & dispatched", date: "May 17, 2026", done: true },
                  { label: "In transit", date: "Est. " + order.deliveryEstimate, done: false, active: true },
                  { label: "Delivered & confirmed", date: "Pending", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.done ? "#059669" : step.active ? "#D97706" : "#E5E7EB",
                      }}>
                      {step.done && <Icon name="check" size={10} style={{ color: "white" }} />}
                      {step.active && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: step.done || step.active ? "#111827" : "#9CA3AF" }}>
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-400">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-2 text-xs font-semibold border border-green-200 rounded-lg text-green-600 hover:bg-green-50 flex items-center justify-center gap-1.5 mt-1">
                <Icon name="checkCircle" size={13} />
                Confirm delivery received
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Fan Dashboard ─────────────────────────────────────────────────────────────
function FanDashboard({ onViewProfile }) {
  const [tab, setTab] = useState("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState({});
  const [ordersTab, setOrdersTab] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleLike = (id) => setLiked(p => ({ ...p, [id]: !p[id] }));
  const toggleOrder = (id) => setExpandedOrder(prev => prev === id ? null : id);

  const tabs = [
    { id: "feed", icon: "feed", label: "Feed" },
    { id: "following", icon: "heart", label: "Following" },
    { id: "exclusive", icon: "star", label: "Exclusive" },
    { id: "orders", icon: "shop", label: "Orders" },
    { id: "messages", icon: "message", label: "Messages" },
  ];

  const filteredOrders = ordersTab === "all" ? ORDERS
    : ordersTab === "subscriptions" ? ORDERS.filter(o => o.type === "subscription")
    : ordersTab === "digital" ? ORDERS.filter(o => o.type === "digital")
    : ORDERS.filter(o => o.type === "physical");

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)}
        onNavigate={(action) => {
          if (action === "profile") onViewProfile();
          else if (action === "orders") setTab("orders");
          else if (action === "messages") setTab("messages");
          else if (action === "feed") setTab("feed");
        }} />

      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button className="relative text-gray-500 hover:text-gray-900">
              <Icon name="bell" size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={onViewProfile}>
              <Avatar initials="MU" color="#111827" size={30} />
            </button>
            <button onClick={() => setMenuOpen(true)} className="text-gray-700 hover:text-gray-900 p-0.5">
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors relative"
                style={{
                  borderColor: tab === t.id ? "#111827" : "transparent",
                  color: tab === t.id ? "#111827" : "#9CA3AF",
                }}>
                {t.id === "exclusive" ? (
                  <Icon name="star" size={13}
                    style={{ fill: tab === t.id ? "#F59E0B" : "none", color: tab === t.id ? "#F59E0B" : "#9CA3AF" }} />
                ) : (
                  <Icon name={t.icon} size={13} />
                )}
                {t.label}
                {t.id === "exclusive" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-24">

        {/* FEED */}
        {tab === "feed" && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Following</span>
                <button className="text-xs text-gray-900 font-medium">See all</button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {CREATORS.map(c => (
                  <div key={c.handle} className="flex flex-col items-center gap-1 shrink-0">
                    <div className="relative">
                      <Avatar initials={c.avatar} color={c.color} size={44} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-[10px] text-gray-600 font-medium max-w-12 text-center truncate">
                      {c.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {FEED_POSTS.map(post => (
                <PostCard key={post.id} post={post} liked={!!liked[post.id]} onLike={toggleLike} />
              ))}
            </div>
          </>
        )}

        {/* FOLLOWING */}
        {tab === "following" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Creators you follow</h2>
              <span className="text-xs text-gray-500">{CREATORS.length} creators</span>
            </div>
            {CREATORS.map(c => (
              <div key={c.handle} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                <Avatar initials={c.avatar} color={c.color} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">@{c.handle}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="text-xs font-semibold px-3 py-1.5 bg-gray-900 text-white rounded-lg">View</button>
                  <button className="text-xs text-gray-400">Unfollow</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXCLUSIVE CONTENT */}
        {tab === "exclusive" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="star" size={16} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
              <h2 className="text-sm font-semibold text-gray-900">Subscriber-only content</h2>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Content from creators you subscribe to. Subscribe to a creator to unlock their exclusive posts.
            </p>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {["All", ...CREATORS.slice(0, 3).map(c => c.name.split(" ")[0])].map((f, i) => (
                <button key={f}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border"
                  style={{
                    background: i === 0 ? "#111827" : "white",
                    color: i === 0 ? "white" : "#6B7280",
                    borderColor: i === 0 ? "#111827" : "#E5E7EB",
                  }}>
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {EXCLUSIVE_POSTS.map(post => (
                <ExclusiveCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS & ORDERS */}
        {tab === "orders" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Payments & Orders</h2>
              <span className="text-xs text-gray-500">{ORDERS.length} orders</span>
            </div>

            {/* Summary card */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total spent</p>
              <p className="text-2xl font-bold text-gray-900">UGX 167,000</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Subscriptions", value: "2", color: "#7C3AED" },
                  { label: "Digital", value: "2", color: "#0891B2" },
                  { label: "Physical", value: "1", color: "#D97706" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-2 text-center"
                    style={{ background: s.color + "10" }}>
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: "all", label: "All" },
                { id: "subscriptions", label: "Subscriptions" },
                { id: "digital", label: "Digital" },
                { id: "physical", label: "Physical" },
              ].map(t => (
                <button key={t.id} onClick={() => setOrdersTab(t.id)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: ordersTab === t.id ? "white" : "transparent",
                    color: ordersTab === t.id ? "#111827" : "#9CA3AF",
                    boxShadow: ordersTab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Order list */}
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => toggleOrder(order.id)} />
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative">
                  <Avatar initials="MB" color="#7C3AED" size={36} />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Mugisha Beats</p>
                    <span className="text-xs text-gray-400">2h ago</span>
                  </div>
                  <p className="text-xs text-gray-500">Thank you for supporting the EP 🙏</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">Hey! Thank you so much for supporting the EP 🙏 What's your favorite track?</p>
              </div>
              <div className="flex gap-2">
                <input placeholder="Reply..." className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900" />
                <button className="px-3 py-2 bg-gray-900 text-white rounded-lg">
                  <Icon name="send" size={15} />
                </button>
              </div>
            </div>

            <div className="text-center py-4 text-xs text-gray-400">
              Only creators can start conversations. When they message you, it appears here.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Fan Public Profile ────────────────────────────────────────────────────────
function FanPublicProfile({ onBack }) {
  const [profileTab, setProfileTab] = useState("about");
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900">
            <Icon name="arrowLeft" size={20} />
          </button>
          <Logo size="sm" />
          <div className="ml-auto">
            <button className="text-gray-500 hover:text-gray-900">
              <Icon name="settings" size={20} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto">
        <div className="bg-white pb-0">
          <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative">
            <div className="absolute bottom-0 left-4 translate-y-1/2">
              <Avatar initials="MU" color="#111827" size={72} ring />
            </div>
          </div>
          <div className="pt-12 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Muhamad</h1>
                <p className="text-sm text-gray-500">@muhamad · <span className="font-medium text-gray-700">Supporter</span></p>
              </div>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Edit profile
              </button>
            </div>
            <div className="flex gap-5 mt-3">
              {[{ value: CREATORS.length, label: "Following" }, { value: "12", label: "Followers" }, { value: "UGX 167K", label: "Given" }].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex border-b border-gray-100 px-4">
            {["about", "supporting"].map(t => (
              <button key={t} onClick={() => setProfileTab(t)}
                className="px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors"
                style={{ borderColor: profileTab === t ? "#111827" : "transparent", color: profileTab === t ? "#111827" : "#9CA3AF" }}>
                {t === "supporting" ? "Creators I support" : "About"}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-4 space-y-3">
          {profileTab === "about" && (
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-600 leading-relaxed">Music lover, tech enthusiast. Supporting East African creators building amazing things. 🇺🇬</p>
            </div>
          )}
          {profileTab === "supporting" && (
            <div className="grid grid-cols-2 gap-3">
              {CREATORS.map(c => (
                <div key={c.handle} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center gap-2">
                  <Avatar initials={c.avatar} color={c.color} size={44} />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{c.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">@{c.handle}</p>
                  </div>
                  <button className="w-full text-xs font-medium py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                    View page
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
function FanOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [handleStatus, setHandleStatus] = useState("idle");

  const checkHandle = (val) => {
    setHandle(val.toLowerCase().replace(/\s/g, ""));
    if (val.length < 3) { setHandleStatus("idle"); return; }
    setHandleStatus("checking");
    setTimeout(() => setHandleStatus(val === "muhamad" ? "taken" : "available"), 400);
  };

  const steps = [
    {
      title: "Claim your handle",
      subtitle: "This is how people will find you on Sub-tree.",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Your handle</label>
            <div className={`flex items-stretch bg-white border rounded-lg overflow-hidden transition-all ${
              handleStatus === "available" ? "border-green-400" : handleStatus === "taken" ? "border-red-300" : "border-gray-200 focus-within:border-gray-900"}`}>
              <span className="flex items-center pl-3 pr-1 text-sm text-gray-500 select-none">sub-tree.com/</span>
              <input value={handle} onChange={e => checkHandle(e.target.value)}
                placeholder="yourhandle" autoCapitalize="none" autoCorrect="off"
                className="flex-1 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900" />
            </div>
            {handleStatus === "available" && <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1"><Icon name="check" size={11} /> Available</p>}
            {handleStatus === "taken" && <p className="mt-1.5 text-xs text-red-500">Already taken</p>}
            {handleStatus === "checking" && <p className="mt-1.5 text-xs text-gray-400">Checking...</p>}
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
            You're signing up as a <strong className="text-gray-900">fan</strong>. Follow creators, track your support, and build your profile. You can become a creator anytime — free to start.
          </div>
        </div>
      ),
      canNext: handleStatus === "available",
    },
    {
      title: "Set up your profile",
      subtitle: "Tell creators a bit about yourself.",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar initials={displayName ? displayName.substring(0, 2).toUpperCase() : "?"} color="#111827" size={72} />
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <Icon name="image" size={13} className="text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-400">Tap to upload a photo</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Display name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Bio <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Tell creators why you support them..." maxLength={300}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 placeholder-gray-400 resize-none" />
            <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
          </div>
        </div>
      ),
      canNext: displayName.length > 0,
    },
    {
      title: "Follow your first creator",
      subtitle: "See their posts and updates in your feed.",
      content: (
        <div className="space-y-2">
          {CREATORS.map((c, i) => <CreatorFollowRow key={c.handle} creator={c} defaultFollowed={i < 2} />)}
        </div>
      ),
      canNext: true,
    },
    {
      title: "You're in! 🎉",
      subtitle: "Your fan profile is live at sub-tree.com/" + (handle || "yourhandle"),
      content: (
        <div className="space-y-4">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Icon name="check" size={26} className="text-green-500" />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              { icon: "feed", text: "See posts from creators you follow in your Feed" },
              { icon: "star", text: "Access subscriber-only content in the Exclusive tab" },
              { icon: "shop", text: "Track all your purchases in Payments & Orders" },
              { icon: "message", text: "Receive messages from creators you support" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={13} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-5 border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Logo size="sm" />
          {step > 0 && step < steps.length - 1 && (
            <button onClick={() => setStep(s => s + 1)} className="text-xs text-gray-400 hover:text-gray-700">Skip</button>
          )}
        </div>
      </header>
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="flex gap-1.5 mb-8">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-colors"
                style={{ background: i <= step ? "#111827" : "#E5E7EB" }} />
            ))}
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{current.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{current.subtitle}</p>
          </div>
          {current.content}
        </div>
      </main>
      <div className="px-6 pb-8 pt-4 border-t border-gray-100">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && step < steps.length - 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Icon name="arrowLeft" size={16} />
            </button>
          )}
          <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onComplete()}
            disabled={!current.canNext}
            className="flex-1 py-3 rounded-lg font-medium text-sm transition-all"
            style={{
              background: current.canNext ? "#111827" : "#F3F4F6",
              color: current.canNext ? "white" : "#9CA3AF",
              cursor: current.canNext ? "pointer" : "not-allowed",
            }}>
            {step === steps.length - 1 ? "Go to my feed →" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatorFollowRow({ creator, defaultFollowed }) {
  const [followed, setFollowed] = useState(defaultFollowed);
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
      <Avatar initials={creator.avatar} color={creator.color} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{creator.name}</p>
        <p className="text-xs text-gray-400">@{creator.handle}</p>
      </div>
      <button onClick={() => setFollowed(f => !f)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: followed ? "#111827" : "transparent",
          color: followed ? "white" : "#111827",
          border: "1.5px solid #111827",
        }}>
        {followed ? "Following" : "Follow"}
      </button>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("onboarding");
  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
      {screen === "onboarding" && <FanOnboarding onComplete={() => setScreen("dashboard")} />}
      {screen === "dashboard" && <FanDashboard onViewProfile={() => setScreen("profile")} />}
      {screen === "profile" && <FanPublicProfile onBack={() => setScreen("dashboard")} />}
    </div>
  );
}
