import { useState, useMemo } from "react";

const ROSTER_TYPES = {
  W5: { label: "5:2", desc: "35 hari kerja + 14 hari cuti", sitedays: 35, leavedays: 14 },
  W6: { label: "6:2", desc: "42 hari kerja + 14 hari cuti", sitedays: 42, leavedays: 14 },
  W7: { label: "7:2", desc: "49 hari kerja + 14 hari cuti", sitedays: 49, leavedays: 14 },
  W8: { label: "8:2", desc: "56 hari kerja + 14 hari cuti", sitedays: 56, leavedays: 14 },
  W9: { label: "9:2", desc: "63 hari kerja + 14 hari cuti", sitedays: 63, leavedays: 14 },
  W10: { label: "10:2", desc: "70 hari kerja + 14 hari cuti", sitedays: 70, leavedays: 14 },
  CUSTOM: { label: "Custom", desc: "Atur jumlah hari kerja & cuti sendiri", sitedays: 35, leavedays: 14 },
};

const APP_VERSION = "1.1.2";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildSchedule(startDate, roster, extraLeave = 0, travelOnsite = 0, travelOffsite = 0, months = 24) {
  const endDate = addDays(startDate, months * 31);
  const schedule = {};
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    for (let t = 0; t < travelOnsite && cursor <= endDate; t++) {
      schedule[toKey(cursor)] = { type: "travel_out", label: travelOnsite > 1 ? `Perjalanan ke Site Hari ${t+1}` : "Perjalanan ke Site" };
      cursor = addDays(cursor, 1);
    }

    let siteRemaining = roster.sitedays;
    let siteCounter = 0;
    while (siteRemaining > 0 && cursor <= endDate) {
      siteCounter++;
      const isOffDay = siteCounter % 14 === 0;
      schedule[toKey(cursor)] = isOffDay
        ? { type: "offday", label: `Off Day (Hari ke-${siteCounter})` }
        : { type: "work", label: `Kerja Hari ke-${siteCounter}` };
      cursor = addDays(cursor, 1);
      siteRemaining--;
    }

    for (let t = 0; t < travelOffsite && cursor <= endDate; t++) {
      schedule[toKey(cursor)] = { type: "travel_back", label: travelOffsite > 1 ? `Perjalanan Pulang Hari ${t+1}` : "Perjalanan Pulang" };
      cursor = addDays(cursor, 1);
    }

    const totalLeave = roster.leavedays + extraLeave;
    for (let l = 1; l <= totalLeave && cursor <= endDate; l++) {
      const isExtra = l > roster.leavedays;
      schedule[toKey(cursor)] = {
        type: isExtra ? "leave_extra" : "leave",
        label: isExtra ? `Cuti Tahunan Hari ke-${l - roster.leavedays}` : `Cuti Hari ke-${l}`,
      };
      cursor = addDays(cursor, 1);
    }
  }
  return schedule;
}

const TYPE_COLORS = {
  work:        { bg: "#0f2744", text: "#93c5fd", dot: "#3b82f6" },
  offday:      { bg: "#0f2a1c", text: "#6ee7b7", dot: "#10b981" },
  travel_out:  { bg: "#2d2000", text: "#fcd34d", dot: "#f59e0b" },
  travel_back: { bg: "#2a0f0f", text: "#fca5a5", dot: "#ef4444" },
  leave:       { bg: "#2a0f2a", text: "#e879f9", dot: "#d946ef" },
  leave_extra: { bg: "#1a1a00", text: "#fde68a", dot: "#eab308" },
};

const LEGEND = [
  { type: "work",        label: "Kerja di Site" },
  { type: "offday",      label: "Off Day (Site)" },
  { type: "travel_out",  label: "Perjalanan ke Site" },
  { type: "travel_back", label: "Perjalanan Pulang" },
  { type: "leave",       label: "Cuti Roster" },
  { type: "leave_extra", label: "Cuti Tahunan" },
];

