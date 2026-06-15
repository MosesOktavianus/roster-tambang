import { useState, useMemo } from "react";

const APP_VERSION = "1.1.5";
const APP_NAME = "PRISMA";
const APP_DESC = "Proyeksi Sisa Masa Cuti";

const HOLIDAYS = {
  "2025-01-01":"Tahun Baru Masehi","2025-01-27":"Isra Mi'raj","2025-01-28":"Cuti Bersama Imlek",
  "2025-01-29":"Tahun Baru Imlek","2025-03-28":"Cuti Bersama Nyepi","2025-03-29":"Hari Raya Nyepi",
  "2025-03-31":"Idul Fitri 1446 H","2025-04-01":"Idul Fitri 1446 H","2025-04-02":"Cuti Bersama Idul Fitri",
  "2025-04-03":"Cuti Bersama Idul Fitri","2025-04-04":"Cuti Bersama Idul Fitri",
  "2025-04-07":"Cuti Bersama Idul Fitri","2025-04-18":"Wafat Isa Al Masih",
  "2025-05-01":"Hari Buruh Internasional","2025-05-12":"Hari Raya Waisak",
  "2025-05-13":"Cuti Bersama Waisak","2025-05-29":"Kenaikan Isa Al Masih",
  "2025-05-30":"Cuti Bersama Kenaikan Isa Al Masih","2025-06-01":"Hari Lahir Pancasila",
  "2025-06-06":"Idul Adha 1446 H","2025-06-09":"Cuti Bersama Idul Adha",
  "2025-06-27":"Tahun Baru Islam 1447 H","2025-08-17":"HUT Kemerdekaan RI",
  "2025-09-05":"Maulid Nabi Muhammad SAW","2025-12-25":"Hari Raya Natal","2025-12-26":"Cuti Bersama Natal",
  "2026-01-01":"Tahun Baru Masehi","2026-01-16":"Isra Mi'raj","2026-02-16":"Cuti Bersama Imlek",
  "2026-02-17":"Tahun Baru Imlek","2026-03-18":"Cuti Bersama Nyepi","2026-03-19":"Hari Raya Nyepi",
  "2026-03-20":"Cuti Bersama Idul Fitri","2026-03-21":"Idul Fitri 1447 H","2026-03-22":"Idul Fitri 1447 H",
  "2026-03-23":"Cuti Bersama Idul Fitri","2026-03-24":"Cuti Bersama Idul Fitri",
  "2026-04-03":"Wafat Isa Al Masih","2026-05-01":"Hari Buruh Internasional",
  "2026-05-14":"Kenaikan Isa Al Masih","2026-05-15":"Cuti Bersama Kenaikan Isa Al Masih",
  "2026-05-27":"Idul Adha 1447 H","2026-05-28":"Cuti Bersama Idul Adha",
  "2026-05-31":"Hari Raya Waisak","2026-06-01":"Hari Lahir Pancasila",
  "2026-06-16":"Tahun Baru Islam 1448 H","2026-08-17":"HUT Kemerdekaan RI",
  "2026-08-25":"Maulid Nabi Muhammad SAW","2026-12-24":"Cuti Bersama Natal","2026-12-25":"Hari Raya Natal",
};

const STAFF_ROSTER = {
  W5:{label:"5:2",sitedays:35,leavedays:14},
  W6:{label:"6:2",sitedays:42,leavedays:14},
  W7:{label:"7:2",sitedays:49,leavedays:14},
  W8:{label:"8:2",sitedays:56,leavedays:14},
};
const NONSTAFF_ROSTER = {
  W9:{label:"9:2",sitedays:63,leavedays:14},
};

const DAY_NAMES   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function parseLocal(str) {
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y, m-1, d);
}
function toKey(date) {
  return date.getFullYear() + "-" +
    String(date.getMonth()+1).padStart(2,"0") + "-" +
    String(date.getDate()).padStart(2,"0");
}
function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function pkbHitung(leavedays, sitedays, effectiveSite) {
  if (effectiveSite === sitedays) return leavedays;
  const raw = leavedays * effectiveSite / sitedays;
  const fl  = Math.floor(raw);
  return (raw - fl >= 0.5) ? fl + 1 : fl;
}

