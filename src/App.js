import { useState, useRef, useEffect } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────
const WrenchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const CarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "My check engine light is on — what should I do?",
  "My brakes are squealing when I stop.",
  "My car is making a knocking noise when I accelerate.",
  "How do I know when my tires need replacing?",
  "My AC isn't blowing cold air.",
  "My car won't start — just clicks when I turn the key.",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 35 }, (_, i) => CURRENT_YEAR - i);
const MAKES = ["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","GMC","Honda","Hyundai","Infiniti","Jeep","Kia","Lexus","Lincoln","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Ram","Subaru","Tesla","Toyota","Volkswagen","Volvo","Other"];

// ── API ────────────────────────────────────────────────────────────────────
const buildSystemPrompt = (vehicle) => {
  const vInfo = vehicle.year && vehicle.make && vehicle.model
    ? `\n\nThe user's vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.mileage ? ` with ${vehicle.mileage} miles` : ""}. Factor this into all advice — mention model-specific quirks, recalls, or known issues when relevant.`
    : "";
  return `You are an expert mechanic with 25+ years of experience working on all types of vehicles. You speak plainly and honestly, like a trusted friend who knows everything about cars.

Your job: help everyday drivers understand what's wrong, what it costs, whether they can DIY it, and when they need a pro.${vInfo}

Guidelines:
- Be direct and practical. Skip fluff.
- Always give a rough cost estimate (parts + labor) when relevant. Format costs clearly like: "Parts: $X–$Y | Labor: $X–$Y | Total: $X–$Y"
- Rate DIY difficulty: Easy / Moderate / Hard / Leave it to a pro.
- Flag safety-critical issues clearly.
- If you need more info, ask ONE focused follow-up.
- Never recommend something unnecessary if a simpler fix exists.
- Use plain language — explain any jargon you use.`;
};

const sendMessage = async (messages, vehicle) => {
  const res = await fetch("https://mechanic-backend-2sbr.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, vehicle }),
  });
  const data = await res.json();
  return data.reply || "Sorry, something went wrong.";
};

const extractCostFromMessage = (text) => {
  const match = text.match(/Total:\s*\$(\d[\d,]*)\s*[–\-]\s*\$(\d[\d,]*)/i)
    || text.match(/\$(\d[\d,]*)\s*[–\-]\s*\$(\d[\d,]*)/);
  if (match) {
    const lo = parseInt(match[1].replace(/,/g, ""));
    const hi = parseInt(match[2].replace(/,/g, ""));
    return { lo, hi, avg: Math.round((lo + hi) / 2) };
  }
  return null;
};

