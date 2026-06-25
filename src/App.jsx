import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext } from "react";
import {
  motion, AnimatePresence, useScroll, useTransform, useInView,
  useReducedMotion, animate,
} from "framer-motion";
import {
  TrendingUp, TrendingDown, Plus, Menu, X,
  Target, Wallet, ChevronRight, Search, Trash2, Upload,
} from "lucide-react";

/* ============================================================================
   FinanceOS — premium financial operating system (React + Tailwind + Framer)
   ----------------------------------------------------------------------------
   Install: npm i framer-motion

   Design language
     • Editorial titles in Fraunces (large, light); systemic labels in tracked
       uppercase — the contrast is the "operating system" feel.
     • Free-scroll with per-section parallax drift (no snap = no abruptness).
     • Statement-style ledger, not an admin grid: segmented control, hover-only
       delete, one quiet summary line.
     • Values bright + mono; labels small + muted + tracked. Hierarchy first.
     • Reduced-motion fully honored. Boots empty until you import / add.
   ========================================================================== */

const EASE = [0.16, 1, 0.3, 1];
const ScrollContext = createContext(null);

/* ---------------------------------------------------------------- constants */
const CAT_GROUPS = {
  "Recurring Fixed":      ["Rent", "Electricity", "Mobile Bill", "Internet", "Insurance", "Loan EMI", "Cash Withdrawal"],
  "Recurring Variable":   ["Groceries", "Milk", "Vegetables", "Fuel"],
  "Food & Dining":        ["Swiggy / Zomato", "Restaurant", "Chai / Snacks"],
  "Shopping":             ["Amazon / Flipkart", "Clothing", "Electronics"],
  "Travel":               ["Travel - Local", "Travel - Train / Bus", "Travel - Flight"],
  "Health & Medical":     ["Doctor", "Pharmacy", "Diagnostics"],
  "Entertainment":        ["OTT / Streaming", "Movies / Events"],
  "Education":            ["Coaching / Tuition", "Online Courses"],
  "Investments / Savings":["Mutual Fund / SIP", "FD / RD"],
  "Internal Transfers":   ["Internal Transfers"],
  "Personal Care":        ["Salon / Grooming", "Gym / Fitness"],
  "Miscellaneous":        ["Miscellaneous"],
};
const ALL_CATS = Object.values(CAT_GROUPS).flat();
const GROUP_OF = (cat) =>
  Object.keys(CAT_GROUPS).find((g) => CAT_GROUPS[g].includes(cat)) || "Miscellaneous";

const RHYTHM_CATS = [
  "Mutual Fund / SIP", "FD / RD", "Rent", "Electricity",
  "Mobile Bill", "Internet", "Insurance", "Loan EMI", "OTT / Streaming", "Cash Withdrawal",
];
const GROUP_COLORS = {
  "Recurring Fixed": "#CBB079", "Recurring Variable": "#7FB08A",
  "Food & Dining": "#9CCBA6", "Shopping": "#B49BD6", "Travel": "#7FB6C9",
  "Health & Medical": "#D98C9E", "Entertainment": "#9B97E0", "Education": "#A9C97E",
  "Investments / Savings": "#E4D2A4", "Internal Transfers": "#8A938C",
  "Personal Care": "#D6A6B8", "Miscellaneous": "#8A938C",
};

/* CLASSIFY — most-specific first; [subcategory, [payee fragments]] */
const CLASSIFY = [
  ["Doctor",    ["bilay", "kailash dayaram"]],
  ["Pharmacy",  ["kailash dayaram pharmacy", "chemist", "medplus", "1mg", "medicine", "apollo pharmacy", "pharmacy"]],
  ["Milk",      ["raju bhagoji pawar", "yamuna dairy"]],
  ["Groceries", ["hemant stores", "zepto", "bigbasket", "blinkit", "dmart", "grofers", "instamart", "grocery", "supermarket"]],
  ["Travel - Local", ["kapoor a", "sagar balkrishna pawa", "mumbai metropolitan r", "uber", "ola", "rapido", "metro", "fastag", "irctc", "auto", "cab"]],
  ["Rent",        ["chandrashekhar jaipra", "rent", "landlord"]],
  ["Electricity", ["electricity", "mseb", "bescom", "power bill", "tata power"]],
  ["Mobile Bill", ["jio", "airtel", "vodafone", "bsnl", "recharge"]],
  ["Insurance",   ["lic", "insurance", "premium"]],
  ["Loan EMI",    ["emi", "loan"]],
  ["Internal Transfers", ["kinjal jitendra kadam", "jitendra r kadam", "jivak", "kamal tewari", "vanitadilipwalke", "jitendraramchandrak", "rajbahardur jagpati y", "0741ri26022208", "ppr064708747463", "souvijayadeviyadave", "pssvms jaywant harcha", "manasi", "0741ri26019285", "nishi"]],
  ["Mutual Fund / SIP", ["ach-dr-tp", "ach-dr-bd-axis", "ach-dr-prudent23022026", "ach-dr-bdecs-franklintemp-b-tx", "nps trust", "safe gold", "sip", "groww", "zerodha", "mutual fund", "prudent", "franklintemp"]],
  ["Chai / Snacks", ["ganesh ashok mohite", "sangita rajesh sahani", "rupali prashant bhoir", "yamuna dairy chai", "shalini sharad patil", "chai", "starbucks", "bakery", "snack", "tea stall"]],
  ["Restaurant", ["restaurant", "cafe", "pizza", "biryani", "hotel", "dhaba", "dine"]],
  ["Swiggy / Zomato", ["swiggy", "zomato"]],
  ["Amazon / Flipkart", ["ekart", "amazon", "flipkart", "myntra", "ajio", "meesho"]],
  ["Clothing",          ["clothing", "fashion", "garment"]],
  ["Cash Withdrawal", ["atm-cash", "atm cash", "shailendra ramesh", "vijay kumar bhailal k"]],
  ["Fuel", ["petrol", "diesel", "fuel", "hpcl", "bpcl", "iocl", "hp petrol"]],
  ["OTT / Streaming", ["netflix", "spotify", "hotstar", "prime video", "youtube premium"]],
  ["Doctor",    ["doctor", "clinic", "hospital", "dr "]],
  ["Pharmacy",  ["medical store"]],
  ["Groceries", ["vegetable", "sabzi", "kirana"]],
];
function classify(note) {
  const s = (note || "").toLowerCase();
  for (const [cat, kws] of CLASSIFY) if (kws.some((k) => s.includes(k.toLowerCase()))) return cat;
  return "Miscellaneous";
}

/* ------------------------------------------------------------------- months */
const NOW = new Date();
function monthList(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    out.push({
      y: d.getFullYear(), m: d.getMonth(),
      short: d.toLocaleString("default", { month: "short" }),
      long: d.toLocaleString("default", { month: "long", year: "numeric" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return out;
}
const MONTHS = monthList(6);

/* ----------------------------------------------- sample data (unused at boot)
   Swap buildSample() for a fetch to your Apps Script Web App returning rows:
   { id, date:'YYYY-MM-DD', cat, type:'credit'|'debit', amt, note } */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildSample() {
  const rng = mulberry32(20260610);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const around = (b, v) => Math.round(b + (rng() - 0.5) * 2 * v);
  const rows = []; let id = 1;
  const add = (mo, day, cat, type, amt, note) =>
    rows.push({ id: id++, date: `${mo.key}-${String(Math.max(1, Math.min(28, day))).padStart(2, "0")}`, cat, type, amt: Math.max(1, amt), note });
  MONTHS.forEach((mo, idx) => {
    add(mo, 1, "Miscellaneous", "credit", around(64000 + idx * 1200, 1500), "Salary credit");
    add(mo, 2, "Rent", "debit", 18000, "Chandrashekhar Jaipra");
    add(mo, 3, "Mutual Fund / SIP", "debit", 10000, pick(["ACH-DR-TP", "Safe Gold"]));
    for (let i = 0; i < 4; i++) add(mo, around(12, 10), "Groceries", "debit", around(900, 600), "Hemant Stores");
    for (let i = 0; i < 6; i++) add(mo, around(15, 13), "Travel - Local", "debit", around(120, 90), "Mumbai Metropolitan R");
  });
  return rows;
}

/* --------------------------------------------------------------- data hook */
/* ----------------------------------------------------------------- auth
   Google OAuth — only your Google account can access the dashboard.
   The CLIENT_ID is safe to be public (it's not a secret).
   -------------------------------------------------------------------------- */
const CLIENT_ID = "833202731310-jsjq6r9ie622fkou8ciprhlm822cl3v4.apps.googleusercontent.com";
const ALLOWED_EMAILS = ["kinjalkadam25@gmail.com", "jitendra04.kadam@gmail.com"];

/* ----------------------------------------------------------------- backend */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9pALAjN_EDDkIp1-OZf_y-qLa5jnTtN53Dse1vUzzIim93eYZixBufxwlgNCQ7_4W/exec"; // e.g. "https://script.google.com/macros/s/AKfyc.../exec"
const API_TOKEN = "fos_kinjal2026";       // must match the token set in Apps Script via setToken()
const CONNECTED = /^https:\/\//.test(APPS_SCRIPT_URL);

async function apiGet(action, extra = {}) {
  const qs = new URLSearchParams({ action, token: API_TOKEN, ...extra }).toString();
  const res = await fetch(`${APPS_SCRIPT_URL}?${qs}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
async function apiPost(action, payload = {}) {
  // text/plain keeps this a CORS-safe "simple request" (no preflight)
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: API_TOKEN, ...payload }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

/* ----------------------------------------------------------------- auth hook */
function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const clientRef = useRef(null);
  useEffect(() => {
    if (document.getElementById("gsi-script")) { setReady(true); return; }
    const s = document.createElement("script");
    s.id = "gsi-script"; s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => {
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid email profile",
        callback: (res) => {
          if (res.error) return;
          fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${res.access_token}` } })
            .then((r) => r.json())
            .then((info) => {
              if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes(info.email)) { setUser(null); alert(`Access restricted. Sign in with an authorized account.`); return; }
              setUser({ email: info.email, name: info.name, picture: info.picture, accessToken: res.access_token });
            })
            .catch(() => setUser(null));
        },
      });
      setReady(true);
    };
    document.head.appendChild(s);
  }, []);
  const signIn  = useCallback(() => { clientRef.current?.requestAccessToken(); }, []);
  const signOut = useCallback(() => { if (user?.accessToken) window.google?.accounts.oauth2.revoke(user.accessToken, () => {}); setUser(null); }, [user]);
  return { user, signIn, signOut, ready };
}