function buildSchedule(startDate, sitedays, leavedays, travelOn, travelOff, months) {
  const end = addDays(startDate, months * 31);
  const sch = {};
  let cur = new Date(startDate);
  while (cur <= end) {
    for (let t = 0; t < travelOn && cur <= end; t++) {
      sch[toKey(cur)] = { type:"travel_out", label: travelOn > 1 ? "Perjalanan ke Site Hari "+(t+1) : "Perjalanan ke Site" };
      cur = addDays(cur, 1);
    }
    let rem = sitedays, ctr = 0;
    while (rem > 0 && cur <= end) {
      ctr++;
      sch[toKey(cur)] = ctr % 14 === 0
        ? { type:"offday", label:"Off Day (Hari ke-"+ctr+")" }
        : { type:"work",   label:"Kerja Hari ke-"+ctr };
      cur = addDays(cur, 1);
      rem--;
    }
    for (let t = 0; t < travelOff && cur <= end; t++) {
      sch[toKey(cur)] = { type:"travel_back", label: travelOff > 1 ? "Perjalanan Pulang Hari "+(t+1) : "Perjalanan Pulang" };
      cur = addDays(cur, 1);
    }
    for (let l = 1; l <= leavedays && cur <= end; l++) {
      sch[toKey(cur)] = { type:"leave", label:"Cuti Hari ke-"+l };
      cur = addDays(cur, 1);
    }
  }
  return sch;
}

const TYPE_COLOR_DARK = {
  work:        {bg:"#0f2744",text:"#93c5fd",dot:"#3b82f6"},
  offday:      {bg:"#0f2a1c",text:"#6ee7b7",dot:"#10b981"},
  travel_out:  {bg:"#2d2000",text:"#fcd34d",dot:"#f59e0b"},
  travel_back: {bg:"#2a0f0f",text:"#fca5a5",dot:"#ef4444"},
  leave:       {bg:"#2a0f2a",text:"#e879f9",dot:"#d946ef"},
};
const TYPE_COLOR_LIGHT = {
  work:        {bg:"#dbeafe",text:"#1e40af",dot:"#3b82f6"},
  offday:      {bg:"#d1fae5",text:"#065f46",dot:"#10b981"},
  travel_out:  {bg:"#fef3c7",text:"#92400e",dot:"#f59e0b"},
  travel_back: {bg:"#fee2e2",text:"#991b1b",dot:"#ef4444"},
  leave:       {bg:"#fae8ff",text:"#701a75",dot:"#d946ef"},
};

const LEGEND = [
  {type:"work",        label:"Kerja di Site"},
  {type:"offday",      label:"Off Day"},
  {type:"travel_out",  label:"Perjalanan Onsite"},
  {type:"travel_back", label:"Perjalanan Offsite"},
  {type:"leave",       label:"Cuti Roster"},
];

function Checkbox({ checked, onToggle, color, dark }) {
  return (
    <span
      onClick={onToggle}
      style={{
        width:18, height:18, borderRadius:4, flexShrink:0, cursor:"pointer",
        background: checked ? color : (dark ? "#1e293b" : "#e2e8f0"),
        border: "2px solid " + (checked ? color : (dark ? "#334155" : "#cbd5e1")),
        display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
      }}
    >
      {checked && <span style={{color: color==="#f59e0b" ? "#0a0f1a" : "#fff", fontSize:11, fontWeight:800}}>✓</span>}
    </span>
  );
}

function NumInput({ value, onChange, min, max, inputStyle, btnStyle }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:4}}>
      <button onClick={function(){ onChange(Math.max(min, value-1)); }} style={btnStyle}>−</button>
      <input
        type="number" min={min} max={max} value={value}
        onChange={function(e){ onChange(Math.max(min, Math.min(max, Number(e.target.value)))); }}
        style={Object.assign({}, inputStyle, {width:48, textAlign:"center", padding:"5px 6px", fontSize:13})}
      />
      <button onClick={function(){ onChange(Math.min(max, value+1)); }} style={btnStyle}>+</button>
    </div>
  );
}