// ── Vehicle Bar ────────────────────────────────────────────────────────────
function VehicleBar({ vehicle, setVehicle, collapsed, setCollapsed }) {
  const hasVehicle = vehicle.year && vehicle.make;
  return (
    <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <button onClick={() => setCollapsed(!collapsed)}
        style={{ width: "100%", background: "none", border: "none", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span style={{ color: "#e8420a", display: "flex" }}><CarIcon /></span>
        <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#666" }}>Vehicle</span>
        <span style={{ marginLeft: 6, fontFamily: "monospace", fontSize: 13, color: hasVehicle ? "#d0c8bc" : "#444" }}>
          {hasVehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model || ""}${vehicle.mileage ? ` · ${Number(vehicle.mileage).toLocaleString()} mi` : ""}` : "Not set — tap to add"}
        </span>
        <span style={{ marginLeft: "auto", color: "#555" }}><ChevronIcon open={!collapsed} /></span>
      </button>
      {!collapsed && (
        <div style={{ padding: "0 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Year", key: "year", type: "select", options: YEARS.map(String) },
            { label: "Make", key: "make", type: "select", options: MAKES },
            { label: "Model", key: "model", type: "text", placeholder: "e.g. F-150" },
            { label: "Mileage", key: "mileage", type: "text", placeholder: "e.g. 85000" },
          ].map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: "monospace", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{f.label}</label>
              {f.type === "select" ? (
                <select value={vehicle[f.key] || ""} onChange={e => setVehicle(v => ({ ...v, [f.key]: e.target.value }))}
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: vehicle[f.key] ? "#f5f0e8" : "#555", fontSize: 13, padding: "6px 8px", fontFamily: "monospace", outline: "none" }}>
                  <option value="">—</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" value={vehicle[f.key] || ""} onChange={e => setVehicle(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 13, padding: "6px 8px", fontFamily: "monospace", outline: "none", width: "100%" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cost Tracker ───────────────────────────────────────────────────────────
function CostTracker({ repairs, setRepairs }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", cost: "", status: "pending" });

  const total = repairs.reduce((s, r) => s + Number(r.cost || 0), 0);
  const paid = repairs.filter(r => r.status === "done").reduce((s, r) => s + Number(r.cost || 0), 0);

  const addRepair = () => {
    if (!form.label || !form.cost) return;
    setRepairs(r => [...r, { ...form, id: Date.now() }]);
    setForm({ label: "", cost: "", status: "pending" });
    setAdding(false);
  };

  return (
    <div style={{ padding: "0 2px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Total Tracked", value: `$${total.toLocaleString()}`, color: "#f5f0e8" },
          { label: "Paid", value: `$${paid.toLocaleString()}`, color: "#4ade80" },
          { label: "Pending", value: `$${(total - paid).toLocaleString()}`, color: "#e8420a" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#141414", border: "1px solid #222", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {repairs.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "36px 0", color: "#444", fontFamily: "monospace", fontSize: 13, lineHeight: 1.8 }}>
          No repairs tracked yet.<br />
          <span style={{ color: "#555" }}>Costs detected in chat are auto-suggested here.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {repairs.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#141414", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 14px" }}>
            <button onClick={() => setRepairs(rs => rs.map(x => x.id === r.id ? { ...x, status: x.status === "done" ? "pending" : "done" } : x))}
              style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${r.status === "done" ? "#4ade80" : "#333"}`, background: r.status === "done" ? "#4ade80" : "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {r.status === "done" && <CheckIcon />}
            </button>
            <span style={{ flex: 1, fontFamily: "'Georgia', serif", fontSize: 14, color: r.status === "done" ? "#444" : "#c8c0b4", textDecoration: r.status === "done" ? "line-through" : "none" }}>{r.label}</span>
            <span style={{ fontFamily: "monospace", fontSize: 14, color: r.status === "done" ? "#4ade80" : "#e8420a", fontWeight: 600 }}>${Number(r.cost).toLocaleString()}</span>
            <button onClick={() => setRepairs(rs => rs.filter(x => x.id !== r.id))} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: 2, display: "flex" }}><TrashIcon /></button>
          </div>
        ))}
      </div>

      {adding ? (
        <div style={{ background: "#141414", border: "1px solid #e8420a33", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <input autoFocus placeholder="Repair description (e.g. Brake pads + rotors)" value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 14, padding: "8px 12px", fontFamily: "'Georgia', serif", outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Est. cost ($)" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value.replace(/\D/g, "") }))}
              style={{ flex: 1, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 14, padding: "8px 12px", fontFamily: "monospace", outline: "none" }} />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 13, padding: "8px 10px", fontFamily: "monospace" }}>
              <option value="pending">Pending</option>
              <option value="done">Paid</option>
            </select>
            <button onClick={addRepair} style={{ background: "#e8420a", border: "none", borderRadius: 6, color: "#fff", padding: "8px 16px", fontFamily: "monospace", fontSize: 13, cursor: "pointer" }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ background: "#222", border: "none", borderRadius: 6, color: "#888", padding: "8px 12px", fontFamily: "monospace", fontSize: 13, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: "100%", background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 8, padding: "10px 0", color: "#555", fontFamily: "monospace", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#e8420a55"; e.currentTarget.style.color = "#888"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}>
          <PlusIcon /> Add repair manually
        </button>
      )}
    </div>
  );
}