function LoginScreen({ onSignIn, ready }) {
  return (
    <div className="fos font-ui bg-void text-app screen-h flex flex-col items-center justify-center gap-8 px-6">
      <ThemeStyles />
      <div className="fixed inset-0 ambient pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex flex-col items-center gap-6 text-center" style={{ maxWidth: 360 }}>
        <div className="accent-grad rounded-2xl flex items-center justify-center" style={{ width: 56, height: 56 }}>
          <Wallet size={26} style={{ color: "#1a160c" }} />
        </div>
        <div>
          <h1 className="font-display text-app mb-2" style={{ fontSize: 32, lineHeight: 1.1 }}>FinanceOS</h1>
          <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6 }}>Your personal financial operating system.<br />Sign in to access your dashboard.</p>
        </div>
        <motion.button onClick={onSignIn} disabled={!ready} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 glass rounded-2xl px-6 py-4 cursor-pointer border border-line2 w-full justify-center"
          style={{ fontSize: 15, fontWeight: 600, opacity: ready ? 1 : 0.5 }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign in with Google
        </motion.button>
        <p className="text-faint" style={{ fontSize: 12 }}>Access restricted to authorized accounts.</p>
      </motion.div>
    </div>
  );
}

/* --------------------------------------------------------------- data hook
   Loads from the Sheet on mount (if connected), writes through on every
   change, and surfaces loading / error so the UI can respond. Falls back to
   in-memory state when not connected.
   -------------------------------------------------------------------------- */
function useFinanceData() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(CONNECTED);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!CONNECTED) { setLoading(false); return; }
    setLoading(true); setError("");
    apiGet("getAll")
      .then((d) => setTxns(Array.isArray(d.expenses) ? d.expenses : []))
      .catch((e) => setError(e.message || "Could not load your data"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const addTransaction = useCallback((t) => {
    const row = { ...t, id: String(t.id || Date.now() + "" + Math.floor(Math.random() * 1000)) };
    setTxns((p) => [row, ...p]);                       // optimistic
    if (CONNECTED) apiPost("addExpense", row).catch((e) => setError(e.message));
  }, []);

  const removeTransaction = useCallback((id) => {
    setTxns((p) => p.filter((t) => String(t.id) !== String(id)));
    if (CONNECTED) apiPost("deleteExpense", { id: String(id) }).catch((e) => setError(e.message));
  }, []);

  const bulkAdd = useCallback((rows) => {
    const stamped = rows.map((r) => ({ ...r, id: String(r.id || Date.now() + "" + Math.floor(Math.random() * 100000)) }));
    setTxns((p) => [...stamped, ...p]);
    if (CONNECTED) apiPost("bulkAdd", { expenses: stamped }).catch((e) => setError(e.message));
  }, []);

  const clearAll = useCallback(() => {
    setTxns([]);
    if (CONNECTED) apiPost("clearAll").catch((e) => setError(e.message));
  }, []);

  return { txns, loading, error, retry: load, dismissError: () => setError(""), addTransaction, removeTransaction, bulkAdd, clearAll };
}


/* ---------------------------------------------------------------- selectors */
const fmt = (n) => Math.round(n).toLocaleString("en-IN");
const inMonth = (t, mo) => t.date.startsWith(mo.key);
const isCredit = (t) => String(t.type || "").trim().toLowerCase() === "credit";
function totalsFor(txns, mo) {
  const rows = txns.filter((t) => inMonth(t, mo));
  const credit = rows.filter((t) => isCredit(t)).reduce((s, t) => s + t.amt, 0);
  const debit = rows.filter((t) => !isCredit(t)).reduce((s, t) => s + t.amt, 0);
  return { rows, credit, debit, net: credit - debit, count: rows.length };
}
function groupBreakdown(rows) {
  const map = {};
  rows.filter((t) => !isCredit(t)).forEach((t) => {
    const g = GROUP_OF(t.cat);
    map[g] = map[g] || { total: 0, subs: {} };
    map[g].total += t.amt;
    map[g].subs[t.cat] = (map[g].subs[t.cat] || 0) + t.amt;
  });
  return Object.entries(map)
    .map(([g, d]) => ({ group: g, total: d.total, subs: Object.entries(d.subs).map(([name, amt]) => ({ name, amt })).sort((a, b) => b.amt - a.amt) }))
    .sort((a, b) => b.total - a.total);
}
const seriesAll = (txns) => MONTHS.map((mo) => ({ mo, ...totalsFor(txns, mo) }));
function computeInsights(txns, idx) {
  const series = seriesAll(txns); const cur = series[idx];
  if (!cur.count) return [];
  const out = [];
  const curBreak = groupBreakdown(cur.rows);
  if (curBreak.length) out.push({ fig: `₹${fmt(curBreak[0].total)}`, text: <>Your largest spending group this month is <b>{curBreak[0].group}</b>.</> });
  const priors = series.slice(Math.max(0, idx - 3), idx).filter((s) => s.count);
  if (priors.length) {
    const catAvg = {};
    priors.forEach((p) => { const m = {}; p.rows.filter((t) => !isCredit(t)).forEach((t) => (m[t.cat] = (m[t.cat] || 0) + t.amt)); Object.entries(m).forEach(([c, v]) => { (catAvg[c] = catAvg[c] || []).push(v); }); });
    const curCat = {}; cur.rows.filter((t) => !isCredit(t)).forEach((t) => (curCat[t.cat] = (curCat[t.cat] || 0) + t.amt));
    let best = null;
    Object.entries(curCat).forEach(([c, v]) => { const arr = catAvg[c]; if (arr && arr.length) { const avg = arr.reduce((s, x) => s + x, 0) / arr.length; if (avg > 0) { const pct = Math.round(((v - avg) / avg) * 100); if (pct >= 20 && (!best || pct > best.pct)) best = { c, pct }; } } });
    if (best) out.push({ fig: `+${best.pct}%`, text: <><b>{best.c}</b> is running {best.pct}% above your recent average.</> });
  }
  const prev = series[idx - 1];
  if (prev && prev.count) { const d = cur.net - prev.net; out.push({ fig: `${d >= 0 ? "+" : "−"}₹${fmt(Math.abs(d))}`, text: d >= 0 ? <>You're keeping <b>more</b> than last month.</> : <>Your net position slipped versus last month.</> }); }
  const invest = cur.rows.filter((t) => !isCredit(t) && CAT_GROUPS["Investments / Savings"].includes(t.cat)).reduce((s, t) => s + t.amt, 0);
  if (invest > 0 && out.length < 3) out.push({ fig: `₹${fmt(invest)}`, text: <>You put <b>₹{fmt(invest)}</b> to work in investments.</> });
  return out.slice(0, 3);
}
function computeHealth(txns, idx) {
  const series = seriesAll(txns); const withData = series.filter((s) => s.count);
  if (!withData.length) return null;
  const cur = series[idx]; const factors = []; let wSum = 0, sSum = 0;
  if (cur.credit > 0) { const sr = Math.max(0, Math.min(1, cur.net / cur.credit)); factors.push({ name: "Savings rate", weight: 40, pct: sr, val: `${Math.round(sr * 100)}%`, note: "Net saved as a share of income this month." }); wSum += 40; sSum += sr * 40; }
  if (withData.length >= 2) { const ds = withData.map((s) => s.debit); const mean = ds.reduce((a, b) => a + b, 0) / ds.length; const variance = ds.reduce((a, b) => a + (b - mean) ** 2, 0) / ds.length; const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; const stab = Math.max(0, Math.min(1, 1 - cv)); factors.push({ name: "Spending stability", weight: 30, pct: stab, val: `${Math.round(stab * 100)}%`, note: "How consistent your monthly spending is across recent months." }); wSum += 30; sSum += stab * 30; }
  if (cur.debit > 0) { const fixed = cur.rows.filter((t) => !isCredit(t) && RHYTHM_CATS.includes(t.cat)).reduce((s, t) => s + t.amt, 0); const flex = 1 - Math.max(0, Math.min(1, fixed / cur.debit)); factors.push({ name: "Spending flexibility", weight: 30, pct: flex, val: `${Math.round(flex * 100)}%`, note: "Share of spending not locked in recurring commitments." }); wSum += 30; sSum += flex * 30; }
  return { score: wSum > 0 ? Math.round((sSum / wSum) * 100) : 0, factors, incomeMissing: cur.credit <= 0 };
}
function avgSurplus(txns, idx) {
  const s = seriesAll(txns).slice(Math.max(0, idx - 3), idx + 1).filter((x) => x.count && x.net > 0);
  return s.length ? Math.round(s.reduce((a, x) => a + x.net, 0) / s.length) : 0;
}

/* -------------------------------------------------------------------- hooks */
function useCountUp(target, inView) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    if (reduce) { setDisplay(target); fromRef.current = target; return; }
    if (!inView) return;
    const controls = animate(fromRef.current, target, { duration: 1, ease: EASE, onUpdate: (v) => setDisplay(v), onComplete: () => { fromRef.current = target; } });
    return () => controls.stop();
  }, [target, inView, reduce]);
  return reduce ? target : display;
}

/* usePullToRefresh — pull down at the top of the scroll container to re-fetch.
   Only calls onRefresh() (the data reload) — never touches auth. */
function usePullToRefresh(scrollRef, onRefresh) {
  const [pull, setPull] = useState(0);      // current pull distance in px
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const THRESHOLD = 70;                       // px to trigger
  const MAX = 110;                            // px clamp

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onStart = (e) => {
      // Only begin a pull when already scrolled to the very top
      if (el.scrollTop <= 0 && !refreshing) {
        startY.current = e.touches ? e.touches[0].clientY : e.clientY;
        pulling.current = true;
      }
    };
    const onMove = (e) => {
      if (!pulling.current || refreshing) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = y - startY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        // Prevent native pull-to-refresh / overscroll reload immediately
        if (e.cancelable) e.preventDefault();
        // resistance curve so it feels rubbery
        const dist = Math.min(MAX, dy * 0.5);
        setPull(dist);
      } else {
        pulling.current = false;
        setPull(0);
      }
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try { await onRefresh(); } finally {
          setTimeout(() => { setRefreshing(false); setPull(0); }, 500);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [scrollRef, onRefresh, pull, refreshing]);

  return { pull, refreshing, threshold: THRESHOLD };
}

/* ------------------------------------------------------------- motion presets */
const vStagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const vItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } };

/* -------------------------------------------------------------------- theme */
function ThemeStyles() {
  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .fos{
    --void:#0E1311;--surface:#141B17;--surface2:#19211D;
    --glass:rgba(26,34,29,0.55);--glass-line:rgba(255,255,255,0.09);
    --line:rgba(255,255,255,0.06);--line2:rgba(255,255,255,0.12);
    --text:#F4F2EC;--text2:#AEB6AE;--muted:#6C756E;--faint:#3E4742;
    --accent:#CBB079;--accent-soft:#E7D6A8;--accent-dim:rgba(203,176,121,0.14);
    --credit:#86B791;--debit:#D2916E;color:var(--text);
    -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  }
  .font-ui{font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif}
  .mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1}
  .serif{font-family:'Fraunces',Georgia,serif}
  .bg-void{background:var(--void)}.bg-surface{background:var(--surface)}.bg-surface2{background:var(--surface2)}
  .text-app{color:var(--text)}.text-2{color:var(--text2)}.text-muted{color:var(--muted)}.text-faint{color:var(--faint)}
  .text-accent{color:var(--accent-soft)}.text-credit{color:var(--credit)}.text-debit{color:var(--debit)}
  .border-line{border-color:var(--line)}.border-line2{border-color:var(--line2)}
  .glass{background:var(--glass);backdrop-filter:blur(20px) saturate(1.2);-webkit-backdrop-filter:blur(20px) saturate(1.2);border:1px solid var(--glass-line)}
  .accent-grad{background:linear-gradient(135deg,var(--accent),var(--accent-soft))}
  .eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:600}
  .h-display{font-size:clamp(2.1rem,1.3rem + 3.4vw,3.5rem);line-height:1.05;letter-spacing:-.015em;font-weight:300}
  .lead{font-size:clamp(1rem,.94rem + .4vw,1.15rem);line-height:1.65;font-weight:300}
  .hero-num{font-size:clamp(2.05rem,10vw,8rem);line-height:.9;letter-spacing:-.045em;font-weight:500;max-width:100%;overflow-wrap:break-word}
  .micro{font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}
  .safe-x{padding-left:max(1.25rem,env(safe-area-inset-left));padding-right:max(1.25rem,env(safe-area-inset-right))}
  .safe-b{padding-bottom:env(safe-area-inset-bottom)}
  .hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .hscroll::-webkit-scrollbar{display:none}.hscroll{scrollbar-width:none}
  .no-bar::-webkit-scrollbar{width:0;height:0}.no-bar{scrollbar-width:none}
  .lux-input{background:rgba(0,0,0,.22);border:1px solid var(--line2);color:var(--text);outline:none;transition:border-color .25s,box-shadow .25s}
  .lux-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
  .lux-input::placeholder{color:var(--muted)}
  .card-hover{transition:transform .45s cubic-bezier(.16,1,.3,1),border-color .45s,box-shadow .45s}
  .card-hover:hover{transform:translateY(-3px);border-color:var(--line2);box-shadow:0 28px 64px rgba(0,0,0,.4)}
  .row-hover{transition:background .25s ease}
  .row-hover:hover{background:rgba(255,255,255,.025)}
  .hr{height:1px;background:var(--line)}
  .kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:5px;background:rgba(255,255,255,.06);border:1px solid var(--line2);font-size:10px;font-weight:600;color:var(--text2);font-family:'JetBrains Mono',monospace}
  .fos button:focus-visible,.fos input:focus-visible,.fos select:focus-visible{outline:none;box-shadow:0 0 0 3px var(--accent-dim)}
  .screen-h{height:100vh;height:100dvh}
  .min-screen-h{min-height:100vh;min-height:100dvh}
  html,body{overscroll-behavior-y:none}
  .ptr-scroll{overscroll-behavior-y:contain}
  .sect-pad{padding-left:max(1.35rem,env(safe-area-inset-left));padding-right:max(1.35rem,env(safe-area-inset-right))}
  @media(min-width:640px){.sect-pad{padding-left:max(2.5rem,env(safe-area-inset-left));padding-right:max(2.5rem,env(safe-area-inset-right))}}
  @media(min-width:1024px){.sect-pad{padding-left:max(12rem,env(safe-area-inset-left));padding-right:max(4rem,env(safe-area-inset-right))}}
  `;
  return <style>{css}</style>;
}

/* --------------------------------------------------------------- primitives */
function Reveal({ delay = 0, y = 22, x = 0, className = "", children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y, x: reduce ? 0 : x, filter: reduce ? "none" : "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE, delay: delay * 0.09 }}>
      {children}
    </motion.div>
  );
}
function Eyebrow({ children }) {
  const reduce = useReducedMotion();
  return (
    <Reveal>
      <div className="flex items-center gap-2.5 mb-6">
        <motion.span className="rounded-full shrink-0"
          style={{ width: 6, height: 6, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)", display: "inline-block" }}
          initial={{ scale: 0 }}
          whileInView={{ scale: [0, 1.5, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: EASE, times: [0, 0.6, 1] }}
        />
        <motion.span className="eyebrow text-muted"
          initial={{ opacity: 0, x: reduce ? 0 : -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}>
          {children}
        </motion.span>
      </div>
    </Reveal>
  );
}
function SectionTitle({ children }) {
  return <Reveal delay={1}><h2 className="serif h-display mb-5">{children}</h2></Reveal>;
}
function Sub({ children }) {
  return <Reveal delay={2}><p className="lead text-2 mb-12 max-w-lg">{children}</p></Reveal>;
}
function AnimatedNumber({ value, prefix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const display = useCountUp(value, inView);
  return <span ref={ref} className={className}>{prefix}{fmt(display)}</span>;
}
/* StatCounter — like AnimatedNumber but fired by an external trigger (e.g. parent inView) */
function StatCounter({ value, prefix = "", className = "", trigger }) {
  const display = useCountUp(value, trigger);
  return <span className={className}>{prefix}{fmt(display)}</span>;
}
function GlassCard({ className = "", children }) {
  return <div className={`glass rounded-3xl card-hover ${className}`}>{children}</div>;
}
function Bar({ pct, color, delay = 0, className = "", h = 6 }) {
  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ height: h, background: "var(--surface2)" }}>
      <motion.div className="h-full rounded-full" style={{ background: color, transformOrigin: "left" }}
        initial={{ scaleX: 0 }} whileInView={{ scaleX: pct / 100 }} viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: EASE, delay }} />
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block micro text-muted mb-2">{label}</label>
      {children}
    </div>
  );
}
function Segmented({ value, onChange, options, id }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-surface2 border border-line2">
      {options.map((o) => {
        const on = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} className="relative px-4 py-1.5 rounded-full cursor-pointer border-0 bg-transparent"
            style={{ fontSize: 12, fontWeight: 600, color: on ? "var(--text)" : "var(--muted)", transition: "color .2s" }}>
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,.07)", border: "1px solid var(--line2)" }} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="relative z-10">{o.l}</span>
          </button>
        );
      })}
    </div>
  );
}
/* SectionShell — full-height, free-scroll, scroll-linked parallax + depth fade */
function SectionShell({ id, children }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const container = useContext(ScrollContext);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, container: container || undefined, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 42, reduce ? 0 : -42]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [reduce ? 1 : 0.2, 1, 1, reduce ? 1 : 0.2]);
  return (
    <section id={id} ref={ref} className="min-screen-h w-full flex flex-col justify-center py-28 sm:py-36 sect-pad">
      <motion.div style={{ y, opacity }} className="w-full max-w-5xl mx-auto lg:mx-0">
        {typeof children === "function" ? children(inView) : children}
      </motion.div>
    </section>
  );
}

/* ----------------------------------------------------------- parallax glows */
function GlowField({ scrollYProgress }) {
  const reduce = useReducedMotion();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 260]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -180]);
  const s1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.25, 0.9]);
  const s2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.15, 1.3]);
  const op1 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.7, 1, 0.8, 0.5]);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Primary accent orb — top right, moves up on scroll */}
      <motion.div style={{ y: y1, scale: s1, opacity: op1, top: "-14%", right: "-10%", width: 660, height: 660, background: "radial-gradient(circle, rgba(203,176,121,.18), transparent 62%)", filter: "blur(22px)" }} className="absolute rounded-full" />
      {/* Green orb — mid left, moves down */}
      <motion.div style={{ y: y2, scale: s2, top: "28%", left: "-18%", width: 600, height: 600, background: "radial-gradient(circle, rgba(134,183,145,.13), transparent 60%)", filter: "blur(24px)" }} className="absolute rounded-full" />
      {/* Warm debit orb — bottom centre */}
      <motion.div style={{ y: y3, bottom: "-18%", left: "38%", width: 720, height: 720, background: "radial-gradient(circle, rgba(210,145,110,.10), transparent 62%)", filter: "blur(28px)" }} className="absolute rounded-full" />
      {/* Subtle second accent — top left counter-scroll */}
      <motion.div style={{ y: y2, top: "-8%", left: "30%", width: 380, height: 380, background: "radial-gradient(circle, rgba(203,176,121,.07), transparent 68%)", filter: "blur(18px)" }} className="absolute rounded-full" />
      {!reduce && (
        <>
          {/* Floating particles */}
          <motion.div className="absolute rounded-full" style={{ top: "18%", left: "16%", width: 6, height: 6, background: "var(--accent)", filter: "blur(1px)" }} animate={{ y: [0, -28, 0], opacity: [0.18, 0.6, 0.18] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute rounded-full" style={{ top: "64%", right: "20%", width: 4, height: 4, background: "var(--credit)", filter: "blur(1px)" }} animate={{ y: [0, 22, 0], opacity: [0.12, 0.42, 0.12] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2.5 }} />
          <motion.div className="absolute rounded-full" style={{ top: "42%", left: "62%", width: 3, height: 3, background: "var(--accent-soft)", filter: "blur(0.5px)" }} animate={{ y: [0, -18, 0], x: [0, 8, 0], opacity: [0.1, 0.35, 0.1] }} transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 5 }} />
          <motion.div className="absolute rounded-full" style={{ top: "78%", left: "28%", width: 5, height: 5, background: "var(--debit)", filter: "blur(1px)" }} animate={{ y: [0, 16, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 }} />
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- navigation */
const SECTIONS = [
  { id: "command", label: "Command" }, { id: "income", label: "Income & Expense" },
  { id: "cashflow", label: "Cashflow" }, { id: "breakdown", label: "Spending" },
  { id: "transactions", label: "Ledger" }, { id: "quickadd", label: "Add" },
  { id: "insights", label: "Insights" }, { id: "health", label: "Health" },
  { id: "goals", label: "Goals" },
];
function goTo(id, reduce) { document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const ob = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) ob.observe(el); });
    return () => ob.disconnect();
  }, [ids.join(",")]);
  return active;
}
function Spine({ active }) {
  const reduce = useReducedMotion();
  return (
    <nav className="hidden lg:flex flex-col gap-1 fixed left-7 top-1/2 -translate-y-1/2 z-40">
      {SECTIONS.map((s) => {
        const on = active === s.id;
        return (
          <button key={s.id} onClick={() => goTo(s.id, reduce)} className="group flex items-center gap-3.5 py-1.5 bg-transparent border-0 cursor-pointer">
            <span className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
              {on && <motion.span layoutId="spineGlow" className="absolute rounded-full" style={{ width: 13, height: 13, background: "var(--accent)", filter: "blur(3px)", opacity: 0.5 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="rounded-full z-10" style={{ width: on ? 6 : 4, height: on ? 6 : 4, background: on ? "var(--accent)" : "var(--faint)", transition: "all .3s cubic-bezier(.16,1,.3,1)" }} />
            </span>
            <span className="eyebrow whitespace-nowrap transition-all duration-300" style={{ color: on ? "var(--text)" : "var(--muted)", opacity: on ? 1 : 0, transform: on ? "translateX(0)" : "translateX(-4px)" }}>{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
function MonthPill({ month, onPrev, onNext }) {
  return (
    <div className="hidden lg:flex items-center gap-1.5 fixed top-7 right-9 z-40 rounded-full px-2.5 py-2 glass">
      <button onClick={onPrev} className="w-6 h-6 rounded-full text-muted hover:text-app bg-transparent border-0 cursor-pointer">‹</button>
      <span className="mono font-medium w-24 text-center" style={{ fontSize: 12 }}>{month.long}</span>
      <button onClick={onNext} className="w-6 h-6 rounded-full text-muted hover:text-app bg-transparent border-0 cursor-pointer">›</button>
    </div>
  );
}
function MobileBar({ month, onPrev, onNext, onMenu, onImport }) {
  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 glass" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-xl accent-grad flex items-center justify-center"><Wallet size={14} color="#1a160c" /></span>
        <span className="serif" style={{ fontSize: 17, fontWeight: 400 }}>FinanceOS</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onImport} className="w-9 h-9 rounded-xl bg-surface2 border border-line2 flex items-center justify-center cursor-pointer" style={{ color: "var(--accent)" }}><Upload size={15} /></button>
        <div className="flex items-center gap-1 rounded-full px-1.5 py-1 bg-surface2 border border-line2">
          <button onClick={onPrev} className="w-6 h-6 text-muted bg-transparent border-0 cursor-pointer">‹</button>
          <span className="mono w-14 text-center" style={{ fontSize: 11 }}>{month.short} '{String(month.y).slice(2)}</span>
          <button onClick={onNext} className="w-6 h-6 text-muted bg-transparent border-0 cursor-pointer">›</button>
        </div>
        <button onClick={onMenu} className="w-9 h-9 rounded-xl bg-surface2 border border-line2 flex items-center justify-center cursor-pointer text-app"><Menu size={15} /></button>
      </div>
    </div>
  );
}
function MobileSheet({ open, active, onClose }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(8,11,10,.86)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex justify-end p-4" style={{ paddingTop: "max(1rem,env(safe-area-inset-top))" }}><button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface2 border border-line2 flex items-center justify-center text-app cursor-pointer"><X size={18} /></button></div>
          <motion.div className="flex-1 flex flex-col justify-center gap-2 px-9" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} variants={vStagger} initial="hidden" animate="show">
            {SECTIONS.map((s, i) => (
              <motion.button key={s.id} variants={vItem} onClick={() => { goTo(s.id, reduce); onClose(); }} className="text-left py-2.5 serif bg-transparent border-0 cursor-pointer" style={{ fontSize: 26, fontWeight: 300, color: active === s.id ? "var(--text)" : "var(--text2)" }}>
                <span className="mono micro text-muted mr-3">{String(i + 1).padStart(2, "0")}</span>{s.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function Toast({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div className="fixed bottom-7 left-1/2 z-50 glass rounded-full px-5 py-2.5 font-semibold text-credit" style={{ x: "-50%", fontSize: 13, boxShadow: "0 16px 50px rgba(0,0,0,.5)" }}
          initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.4, ease: EASE }}>
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================ SECTIONS (9) */

/* 1 — Command Center */
function CommandCenter({ totals, month, isEmpty, onImport, onAdd, account }) {
  const reduce = useReducedMotion();
  const neg = totals.net < 0;

  // Word-by-word stagger for the cinematic tagline
  const tagline = isEmpty ? ["Your", "financial", "command", "center."] : (neg ? ["Net", "negative", `·`, month.short] : ["Net", "positive", `·`, month.short]);
  const wordVars = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const wordItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 40, filter: reduce ? "none" : "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
  };

  // Stats counter ref — trigger on mount since hero is first visible
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });

  return (
    <SectionShell id="command">
      {/* Cinematic eyebrow */}
      <Eyebrow>{account ? `Account · ${account}` : "Personal finance"} · {month.long}</Eyebrow>

      {/* Giant word-by-word tagline */}
      <motion.div
        className="serif mb-4 leading-none"
        style={{ fontSize: "clamp(2.6rem, 10vw, 7.5rem)", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.0 }}
        variants={wordVars} initial="hidden" animate="show">
        {tagline.map((w, i) => (
          <motion.span key={i} variants={wordItem} style={{ display: "inline-block", marginRight: "0.28em", color: i === tagline.length - 1 ? "var(--accent-soft)" : "var(--text)" }}>
            {w}
          </motion.span>
        ))}
      </motion.div>

      {/* Net number — the centrepiece */}
      <Reveal delay={4}>
        <div className="flex items-baseline gap-4 mb-10 mt-2">
          <motion.div
            className={`hero-num mono ${neg ? "text-debit" : "text-app"}`}
            animate={reduce ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>
            {neg ? "−" : "+"}<AnimatedNumber value={Math.abs(totals.net)} prefix="₹" />
          </motion.div>
          {!isEmpty && (
            <motion.span className="text-muted lead hidden sm:block" style={{ fontSize: "clamp(.85rem,1.2vw,1rem)" }}>
              {totals.count} transactions
            </motion.span>
          )}
        </div>
      </Reveal>

      {isEmpty ? (
        <Reveal delay={5}>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onImport} className="accent-grad rounded-full px-6 py-3 font-bold cursor-pointer border-0 flex items-center gap-2" style={{ color: "#1a160c", fontSize: 14 }}><Upload size={15} /> Import statement</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd} className="rounded-full px-6 py-3 font-semibold text-app bg-surface2 border border-line2 cursor-pointer flex items-center gap-2" style={{ fontSize: 14 }}><Plus size={15} /> Add manually</motion.button>
            <span className="hidden md:flex items-center gap-1.5 text-muted ml-1" style={{ fontSize: 12 }}>or press <span className="kbd">⌘K</span></span>
          </div>
        </Reveal>
      ) : (
        /* Stats row — counters fire when row enters view */
        <Reveal delay={5}>
          <motion.div ref={statsRef} className="flex items-stretch gap-0 flex-wrap"
            variants={vStagger} initial="hidden" animate={statsInView ? "show" : "hidden"}>
            {[
              { l: "Received", v: totals.credit, cls: "text-credit", pre: "₹" },
              { l: "Spent", v: totals.debit, cls: "text-debit", pre: "₹" },
              { l: "Entries", v: totals.count, cls: "text-app", pre: "" },
            ].map((a, i) => (
              <motion.div key={a.l} variants={vItem}
                className="flex flex-col gap-1.5 pr-4 mr-4 sm:pr-9 sm:mr-9"
                style={{ borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                <span className="micro text-muted">{a.l}</span>
                <StatCounter value={a.v} prefix={a.pre} className={`mono text-base sm:text-xl font-medium ${a.cls}`} trigger={statsInView} />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>
      )}

      <Reveal delay={6}>
        <div className="flex items-center gap-2 mt-8 text-faint micro">
          <motion.span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--credit)", display: "inline-block" }}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
          Live · 6-month window
        </div>
      </Reveal>

      {/* Scroll hint */}
      <motion.div className="absolute bottom-10 left-7 md:left-14 lg:left-48 flex items-center gap-2 text-muted micro"
        animate={reduce ? {} : { y: [0, 5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
        <TrendingDown size={12} /> Scroll
      </motion.div>
    </SectionShell>
  );
}

/* 2 — Income & Expense */
function IncomeExpense({ totals }) {
  const tot = totals.credit + totals.debit || 1;
  const cells = [
    { l: "Received", v: totals.credit, n: totals.rows.filter((t) => isCredit(t)).length, cls: "text-credit", Icon: TrendingUp, sub: "credits" },
    { l: "Spent", v: totals.debit, n: totals.rows.filter((t) => !isCredit(t)).length, cls: "text-debit", Icon: TrendingDown, sub: "debits" },
  ];
  return (
    <SectionShell id="income">
      <Eyebrow>The two forces</Eyebrow>
      <SectionTitle>Income &amp; Expense</SectionTitle>
      <Sub>What came in, against what went out — and the gap between them.</Sub>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8" variants={vStagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
        {cells.map((c) => (
          <motion.div key={c.l} variants={vItem} className="bg-surface rounded-3xl p-5 sm:p-7 border border-line card-hover">
            <div className="flex items-center gap-2 micro text-muted mb-4"><c.Icon size={13} className={c.cls} /> {c.l}</div>
            <div className={`mono font-medium ${c.cls}`} style={{ fontSize: "clamp(1.6rem,7vw,2rem)", letterSpacing: "-.02em" }}><AnimatedNumber value={c.v} prefix="₹" /></div>
            <div className="text-muted mt-2" style={{ fontSize: 12 }}>{c.n} {c.sub}</div>
          </motion.div>
        ))}
      </motion.div>
      <Reveal delay={3}>
        <div className="flex rounded-full overflow-hidden" style={{ height: 8, background: "var(--surface2)", border: "1px solid var(--line)" }}>
          <motion.div className="h-full" style={{ width: `${(totals.credit / tot) * 100}%`, background: "linear-gradient(90deg,var(--credit),#a4ccab)", transformOrigin: "left" }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE }} />
          <motion.div className="h-full" style={{ width: `${(totals.debit / tot) * 100}%`, background: "linear-gradient(90deg,#dca689,var(--debit))", transformOrigin: "left" }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: 0.1 }} />
        </div>
      </Reveal>
      <Reveal delay={4}>
        <div className="flex items-baseline gap-4 mt-9">
          <span className="serif italic text-2" style={{ fontSize: 19 }}>Net position</span>
          <span className={`mono font-medium ${totals.net < 0 ? "text-debit" : "text-credit"}`} style={{ fontSize: "1.6rem" }}>{totals.net < 0 ? "−" : ""}<AnimatedNumber value={Math.abs(totals.net)} prefix="₹" /></span>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* 3 — Cashflow */
function Cashflow({ txns, idx }) {
  const series = useMemo(() => seriesAll(txns), [txns]);
  const max = Math.max(1, ...series.map((s) => Math.max(s.credit, s.debit)));
  const withData = series.filter((s) => s.count);
  const avg = withData.length ? Math.round(withData.reduce((s, x) => s + x.debit, 0) / withData.length) : 0;
  const best = withData.slice().sort((a, b) => b.net - a.net)[0];
  const cur = series[idx], prev = series[idx - 1];
  const caption = withData.length === 0 ? "Import or add transactions to chart your cashflow over time."
    : prev && (cur.count || prev.count) ? (cur.net - prev.net >= 0 ? `You're ₹${fmt(Math.abs(cur.net - prev.net))} better off than last month.` : `You're ₹${fmt(Math.abs(cur.net - prev.net))} behind last month.`)
    : (cur.net >= 0 ? "A positive month so far." : "Spending has outpaced income this month.");
  return (
    <SectionShell id="cashflow">
      <Eyebrow>Over time</Eyebrow>
      <SectionTitle>Cashflow</SectionTitle>
      <Sub>Six months of movement. Everything but this month recedes.</Sub>
      <Reveal delay={2}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-12 items-center">
          <div>
            <motion.div className="flex items-end gap-2.5 sm:gap-5 md:gap-7" style={{ height: 200 }} variants={vStagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
              {series.map((s, i) => {
                const now = i === idx;
                return (
                  <motion.div key={s.mo.key} variants={vItem} className="flex-1 flex flex-col items-center justify-end gap-3 h-full" style={{ opacity: now ? 1 : 0.4 }}>
                    <div className="flex-1 w-full flex items-end justify-center gap-1.5">
                      <motion.div className="rounded-t-lg" title={`In ₹${fmt(s.credit)}`} style={{ width: "42%", maxWidth: 22, height: `${(s.credit / max) * 100}%`, background: now ? "linear-gradient(180deg,var(--credit),rgba(134,183,145,.3))" : "var(--text2)", transformOrigin: "bottom" }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.85, ease: EASE, delay: i * 0.06 }} />
                      <motion.div className="rounded-t-lg" title={`Out ₹${fmt(s.debit)}`} style={{ width: "42%", maxWidth: 22, height: `${(s.debit / max) * 100}%`, background: now ? "linear-gradient(180deg,var(--debit),rgba(210,145,110,.3))" : "var(--faint)", transformOrigin: "bottom" }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.85, ease: EASE, delay: i * 0.06 + 0.05 }} />
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: now ? "var(--accent-soft)" : "var(--muted)", fontWeight: now ? 600 : 400 }}>{s.mo.short}</div>
                  </motion.div>
                );
              })}
            </motion.div>
            <div className="hr mt-3" />
          </div>
          <div className="flex flex-col gap-6">
            <div><div className="micro text-muted mb-1.5">Avg monthly spend</div><div className="mono text-xl font-medium"><AnimatedNumber value={avg} prefix="₹" /></div></div>
            <div className="hr" style={{ width: 40 }} />
            <div><div className="micro text-muted mb-1.5">Best net month</div><div className="mono text-xl font-medium">{best ? `${best.mo.short} '${String(best.mo.y).slice(2)}` : "—"}</div></div>
          </div>
        </div>
      </Reveal>
      <Reveal delay={3}><p className="serif italic text-2 mt-9" style={{ fontSize: 18 }}>{caption}</p></Reveal>
    </SectionShell>
  );
}