export default function App() {
  const today = new Date();

  // Theme
  const [dark, setDark] = useState(true);

  // Level & roster
  const [empType,   setEmpType]   = useState("staff");
  const [rosterKey, setRosterKey] = useState("W7");
  const [customOn,  setCustomOn]  = useState(false);
  const [customSite,  setCustomSite]  = useState(35);
  const [customLeave, setCustomLeave] = useState(14);

  // Dates
  const [startDate,  setStartDate]  = useState(toKey(today));
  const [extraLeave, setExtraLeave] = useState(0);

  // Travel
  const [travelOnEn,  setTravelOnEn]  = useState(false);
  const [travelOffEn, setTravelOffEn] = useState(false);
  const [travelOn,    setTravelOn]    = useState(1);
  const [travelOff,   setTravelOff]   = useState(1);

  // Penyesuaian
  const [penyEn,  setPenyEn]  = useState(false);
  const [arah,    setArah]    = useState("mundur");
  const [tglPeny, setTglPeny] = useState("");

  // Calendar nav
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered,   setHovered]   = useState(null);

  // --- Derived values ---
  const isStaff  = empType === "staff";
  const effOn    = isStaff && travelOnEn  ? travelOn  : 0;
  const effOff   = isStaff && travelOffEn ? travelOff : 0;

  const rosterOptions = isStaff ? STAFF_ROSTER : NONSTAFF_ROSTER;
  const safeKey       = rosterOptions[rosterKey] ? rosterKey : (isStaff ? "W7" : "W9");

  const baseRoster = useMemo(function() {
    if (customOn) return { label:"Custom", sitedays: Math.max(1, Number(customSite)), leavedays: Math.max(0, Number(customLeave)) };
    return rosterOptions[safeKey] || (isStaff ? STAFF_ROSTER.W7 : NONSTAFF_ROSTER.W9);
  }, [customOn, customSite, customLeave, safeKey, isStaff, rosterOptions]);

  // Tanggal normal cuti mulai (tanpa penyesuaian)
  const normalCutiStart = useMemo(function() {
    var cur = parseLocal(startDate);
    // skip travel onsite
    for (var t = 0; t < effOn; t++) cur = addDays(cur, 1);
    // skip site days
    for (var s = 0; s < baseRoster.sitedays; s++) cur = addDays(cur, 1);
    // skip travel offsite
    for (var o = 0; o < effOff; o++) cur = addDays(cur, 1);
    return cur;
  }, [startDate, baseRoster.sitedays, effOn, effOff]);

  // Batas tanggal picker
  const minDatePeny = arah === "mundur" ? toKey(addDays(normalCutiStart, 1))  : undefined;
  const maxDatePeny = arah === "maju"   ? toKey(addDays(normalCutiStart, -1)) : undefined;

  // Hitung penyesuaian
  const penyCalc = useMemo(function() {
    if (!penyEn || !tglPeny) {
      return { selisih:0, arahAktual:"mundur", effectiveSite: baseRoster.sitedays, adjLeave: baseRoster.leavedays + Number(extraLeave) };
    }
    var tglBaru   = parseLocal(tglPeny);
    var selisihRaw = diffDays(normalCutiStart, tglBaru); // + = mundur, - = maju
    var arahAktual = selisihRaw >= 0 ? "mundur" : "maju";
    var effectiveSite = Math.max(1, baseRoster.sitedays + selisihRaw);
    var adjLeaveBase  = pkbHitung(baseRoster.leavedays, baseRoster.sitedays, effectiveSite);
    var adjLeave      = adjLeaveBase + Number(extraLeave);
    return { selisih: Math.abs(selisihRaw), arahAktual, effectiveSite, adjLeave, adjLeaveBase };
  }, [penyEn, tglPeny, arah, normalCutiStart, baseRoster, extraLeave]);

  // Effective schedule params
  const schedSitedays  = penyEn && tglPeny ? penyCalc.effectiveSite : baseRoster.sitedays;
  const schedLeavedays = penyEn && tglPeny ? penyCalc.adjLeave      : baseRoster.leavedays + Number(extraLeave);

  const schedule = useMemo(function() {
    return buildSchedule(parseLocal(startDate), schedSitedays, schedLeavedays, effOn, effOff, 24);
  }, [startDate, schedSitedays, schedLeavedays, effOn, effOff]);

  // Calendar grid
  const calDays = useMemo(function() {
    var first = new Date(viewYear, viewMonth, 1);
    var last  = new Date(viewYear, viewMonth+1, 0);
    var g = [];
    for (var i = 0; i < first.getDay(); i++) g.push(null);
    for (var d = 1; d <= last.getDate(); d++) g.push(new Date(viewYear, viewMonth, d));
    return g;
  }, [viewYear, viewMonth]);

  // Stats
  const stats = useMemo(function() {
    var c = {work:0, offday:0, travel_out:0, travel_back:0, leave:0, holiday:0};
    calDays.forEach(function(d) {
      if (!d) return;
      var k = toKey(d);
      if (HOLIDAYS[k]) c.holiday++;
      var s = schedule[k];
      if (s && c[s.type] !== undefined) c[s.type]++;
    });
    return c;
  }, [calDays, schedule]);

  function prevMonth() { if (viewMonth===0){setViewMonth(11);setViewYear(function(y){return y-1;});}else setViewMonth(function(m){return m-1;}); }
  function nextMonth() { if (viewMonth===11){setViewMonth(0);setViewYear(function(y){return y+1;});}else setViewMonth(function(m){return m+1;}); }

  // Theme tokens
  var CM      = dark ? TYPE_COLOR_DARK : TYPE_COLOR_LIGHT;
  var bg      = dark ? "#080d18" : "#f1f5f9";
  var card    = dark ? "#111827" : "#ffffff";
  var border  = dark ? "#1e293b" : "#e2e8f0";
  var sub     = dark ? "#0a0f1a" : "#f8fafc";
  var text    = dark ? "#e2e8f0" : "#0f172a";
  var muted   = dark ? "#475569" : "#64748b";
  var faint   = dark ? "#334155" : "#94a3b8";
  var inp     = {background: dark?"#0f172a":"#f8fafc", border:"2px solid "+border, borderRadius:7, color:text, fontSize:14, padding:"7px 12px", boxSizing:"border-box", outline:"none"};
  var sBtn    = {background: dark?"#0f172a":"#f1f5f9", border:"1px solid "+border, color:muted, borderRadius:6, width:28, height:34, fontSize:16, fontWeight:700, cursor:"pointer", flexShrink:0};
  function lbl(c) { return {fontSize:11, color: c||faint, display:"block", marginBottom:7, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em"}; }

  // Rumus display
  var showRumus = penyEn && tglPeny && penyCalc.selisih > 0;
  var diffLeave = showRumus ? penyCalc.adjLeaveBase - baseRoster.leavedays : 0;

  return (
    <div style={{minHeight:"100vh", background:bg, color:text, fontFamily:"'Inter','Segoe UI',sans-serif", padding:"24px 16px", transition:"all 0.2s"}}>
      <div style={{maxWidth:740, margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24}}>
          <div>
            <h1 style={{margin:0, fontSize:28, fontWeight:900, letterSpacing:"-1px", color: dark?"#f1f5f9":"#0f172a"}}>{APP_NAME}</h1>
            <p style={{margin:"2px 0 0", fontSize:13, color:muted}}>{APP_DESC}</p>
          </div>
          <button
            onClick={function(){ setDark(function(d){return !d;}); }}
            style={{background: dark?"#1e293b":"#e2e8f0", border:"none", borderRadius:10, padding:"8px 12px", cursor:"pointer", fontSize:20, lineHeight:1, transition:"all 0.2s"}}
          >{dark ? "☀️" : "🌙"}</button>
        </div>

        {/* Config Card */}
        <div style={{background:card, border:"1px solid "+border, borderRadius:12, padding:20, marginBottom:16}}>

          {/* Level Karyawan */}
          <div style={{marginBottom:20}}>
            <label style={lbl()}>Level Karyawan</label>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {[["staff","Staff"],["nonstaff","Nonstaff"]].map(function(item) {
                var v = item[0], l = item[1];
                var active = !customOn && empType===v;
                return (
                  <button key={v}
                    onClick={function(){ setEmpType(v); setCustomOn(false); setRosterKey(v==="staff"?"W7":"W9"); setTglPeny(""); }}
                    style={{padding:"8px 24px", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer",
                      border: active ? "2px solid #6366f1" : "2px solid "+border,
                      background: active ? (dark?"#1e1b4b":"#eef2ff") : (dark?"#0f172a":sub),
                      color: active ? (dark?"#a5b4fc":"#4338ca") : muted, transition:"all 0.15s"}}
                  >{l}</button>
                );
              })}
              <button
                onClick={function(){ setCustomOn(function(c){return !c;}); setTglPeny(""); }}
                style={{padding:"8px 20px", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer",
                  border: customOn ? "2px solid #10b981" : "2px solid "+border,
                  background: customOn ? (dark?"#0f2a1c":"#d1fae5") : (dark?"#0f172a":sub),
                  color: customOn ? (dark?"#6ee7b7":"#065f46") : muted, transition:"all 0.15s"}}
              >Custom</button>
            </div>
            {customOn && (
              <div style={{display:"flex", gap:16, marginTop:12, flexWrap:"wrap"}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:12, color:muted}}>Hari Kerja:</span>
                  <input type="number" min="1" max="365" value={customSite}
                    onChange={function(e){ setCustomSite(Math.max(1,Math.min(365,Number(e.target.value)))); }}
                    style={Object.assign({}, inp, {width:64, textAlign:"center", padding:"6px 8px"})}/>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:12, color:muted}}>Hari Cuti:</span>
                  <input type="number" min="0" max="60" value={customLeave}
                    onChange={function(e){ setCustomLeave(Math.max(0,Math.min(60,Number(e.target.value)))); }}
                    style={Object.assign({}, inp, {width:64, textAlign:"center", padding:"6px 8px"})}/>
                </div>
              </div>
            )}
          </div>

          {/* Tipe Roster */}
          {!customOn && (
            <div style={{marginBottom:16}}>
              <label style={lbl()}>Tipe Roster</label>
              <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:6}}>
                {Object.keys(rosterOptions).map(function(k) {
                  var active = safeKey===k;
                  return (
                    <button key={k} onClick={function(){ setRosterKey(k); setTglPeny(""); }}
                      style={{padding:"7px 16px", borderRadius:7, fontWeight:700, fontSize:13, cursor:"pointer",
                        border: active ? "2px solid #3b82f6" : "2px solid "+border,
                        background: active ? (dark?"#1e3a5f":"#dbeafe") : (dark?"#0f172a":sub),
                        color: active ? (dark?"#93c5fd":"#1d4ed8") : muted, transition:"all 0.15s"}}
                    >{rosterOptions[k].label}</button>
                  );
                })}
              </div>
              <p style={{margin:0, fontSize:12, color:muted}}>{baseRoster.sitedays} hari kerja + {baseRoster.leavedays} hari cuti</p>
            </div>
          )}

          {/* Tanggal & Cuti Tahunan */}
          <div style={{display:"flex", flexWrap:"wrap", gap:16, marginBottom:16}}>
            <div style={{flex:"1 1 160px"}}>
              <label style={lbl()}>{effOn>0 ? "Tanggal Berangkat" : "Tanggal Mulai Kerja"}</label>
              <input type="date" value={startDate} onChange={function(e){ setStartDate(e.target.value); setTglPeny(""); }}
                style={Object.assign({}, inp, {width:"100%"})}/>
              {effOn>0 && <p style={{margin:"5px 0 0", fontSize:12, color:muted}}>+{effOn} hari perjalanan → kerja hari ke-{effOn+1}</p>}
            </div>
            <div style={{flex:"0 1 180px"}}>
              <label style={lbl()}>Cuti Tahunan <span style={{color:faint, fontWeight:400, textTransform:"none"}}>(opsional)</span></label>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <NumInput value={extraLeave} onChange={setExtraLeave} min={0} max={30} inputStyle={inp} btnStyle={sBtn}/>
                <span style={{fontSize:12, color:muted}}>hari</span>
              </div>
            </div>
          </div>

          {/* Hari Perjalanan — Staff only */}
          {isStaff && (
            <div style={{background:sub, borderRadius:10, padding:"14px 16px", marginBottom:14}}>
              <div style={{fontSize:11, fontWeight:700, color:faint, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12}}>Hari Perjalanan</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:20}}>
                {[
                  {en:travelOnEn,  setEn:setTravelOnEn,  val:travelOn,  setVal:setTravelOn,  label:"Perjalanan Onsite",  col:"#f59e0b", textCol: dark?"#fcd34d":"#92400e"},
                  {en:travelOffEn, setEn:setTravelOffEn, val:travelOff, setVal:setTravelOff, label:"Perjalanan Offsite", col:"#ef4444", textCol: dark?"#fca5a5":"#991b1b"},
                ].map(function(item, i) {
                  return (
                    <div key={i} style={{flex:"1 1 190px"}}>
                      <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer"}}>
                        <Checkbox checked={item.en} onToggle={function(){ item.setEn(function(v){return !v;}); }} color={item.col} dark={dark}/>
                        <span style={{fontSize:13, color: item.en?item.textCol:muted, fontWeight:600}}>{item.label}</span>
                      </label>
                      {item.en && (
                        <div style={{display:"flex", alignItems:"center", gap:8, marginTop:8}}>
                          <span style={{fontSize:12, color:muted, width:90}}>Jumlah hari:</span>
                          <NumInput value={item.val} onChange={item.setVal} min={0} max={14} inputStyle={inp} btnStyle={sBtn}/>
                          <span style={{fontSize:11, color:muted}}>hari</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Penyesuaian Hari Cuti */}
          <div style={{background:sub, borderRadius:10, padding:"14px 16px"}}>
            <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom: penyEn?14:0}}>
              <Checkbox checked={penyEn} onToggle={function(){ setPenyEn(function(v){return !v;}); setTglPeny(""); }} color="#6366f1" dark={dark}/>
              <span style={{fontSize:13, color: penyEn?(dark?"#a5b4fc":"#4338ca"):muted, fontWeight:700}}>Penyesuaian Hari Cuti</span>
            </label>

            {penyEn && (
              <div>
                <div style={{display:"flex", flexWrap:"wrap", gap:12, alignItems:"flex-end", marginBottom:12}}>
                  {/* Arah */}
                  <div>
                    <label style={lbl(muted)}>Arah Penyesuaian</label>
                    <div style={{display:"flex", gap:8}}>
                      {[["mundur","⬅ Mundur"],["maju","➡ Maju"]].map(function(item) {
                        var v = item[0], l = item[1];
                        var active = arah===v;
                        return (
                          <button key={v}
                            onClick={function(){ setArah(v); setTglPeny(""); }}
                            style={{padding:"7px 16px", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer",
                              border: active ? "2px solid #6366f1" : "2px solid "+border,
                              background: active ? (dark?"#1e1b4b":"#eef2ff") : (dark?"#0f172a":card),
                              color: active ? (dark?"#a5b4fc":"#4338ca") : muted, transition:"all 0.15s"}}
                          >{l}</button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Tanggal cuti baru */}
                  <div style={{flex:"1 1 180px"}}>
                    <label style={lbl(muted)}>Tanggal Mulai Cuti Baru</label>
                    <input type="date" value={tglPeny}
                      min={minDatePeny} max={maxDatePeny}
                      onChange={function(e){ setTglPeny(e.target.value); }}
                      style={Object.assign({}, inp, {width:"100%", borderColor: tglPeny?"#6366f1":border})}/>
                    <p style={{margin:"4px 0 0", fontSize:11, color:faint}}>
                      Jadwal normal: <strong style={{color: dark?"#a5b4fc":"#4338ca"}}>{toKey(normalCutiStart)}</strong>
                      {" · "}{arah==="mundur" ? "pilih sesudahnya" : "pilih sebelumnya"}
                    </p>
                  </div>
                </div>

                {/* Rumus PKB */}
                {showRumus && (
                  <div style={{background: dark?"#1a1a2e":"#f0f0ff", border:"1px solid "+(dark?"#2d2b6b":"#c7d2fe"), borderRadius:10, padding:"12px 16px"}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={dark?"#a5b4fc":"#4338ca"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"/>
                        <line x1="8" y1="6" x2="16" y2="6"/>
                        <line x1="8" y1="10" x2="10" y2="10"/>
                        <line x1="14" y1="10" x2="16" y2="10"/>
                        <line x1="8" y1="14" x2="10" y2="14"/>
                        <line x1="14" y1="14" x2="16" y2="14"/>
                        <line x1="8" y1="18" x2="10" y2="18"/>
                        <line x1="14" y1="18" x2="16" y2="18"/>
                      </svg>
                      <span style={{fontSize:11, fontWeight:700, color: dark?"#a5b4fc":"#4338ca", textTransform:"uppercase", letterSpacing:"0.06em"}}>Perhitungan PKB</span>
                    </div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:12, lineHeight:2, color: dark?"#c7d2fe":"#3730a3"}}>
                      <div>
                        <span style={{color:muted}}>Hari kerja efektif  </span>
                        <span style={{color:text, fontWeight:600}}>
                          = {baseRoster.sitedays} {penyCalc.arahAktual==="mundur" ? "+" : "-"} {penyCalc.selisih} = <strong style={{color: dark?"#a5b4fc":"#4338ca"}}>{penyCalc.effectiveSite} hari</strong>
                        </span>
                      </div>
                      <div>
                        <span style={{color:muted}}>Cuti setelah sesuai </span>
                        <span style={{color:text, fontWeight:600}}>
                          = {baseRoster.leavedays} × {penyCalc.effectiveSite} ÷ {baseRoster.sitedays} = <strong style={{color: dark?"#a5b4fc":"#4338ca"}}>{penyCalc.adjLeaveBase} hari</strong>
                        </span>
                      </div>
                      {diffLeave !== 0 && (
                        <div style={{marginTop:4, paddingTop:6, borderTop:"1px solid "+(dark?"#2d2b6b":"#c7d2fe")}}>
                          <span style={{color:muted}}>Perubahan cuti      </span>
                          <span style={{fontWeight:700, fontSize:13, color: penyCalc.arahAktual==="mundur" ? (dark?"#6ee7b7":"#065f46") : (dark?"#fca5a5":"#dc2626")}}>
                            {penyCalc.arahAktual==="mundur" ? "▲ +" : "▼ -"}{Math.abs(diffLeave)} hari dari normal ({baseRoster.leavedays} hari)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div style={{background:card, border:"1px solid "+border, borderRadius:12, overflow:"hidden", marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid "+border}}>
            <button onClick={prevMonth} style={{background: dark?"#0f172a":"#f1f5f9", border:"1px solid "+border, color:muted, borderRadius:6, width:32, height:32, fontSize:20, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0}}>‹</button>
            <h2 style={{margin:0, fontSize:17, fontWeight:700, color:text}}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} style={{background: dark?"#0f172a":"#f1f5f9", border:"1px solid "+border, color:muted, borderRadius:6, width:32, height:32, fontSize:20, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0}}>›</button>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid "+border}}>
            {DAY_NAMES.map(function(d) {
              return <div key={d} style={{textAlign:"center", padding:"7px 2px", fontSize:10, fontWeight:700, color:faint, textTransform:"uppercase", letterSpacing:"0.06em"}}>{d}</div>;
            })}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)"}}>
            {calDays.map(function(day, i) {
              if (!day) return <div key={"b"+i} style={{minHeight:72, borderBottom:"1px solid "+(dark?"#0d1420":border), borderRight:"1px solid "+(dark?"#0d1420":border)}}/>;
              var k       = toKey(day);
              var info    = schedule[k];
              var col     = info ? CM[info.type] : null;
              var holiday = HOLIDAYS[k];
              var isToday = toKey(today)===k;
              var isHov   = hovered===k;
              var isCutiTarget = penyEn && tglPeny && k===tglPeny;
              return (
                <div key={k}
                  onMouseEnter={function(){ setHovered(k); }}
                  onMouseLeave={function(){ setHovered(null); }}
                  style={{
                    minHeight:72, padding:"5px 4px",
                    borderBottom:"1px solid "+(dark?"#0d1420":border),
                    borderRight:"1px solid "+(dark?"#0d1420":border),
                    background: isHov&&col ? col.bg+"ee" : col ? col.bg : (holiday?(dark?"#1a0a0a":"#fff5f5"):card),
                    position:"relative", cursor:(info||holiday)?"pointer":"default", transition:"background 0.1s",
                    outline: isCutiTarget ? "2px solid #6366f1" : "none",
                    outlineOffset:"-2px",
                  }}
                >
                  <div style={{marginBottom:2}}>
                    {isToday
                      ? <span style={{background:"#3b82f6", color:"#fff", borderRadius:"50%", width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800}}>{day.getDate()}</span>
                      : <span style={{fontSize:12, fontWeight: holiday?700:500, color: holiday?(dark?"#fca5a5":"#dc2626"):(col?col.text:(dark?"#1e293b":"#cbd5e1"))}}>{day.getDate()}</span>
                    }
                  </div>
                  {col && (
                    <div style={{display:"flex", alignItems:"flex-start", gap:3, marginBottom:1}}>
                      <span style={{width:5, height:5, borderRadius:"50%", marginTop:3, background:col.dot, flexShrink:0}}/>
                      <span style={{fontSize:9, color:col.text, lineHeight:1.3}}>
                        {info.type==="work"?"Kerja":info.type==="offday"?"Off":info.type==="travel_out"?"Onsite":info.type==="travel_back"?"Offsite":"Cuti"}
                      </span>
                    </div>
                  )}
                  {holiday && (
                    <div style={{display:"flex", alignItems:"flex-start", gap:2}}>
                      <span style={{fontSize:8, lineHeight:1}}>🔴</span>
                      <span style={{fontSize:8, color: dark?"#fca5a5":"#dc2626", lineHeight:1.3, wordBreak:"break-word"}}>{holiday.length>14 ? holiday.slice(0,13)+"…" : holiday}</span>
                    </div>
                  )}
                  {isCutiTarget && (
                    <div style={{position:"absolute", top:2, right:3}}>
                      <span style={{fontSize:8, background:"#6366f1", color:"#fff", borderRadius:3, padding:"1px 3px", fontWeight:700}}>Cuti Baru</span>
                    </div>
                  )}
                  {isHov && (info||holiday) && (
                    <div style={{position:"absolute", top:"calc(100% + 4px)", left:"50%", transform:"translateX(-50%)", background: dark?"#0f172a":"#fff", border:"1px solid "+(dark?"#334155":border), borderRadius:6, padding:"6px 10px", zIndex:20, pointerEvents:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.25)", minWidth:140}}>
                      {info && <p style={{margin:0, fontSize:11, color:col.text, fontWeight:600}}>{info.label}</p>}
                      {holiday && <p style={{margin: info?"2px 0 0":0, fontSize:11, color: dark?"#fca5a5":"#dc2626"}}>🔴 {holiday}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{background:card, border:"1px solid "+border, borderRadius:12, padding:"16px 20px", marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:faint, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12}}>
            Ringkasan {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
            {LEGEND.map(function(item) {
              var cnt = stats[item.type]; if (!cnt) return null;
              var c = CM[item.type];
              return (
                <div key={item.type} style={{background:c.bg, border:"1px solid "+c.dot+"33", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:6}}>
                  <span style={{width:7, height:7, borderRadius:"50%", background:c.dot}}/>
                  <span style={{fontSize:12, color:c.text}}>{item.label}</span>
                  <span style={{fontSize:16, fontWeight:800, color: dark?"#fff":"#0f172a", marginLeft:2}}>{cnt}</span>
                  <span style={{fontSize:11, color:muted}}>hr</span>
                </div>
              );
            })}
            {stats.holiday > 0 && (
              <div style={{background: dark?"#2a0a0a":"#fff5f5", border:"1px solid #ef444433", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:12}}>🔴</span>
                <span style={{fontSize:12, color: dark?"#fca5a5":"#dc2626"}}>Libur Nasional</span>
                <span style={{fontSize:16, fontWeight:800, color: dark?"#fff":"#0f172a", marginLeft:2}}>{stats.holiday}</span>
                <span style={{fontSize:11, color:muted}}>hr</span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{display:"flex", flexWrap:"wrap", gap:10, padding:"4px 0 16px", alignItems:"center"}}>
          {LEGEND.map(function(item) {
            return (
              <div key={item.type} style={{display:"flex", alignItems:"center", gap:4}}>
                <span style={{width:8, height:8, borderRadius:2, background:CM[item.type].dot, flexShrink:0}}/>
                <span style={{fontSize:11, color:muted}}>{item.label}</span>
              </div>
            );
          })}
          <div style={{display:"flex", alignItems:"center", gap:4}}>
            <span style={{fontSize:11}}>🔴</span>
            <span style={{fontSize:11, color:muted}}>Libur Nasional</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:"center", padding:"16px 0 8px", borderTop:"1px solid "+border}}>
          <p style={{margin:0, fontSize:11, color:faint}}>v{APP_VERSION}</p>
          <p style={{margin:"4px 0 0", fontSize:12, color:muted}}>Made with ❤️ by Moses</p>
        </div>

      </div>
    </div>
  );
}