// ── Shop Finder ────────────────────────────────────────────────────────────
function ShopFinder({ vehicle }) {
  const [zip, setZip] = useState("");
  const [specialty, setSpecialty] = useState("general");
  const [searched, setSearched] = useState(false);

  const searchQuery = () => {
    const make = vehicle?.make || "";
    const specs = { general: "auto repair shop", transmission: "transmission repair", bodywork: "auto body shop", tires: "tire shop", oil: "oil change", electric: "electric vehicle EV repair" };
    const q = encodeURIComponent(`${make ? make + " " : ""}${specs[specialty]} near ${zip || "me"}`);
    window.open(`https://www.google.com/maps/search/${q}`, "_blank");
    setSearched(true);
  };

  const tips = [
    { icon: "⭐", tip: "Look for shops with 50+ Google reviews and a 4.5+ star rating." },
    { icon: "🔧", tip: "ASE-certified mechanics are held to a national standard — look for the blue seal." },
    { icon: "💬", tip: "Always get a written estimate before work starts. It's your legal right in most states." },
    { icon: "📋", tip: "Ask about their warranty — good shops offer 12 months or 12,000 miles on parts and labor." },
    { icon: "🚗", tip: vehicle?.make ? `Search for ${vehicle.make}-specialist shops — they know your vehicle's quirks inside out.` : "Brand-specialist shops often diagnose faster and cheaper than general shops." },
  ];

  return (
    <div style={{ padding: "0 2px" }}>
      <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", fontFamily: "monospace", fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Find a Shop Near You</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="ZIP code (optional)" value={zip} onChange={e => setZip(e.target.value)}
            style={{ flex: 1, minWidth: 110, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 14, padding: "9px 12px", fontFamily: "monospace", outline: "none" }} />
          <select value={specialty} onChange={e => setSpecialty(e.target.value)}
            style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f5f0e8", fontSize: 13, padding: "9px 10px", fontFamily: "monospace" }}>
            <option value="general">General Repair</option>
            <option value="transmission">Transmission</option>
            <option value="bodywork">Body Shop</option>
            <option value="tires">Tires</option>
            <option value="oil">Oil Change</option>
            <option value="electric">EV / Electric</option>
          </select>
          <button onClick={searchQuery}
            style={{ background: "#e8420a", border: "none", borderRadius: 6, color: "#fff", padding: "9px 16px", fontFamily: "monospace", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <MapPinIcon /> Search Maps
          </button>
        </div>
        {searched && <p style={{ margin: "10px 0 0", fontFamily: "monospace", fontSize: 12, color: "#4ade80" }}>✓ Opened Google Maps — check ratings and reviews!</p>}
      </div>

      <p style={{ fontFamily: "monospace", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>How to Pick a Good Shop</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tips.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 12, background: "#141414", border: "1px solid #1e1e1e", borderRadius: 8, padding: "11px 14px" }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#999", lineHeight: 1.6 }}>{t.tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function AskAMechanic() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [vehicle, setVehicle] = useState({});
  const [vehicleCollapsed, setVehicleCollapsed] = useState(true);
  const [repairs, setRepairs] = useState([]);
  const [suggestCost, setSuggestCost] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, tab]);

  const handleSend = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setStarted(true);
    setSuggestCost(null);
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await sendMessage(newMessages, vehicle);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      const cost = extractCostFromMessage(reply);
      if (cost) setSuggestCost({ cost, label: userText.slice(0, 70) });
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", fontFamily: "'Georgia', 'Times New Roman', serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.5 }} />

      <div style={{ width: "100%", maxWidth: 740, padding: "26px 18px 0", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ background: "#e8420a", borderRadius: 8, padding: "7px 9px", color: "#fff", display: "flex" }}><WrenchIcon size={20} /></div>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, color: "#f5f0e8", letterSpacing: "-0.5px" }}>Ask a Mechanic</h1>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#e8420a", border: "1px solid #e8420a44", borderRadius: 20, padding: "2px 9px", letterSpacing: 1.5, fontFamily: "monospace", textTransform: "uppercase" }}>Free Beta</span>
        </div>
        <p style={{ margin: "0 0 14px", color: "#555", fontSize: 11, paddingLeft: 46, fontFamily: "monospace" }}>25 years of expertise · no upsells · no BS</p>

        <VehicleBar vehicle={vehicle} setVehicle={setVehicle} collapsed={vehicleCollapsed} setCollapsed={setVehicleCollapsed} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "#111", borderRadius: 8, padding: 3 }}>
          {[
            { key: "chat", label: "💬 Chat" },
            { key: "costs", label: `💰 Costs${repairs.length ? ` (${repairs.length})` : ""}` },
            { key: "shops", label: "📍 Find a Shop" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", background: tab === t.key ? "#1e1e1e" : "none", color: tab === t.key ? "#f5f0e8" : "#555", fontFamily: "monospace", fontSize: 12, boxShadow: tab === t.key ? "0 1px 4px #0008" : "none", transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: tab === "chat" ? 0 : 28 }}>
          {tab === "chat" && (
            <>
              {!started ? (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <p style={{ color: "#555", fontSize: 12, marginBottom: 12, fontFamily: "monospace" }}>Common questions to get started:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => handleSend(s)}
                        style={{ background: "#141414", border: "1px solid #1e1e1e", borderLeft: "3px solid #e8420a", borderRadius: 6, padding: "11px 14px", color: "#888", textAlign: "left", cursor: "pointer", fontSize: 14, fontFamily: "'Georgia', serif", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = "#f5f0e8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#141414"; e.currentTarget.style.color = "#888"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, animation: "fadeUp 0.3s ease" }}>
                      {m.role === "assistant" && (
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: "#e8420a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", marginTop: 2 }}>
                          <WrenchIcon size={16} />
                        </div>
                      )}
                      <div style={{ maxWidth: "82%", background: m.role === "user" ? "#e8420a" : "#141414", border: m.role === "user" ? "none" : "1px solid #222", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "11px 15px", color: m.role === "user" ? "#fff" : "#c8c0b4", fontSize: 14, lineHeight: 1.7, fontFamily: m.role === "user" ? "monospace" : "'Georgia', serif", whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: "#e8420a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}><WrenchIcon size={16} /></div>
                      <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "14px 14px 14px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                        {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8420a", animation: `pulse 1.2s ease-in-out ${d*0.2}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                  {suggestCost && (
                    <div style={{ background: "#141414", border: "1px solid #e8420a55", borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.3s ease" }}>
                      <span style={{ color: "#e8420a", display: "flex" }}><DollarIcon /></span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 11, color: "#666" }}>Cost estimate detected</p>
                        <p style={{ margin: "2px 0 0", fontFamily: "'Georgia', serif", fontSize: 13, color: "#c8c0b4" }}>
                          <strong style={{ color: "#e8420a" }}>${suggestCost.cost.lo.toLocaleString()}–${suggestCost.cost.hi.toLocaleString()}</strong> · avg ~${suggestCost.cost.avg.toLocaleString()}
                        </p>
                      </div>
                      <button onClick={() => { setRepairs(r => [...r, { id: Date.now(), label: suggestCost.label, cost: suggestCost.cost.avg, status: "pending" }]); setSuggestCost(null); }}
                        style={{ background: "#e8420a", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontFamily: "monospace", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>+ Track It</button>
                      <button onClick={() => setSuggestCost(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontFamily: "monospace", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </>
          )}
          {tab === "costs" && <CostTracker repairs={repairs} setRepairs={setRepairs} />}
          {tab === "shops" && <ShopFinder vehicle={vehicle} />}
        </div>

        {/* Chat input */}
        {tab === "chat" && (
          <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(to top, #0f0f0f 75%, transparent)", paddingTop: 14, paddingBottom: 22 }}>
            <div style={{ display: "flex", gap: 8, background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "5px 5px 5px 14px", transition: "border-color 0.2s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = "#e8420a55"}
              onBlurCapture={e => e.currentTarget.style.borderColor = "#222"}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={vehicle.year && vehicle.make ? `Ask about your ${vehicle.year} ${vehicle.make}...` : "Describe your car problem..."}
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f5f0e8", fontSize: 14, resize: "none", fontFamily: "monospace", lineHeight: 1.5, padding: "8px 0", minHeight: 34, maxHeight: 110 }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px"; }} />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading}
                style={{ background: input.trim() && !loading ? "#e8420a" : "#1e1e1e", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() && !loading ? "#fff" : "#333", transition: "all 0.2s", flexShrink: 0, alignSelf: "flex-end" }}>
                <SendIcon />
              </button>
            </div>
            <p style={{ textAlign: "center", margin: "7px 0 0", fontSize: 10, color: "#333", fontFamily: "monospace" }}>For informational purposes only — consult a professional for safety-critical repairs.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.1)} }
        *{box-sizing:border-box;}
        textarea::placeholder{color:#444;}
        select option{background:#1e1e1e;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
      `}</style>
    </div>
  );
}