/* 4 — Spending Breakdown */
function Breakdown({ totals }) {
  const groups = useMemo(() => groupBreakdown(totals.rows), [totals.rows]);
  const max = groups[0]?.total || 1;
  const [open, setOpen] = useState(null);
  return (
    <SectionShell id="breakdown">
      <Eyebrow>Where it goes</Eyebrow>
      <SectionTitle>Spending</SectionTitle>
      <Sub>Outflow by category, largest first. Tap any group to open it up.</Sub>
      {groups.length === 0 ? (
        <Reveal delay={2}><div className="text-muted lead py-10">No spending recorded this month yet.</div></Reveal>
      ) : (
        <motion.div className="flex flex-col" variants={vStagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {groups.map((g, gi) => {
            const isOpen = open === g.group;
            const color = GROUP_COLORS[g.group] || "#8A938C";
            return (
              <motion.div key={g.group} variants={vItem} className="py-4 border-b border-line last:border-0">
                <button onClick={() => setOpen(isOpen ? null : g.group)} className="w-full flex items-center gap-3 sm:gap-5 bg-transparent border-0 cursor-pointer text-app">
                  <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="text-muted shrink-0"><ChevronRight size={13} /></motion.span>
                  <span className="font-medium shrink-0 text-left truncate w-24 sm:w-[150px]" style={{ fontSize: 14 }}>{g.group}</span>
                  <span className="flex-1 min-w-0"><Bar pct={(g.total / max) * 100} color={`linear-gradient(90deg,${color},${color}99)`} delay={gi * 0.05} h={5} /></span>
                  <span className="mono font-semibold text-right shrink-0 w-[74px] sm:w-[90px]" style={{ fontSize: 14 }}>₹{fmt(g.total)}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: EASE }} className="overflow-hidden">
                      <div className="grid gap-x-8 gap-y-1 pt-3.5 pl-7 sm:pl-11" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
                        {g.subs.map((s) => (<div key={s.name} className="flex justify-between text-muted" style={{ fontSize: 12.5 }}><span>{s.name}</span><span className="mono text-2">₹{fmt(s.amt)}</span></div>))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </SectionShell>
  );
}

/* 5 — Ledger (statement-style, month-scoped) */
function Transactions({ txns, globalIdx, onDelete }) {
  const [localIdx, setLocalIdx] = useState(globalIdx);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { setLocalIdx(globalIdx); }, [globalIdx]);
  const month = MONTHS[localIdx];
  const allRows = useMemo(() => txns.filter((t) => t.date.startsWith(month.key)).slice().sort((a, b) => b.date.localeCompare(a.date)), [txns, month.key]);
  const rows = useMemo(() => {
    let r = allRows;
    if (type) r = r.filter((t) => (t.type || "debit") === type);
    if (q) r = r.filter((t) => (t.note || "").toLowerCase().includes(q.toLowerCase()) || t.cat.toLowerCase().includes(q.toLowerCase()));
    return r;
  }, [allRows, type, q]);
  const credit = allRows.filter((t) => isCredit(t)).reduce((s, t) => s + t.amt, 0);
  const debit = allRows.filter((t) => !isCredit(t)).reduce((s, t) => s + t.amt, 0);
  return (
    <SectionShell id="transactions">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
        <div>
          <Eyebrow>The record</Eyebrow>
          <SectionTitle>Ledger</SectionTitle>
          <Reveal delay={2}>
            <div className="mono flex items-center gap-2 flex-wrap" style={{ fontSize: 12.5 }}>
              <span className="text-credit">+₹{fmt(credit)}</span><span className="text-faint">in</span>
              <span className="text-faint">·</span>
              <span className="text-debit">−₹{fmt(debit)}</span><span className="text-faint">out</span>
              <span className="text-faint">·</span>
              <span className="text-2">{allRows.length} entries</span>
            </div>
          </Reveal>
        </div>
        <Reveal delay={1}>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocalIdx((i) => Math.max(0, i - 1))} disabled={localIdx === 0} className="w-8 h-8 rounded-full bg-transparent border border-line2 cursor-pointer text-muted hover:text-app disabled:opacity-25">‹</button>
            <span className="mono font-medium w-24 text-center" style={{ fontSize: 13 }}>{month.long}</span>
            <button onClick={() => setLocalIdx((i) => Math.min(MONTHS.length - 1, i + 1))} disabled={localIdx === MONTHS.length - 1} className="w-8 h-8 rounded-full bg-transparent border border-line2 cursor-pointer text-muted hover:text-app disabled:opacity-25">›</button>
          </div>
        </Reveal>
      </div>
      <Reveal delay={2}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <Segmented id="dir" value={type} onChange={setType} options={[{ l: "All", v: "" }, { l: "In", v: "credit" }, { l: "Out", v: "debit" }]} />
          <div className="relative w-full sm:w-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the ledger…" className="lux-input rounded-full pl-8 pr-4 py-2 w-full sm:w-[200px]" style={{ fontSize: 13 }} />
          </div>
        </div>
      </Reveal>
      <Reveal delay={3}>
        {rows.length === 0 ? (
          <div className="text-muted lead py-12 text-center">{allRows.length === 0 ? <>Nothing in {month.long}. <span className="text-faint">Switch months or add an entry.</span></> : "No entries match."}</div>
        ) : (
          <div className="max-h-[54vh] overflow-y-auto no-bar -mx-3">
            <AnimatePresence initial={false}>
              {rows.map((t) => {
                const isC = isCredit(t);
                const d = new Date(t.date + "T00:00:00");
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}
                    className="group grid items-center row-hover rounded-xl px-3 border-b border-line" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                    <div className="flex flex-col items-center justify-center mr-5 py-4" style={{ width: 38 }}>
                      <span className="mono text-app" style={{ fontSize: 15, lineHeight: 1 }}>{d.getDate()}</span>
                      <span className="micro text-muted mt-1">{d.toLocaleString("default", { month: "short" })}</span>
                    </div>
                    <div className="py-4 min-w-0">
                      <div className="truncate text-app" style={{ fontSize: 14.5 }}>{t.note || "—"}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted" style={{ fontSize: 12 }}>{t.cat}</span>
                        {t.bank && t.bank !== "Axis" && t.bank !== "" && <span className="mono rounded px-1.5 py-0.5" style={{ fontSize: 10, background: "var(--surface2)", color: "var(--text-faint)", border: "1px solid var(--line2)" }}>{t.bank}</span>}
                      </div>
                    </div>
                    <div className="py-4 flex items-center gap-4 justify-end pl-4">
                      <span className="mono font-semibold whitespace-nowrap" style={{ fontSize: 15, color: isC ? "var(--credit)" : "var(--debit)" }}>{isC ? "+" : "−"}₹{fmt(t.amt)}</span>
                      <button onClick={() => onDelete(t.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-faint hover:text-debit bg-transparent border-0 cursor-pointer p-1 -m-1"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Reveal>
    </SectionShell>
  );
}

/* 6 — Quick Add */
function QuickAdd({ onAdd, month }) {
  const [note, setNote] = useState("");
  const [credit, setCredit] = useState("");
  const [debit, setDebit] = useState("");
  const submit = () => {
    const c = parseFloat(credit) || 0, d = parseFloat(debit) || 0;
    if (c <= 0 && d <= 0) return onAdd(null, "Enter a credit or debit amount");
    if (c > 0 && d > 0) return onAdd(null, "Fill either credit or debit, not both");
    const today = new Date();
    const sameMonth = today.getFullYear() === month.y && today.getMonth() === month.m;
    const date = sameMonth ? today.toISOString().slice(0, 10) : `${month.key}-15`;
    onAdd({ note: note.trim() || "Manual entry", cat: classify(note), type: c > 0 ? "credit" : "debit", amt: c > 0 ? c : d, date });
    setNote(""); setCredit(""); setDebit("");
  };
  return (
    <SectionShell id="quickadd">
      <Eyebrow>Record it now</Eyebrow>
      <SectionTitle>Add a transaction</SectionTitle>
      <Sub>Type the particulars — the category resolves itself.</Sub>
      <Reveal delay={2}>
        <div className="bg-surface rounded-3xl border border-line p-6 sm:p-8 max-w-md card-hover">
          <Field label="Particulars"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Hemant Stores, Mumbai Metro" className="lux-input rounded-xl px-3.5 py-3 w-full" style={{ fontSize: 14 }} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={<span className="text-credit">Credit ₹</span>}><input type="number" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="0" className="lux-input rounded-xl px-3.5 py-3 w-full" style={{ fontSize: 14 }} /></Field>
            <Field label={<span className="text-debit">Debit ₹</span>}><input type="number" value={debit} onChange={(e) => setDebit(e.target.value)} placeholder="0" className="lux-input rounded-xl px-3.5 py-3 w-full" style={{ fontSize: 14 }} /></Field>
          </div>
          <AnimatePresence>{note && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-muted mb-4 overflow-hidden" style={{ fontSize: 12.5 }}>Detected category · <span className="text-accent">{classify(note)}</span></motion.div>}</AnimatePresence>
          <motion.button onClick={submit} whileTap={{ scale: 0.98 }} className="w-full accent-grad rounded-xl py-3.5 font-bold cursor-pointer border-0 flex items-center justify-center gap-2" style={{ color: "#1a160c", fontSize: 14 }}><Plus size={15} /> Add transaction</motion.button>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/* 7 — Insights */
function Insights({ txns, idx }) {
  const items = useMemo(() => computeInsights(txns, idx), [txns, idx]);
  return (
    <SectionShell id="insights">
      <Eyebrow>What to notice</Eyebrow>
      <SectionTitle>Insights</SectionTitle>
      <Sub>Observations drawn only from your own data — never invented.</Sub>
      {items.length === 0 ? (
        <Reveal delay={2}><div className="text-muted lead py-10">Not enough data yet. Insights surface as activity accrues.</div></Reveal>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5" variants={vStagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          {items.map((it, i) => (
            <motion.div key={i} variants={vItem}>
              <GlassCard className="p-7 h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: "linear-gradient(90deg,var(--accent),transparent)" }} />
                <div className="mono font-medium text-accent mb-3" style={{ fontSize: "1.7rem", letterSpacing: "-.02em" }}>{it.fig}</div>
                <div className="serif" style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 400 }}>{it.text}</div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </SectionShell>
  );
}

/* 8 — Health Score */
function HealthScore({ txns, idx }) {
  const health = useMemo(() => computeHealth(txns, idx), [txns, idx]);
  return (
    <SectionShell id="health">
      <Eyebrow>One signal</Eyebrow>
      <SectionTitle>Health score</SectionTitle>
      <Sub>A transparent blend of savings rate, stability, and how much room you keep.</Sub>
      {!health ? (
        <Reveal delay={2}><div className="text-muted lead py-10">Record a month of activity to compute your score.</div></Reveal>
      ) : (
        <Reveal delay={2}>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-14 items-center">
            <Gauge score={health.score} />
            <div className="flex flex-col gap-6">
              {health.factors.map((f, i) => (
                <div key={f.name} title={f.note}>
                  <div className="flex justify-between items-baseline mb-2"><span className="font-medium" style={{ fontSize: 14 }}>{f.name}<span className="micro text-faint ml-2">{f.weight}%</span></span><span className="mono text-2" style={{ fontSize: 14 }}>{f.val}</span></div>
                  <Bar pct={f.pct * 100} color="linear-gradient(90deg,var(--accent),var(--accent-soft))" delay={0.3 + i * 0.12} h={5} />
                </div>
              ))}
              {health.incomeMissing && <div className="text-muted" style={{ fontSize: 12 }}>No income this month — savings rate is excluded and weights rebalance.</div>}
            </div>
          </div>
        </Reveal>
      )}
    </SectionShell>
  );
}
function Gauge({ score }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const R = 112, C = 2 * Math.PI * R, frac = score / 100;
  const display = useCountUp(score, inView);
  const targetOffset = C * (1 - frac);
  const band = score >= 70 ? "#86B791" : score >= 40 ? "#CBB079" : "#D2916E";
  return (
    <div ref={ref} className="relative mx-auto" style={{ width: 270, height: 270 }}>
      <svg width="270" height="270" viewBox="0 0 270 270">
        <circle cx="135" cy="135" r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="12" />
        <motion.circle cx="135" cy="135" r={R} fill="none" stroke={band} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 135 135)"
          style={{ filter: `drop-shadow(0 0 8px ${band}55)` }}
          initial={{ strokeDashoffset: reduce ? targetOffset : C }} animate={inView ? { strokeDashoffset: targetOffset } : {}} transition={{ duration: 1.5, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono font-medium" style={{ fontSize: "3.4rem", letterSpacing: "-.03em" }}>{fmt(display)}</span>
        <span className="micro text-muted mt-1">Health score</span>
      </div>
    </div>
  );
}

/* 9 — Goals */
function Goals({ txns, idx }) {
  const [goals, setGoals] = useState([{ id: 1, name: "Bali trip", target: 100000, saved: 0 }, { id: 2, name: "Emergency fund", target: 200000, saved: 0 }]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [fundId, setFundId] = useState(null);
  const [fundAmt, setFundAmt] = useState("");
  const pace = useMemo(() => avgSurplus(txns, idx), [txns, idx]);
  const add = () => { const t = parseFloat(target) || 0; if (!name.trim() || t <= 0) return; setGoals((g) => [...g, { id: Date.now(), name: name.trim(), target: t, saved: 0 }]); setName(""); setTarget(""); };
  const confirmFund = () => { const v = parseFloat(fundAmt) || 0; if (v > 0) setGoals((g) => g.map((x) => (x.id === fundId ? { ...x, saved: x.saved + v } : x))); setFundId(null); setFundAmt(""); };
  const remove = (id) => setGoals((g) => g.filter((x) => x.id !== id));
  return (
    <SectionShell id="goals">
      <Eyebrow>Looking forward</Eyebrow>
      <SectionTitle>Goals</SectionTitle>
      <Sub>Set a target. Projected dates draw on your average recent surplus.</Sub>
      <motion.div className="flex flex-col gap-4 mb-7" variants={vStagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
        <AnimatePresence>
          {goals.length === 0 && <div className="text-muted lead py-8">No goals yet. Set your first below.</div>}
          {goals.map((g) => {
            const saved = Math.min(g.saved, g.target);
            const pct = g.target > 0 ? Math.min(100, (saved / g.target) * 100) : 0;
            const remaining = Math.max(0, g.target - saved);
            let eta = "Fund it to project a date";
            if (remaining <= 0) eta = "Goal reached ✓";
            else if (pace > 0) { const months = Math.ceil(remaining / pace); const d = new Date(); d.setMonth(d.getMonth() + months); eta = `~${months} ${months === 1 ? "month" : "months"} · ${d.toLocaleString("default", { month: "short", year: "numeric" })}`; }
            return (
              <motion.div key={g.id} layout variants={vItem} exit={{ opacity: 0, x: -16 }} className="bg-surface rounded-3xl border border-line p-7 card-hover">
                <div className="flex justify-between items-start gap-4 mb-4"><div><div className="font-medium" style={{ fontSize: 15 }}>{g.name}</div><div className="text-muted mt-1" style={{ fontSize: 12 }}>{pct.toFixed(0)}% funded</div></div><div className="mono text-accent text-right whitespace-nowrap" style={{ fontSize: 12 }}>{eta}</div></div>
                <div className="rounded-full overflow-hidden mb-2.5" style={{ height: 7, background: "var(--surface2)" }}><motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,var(--credit),#a4ccab)", transformOrigin: "left" }} initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.9, ease: EASE }} /></div>
                <div className="flex justify-between mono text-2" style={{ fontSize: 13 }}><span>₹{fmt(saved)}</span><span className="text-muted">₹{fmt(g.target)}</span></div>
                <div className="flex gap-2 mt-4"><button onClick={() => { setFundAmt(""); setFundId(g.id); }} className="rounded-full px-4 py-1.5 font-semibold text-2 bg-surface2 border border-line2 cursor-pointer" style={{ fontSize: 12 }}>Add funds</button><button onClick={() => remove(g.id)} className="rounded-full px-4 py-1.5 font-semibold text-muted bg-surface2 border border-line2 cursor-pointer" style={{ fontSize: 12 }}>Remove</button></div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      <Reveal delay={3}>
        <div className="grid gap-3 items-end bg-surface rounded-3xl p-6" style={{ border: "1px dashed var(--line2)", gridTemplateColumns: "1fr 150px auto" }}>
          <Field label="Goal name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" className="lux-input rounded-xl px-3.5 py-3 w-full" style={{ fontSize: 14 }} /></Field>
          <Field label="Target ₹"><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000" className="lux-input rounded-xl px-3.5 py-3 w-full" style={{ fontSize: 14 }} /></Field>
          <motion.button onClick={add} whileTap={{ scale: 0.98 }} className="accent-grad rounded-xl px-6 py-3 font-bold cursor-pointer border-0 mb-4" style={{ color: "#1a160c", fontSize: 14 }}>Add</motion.button>
        </div>
      </Reveal>
      <Reveal delay={3}><div className="text-muted mt-4 flex items-center gap-1.5" style={{ fontSize: 12 }}><Target size={12} /> Kept in memory for this demo; persists to your Sheets backend in production.</div></Reveal>
      <Dialog open={fundId != null} title="Add funds" onClose={() => { setFundId(null); setFundAmt(""); }}>
        <input autoFocus type="number" value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmFund(); }} placeholder="Amount ₹" className="lux-input rounded-xl px-3.5 py-3 w-full mb-4" style={{ fontSize: 14 }} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => { setFundId(null); setFundAmt(""); }} className="rounded-full px-4 py-2 text-2 bg-surface2 border border-line2 cursor-pointer" style={{ fontSize: 13 }}>Cancel</button>
          <button onClick={confirmFund} className="accent-grad rounded-full px-4 py-2 font-bold cursor-pointer border-0" style={{ color: "#1a160c", fontSize: 13 }}>Add</button>
        </div>
      </Dialog>
    </SectionShell>
  );
}

/* ============================================================= IMPORT MODAL */
function normalizeDate(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  const m = raw.trim().match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  const m2 = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${String(m2[1]).padStart(2, "0")}-${String(m2[2]).padStart(2, "0")}`;
  return null;
}
const parseAmt = (s) => (s ? parseFloat(String(s).replace(/,/g, "").trim()) || 0 : 0);
function parseAxisCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ["File appears empty"] };
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) if (/tran.?date|^date/i.test(lines[i])) { headerIdx = i; break; }
  const headers = lines[headerIdx].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
  const dateCol = headers.findIndex((h) => /date/.test(h));
  const partCol = headers.findIndex((h) => /particular|narrat|desc/i.test(h));
  const crCol = headers.findIndex((h) => /^credit|cr\.?$/i.test(h));
  const dbCol = headers.findIndex((h) => /^debit|dr\.?$/i.test(h));
  if (dateCol < 0) return { rows: [], errors: ["Could not find a date column. Make sure this is an Axis Bank CSV."] };
  const rows = [], errors = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    const date = normalizeDate(cols[dateCol] || "");
    if (!date) { errors.push(`Row ${i + 1}: unrecognised date "${cols[dateCol] || ""}"`); continue; }
    const note = partCol >= 0 ? cols[partCol] || "" : "";
    const cr = crCol >= 0 ? parseAmt(cols[crCol]) : 0;
    const db = dbCol >= 0 ? parseAmt(cols[dbCol]) : 0;
    if (cr <= 0 && db <= 0) continue;
    rows.push({ _key: `${date}-${i}`, date, note, cat: classify(note), type: cr > 0 ? "credit" : "debit", amt: cr > 0 ? cr : db, bank: "Axis" });
  }
  return { rows, errors };
}
function ImportModal({ onConfirm, onClose }) {
  const [stage, setStage] = useState("drop");
  const [rows, setRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const processFile = (file) => {
    if (!file) return;
    if (file.name.split(".").pop().toLowerCase() !== "csv") { setParseErrors(["Only CSV files are supported. Export your Axis Bank statement as CSV."]); setRows([]); setStage("review"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { const { rows: parsed, errors } = parseAxisCSV(e.target.result); setRows(parsed); setParseErrors(errors); setStage("review"); };
    reader.readAsText(file);
  };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); };
  const toggleType = (key) => setRows((prev) => prev.map((r) => r._key === key ? { ...r, type: r.type === "credit" ? "debit" : "credit" } : r));
  const removeRow = (key) => setRows((prev) => prev.filter((r) => r._key !== key));
  const confirm = () => { onConfirm(rows); setStage("done"); };
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,11,10,.86)", backdropFilter: "blur(16px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div className="relative w-full max-w-2xl bg-surface rounded-3xl border border-line2 overflow-hidden" style={{ maxHeight: "88vh", display: "flex", flexDirection: "column" }} initial={{ scale: 0.95, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.97, y: 10, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-line shrink-0">
          <div><div className="font-medium flex items-center gap-2" style={{ fontSize: 15 }}><Upload size={15} className="text-accent" /> Import transactions</div><div className="text-muted mt-0.5" style={{ fontSize: 12 }}>Axis Bank CSV — drop or browse</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface2 border border-line2 flex items-center justify-center text-app cursor-pointer"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-bar px-7 py-6">
          {stage === "drop" && (
            <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 cursor-pointer transition-colors duration-200" style={{ minHeight: 240, borderColor: dragging ? "var(--accent)" : "var(--line2)", borderStyle: "dashed", background: dragging ? "var(--accent-dim)" : "transparent" }}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><Upload size={30} style={{ color: "var(--accent)" }} /></motion.div>
              <div className="text-center"><div className="font-medium">Drop your CSV here</div><div className="text-muted mt-1" style={{ fontSize: 12 }}>or click to browse · Axis Bank statement CSV</div></div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
            </div>
          )}
          {stage === "review" && (
            <>
              {parseErrors.length > 0 && (
                <div className="rounded-xl px-4 py-3 mb-4" style={{ fontSize: 13, background: "rgba(210,145,110,.12)", border: "1px solid rgba(210,145,110,.3)", color: "var(--debit)" }}>
                  <div className="font-semibold mb-1">{parseErrors.length} row{parseErrors.length > 1 ? "s" : ""} skipped</div>
                  {parseErrors.slice(0, 3).map((e, i) => <div key={i} style={{ fontSize: 12, opacity: 0.8 }}>{e}</div>)}
                </div>
              )}
              {rows.length === 0 ? (
                <div className="text-center text-muted py-12" style={{ fontSize: 13 }}>No valid rows found.<br /><button onClick={() => setStage("drop")} className="mt-3 underline text-accent bg-transparent border-0 cursor-pointer">Try a different file</button></div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3"><span className="font-medium" style={{ fontSize: 13 }}>{rows.length} transactions ready</span><button onClick={() => setStage("drop")} className="text-muted underline bg-transparent border-0 cursor-pointer" style={{ fontSize: 12 }}>Change file</button></div>
                  <div className="rounded-2xl border border-line overflow-hidden">
                    <table className="w-full" style={{ fontSize: 12 }}>
                      <thead className="bg-surface2"><tr className="text-muted">{["Date", "Particulars", "Category", "Type", "Amount", ""].map((h, i) => (<th key={i} className={`px-3 py-2.5 text-left micro border-b border-line ${i === 4 ? "text-right" : ""}`}>{h}</th>))}</tr></thead>
                      <tbody>
                        {rows.map((r) => { const isC = r.type === "credit"; return (
                          <tr key={r._key} className="border-b border-line last:border-0">
                            <td className="px-3 py-2 mono text-2 whitespace-nowrap">{r.date}</td>
                            <td className="px-3 py-2 text-2 max-w-[150px] truncate" title={r.note}>{r.note || "—"}</td>
                            <td className="px-3 py-2"><span className="inline-flex px-1.5 py-0.5 rounded text-2" style={{ fontSize: 11, background: "rgba(255,255,255,.045)", border: "1px solid var(--line)" }}>{r.cat}</span></td>
                            <td className="px-3 py-2"><button onClick={() => toggleType(r._key)} className="inline-flex px-2 py-0.5 rounded-full font-bold cursor-pointer border-0" style={{ fontSize: 9, background: isC ? "rgba(134,183,145,.18)" : "rgba(210,145,110,.18)", color: isC ? "var(--credit)" : "var(--debit)" }} title="Flip credit/debit">{isC ? "Credit" : "Debit"}</button></td>
                            <td className="px-3 py-2 mono font-semibold text-right whitespace-nowrap" style={{ color: isC ? "var(--credit)" : "var(--debit)" }}>{isC ? "+" : "−"}₹{fmt(r.amt)}</td>
                            <td className="px-2 py-2 text-right"><button onClick={() => removeRow(r._key)} className="text-faint bg-transparent border-0 cursor-pointer"><X size={12} /></button></td>
                          </tr>); })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          {stage === "done" && (
            <motion.div className="flex flex-col items-center justify-center gap-4 py-16 text-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(134,183,145,.18)" }}><TrendingUp size={22} style={{ color: "var(--credit)" }} /></div>
              <div><div className="font-medium" style={{ fontSize: 18 }}>Import complete</div><div className="text-muted mt-1" style={{ fontSize: 13 }}>Transactions are now in the ledger.</div></div>
              <button onClick={onClose} className="accent-grad rounded-xl px-6 py-2.5 font-bold cursor-pointer border-0" style={{ color: "#1a160c", fontSize: 14 }}>Done</button>
            </motion.div>
          )}
        </div>
        {stage === "review" && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-line shrink-0">
            <span className="text-muted" style={{ fontSize: 12 }}>Tap a <b>Credit / Debit</b> badge to flip it.</span>
            <motion.button onClick={confirm} whileTap={{ scale: 0.97 }} className="accent-grad rounded-xl px-6 py-2.5 font-bold cursor-pointer border-0 whitespace-nowrap" style={{ color: "#1a160c", fontSize: 14 }}>Import {rows.length} row{rows.length > 1 ? "s" : ""}</motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Dialog({ open, title, children, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(8,11,10,.8)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm glass rounded-2xl p-6" style={{ boxShadow: "0 40px 100px rgba(0,0,0,.6)" }}
            initial={{ scale: 0.96, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
            {title && <div className="font-medium mb-2" style={{ fontSize: 16 }}>{title}</div>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================ COMMAND PALETTE */
function CommandPalette({ open, onClose, onJump, onImport, onAdd, onClear }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(""); const t = setTimeout(() => inputRef.current?.focus(), 40); return () => clearTimeout(t); } }, [open]);
  const items = useMemo(() => [
    { id: "a-import", label: "Import statement", kind: "Action", run: onImport },
    { id: "a-add", label: "Add transaction", kind: "Action", run: onAdd },
    ...SECTIONS.map((s) => ({ id: `nav-${s.id}`, label: `Go to ${s.label}`, kind: "Navigate", run: () => onJump(s.id) })),
    { id: "a-clear", label: "Clear all data", kind: "Action", run: onClear },
  ], [onImport, onAdd, onJump, onClear]);
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const run = (i) => { i.run(); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-start justify-center px-4" style={{ paddingTop: "18vh", background: "rgba(8,11,10,.7)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg glass rounded-2xl overflow-hidden" style={{ boxShadow: "0 40px 100px rgba(0,0,0,.6)" }}
            initial={{ scale: 0.97, y: -8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
              <Search size={15} className="text-muted" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) run(filtered[0]); if (e.key === "Escape") onClose(); }}
                placeholder="Search actions, jump to a section…" className="flex-1 bg-transparent border-0 outline-none text-app" style={{ fontSize: 14 }} />
              <span className="kbd">esc</span>
            </div>
            <div className="max-h-72 overflow-y-auto no-bar py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted" style={{ fontSize: 13 }}>No matches</div>
              ) : filtered.map((i) => (
                <button key={i.id} onClick={() => run(i)} className="w-full flex items-center justify-between px-4 py-2.5 bg-transparent border-0 cursor-pointer row-hover text-left">
                  <span className="text-app" style={{ fontSize: 13.5 }}>{i.label}</span>
                  <span className="micro text-faint">{i.kind}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =================================================================== APP */
function LoadingScreen() {
  return (
    <motion.div
      className="fos font-ui bg-void text-app screen-h flex flex-col items-center justify-center gap-6"
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <ThemeStyles />
      {/* Ambient glow behind icon */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <motion.div
          style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "radial-gradient(circle, rgba(203,176,121,.28), transparent 70%)", filter: "blur(8px)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Wallet icon with breath */}
        <motion.div
          className="accent-grad rounded-2xl flex items-center justify-center"
          style={{ width: 64, height: 64, position: "relative" }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a160c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <path d="M16 3l-4 4-4-4" />
            <circle cx="17" cy="13" r="1.5" fill="#1a160c" stroke="none" />
          </svg>
        </motion.div>
      </div>
      {/* Staggered text */}
      <motion.div className="flex flex-col items-center gap-1.5"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        initial="hidden" animate="show">
        <motion.span className="serif" style={{ fontSize: 22, fontWeight: 400, color: "var(--text)" }}
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>
          FinanceOS
        </motion.span>
        <motion.span className="micro text-muted"
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>
          Loading your ledger…
        </motion.span>
      </motion.div>
      {/* Thin progress shimmer */}
      <motion.div style={{ width: 80, height: 1.5, background: "var(--line2)", borderRadius: 9999, overflow: "hidden", marginTop: 8 }}>
        <motion.div style={{ height: "100%", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", borderRadius: 9999 }}
          animate={{ x: [-80, 80] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>
    </motion.div>
  );
}

function Dashboard({ user, signOut }) {
  const { txns, loading, error, retry, dismissError, addTransaction, removeTransaction, bulkAdd, clearAll } = useFinanceData();
  const [offset, setOffset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState("");
  const scrollRef = useRef(null);
  const toastTimer = useRef(0);
  const active = useScrollSpy(SECTIONS.map((s) => s.id));
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const { pull, refreshing, threshold } = usePullToRefresh(scrollRef, retry);
  const wasRefreshing = useRef(false);

  const idx = MONTHS.length - 1 + offset;
  const month = MONTHS[idx];
  const [account, setAccount] = useState("");
  const accounts = useMemo(() => [...new Set(txns.map((t) => t.bank).filter((b) => b && b !== "Axis"))], [txns]);
  const viewTxns = useMemo(() => (account ? txns.filter((t) => t.bank === account) : txns), [txns, account]);
  const totals = useMemo(() => totalsFor(viewTxns, month), [viewTxns, month]);

  const prevMonth = () => setOffset((o) => Math.max(-(MONTHS.length - 1), o - 1));
  const nextMonth = () => setOffset((o) => Math.min(0, o + 1));
  const showToast = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(""), 2400); };
  useEffect(() => {
    if (wasRefreshing.current && !refreshing) showToast("Transactions updated");
    wasRefreshing.current = refreshing;
  }, [refreshing]);
  const handleAdd = (t, err) => { if (err) return showToast(err); addTransaction(t); showToast(isCredit(t) ? "Credit recorded" : "Debit recorded"); };
  const handleBulkAdd = (rows) => { bulkAdd(rows.map((r) => ({ note: r.note, cat: r.cat, type: r.type, amt: r.amt, date: r.date, bank: r.bank }))); showToast(`${rows.length} transaction${rows.length > 1 ? "s" : ""} imported`); };

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
      else if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ScrollContext.Provider value={scrollRef}>
      <motion.div className="fos font-ui bg-void text-app"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE }}>
        <ThemeStyles />
        <GlowField scrollYProgress={scrollYProgress} />
        <motion.div className="fixed top-0 left-0 right-0 z-50 accent-grad" style={{ height: 2, scaleX: scrollYProgress, transformOrigin: "0%" }} />
        <AnimatePresence>
          {error && (
            <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
              className="fixed top-0 inset-x-0 z-[55] flex items-center justify-center gap-4 px-4 py-2.5" style={{ background: "rgba(210,145,110,.16)", borderBottom: "1px solid rgba(210,145,110,.3)", backdropFilter: "blur(8px)" }}>
              <span className="text-debit" style={{ fontSize: 13 }}>Sync issue: {error}</span>
              <button onClick={retry} className="rounded-full px-3 py-1 font-semibold cursor-pointer border-0" style={{ fontSize: 12, background: "var(--debit)", color: "#1a160c" }}>Retry</button>
              <button onClick={dismissError} className="text-muted bg-transparent border-0 cursor-pointer"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <Spine active={active} />
        <MonthPill month={month} onPrev={prevMonth} onNext={nextMonth} />
        {accounts.length > 1 && (
          <div className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 glass rounded-full p-1 hscroll flex-nowrap" style={{ top: "calc(4.2rem + env(safe-area-inset-top))", maxWidth: "calc(100vw - 1.5rem)" }}>
            {[{ l: "All", v: "" }, ...accounts.map((a) => ({ l: a, v: a }))].map((o) => (
              <button key={o.v} onClick={() => setAccount(o.v)}
                className="rounded-full px-3 py-1 font-semibold cursor-pointer border-0 transition-all mono shrink-0 whitespace-nowrap"
                style={{ fontSize: 11, background: account === o.v ? "var(--accent)" : "transparent", color: account === o.v ? "#1a160c" : "var(--text2)" }}>
                {o.l}
              </button>
            ))}
          </div>
        )}
        <div className="hidden lg:flex items-center gap-2 fixed top-7 z-40" style={{ right: "12.5rem" }}>
          <button onClick={() => setPaletteOpen(true)} className="flex items-center gap-1.5 glass rounded-full px-3 py-2 cursor-pointer border-0" title="Command palette"><span className="kbd">⌘K</span></button>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 glass rounded-full px-4 py-2 font-semibold cursor-pointer border-0 text-app" style={{ fontSize: 12 }}><Upload size={13} style={{ color: "var(--accent)" }} /> Import</button>
          {user?.picture && <img src={user.picture} alt={user.name} onClick={signOut} title={`Sign out (${user.email})`} className="rounded-full cursor-pointer" style={{ width: 28, height: 28, border: "1.5px solid var(--line2)" }} />}
        </div>
        <MobileBar month={month} onPrev={prevMonth} onNext={nextMonth} onMenu={() => setMenuOpen(true)} onImport={() => setImportOpen(true)} />
        <MobileSheet open={menuOpen} active={active} onClose={() => setMenuOpen(false)} />

        {/* Pull-to-refresh indicator */}
        <motion.div
          className="lg:hidden fixed left-1/2 z-30 flex items-center justify-center pointer-events-none"
          style={{ x: "-50%", top: "calc(env(safe-area-inset-top) + 0.5rem)" }}
          animate={{ opacity: pull > 4 || refreshing ? 1 : 0 }}
          transition={{ duration: 0.15 }}>
          <motion.div className="glass rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36 }}
            animate={{ rotate: refreshing ? 360 : pull * 2.2, scale: pull > 4 || refreshing ? 1 : 0.6 }}
            transition={refreshing ? { rotate: { duration: 0.9, repeat: Infinity, ease: "linear" } } : { duration: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={pull >= threshold || refreshing ? "var(--accent)" : "var(--muted)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div ref={scrollRef} className="relative screen-h overflow-y-auto overflow-x-hidden no-bar ptr-scroll" style={{ zIndex: 1, scrollBehavior: "smooth", overscrollBehaviorY: "contain" }}
          animate={{ y: pull }} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
          <CommandCenter totals={totals} month={month} isEmpty={viewTxns.length === 0} onImport={() => setImportOpen(true)} onAdd={() => goTo("quickadd", false)} account={account} />
          <IncomeExpense totals={totals} />
          <Cashflow txns={viewTxns} idx={idx} />
          <Breakdown totals={totals} />
          <Transactions txns={viewTxns} globalIdx={idx} onDelete={removeTransaction} />
          <QuickAdd onAdd={handleAdd} month={month} />
          <Insights txns={viewTxns} idx={idx} />
          <HealthScore txns={viewTxns} idx={idx} />
          <Goals txns={viewTxns} idx={idx} />
        </motion.div>

        <Toast msg={toast} />
        <AnimatePresence>{importOpen && <ImportModal onConfirm={handleBulkAdd} onClose={() => setImportOpen(false)} />}</AnimatePresence>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onJump={(id) => goTo(id, false)} onImport={() => { setPaletteOpen(false); setImportOpen(true); }} onAdd={() => goTo("quickadd", false)} onClear={() => { setPaletteOpen(false); setClearOpen(true); }} />
        <Dialog open={clearOpen} title="Clear all data?" onClose={() => setClearOpen(false)}>
          <p className="text-2 mb-5" style={{ fontSize: 13.5, lineHeight: 1.55 }}>This permanently removes every transaction from this session. It can't be undone.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setClearOpen(false)} className="rounded-full px-4 py-2 text-2 bg-surface2 border border-line2 cursor-pointer" style={{ fontSize: 13 }}>Cancel</button>
            <button onClick={() => { clearAll(); setClearOpen(false); showToast("All data cleared"); }} className="rounded-full px-4 py-2 font-bold cursor-pointer border-0" style={{ fontSize: 13, background: "var(--debit)", color: "#1a160c" }}>Clear all</button>
          </div>
        </Dialog>
      </motion.div>
    </ScrollContext.Provider>
  );
}

export default function App() {
  const { user, signIn, signOut, ready } = useAuth();
  if (!user) return <LoginScreen onSignIn={signIn} ready={ready} />;
  return <Dashboard user={user} signOut={signOut} />;
}