function DayCounter({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
      <span style={{ fontSize: 12, color: "#64748b", width: 100 }}>{label}</span>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={smallBtn}>−</button>
      <input
        type="number" min="0" max="14" value={value}
        onChange={e => onChange(Math.max(0, Math.min(14, Number(e.target.value))))}
        style={{ ...inputStyle, width: 48, textAlign: "center", padding: "5px 6px", fontSize: 13 }}
      />
      <button onClick={() => onChange(Math.min(14, value + 1))} style={smallBtn}>+</button>
      <span style={{ fontSize: 11, color: "#475569" }}>hari</span>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [rosterType, setRosterType] = useState("W7");
  const [customSitedays, setCustomSitedays] = useState(35);
  const [customLeavedays, setCustomLeavedays] = useState(14);
  const [startDate, setStartDate] = useState(toKey(today));
  const [extraLeave, setExtraLeave] = useState(0);
  const [travelOnsiteEnabled, setTravelOnsiteEnabled] = useState(false);
  const [travelOffsiteEnabled, setTravelOffsiteEnabled] = useState(false);
  const [travelOnsite, setTravelOnsite] = useState(1);
  const [travelOffsite, setTravelOffsite] = useState(1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered, setHovered] = useState(null);

  const effOnsite = travelOnsiteEnabled ? travelOnsite : 0;
  const effOffsite = travelOffsiteEnabled ? travelOffsite : 0;

  const roster = rosterType === "CUSTOM"
    ? { label: "Custom", desc: `${customSitedays} hari kerja + ${customLeavedays} hari cuti`, sitedays: Number(customSitedays) || 0, leavedays: Number(customLeavedays) || 0 }
    : ROSTER_TYPES[rosterType];

  const schedule = useMemo(
    () => buildSchedule(parseLocalDate(startDate), roster, Number(extraLeave), effOnsite, effOffsite, 24),
    [startDate, roster, extraLeave, effOnsite, effOffsite]
  );

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const grid = [];
    for (let i = 0; i < first.getDay(); i++) grid.push(null);
    for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(viewYear, viewMonth, d));
    return grid;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthStats = useMemo(() => {
    const counts = { work: 0, offday: 0, travel_out: 0, travel_back: 0, leave: 0, leave_extra: 0 };
    calendarDays.forEach(d => {
      if (!d) return;
      const s = schedule[toKey(d)];
      if (s && counts[s.type] !== undefined) counts[s.type]++;
    });
    return counts;
  }, [calendarDays, schedule]);

  const cycleTotal = effOnsite + roster.sitedays + effOffsite + roster.leavedays + Number(extraLeave);
  const startLabel = effOnsite > 0 ? "Tanggal Berangkat" : "Tanggal Mulai Kerja";
  const startHint = effOnsite > 0
    ? `+${effOnsite} hari perjalanan → mulai kerja hari ke-${effOnsite + 1}`
    : "Langsung hari pertama kerja di site";

  return (
    <div style={{ minHeight: "100vh", background: "#080d18", color: "#e2e8f0", fontFamily: "'Inter','Segoe UI',sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "#f1f5f9" }}>Kalender Roster</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569" }}>Visualisasi jadwal kerja, off day & cuti berdasarkan pola roster</p>
        </div>

        {/* Config */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16 }}>

            <div style={{ flex: "1 1 100%" }}>
              <label style={labelStyle}>Tipe Roster</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                {Object.keys(ROSTER_TYPES).map(k => (
                  <button key={k} onClick={() => setRosterType(k)} style={{
                    padding: "7px 16px", borderRadius: 7,
                    border: rosterType === k ? "2px solid #3b82f6" : "2px solid #1e293b",
                    background: rosterType === k ? "#1e3a5f" : "#0f172a",
                    color: rosterType === k ? "#93c5fd" : "#475569",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{ROSTER_TYPES[k].label}</button>
                ))}
              </div>
              {rosterType === "CUSTOM" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Hari Kerja:</span>
                    <input
                      type="number" min="1" max="365" value={customSitedays}
                      onChange={e => setCustomSitedays(Math.max(1, Math.min(365, Number(e.target.value))))}
                      style={{ ...inputStyle, width: 64, textAlign: "center", padding: "6px 8px" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Hari Cuti:</span>
                    <input
                      type="number" min="0" max="60" value={customLeavedays}
                      onChange={e => setCustomLeavedays(Math.max(0, Math.min(60, Number(e.target.value))))}
                      style={{ ...inputStyle, width: 64, textAlign: "center", padding: "6px 8px" }}
                    />
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{roster.desc}</p>
              )}
            </div>

            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>{startLabel}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>{startHint}</p>
            </div>

            <div style={{ flex: "0 1 160px" }}>
              <label style={labelStyle}>Cuti Tahunan <span style={{ color: "#334155", fontWeight: 400, textTransform: "none" }}>(opsional)</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setExtraLeave(v => Math.max(0, Number(v) - 1))} style={smallBtn}>−</button>
                <input
                  type="number" min="0" max="30" value={extraLeave}
                  onChange={e => setExtraLeave(Math.max(0, Math.min(30, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 52, textAlign: "center", padding: "7px 8px" }}
                />
                <button onClick={() => setExtraLeave(v => Math.min(30, Number(v) + 1))} style={smallBtn}>+</button>
                <span style={{ fontSize: 12, color: "#475569" }}>hari</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>Ditambahkan tiap siklus</p>
            </div>
          </div>

          <div style={{ background: "#0a0f1a", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Hari Perjalanan</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: travelOnsiteEnabled ? "#f59e0b" : "#1e293b", border: `2px solid ${travelOnsiteEnabled ? "#f59e0b" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onClick={() => setTravelOnsiteEnabled(v => !v)}>
                    {travelOnsiteEnabled && <span style={{ color: "#0a0f1a", fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 13, color: travelOnsiteEnabled ? "#fcd34d" : "#475569", fontWeight: 600 }}>Perjalanan Onsite (ke Site)</span>
                </label>
                {travelOnsiteEnabled && <DayCounter label="Jumlah hari:" value={travelOnsite} onChange={setTravelOnsite} />}
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: travelOffsiteEnabled ? "#ef4444" : "#1e293b", border: `2px solid ${travelOffsiteEnabled ? "#ef4444" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onClick={() => setTravelOffsiteEnabled(v => !v)}>
                    {travelOffsiteEnabled && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 13, color: travelOffsiteEnabled ? "#fca5a5" : "#475569", fontWeight: 600 }}>Perjalanan Offsite (pulang)</span>
                </label>
                {travelOffsiteEnabled && <DayCounter label="Jumlah hari:" value={travelOffsite} onChange={setTravelOffsite} />}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, background: "#0a0f1a", borderRadius: 8, padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#334155", marginRight: 4, fontWeight: 600 }}>SIKLUS</span>
            {effOnsite > 0 && <Chip color="#f59e0b" bg="#2d2000">Perj. Onsite {effOnsite} hr</Chip>}
            <Chip color="#3b82f6" bg="#0f2744">Kerja {roster.sitedays} hr</Chip>
            {effOffsite > 0 && <Chip color="#ef4444" bg="#2a0f0f">Perj. Offsite {effOffsite} hr</Chip>}
            <Chip color="#d946ef" bg="#2a0f2a">Cuti {roster.leavedays} hr</Chip>
            {Number(extraLeave) > 0 && <Chip color="#eab308" bg="#1a1a00">+Tahunan {extraLeave} hr</Chip>}
            <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>= <strong style={{ color: "#94a3b8" }}>{cycleTotal} hari</strong></span>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1e293b" }}>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #1e293b" }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign: "center", padding: "7px 2px", fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`b${i}`} style={{ minHeight: 68, borderBottom: "1px solid #0d1420", borderRight: "1px solid #0d1420" }} />;
              const key = toKey(day);
              const info = schedule[key];
              const col = info ? TYPE_COLORS[info.type] : null;
              const isToday = toKey(today) === key;
              const isHov = hovered === key;
              return (
                <div key={key} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} style={{
                  minHeight: 68, padding: "6px 5px",
                  borderBottom: "1px solid #0d1420", borderRight: "1px solid #0d1420",
                  background: isHov && col ? col.bg + "ee" : col ? col.bg : "#111827",
                  position: "relative", cursor: info ? "pointer" : "default", transition: "background 0.1s",
                }}>
                  <div style={{ marginBottom: 4 }}>
                    {isToday
                      ? <span style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{day.getDate()}</span>
                      : <span style={{ fontSize: 12, fontWeight: 500, color: col ? col.text : "#1e293b" }}>{day.getDate()}</span>
                    }
                  </div>
                  {col && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 2, background: col.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: col.text, lineHeight: 1.3 }}>
                        {info.type === "work" ? "Kerja" : info.type === "offday" ? "Off Day" : info.type === "travel_out" ? "Onsite" : info.type === "travel_back" ? "Offsite" : info.type === "leave_extra" ? "Cuti Thn" : "Cuti"}
                      </span>
                    </div>
                  )}
                  {isHov && info && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#0f172a", border: `1px solid ${col.dot}66`, borderRadius: 6, padding: "5px 10px", fontSize: 11, color: col.text, whiteSpace: "nowrap", zIndex: 20, pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.6)" }}>
                      {info.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Ringkasan {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LEGEND.map(({ type, label }) => {
              const count = monthStats[type];
              if (count === 0) return null;
              return (
                <div key={type} style={{ background: TYPE_COLORS[type].bg, border: `1px solid ${TYPE_COLORS[type].dot}33`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: TYPE_COLORS[type].dot }} />
                  <span style={{ fontSize: 12, color: TYPE_COLORS[type].text }}>{label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginLeft: 2 }}>{count}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>hr</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "4px 0 16px" }}>
          {LEGEND.map(({ type, label }) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: TYPE_COLORS[type].dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0 8px", borderTop: "1px solid #1e293b" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#334155" }}>v{APP_VERSION}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>Made with ❤️ by Moses</p>
        </div>

      </div>
    </div>
  );
}

function Chip({ color, bg, children }) {
  return <span style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 5, padding: "3px 8px", fontSize: 11, color, fontWeight: 600 }}>{children}</span>;
}

const labelStyle = { fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle = { background: "#0f172a", border: "2px solid #1e293b", borderRadius: 7, color: "#e2e8f0", fontSize: 14, padding: "7px 12px", width: "100%", boxSizing: "border-box", outline: "none" };
const smallBtn = { background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 6, width: 28, height: 34, fontSize: 16, fontWeight: 700, cursor: "pointer", flexShrink: 0 };
const navBtn = { background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 6, width: 32, height: 32, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 };
