import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, X, Check, Calendar, BarChart3, Package, Sparkles, ChevronLeft, ChevronRight, Clock, TrendingUp, AlertCircle, Settings, LogOut, Edit3, Trash2 } from "lucide-react";

const SUPABASE_URL = "https://drgiyafkcmfydkabctxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZ2l5YWZrY21meWRrYWJjdHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTA5MDAsImV4cCI6MjEwMTkyNjkwMH0.Ak3tEWz5PL9DRhGKOswtqujW7dHM3-x79hd8ItteIQo";

// EmailJS — pour l'envoi de l'email de refus (à remplir sur emailjs.com)
const EMAILJS_SERVICE_ID = "service_zrdnuog";
const EMAILJS_TEMPLATE_ID = "template_4ux2cjt";
const EMAILJS_TEMPLATE_APPROVE_ID = "template_9rkca8s";
const EMAILJS_PUBLIC_KEY = "d-5YsA5j9C8wv8sVx";

// Charge le SDK EmailJS une seule fois et retourne une promesse résolue quand il est prêt
let _emailjsPromise = null;
function loadEmailJS() {
  if (_emailjsPromise) return _emailjsPromise;
  _emailjsPromise = new Promise((resolve, reject) => {
    if (window.emailjs) { try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {} resolve(window.emailjs); return; }
    const existing = document.getElementById('emailjs-sdk');
    if (existing) {
      existing.addEventListener('load', () => { try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {} resolve(window.emailjs); });
      existing.addEventListener('error', () => reject(new Error("Échec chargement SDK EmailJS")));
      return;
    }
    const s = document.createElement('script');
    s.id = 'emailjs-sdk';
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => { try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {} resolve(window.emailjs); };
    s.onerror = () => reject(new Error("Échec chargement SDK EmailJS"));
    document.head.appendChild(s);
  });
  return _emailjsPromise;
}

// Token session courant
let _token = SUPABASE_KEY;
let _userId = null;

const api = async (method, path, body, retry=true) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retry) {
    const refreshed = await auth.refresh();
    if (refreshed) return api(method, path, body, false);
    throw new Error("Session expirée — reconnecte-toi");
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// Charge le SDK Supabase JS (une seule fois) — utilisé uniquement pour le
// Realtime (mise à jour instantanée sans avoir à rafraîchir la page).
// Le reste de l'app continue d'utiliser les appels fetch() bruts existants.
let _supabaseJsPromise = null;
function loadSupabaseJS() {
  if (_supabaseJsPromise) return _supabaseJsPromise;
  _supabaseJsPromise = new Promise((resolve, reject) => {
    if (window.supabase) { resolve(window.supabase); return; }
    const existing = document.getElementById('supabase-js-sdk');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.supabase));
      existing.addEventListener('error', () => reject(new Error("Échec chargement SDK Supabase JS")));
      return;
    }
    const s = document.createElement('script');
    s.id = 'supabase-js-sdk';
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = () => resolve(window.supabase);
    s.onerror = () => reject(new Error("Échec chargement SDK Supabase JS"));
    document.head.appendChild(s);
  });
  return _supabaseJsPromise;
}

let _realtimeClient = null;
async function getRealtimeClient() {
  if (_realtimeClient) return _realtimeClient;
  const { createClient } = await loadSupabaseJS();
  _realtimeClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _realtimeClient;
}
// Informe le client Realtime du token de session courant, pour que les
// policies RLS s'appliquent correctement aux mises à jour en direct.
async function syncRealtimeAuth() {
  try {
    const client = await getRealtimeClient();
    client.realtime.setAuth(_token);
  } catch(e) { console.error('Erreur sync Realtime auth:', e); }
}

// Auth functions
const auth = {
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.status === 429) {
      throw new Error("Trop de tentatives d'envoi d'email pour le moment — réessaie dans quelques minutes.");
    }
    if (!res.ok || data.error) {
      const msg = data?.error?.message || data?.error_description || data?.msg || data?.error || "Erreur lors de la création du compte";
      throw new Error(msg);
    }
    // Supabase renvoie un "faux succès" (200, sans erreur) quand l'email existe déjà,
    // avec un tableau "identities" vide — c'est le seul signal disponible.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("Un compte existe déjà avec cet email. Contacte l'administratrice si besoin.");
    }
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    // Détection robuste des erreurs — Supabase renvoie des formats différents selon les versions :
    // { error: { message } }, { error_description }, { error_code, msg }, { code, msg }...
    if (!res.ok || !data.access_token || data.error) {
      const msg = data?.error?.message || data?.error_description || data?.msg || data?.error || "Email ou mot de passe incorrect";
      throw new Error(msg);
    }
    _token = data.access_token;
    // Extraire userId depuis le JWT
    let userId = data.user?.id;
    if (!userId && data.access_token) {
      try { userId = JSON.parse(atob(data.access_token.split('.')[1])).sub; } catch(e) {}
    }
    if (!userId) { _token = SUPABASE_KEY; throw new Error("Connexion impossible — réessaie"); }
    _userId = userId;
    try { localStorage.setItem('planme_session', JSON.stringify({ token:data.access_token, refreshToken:data.refresh_token, userId, email })); } catch(e) {}
    syncRealtimeAuth();
    return { ...data, user: { ...(data.user||{}), id: userId } };
  },
  async refresh() {
    try {
      const s = localStorage.getItem('planme_session');
      if (!s) return false;
      const { refreshToken } = JSON.parse(s);
      if (!refreshToken) return false;
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (data.access_token) {
        _token = data.access_token;
        _userId = data.user?.id;
        const { email } = JSON.parse(s);
        try { localStorage.setItem('planme_session', JSON.stringify({ token:data.access_token, refreshToken:data.refresh_token, userId:data.user?.id, email })); } catch(e) {}
        syncRealtimeAuth();
        return true;
      }
    } catch(e) {}
    return false;
  },
  async signOut() {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}` },
    });
    _token = SUPABASE_KEY;
    _userId = null;
    try { localStorage.removeItem('planme_session'); } catch(e) {}
  },
  getSession() {
    try {
      const s = localStorage.getItem('planme_session');
      if (s) {
        const { token, userId, email } = JSON.parse(s);
        _token = token;
        _userId = userId;
        syncRealtimeAuth();
        return { token, userId, email };
      }
    } catch(e) {}
    return null;
  }
};

// ── STYLES GLOBAUX (v2) ──────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('planme-styles')) return;
  const s = document.createElement('style');
  s.id = 'planme-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap');
    * { -webkit-tap-highlight-color: transparent; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes popIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
    @keyframes slideInRight { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:none; } }
    @keyframes slideInLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
    @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px) scale(.97); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
    @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(28,27,23,.10); } 60% { box-shadow:0 0 0 8px rgba(28,27,23,0); } }
    @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
    @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    .card-anim { animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
    .tap-card { transition: transform .12s cubic-bezier(.32,1.2,.55,1), box-shadow .12s; cursor:pointer; }
    .tap-card:active { transform: scale(0.98) !important; box-shadow: 0 1px 4px rgba(28,27,23,.05) !important; }
    .tab-content { animation: fadeIn .25s ease both; }
    .onboarding-bubble { animation: popIn .35s cubic-bezier(.22,1,.36,1) both; }
    .robe-card { transition: transform .15s cubic-bezier(.22,1,.36,1), box-shadow .15s; }
    .robe-card:active { transform: scale(0.98); }
    .btn-tap { transition: transform .1s cubic-bezier(.32,1.2,.55,1); }
    .btn-tap:active { transform: scale(0.96); }
    input:focus, select:focus { border-color: #1C1B17 !important; box-shadow: 0 0 0 3px rgba(28,27,23,.06) !important; transition: border-color .2s, box-shadow .2s; }
    .modal-enter { animation: slideUp .3s cubic-bezier(.22,1,.36,1) both; }
    @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
    @keyframes fabPulse { 0%,100% { box-shadow:0 6px 20px rgba(255,79,148,.35), 0 0 0 0 rgba(255,79,148,.35); } 50% { box-shadow:0 6px 24px rgba(255,79,148,.45), 0 0 0 8px rgba(255,79,148,0); } }
    .fab-pulse { animation: fabPulse 2.4s ease-in-out infinite; transition: transform .15s cubic-bezier(.32,1.2,.55,1); }
    .fab-pulse:active { transform: scale(0.88); }
    @keyframes popCheck { 0% { transform:scale(0); opacity:0; } 55% { transform:scale(1.25); opacity:1; } 100% { transform:scale(1); opacity:1; } }
    .pop-check { animation: popCheck .45s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes heartBurst { 0% { transform:scale(0.5); opacity:0; } 30% { transform:scale(1.3); opacity:1; } 60% { transform:scale(0.95); } 100% { transform:scale(1); opacity:1; } }
    .heart-burst { animation: heartBurst .5s cubic-bezier(.34,1.56,.64,1) both; }
  `;
  document.head.appendChild(s);
};

// ── ONBOARDING DATA ──────────────────────────────────────────
const ONBOARDING = {
  catalogue: {
    emoji: "📦",
    title: "Ton catalogue de pièces",
    desc: "Ajoute toutes tes robes, karakou, caftan... avec photo, taille, prix et caution. Appuie sur + pour commencer !",
    color: "#D9558C",
  },
  essayages: {
    emoji: "✨",
    title: "Calendrier des essayages",
    desc: "Planifie les essayages séparément de tes locations. Sélectionne un jour dans le calendrier et appuie sur + pour ajouter.",
    color: "#EFA0C0",
  },
  planning: {
    emoji: "📅",
    title: "Planning des réservations",
    desc: "Visualise tes locations confirmées sur le calendrier. Les jours occupés sont indiqués — plus jamais de double réservation !",
    color: "#D9558C",
  },
  resa: {
    emoji: "✓",
    title: "Tes réservations",
    desc: "Enregistre chaque location avec le détail client, pièce choisie, acompte et dates. Un acompte est obligatoire pour valider.",
    color: "#C4487A",
  },
  stats: {
    emoji: "📊",
    title: "Tes statistiques",
    desc: "Suis ton chiffre d'affaires, panier moyen et top pièces. Tape sur une barre du graphique pour voir le détail du mois !",
    color: "#D9558C",
  },
};

const T = {
  vert: "#E8699F", vert2: "#D9558C", vertL: "#FCE9F1", vertM: "#F5DCE7",
  rose: "#E8699F", rose2: "#D9558C", roseL: "#FCE9F1",
  or: "#B8863E", orL: "#FBF3E4",
  encre: "#211F1A", gris: "#9B8F97", fond: "#FDF8FA", blanc: "#FFFFFF",
};
const GRAD = T.rose;

const SHADES = ["#E8699F","#EFA0C0","#D9558C","#F3B8D2","#C4487A","#E8699F","#EFA0C0","#D9558C"];

const TODAY = new Date().toISOString().slice(0,10);

// ── AUTH SCREEN ─────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label:"8 caractères minimum", ok: password.length >= 8 },
    { label:"Une majuscule", ok: /[A-Z]/.test(password) },
    { label:"Un chiffre", ok: /[0-9]/.test(password) },
    { label:"Un caractère spécial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c=>c.ok).length;
  const colors = ["#E05050","#E08030","#D4A020","#3DAE72"];
  const labels = ["Trop faible","Faible","Moyen","Fort"];
  if (!password) return null;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", gap:4, marginBottom:6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:4, borderRadius:100, background:i<score?colors[score-1]:"#E8E8E8", transition:"background .3s" }}/>
        ))}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:colors[score-1]||T.gris }}>{labels[score-1]||"Trop faible"}</div>
      <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
        {checks.map(ch => (
          <span key={ch.label} style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background:ch.ok?T.vertL:"#F5F5F5", color:ch.ok?T.vert:"#999" }}>
            {ch.ok?"✓":"·"} {ch.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function AuthScreen({ onAuth, initialError, initialPaymentEmail }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(initialPaymentEmail || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [success, setSuccess] = useState("");
  const [exiting, setExiting] = useState(false);
  const [paymentPending, setPaymentPending] = useState(!!initialPaymentEmail);

  const payNow = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur lors de la création du paiement");
      window.location.href = data.url;
    } catch(e) {
      setError(e.message || "Erreur lors du paiement — réessaie.");
      setLoading(false);
    }
  };

  const pwStrong = password.length>=8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

  const submit = async () => {
    if (!email || (mode !== "forgot" && !password)) return;
    if (mode==="signup" && !pwStrong) { setError("Mot de passe trop faible — respecte les critères ci-dessous."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "signup") {
        await auth.signUp(email, password);
        // Enregistrer la demande d'accès
        await fetch(`${SUPABASE_URL}/rest/v1/users_approved`, {
          method:"POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type":"application/json", Prefer:"return=representation" },
          body: JSON.stringify({ email:email.toLowerCase().trim(), approved:false, paid:false, note:"Inscription via app" })
        }).catch(()=>{}); // Ignore si déjà existant
        setSuccess("📧 Email de confirmation envoyé ! Une fois confirmé, votre demande d'accès sera examinée sous 24h.");
        setMode("login");
        setPassword("");
      } else if (mode === "forgot") {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
          method:"POST",
          headers:{ apikey:SUPABASE_KEY, "Content-Type":"application/json" },
          body: JSON.stringify({ email })
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>({}));
          throw new Error(data?.msg || data?.error_description || "Erreur lors de l'envoi de l'email.");
        }
        setSuccess("📧 Email de réinitialisation envoyé ! Vérifie ta boîte mail.");
        setMode("login");
      } else {
        const data = await auth.signIn(email, password);
        // Vérifier accès approuvé
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=approved,paid,plan,prix`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        const checkData = await checkRes.json();
        console.log('Access check:', checkData, 'for email:', email.toLowerCase().trim());
        const access = Array.isArray(checkData) && checkData.length > 0 && checkData[0];
        if (!access) {
          // Première demande — enregistrer
          await fetch(`${SUPABASE_URL}/rest/v1/users_approved`, {
            method:"POST",
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${data.access_token}`, "Content-Type":"application/json", Prefer:"return=representation" },
            body: JSON.stringify({ email:email.toLowerCase().trim(), approved:false, paid:false, note:"Demande via app" })
          });
          await auth.signOut();
          setError("⏳ Demande enregistrée ! Vous serez contactée par email sous 24h pour valider votre accès.");
          setLoading(false);
          return;
        }
        if (!access.approved) {
          await auth.signOut();
          setError("⏳ Votre demande est en cours de validation. Vous serez contactée sous 24h.");
          setLoading(false);
          return;
        }
        if (!access.paid && access.plan !== 'admin' && access.plan !== 'fondateur') {
          await auth.signOut();
          setPaymentPending(true);
          setLoading(false);
          return;
        }
        // Accès OK
        setLoading(false);
        setSuccess("✅ Connexion réussie !");
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => onAuth({ email, userId: data.user?.id, plan: access.plan }), 500);
        }, 600);
        return;
      }
    } catch(e) {
      setError(e.message==="Invalid login credentials"?"Email ou mot de passe incorrect.":e.message||"Une erreur est survenue.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", background:T.fond, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:8, padding:"12px 14px", fontSize:15, fontFamily:"inherit", fontWeight:600, color:T.encre, outline:"none", boxSizing:"border-box" };

  if (paymentPending) {
    return (
      <div style={{ minHeight:"100vh", background:T.roseL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:"inherit" }}>
        <div style={{ marginBottom:34, textAlign:"center" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:46, color:T.encre, letterSpacing:-0.5, lineHeight:1 }}>
            Plan<span style={{ color:T.rose }}>me</span>
          </div>
        </div>
        <div style={{ width:"100%", maxWidth:380, background:"#FFFFFF", borderRadius:10, padding:"32px 26px", boxShadow:"0 20px 50px rgba(0,0,0,.22)", textAlign:"center" }}>
          <div style={{ fontSize:38, marginBottom:14 }}>💳</div>
          <div style={{ fontWeight:900, fontSize:18, color:T.encre, marginBottom:8 }}>Ton accès est validé !</div>
          <div style={{ fontSize:13, color:T.gris, marginBottom:22, lineHeight:1.5 }}>Il ne reste plus qu'à finaliser ton abonnement pour débloquer Plan Me.</div>
          {error && <div style={{ background:T.roseL, border:`1.5px solid ${T.rose}44`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, fontWeight:700, color:T.rose }}>{error}</div>}
          <button onClick={payNow} disabled={loading} style={{ width:"100%", background:loading?T.gris:T.vert, color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:900, fontSize:15, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:loading?"none":`0 4px 16px ${T.vert}44`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loading && <span style={{ display:"inline-block", width:18, height:18, border:"2.5px solid rgba(255,255,255,.3)", borderTop:"2.5px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>}
            {loading ? "Redirection..." : "Payer et débloquer l'accès →"}
          </button>
          <button onClick={()=>{ setPaymentPending(false); setError(""); }} style={{ marginTop:16, background:"none", border:"none", color:T.gris, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>← Retour à la connexion</button>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.roseL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:"inherit", opacity:exiting?0:1, transition:"opacity .5s ease" }}>
      {/* Logo */}
      <div style={{ marginBottom:34, textAlign:"center", animation:"fadeUp .6s ease both" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:46, color:T.encre, letterSpacing:-0.5, lineHeight:1 }}>
          Plan<span style={{ color:T.rose }}>me</span>
        </div>
        <div style={{ fontSize:11, color:T.encre, fontWeight:600, marginTop:10, letterSpacing:".18em", textTransform:"uppercase", opacity:.55 }}>Gestion locations</div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:380, background:"#FFFFFF", borderRadius:10, padding:"26px 22px", boxShadow:"0 20px 50px rgba(0,0,0,.22)", animation:"popIn .5s cubic-bezier(.22,1,.36,1) .1s both" }}>
        
        {/* Tabs */}
        {mode !== "forgot" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, background:T.fond, borderRadius:8, padding:4, marginBottom:22 }}>
            {[["login","Se connecter"],["signup","Créer un compte"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }} style={{ padding:"9px", borderRadius:8, border:"none", background:mode===m?T.blanc:"transparent", color:mode===m?T.encre:T.gris, fontWeight:mode===m?800:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.08)":"none", transition:"all .2s" }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {mode === "forgot" && (
          <div style={{ marginBottom:18 }}>
            <button onClick={()=>{setMode("login");setError("");setSuccess("");}} style={{ background:"none", border:"none", color:T.vert, fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>← Retour</button>
            <div style={{ fontWeight:900, fontSize:17, color:T.encre, marginTop:10 }}>Mot de passe oublié</div>
            <div style={{ fontSize:12, color:T.gris, marginTop:4 }}>On t'envoie un lien de réinitialisation.</div>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="ton@email.com" style={inp}/>
        </div>

        {/* Mot de passe */}
        {mode !== "forgot" && (
          <div style={{ marginBottom:mode==="signup"?8:16 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>Mot de passe</div>
            <div style={{ position:"relative" }}>
              <input value={password} onChange={e=>setPassword(e.target.value)} type={showPass?"text":"password"} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} style={{ ...inp, paddingRight:46 }}/>
              <button onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:T.gris }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
          </div>
        )}

        {/* Force du mot de passe */}
        {mode==="signup" && <PasswordStrength password={password}/>}

        {/* Mot de passe oublié */}
        {mode==="login" && (
          <div style={{ textAlign:"right", marginBottom:16, marginTop:-8 }}>
            <button onClick={()=>{setMode("forgot");setError("");setSuccess("");}} style={{ background:"none", border:"none", color:T.vert, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {/* Messages */}
        {error && <div style={{ background:T.roseL, border:`1.5px solid ${T.rose}44`, borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, fontWeight:700, color:T.rose }}>{error}</div>}
        {success && <div style={{ background:T.vertL, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, fontWeight:700, color:T.vert }}>{success}</div>}

        {/* Bouton */}
        <button onClick={submit} disabled={loading||!email||(mode!=="forgot"&&!password)||(mode==="signup"&&!pwStrong)} style={{ width:"100%", background:loading||!email||(mode!=="forgot"&&!password)||(mode==="signup"&&!pwStrong)?T.gris:T.vert, color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:900, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 16px ${T.vert}44`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          {loading && <span style={{ display:"inline-block", width:18, height:18, border:"2.5px solid rgba(255,255,255,.3)", borderTop:"2.5px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>}
          {loading ? "Connexion en cours..." : mode==="login" ? "Se connecter →" : mode==="signup" ? "Créer mon compte →" : "Envoyer le lien →"}
        </button>
      </div>

      <div style={{ marginTop:20, fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:600, textAlign:"center" }}>
        Plan Me · Données sécurisées · Sans engagement
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function ResetPasswordScreen({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pwStrong = password.length>=8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const match = password && password === confirm;

  const submit = async () => {
    if (!pwStrong) { setError("Mot de passe trop faible — respecte les critères ci-dessous."); return; }
    if (!match) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.msg || data?.error_description || data?.error || "Erreur lors de la mise à jour du mot de passe");
      setSuccess(true);
    } catch(e) {
      setError(e.message || "Une erreur est survenue.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", background:T.fond, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:8, padding:"12px 14px", fontSize:15, fontFamily:"inherit", fontWeight:600, color:T.encre, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", background:T.roseL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:"inherit" }}>
      <div style={{ marginBottom:34, textAlign:"center" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:46, color:T.encre, letterSpacing:-0.5, lineHeight:1 }}>
          Plan<span style={{ color:T.rose }}>me</span>
        </div>
      </div>
      <div style={{ width:"100%", maxWidth:380, background:"#FFFFFF", borderRadius:10, padding:"26px 22px", boxShadow:"0 20px 50px rgba(0,0,0,.22)" }}>
        {success ? (
          <>
            <div style={{ fontSize:34, textAlign:"center", marginBottom:10 }}>✅</div>
            <div style={{ fontWeight:900, fontSize:16, color:T.encre, textAlign:"center", marginBottom:8 }}>Mot de passe mis à jour !</div>
            <div style={{ fontSize:13, color:T.gris, textAlign:"center", marginBottom:20, lineHeight:1.5 }}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</div>
            <BtnPrimary onClick={onDone}>Aller à la connexion →</BtnPrimary>
          </>
        ) : (
          <>
            <div style={{ fontWeight:900, fontSize:17, color:T.encre, marginBottom:6 }}>Nouveau mot de passe</div>
            <div style={{ fontSize:12, color:T.gris, marginBottom:18 }}>Choisis un nouveau mot de passe pour ton compte.</div>

            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>Nouveau mot de passe</div>
              <div style={{ position:"relative" }}>
                <input value={password} onChange={e=>{setPassword(e.target.value); setError("");}} type={showPass?"text":"password"} placeholder="••••••••" style={{ ...inp, paddingRight:46 }}/>
                <button onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:T.gris }}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>
            <PasswordStrength password={password}/>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>Confirmer le mot de passe</div>
              <input value={confirm} onChange={e=>{setConfirm(e.target.value); setError("");}} type={showPass?"text":"password"} placeholder="••••••••" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              {confirm && !match && <div style={{ fontSize:11, color:T.rose, fontWeight:700, marginTop:4 }}>Les mots de passe ne correspondent pas</div>}
            </div>

            {error && <div style={{ background:T.roseL, border:`1.5px solid ${T.rose}44`, borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, fontWeight:700, color:T.rose }}>{error}</div>}

            <button onClick={submit} disabled={loading||!pwStrong||!match} style={{ width:"100%", background:loading||!pwStrong||!match?T.gris:T.vert, color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:900, fontSize:15, cursor:loading||!pwStrong||!match?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:loading||!pwStrong||!match?"none":`0 4px 16px ${T.vert}44`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {loading && <span style={{ display:"inline-block", width:18, height:18, border:"2.5px solid rgba(255,255,255,.3)", borderTop:"2.5px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>}
              {loading ? "Mise à jour..." : "Valider le nouveau mot de passe →"}
            </button>
          </>
        )}
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function PayerRedirectScreen({ email }) {
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const goPay = async () => {
    setError("");
    setRetrying(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Erreur lors de la création du paiement");
      window.location.href = data.url;
    } catch(e) {
      setError(e.message || "Une erreur est survenue.");
      setRetrying(false);
    }
  };

  useEffect(() => { goPay(); }, []);

  return (
    <div style={{ minHeight:"100vh", background:T.roseL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:"inherit", textAlign:"center" }}>
      <div style={{ marginBottom:34 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:46, color:T.encre, letterSpacing:-0.5, lineHeight:1 }}>
          Plan<span style={{ color:T.rose }}>me</span>
        </div>
      </div>
      <div style={{ width:"100%", maxWidth:380, background:"#FFFFFF", borderRadius:10, padding:"32px 26px", boxShadow:"0 20px 50px rgba(0,0,0,.22)" }}>
        {error ? (
          <>
            <div style={{ fontSize:34, marginBottom:10 }}>⚠️</div>
            <div style={{ fontWeight:900, fontSize:16, color:T.encre, marginBottom:8 }}>Impossible de continuer</div>
            <div style={{ background:T.roseL, border:`1.5px solid ${T.rose}44`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, fontWeight:700, color:T.rose }}>{error}</div>
            <button onClick={goPay} disabled={retrying} style={{ width:"100%", background:T.vert, color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:900, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 4px 16px ${T.vert}44` }}>Réessayer</button>
          </>
        ) : (
          <>
            <span style={{ display:"inline-block", width:28, height:28, border:"3px solid rgba(232,105,159,.25)", borderTop:`3px solid ${T.rose}`, borderRadius:"50%", animation:"spin .7s linear infinite", marginBottom:16 }}/>
            <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>Redirection vers le paiement...</div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function AppLoadingScreen({ step }) {
  return (
    <div style={{ minHeight:"100vh", background:T.roseL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", fontFamily:"inherit" }}>
      <div style={{ marginBottom:40, textAlign:"center", animation:"fadeUp .6s ease both" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:46, color:T.encre, letterSpacing:-0.5, lineHeight:1 }}>
          Plan<span style={{ color:T.rose }}>me</span>
        </div>
      </div>
      <span style={{ display:"inline-block", width:32, height:32, border:"3px solid rgba(232,105,159,.25)", borderTop:`3px solid ${T.rose}`, borderRadius:"50%", animation:"spin .7s linear infinite", marginBottom:18 }}/>
      <div style={{ fontSize:13, fontWeight:700, color:T.encre, opacity:.75 }}>{step || "Préparation de ton espace..."}</div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function OnboardingBubble({ tab, onDismiss }) {
  const info = ONBOARDING[tab];
  if (!info) return null;
  return (
    <div className="onboarding-bubble" style={{
      margin:"0 16px 16px",
      background:`linear-gradient(135deg,${info.color}18,${info.color}08)`,
      border:`1.5px solid ${info.color}44`,
      borderRadius:10,
      padding:"16px 18px",
      position:"relative",
    }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{ fontSize:28, flexShrink:0, animation:"bounce 2s ease infinite" }}>{info.emoji}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:15, color:info.color, marginBottom:5 }}>{info.title}</div>
          <div style={{ fontSize:13, color:T.encre, lineHeight:1.5, fontWeight:600 }}>{info.desc}</div>
        </div>
        <button onClick={onDismiss} style={{ background:"rgba(0,0,0,.06)", border:"none", borderRadius:8, width:26, height:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <X size={13} color={T.gris}/>
        </button>
      </div>
      <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
        <button onClick={onDismiss} style={{ background:info.color, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          J'ai compris ✓
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, type="success", onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2500);
    return () => clearTimeout(t);
  }, []);
  const colors = { success:T.vert, error:"#D04040", info:T.rose };
  const col = colors[type] || T.vert;
  return (
    <div style={{
      position:"fixed", bottom:100, left:"50%",
      transform:visible ? "translateX(-50%) translateY(0) scale(1)" : "translateX(-50%) translateY(20px) scale(.9)",
      opacity:visible ? 1 : 0,
      transition:"all .4s cubic-bezier(.34,1.56,.64,1)",
      background:T.blanc,
      borderRadius:100,
      padding:"12px 22px 12px 14px",
      display:"flex", gap:10, alignItems:"center",
      boxShadow:type==="success"?`0 8px 28px rgba(31,167,102,.18), 0 8px 28px rgba(255,79,148,.12)`:`0 8px 32px rgba(0,0,0,.15), 0 0 0 1px ${col}22`,
      zIndex:999, fontFamily:"inherit", whiteSpace:"nowrap",

    }}>
      <div className={visible?"pop-check":""} style={{ width:22, height:22, borderRadius:"50%", background:type==="success"?T.vert:col, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {type==="success" && <Check size={13} color="#fff" strokeWidth={3}/>}
      </div>
      <span style={{ fontWeight:800, fontSize:13, color:T.encre }}>{msg}</span>
    </div>
  );
}

function Avatar({ color, nom, size = 42 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size*.3, padding:2.5, background:T.vert, flexShrink:0, boxShadow:"0 2px 8px rgba(255,79,148,.25)" }}>
      <div style={{ width:"100%", height:"100%", borderRadius:size*.24, background:color||T.vert, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"'Manrope',sans-serif", fontWeight:700, fontSize:size*.34, letterSpacing:"-.02em" }}>
        {nom?.[0]?.toUpperCase() || "?"}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(26,46,31,.4)", zIndex:500, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxWidth:430, margin:"0 auto", background:T.blanc, borderRadius:"24px 24px 0 0", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,.2)" }}>
        <div style={{ padding:"0 18px" }}>
          <div style={{ width:36, height:4, borderRadius:100, background:T.vertM, margin:"12px auto 14px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <span style={{ fontWeight:900, fontSize:17, color:T.encre }}>{title}</span>
            <button onClick={onClose} style={{ background:T.fond, border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} color={T.gris}/></button>
          </div>
          <div style={{ paddingBottom:100 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = { width:"100%", background:T.fond, border:"none", borderRadius:10, padding:"12px 16px", fontSize:15, fontFamily:"inherit", fontWeight:600, color:T.encre, outline:"none", boxSizing:"border-box" };

function BtnPrimary({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", background:disabled?T.gris:T.vert, color:"#fff", border:"none", borderRadius:10, padding:"14px", fontWeight:900, fontSize:15, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:disabled?"none":`0 4px 16px ${T.vert}44` }}>
      {children}
    </button>
  );
}

// ── CATALOGUE ────────────────────────────────────────────────
function Catalogue({ robes, setRobes, toast }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ nom:"", categorie:"", tailleMin:"", tailleMax:"", prix:"", caution:"", photoFile:null, photoPreview:null });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const filtered = useMemo(() => robes.filter(r => r.nom?.toLowerCase().includes(q.toLowerCase())), [robes, q]);

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(p => ({ ...p, photoFile:file, photoPreview:URL.createObjectURL(file) }));
  };

  const save = async () => {
    if (!form.nom || !form.prix) return;
    setSaving(true);
    try {
      const taille = form.tailleMax ? `${form.tailleMin} → ${form.tailleMax}` : form.tailleMin;
      const shade = editId ? (robes.find(r=>r.id===editId)?.shade || SHADES[robes.length % SHADES.length]) : SHADES[robes.length % SHADES.length];

      let photo_url = form.photoPreview && !form.photoFile ? form.photoPreview : null;
      if (form.photoFile) {
        await auth.refresh().catch(()=>{});
        const ext = form.photoFile.name.split('.').pop();
        const fname = `robe_${Date.now()}.${ext}`;
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/photos-robes/${fname}`, {
          method:"POST",
          headers: { apikey:SUPABASE_KEY, Authorization:`Bearer ${_token}`, "Content-Type":form.photoFile.type, "x-upsert":"true", "cache-control":"3600" },
          body: form.photoFile
        });
        if (up.ok) {
          photo_url = `${SUPABASE_URL}/storage/v1/object/public/photos-robes/${fname}`;
        } else {
          const errTxt = await up.text();
          console.log('Upload error:', up.status, errTxt);
        }
      }

      const data = { nom:form.nom, categorie:form.categorie, taille, prix:+form.prix, caution:+form.caution, shade, photo_url, user_id:_userId };

      if (editId) {
        await api("PATCH", `robes?id=eq.${editId}`, data);
        setRobes(p => p.map(r => r.id===editId ? {...r,...data} : r));
        toast(`${form.nom} modifiée`);
      } else {
        const res = await api("POST", "robes", data);
        const newRobe = Array.isArray(res) ? res[0] : { id:`local_${Date.now()}`, ...data };
        setRobes(p => [...p, newRobe]);
        toast(`${form.nom} ajoutée au catalogue`);
      }
      setModal(false);
      setEditId(null);
      setForm({ nom:"", categorie:"", tailleMin:"", tailleMax:"", prix:"", caution:"", photoFile:null, photoPreview:null });
    } catch(e) {
      console.error(e);
      toast("Erreur lors de l'enregistrement","error");
    }
    setSaving(false);
  };

  const deleteRobe = async (r) => {
    if (!window.confirm(`Supprimer "${r.nom}" ?`)) return;
    try { await api("DELETE", `robes?id=eq.${r.id}`, null); } catch(e) {}
    setRobes(p => p.filter(x => x.id !== r.id));
    setDetail(null);
    toast("Pièce supprimée");
  };

  return (
    <div>
      <div style={{ padding:"0 16px" }}>
        <div style={{ position:"relative", marginBottom:14 }}>
          <Search size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une pièce..." style={{ ...inputStyle, paddingLeft:40, borderRadius:100 }} />
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:T.gris, marginBottom:12 }}>{filtered.length} pièce{filtered.length>1?"s":""}</div>
      </div>

      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {filtered.map((r,i) => (
          <div key={r.id} onClick={() => setDetail(r)} className="robe-card card-anim" style={{ background:T.blanc, borderRadius:14, overflow:"hidden", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.05)", animationDelay:`${Math.min(i*40,320)}ms` }}>
            <div style={{ aspectRatio:"3/4", position:"relative", overflow:"hidden", background:`linear-gradient(135deg,${r.shade||T.vert}33,${r.shade||T.vert}66)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {r.photo_url
                ? <img src={r.photo_url} alt={r.nom} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
                : <Avatar color={r.shade} nom={r.nom} size={44} />
              }
              <div style={{ position:"absolute", bottom:8, left:8, background:T.rose, borderRadius:100, padding:"3px 10px", fontSize:11, fontWeight:800, color:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}>{r.prix}€</div>
            </div>
            <div style={{ padding:"10px 11px 12px" }}>
              <div style={{ fontWeight:800, fontSize:13, color:T.encre, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.nom}</div>
              <div style={{ fontSize:11, color:T.gris, marginTop:3 }}>{r.categorie} · T.{r.taille}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={() => setModal(true)} className="fab-pulse" style={{ position:"fixed", bottom:90, right:20, width:56, height:56, borderRadius:"50%", background:T.rose, color:"#fff", border:"none", fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.rose}55`, zIndex:150 }}>
        <Plus size={24} />
      </button>

      {/* Modal ajout */}
      <Modal open={modal} onClose={() => { setModal(false); setEditId(null); setForm({ nom:"", categorie:"", tailleMin:"", tailleMax:"", prix:"", caution:"", photoFile:null, photoPreview:null }); }} title={editId ? "Modifier la pièce" : "Nouvelle pièce"}>
        <Field label="Nom de la pièce">
          <input style={inputStyle} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="ex: Karakou Yasmine" />
        </Field>
        <Field label="Type de pièce">
          <input style={inputStyle} value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))} placeholder="ex: Karakou, Caftan, Robe..." />
        </Field>
        <Field label="Taille(s)">
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
            <input style={{ ...inputStyle, textAlign:"center" }} value={form.tailleMin} onChange={e=>setForm(p=>({...p,tailleMin:e.target.value}))} placeholder="T.36" />
            <span style={{ color:T.gris, fontWeight:700 }}>→</span>
            <input style={{ ...inputStyle, textAlign:"center" }} value={form.tailleMax} onChange={e=>setForm(p=>({...p,tailleMax:e.target.value}))} placeholder="T.42" />
          </div>
          <div style={{ fontSize:11, color:T.gris, marginTop:4 }}>Laisse vide si taille unique</div>
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Prix (€)">
            <input style={inputStyle} type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder="120" />
          </Field>
          <Field label="Caution (€)">
            <input style={inputStyle} type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder="300" />
          </Field>
        </div>
        <Field label="Photo">
          <label style={{ display:"block", border:`2px dashed ${T.vertM}`, borderRadius:10, padding:"16px", textAlign:"center", background:T.fond, cursor:"pointer" }}>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
            {form.photoPreview
              ? <img src={form.photoPreview} alt="preview" style={{ width:"100%", height:130, objectFit:"cover", borderRadius:8 }} />
              : <><div style={{ fontSize:24 }}>📷</div><div style={{ fontSize:12, fontWeight:700, color:T.vert, marginTop:6 }}>Appuyer pour choisir une photo</div></>
            }
          </label>
        </Field>
        <BtnPrimary onClick={save} disabled={saving||!form.nom||!form.prix}>
          {saving ? "Enregistrement..." : editId ? "Enregistrer les modifications ✓" : "Ajouter au catalogue ✓"}
        </BtnPrimary>
      </Modal>

      {/* Modal détail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nom || ""}>
        {detail && (
          <>
            <div style={{ height:180, borderRadius:10, overflow:"hidden", background:`linear-gradient(135deg,${detail.shade||T.vert}22,${detail.shade||T.vert}55)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              {detail.photo_url
                ? <img src={detail.photo_url} alt={detail.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ textAlign:"center" }}><div style={{ fontSize:36 }}>📷</div><div style={{ fontSize:12, fontWeight:700, color:detail.shade||T.vert, marginTop:6 }}>Photo de la pièce</div></div>
              }
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              {[["Taille",detail.taille,T.encre,T.vertL],["Prix",`${detail.prix}€`,T.or,T.roseL],["Caution",`${detail.caution}€`,T.encre,T.vertL]].map(([l,v,col,bg]) => (
                <div key={l} style={{ background:bg, borderRadius:8, padding:"11px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:19, color:col }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.vertL, borderRadius:8, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <Check size={16} color={T.vert} />
              <span style={{ fontSize:13, fontWeight:700, color:T.vert }}>Disponible à la location</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => {
                const r = detail;
                const parts = r.taille?.split(' → ') || [];
                setForm({ nom:r.nom, categorie:r.categorie||"", tailleMin:parts[0]||"", tailleMax:parts[1]||"", prix:r.prix?.toString()||"", caution:r.caution?.toString()||"", photoFile:null, photoPreview:r.photo_url||null });
                setEditId(r.id);
                setDetail(null);
                setModal(true);
              }} style={{ padding:"12px", borderRadius:9, background:T.vertL, border:"none", color:T.vert, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                <Edit3 size={14}/> Modifier
              </button>
              <button onClick={() => deleteRobe(detail)} style={{ padding:"12px", borderRadius:9, background:T.roseL, border:"none", color:"#A5432E", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                <Trash2 size={14}/> Supprimer
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ── ESSAYAGES ────────────────────────────────────────────────
function buildCal(mois, events = []) {
  const y = mois.getFullYear(), m = mois.getMonth();
  const first = (new Date(y,m,1).getDay()+6)%7;
  const days = new Date(y,m+1,0).getDate();
  const cells = [];
  for (let i=0; i<first; i++) cells.push(null);
  for (let d=1; d<=days; d++) {
    const ds = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const hasEv = events.some(e => (e.debut||e.date)<=ds && (e.fin||e.date)>=ds);
    cells.push({ d, ds, hasEv });
  }
  return cells;
}

function CalHeader({ mois, setMois }) {
  const nom = mois.toLocaleDateString("fr-FR", { month:"long", year:"numeric" });
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()-1,1))} style={{ background:T.vertL, border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.vert }}><ChevronLeft size={16}/></button>
      <span style={{ fontWeight:800, fontSize:14, color:T.encre, textTransform:"capitalize" }}>{nom}</span>
      <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()+1,1))} style={{ background:T.vertL, border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.vert }}><ChevronRight size={16}/></button>
    </div>
  );
}

function CalGrid({ cells, selected, onSelect, eventsByDay={} }) {
  const jours = ["L","M","M","J","V","S","D"];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {jours.map((j,i) => <div key={i} style={{ textAlign:"center", fontSize:9, fontWeight:800, color:T.gris }}>{j}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((cell,i) => {
          if (!cell) return <div key={i}/>;
          const isSel = cell.ds===selected;
          const isToday = cell.ds===TODAY;
          const evts = eventsByDay[cell.ds] || [];
          const hasEv = evts.length > 0;
          return (
            <div key={i} onClick={() => onSelect(cell.ds)} style={{
              borderRadius:8,
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"flex-start",
              cursor:"pointer",
              background:isSel?T.vert:isToday?T.vertL:"transparent",
              border:isToday&&!isSel?`1.5px solid ${T.vert}`:"1px solid transparent",
              padding:"4px 2px 3px",
              minHeight:48,
              transition:"background .15s",
            }}>
              <span style={{ fontSize:11, fontWeight:isSel||isToday?800:600, color:isSel?"#fff":isToday?T.vert:T.encre, marginBottom:3 }}>{cell.d}</span>
              {/* Avatars miniatures des clientes/robes */}
              <div style={{ display:"flex", flexDirection:"column", gap:1.5, width:"100%", alignItems:"center" }}>
                {evts.slice(0,2).map((ev,j) => (
                  <div key={j} style={{
                    width:"90%",
                    background:isSel?"rgba(255,255,255,.25)":ev.color||T.rose,
                    borderRadius:4,
                    padding:"1px 3px",
                    display:"flex",
                    alignItems:"center",
                    gap:2,
                    overflow:"hidden",
                  }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:isSel?"rgba(255,255,255,.5)":"rgba(255,255,255,.7)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:6, fontWeight:900, color:ev.color||T.rose }}>
                      {ev.initiale||"?"}
                    </div>
                    <span style={{ fontSize:7, fontWeight:700, color:isSel?"#fff":"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3 }}>
                      {ev.nom||""}
                    </span>
                  </div>
                ))}
                {evts.length > 2 && (
                  <div style={{ fontSize:7, fontWeight:800, color:isSel?"rgba(255,255,255,.7)":T.gris }}>
                    +{evts.length-2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Essayages({ essayages, setEssayages, robes, clientes, setClientes, toast }) {
  const [mois, setMois] = useState(new Date());
  const [sel, setSel] = useState(TODAY);
  const [modal, setModal] = useState(false);
  const [editEssId, setEditEssId] = useState(null);
  const [form, setForm] = useState({ nom:"", tel:"", rid:"", heure:"10:00", note:"" });

  const cells = buildCal(mois, essayages.map(e => ({ date:e.date, debut:e.date, fin:e.date })));
  const dayEss = essayages.filter(e => e.date===sel);

  const save = async () => {
    if (!form.nom || !form.rid) return;
    let cl = clientes.find(c => c.nom.toLowerCase()===form.nom.toLowerCase());
    if (!cl || !cl.id || cl.id.startsWith('c')) {
      try {
        const found = await api("GET",`clientes?nom=eq.${encodeURIComponent(form.nom)}&user_id=eq.${_userId}&select=*`);
        if(Array.isArray(found)&&found[0]) {
          cl = found[0];
          setClientes(p => p.some(x=>x.id===cl.id) ? p : [...p, cl]);
        } else {
          const r = await api("POST","clientes",{nom:form.nom,tel:form.tel,user_id:_userId});
          if(Array.isArray(r)&&r[0]) { cl=r[0]; setClientes(p=>[...p,cl]); }
        }
      } catch(e) { console.error('Cliente error:', e); }
    }
    if (editEssId) {
      // Mode modification
      const upd = { robe_id:form.rid, heure:form.heure, note:form.note };
      try { await api("PATCH",`essayages?id=eq.${editEssId}`,upd); } catch(e) {}
      setEssayages(p=>p.map(x=>x.id===editEssId?{...x,rid:form.rid,heure:form.heure,note:form.note}:x));
      toast("Essayage modifié");
    } else {
      const ess = { id:`e${Date.now()}`, cid:cl.id, rid:form.rid, date:sel, heure:form.heure, statut:"aVenir", note:form.note };
      try { await api("POST","essayages",{ cliente_id:cl.id, robe_id:form.rid, date:sel, heure:form.heure, statut:"aVenir", note:form.note, user_id:_userId }); } catch(e) {}
      setEssayages(p => [...p, ess]);
      toast("Essayage enregistré");
    }
    setModal(false);
    setEditEssId(null);
    setForm({ nom:"", tel:"", rid:"", heure:"10:00", note:"" });
  };

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, padding:14, marginBottom:12, boxShadow:"0 2px 10px rgba(31,58,46,.07)" }}>
        <CalHeader mois={mois} setMois={setMois}/>
        <CalGrid cells={cells} selected={sel} onSelect={setSel} eventsByDay={useMemo(()=>{
        const m={};
        essayages.forEach(e=>{
          if(!m[e.date]) m[e.date]=[];
          const cl=clientes.find(x=>x.id===e.cid);
          m[e.date].push({ nom:cl?.nom?.split(' ')[0]||"?", initiale:cl?.nom?.[0]||"?", color:"#B8789E", heure:e.heure });
        });
        return m;
      },[essayages,clientes])}/>
      </div>
      <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:10, textTransform:"capitalize" }}>
        {new Date(sel).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </div>
      {dayEss.length === 0
        ? <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"24px 16px", textAlign:"center", color:T.gris, fontSize:13 }}>Aucun essayage ce jour</div>
        : dayEss.map((e,i) => {
            const r = robes.find(x=>x.id===e.rid);
            const cl = clientes.find(x=>x.id===e.cid);
            return (
              <div key={e.id} className="card-anim" style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"12px 14px", marginBottom:10, animationDelay:`${Math.min(i*40,320)}ms` }}>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:T.encre }}>{cl?.nom}</div>
                    <div style={{ fontSize:12, color:T.gris, marginTop:2 }}>{r?.nom} · {e.heure}</div>
                    {e.note && <div style={{ fontSize:11, color:T.rose, marginTop:3, fontStyle:"italic" }}>{e.note}</div>}
                  </div>
                  <span style={{ background:e.date<TODAY?T.vertL:T.orL, color:e.date<TODAY?T.gris:T.or, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:100 }}>{e.date<TODAY?"Passé":"À venir"}</span>
                </div>
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                  <button onClick={()=>{ setForm({ nom:cl?.nom||"", tel:cl?.tel||"", rid:e.rid, heure:e.heure, note:e.note||"" }); setEditEssId(e.id); setModal(true); }} style={{ padding:"6px 11px", borderRadius:7, background:T.vertL, border:"none", color:T.vert, fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                    <Edit3 size={12}/> Modifier
                  </button>
                  <button onClick={async()=>{ if(!window.confirm("Supprimer cet essayage ?")) return; try{await api("DELETE",`essayages?id=eq.${e.id}`,null);}catch(err){} setEssayages(p=>p.filter(x=>x.id!==e.id)); toast("Essayage supprimé"); }} style={{ padding:"6px 11px", borderRadius:7, background:T.roseL, border:"none", color:"#A5432E", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                    <Trash2 size={12}/> Supprimer
                  </button>
                </div>
              </div>
            );
          })
      }
      <button onClick={() => setModal(true)} className="fab-pulse" style={{ position:"fixed", bottom:90, right:20, width:56, height:56, borderRadius:"50%", background:T.rose, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.rose}55`, zIndex:150 }}>
        <Plus size={24}/>
      </button>
      <Modal open={modal} onClose={() => { setModal(false); setEditEssId(null); setForm({ nom:"", tel:"", rid:"", heure:"10:00", note:"" }); }} title={editEssId?"Modifier l'essayage":`Essayage — ${new Date(sel).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`}>
        {/* Toggle nouvelle / existante */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, background:T.fond, borderRadius:10, padding:4, marginBottom:14 }}>
          {[["existante","👥 Cliente existante"],["nouvelle","✨ Nouvelle cliente"]].map(([m,l])=>(
            <button key={m} onClick={()=>setForm(p=>({...p,modeCliente:m,nom:"",tel:""}))} style={{ padding:"10px 6px", borderRadius:8, border:"none", background:form.modeCliente===m?T.blanc:"transparent", color:form.modeCliente===m?T.encre:T.gris, fontWeight:form.modeCliente===m?800:600, fontSize:12, cursor:"pointer", fontFamily:"inherit", boxShadow:form.modeCliente===m?"0 2px 8px rgba(0,0,0,.08)":"none", transition:"all .2s" }}>
              {l}
            </button>
          ))}
        </div>

        {form.modeCliente==="existante" ? (
          <Field label="Rechercher la cliente">
            <input style={inputStyle} value={form.nom}
              onChange={e=>setForm(p=>({...p,nom:e.target.value,tel:""}))}
              placeholder="Tape le prénom..."/>
            {form.nom.length>=1 && clientes.filter(cl=>cl.nom.toLowerCase().includes(form.nom.toLowerCase())&&cl.nom.toLowerCase()!==form.nom.toLowerCase()).length>0 && (
              <div style={{ background:T.blanc, border:`1.5px solid ${T.vert}`, borderRadius:10, marginTop:6, overflow:"hidden", boxShadow:"0 8px 24px rgba(31,58,46,.15)", animation:"fadeUp .2s ease both" }}>
                {clientes.filter(cl=>cl.nom.toLowerCase().includes(form.nom.toLowerCase())&&cl.nom.toLowerCase()!==form.nom.toLowerCase()).slice(0,6).map((cl,i)=>(
                  <div key={cl.id} onClick={()=>setForm(p=>({...p,nom:cl.nom,tel:cl.tel||""}))}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", cursor:"pointer", borderBottom:i<5?`1px solid ${T.vertM}44`:"none", transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.vertL}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${SHADES[i%SHADES.length]},${SHADES[(i+2)%SHADES.length]})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:15,flexShrink:0 }}>
                      {cl.nom[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>{cl.nom}</div>
                      {cl.tel && <div style={{ fontSize:11, color:T.gris, marginTop:1 }}>📞 {cl.tel}</div>}
                    </div>
                    <div style={{ fontSize:10, color:T.gris, fontWeight:600 }}>
                      {reservations.filter(r=>r.cid===cl.id).length} résa
                    </div>
                  </div>
                ))}
              </div>
            )}
            {form.nom && clientes.find(cl=>cl.nom.toLowerCase()===form.nom.toLowerCase()) && (
              <div style={{ background:T.vertL, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:8, padding:"9px 13px", marginTop:6, display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:700, color:T.vert }}>
                <Check size={14}/> {form.nom} sélectionnée
              </div>
            )}
          </Field>
        ) : (
          <>
            <Field label="Nom complet">
              <input style={inputStyle} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
            </Field>
            <Field label="Téléphone">
              <input style={inputStyle} value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX" type="tel"/>
            </Field>
          </>
        )}
        <Field label="Pièce à essayer">
          {robes.length === 0
            ? <div style={{ background:"#FFF0EC", border:"1.5px solid #F5C0B0", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#8B3020", fontWeight:700 }}>
                ⚠️ Aucune pièce dans le catalogue. Ajoute d'abord des pièces dans l'onglet Catalogue.
              </div>
            : <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:200, overflowY:"auto" }}>
                {robes.map(r => (
                  <div key={r.id} onClick={()=>setForm(p=>({...p,rid:r.id}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:form.rid===r.id?`2px solid ${T.vert}`:`1.5px solid ${T.vertM}88`, background:form.rid===r.id?T.vertL:T.blanc, cursor:"pointer" }}>
                    {r.photo_url
                      ? <img src={r.photo_url} alt={r.nom} style={{width:34,height:34,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                      : <Avatar color={r.shade} nom={r.nom} size={34}/>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:form.rid===r.id?T.vert:T.encre }}>{r.nom}</div>
                      <div style={{ fontSize:11, color:T.gris }}>{r.categorie} · T.{r.taille} · {r.prix}€</div>
                    </div>
                    {form.rid===r.id && <Check size={16} color={T.vert}/>}
                  </div>
                ))}
              </div>
          }
        </Field>
        <Field label="Heure">
          <input style={inputStyle} type="time" value={form.heure} onChange={e=>setForm(p=>({...p,heure:e.target.value}))}/>
        </Field>
        <Field label="Note"><input style={inputStyle} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: voir aussi T.38"/></Field>
        <BtnPrimary onClick={save} disabled={!form.nom||!form.rid}>{editEssId?"Enregistrer les modifications ✓":"Enregistrer l'essayage ✓"}</BtnPrimary>
      </Modal>
    </div>
  );
}

// ── PLANNING ─────────────────────────────────────────────────
function Planning({ reservations, robes, clientes }) {
  const [mois, setMois] = useState(new Date());
  const [sel, setSel] = useState(TODAY);

  const cells = buildCal(mois, reservations.map(r => ({ debut:r.debut, fin:r.fin })));
  const dayRes = reservations.filter(r => r.debut<=sel && r.fin>=sel);

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, padding:14, marginBottom:12, boxShadow:"0 2px 10px rgba(31,58,46,.07)" }}>
        <CalHeader mois={mois} setMois={setMois}/>
        <CalGrid cells={cells} selected={sel} onSelect={setSel} eventsByDay={useMemo(()=>{
        const m={};
        reservations.forEach(r=>{
          const start=new Date(r.debut), end=new Date(r.fin);
          for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
            const ds=d.toISOString().slice(0,10);
            if(!m[ds]) m[ds]=[];
            const cl=clientes.find(x=>x.id===r.cid);
            const robe=robes.find(x=>x.id===r.rid);
            m[ds].push({ nom:robe?.nom?.split(' ')[0]||"?", initiale:cl?.nom?.[0]||"?", color:T.vert });
          }
        });
        return m;
      },[reservations,clientes,robes])}/>
      </div>
      <div style={{ background:T.vertL, border:`1.5px solid ${T.vert}33`, borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:T.vert, fontWeight:700 }}>
        📅 Planning des réservations · distinct du planning essayages
      </div>
      <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:10, textTransform:"capitalize" }}>
        {new Date(sel).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </div>
      {dayRes.length === 0
        ? <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"24px 16px", textAlign:"center", color:T.gris, fontSize:13 }}>✅ Toutes les pièces disponibles</div>
        : dayRes.map(r => {
            const robe = robes.find(x=>x.id===r.rid);
            const cl = clientes.find(x=>x.id===r.cid);
            return (
              <div key={r.id} style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, padding:"12px 14px", marginBottom:10, boxShadow:"0 2px 10px rgba(31,58,46,.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  {robe?.photo_url
                    ? <img src={robe.photo_url} alt={robe.nom} style={{width:60,height:60,borderRadius:9,objectFit:"cover",flexShrink:0}}/>
                    : <Avatar color={robe?.shade} nom={robe?.nom} size={60}/>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:T.encre }}>{cl?.nom}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.encre, marginTop:2 }}>{robe?.nom}</div>
                  </div>
                  <span style={{ background:(r.fin<TODAY?T.gris:T.rose)+"1A", color:r.fin<TODAY?T.gris:T.rose, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{r.fin<TODAY?"Archivée":"Confirmée"}</span>
                </div>
                {cleanNote(r.note) && (
                  <div style={{ background:"#FCEAEA", border:`1.5px solid #D6293A44`, borderRadius:8, padding:"9px 12px", fontSize:12, color:"#D6293A", fontWeight:700, fontStyle:"italic" }}>
                    ⚠️ {cleanNote(r.note)}
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
}

// ── RÉSERVATIONS ─────────────────────────────────────────────
// Nettoie les anciennes notes qui contenaient encore le préfixe "Prix modifié (catalogue: X€) · "
const cleanNote = (note) => {
  if (!note) return note;
  return note.replace(/^Prix modifié\s*\(catalogue:\s*[\d.,]+€\)\s*(·\s*)?/i, "").trim();
};

function Reservations({ reservations, setReservations, robes, clientes, setClientes, toast }) {
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editResaId, setEditResaId] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ nom:"", tel:"", rid:"", debut:"", fin:"", prix:"", caution:"", acompte:"", note:"", paiement:"" });
  const [showSuggest, setShowSuggest] = useState(false);
  const [formError, setFormError] = useState("");
  const [robeQuery, setRobeQuery] = useState("");

  const suggestions = form.nom.trim().length>0
    ? clientes.filter(c => c.nom.toLowerCase().includes(form.nom.trim().toLowerCase())).slice(0,6)
    : [];

  const filtered = reservations.filter(r => {
    const cl = clientes.find(x=>x.id===r.cid);
    return !q || cl?.nom.toLowerCase().includes(q.toLowerCase());
  });

  const robesFiltrees = robes.filter(r => !robeQuery.trim() || r.nom.toLowerCase().includes(robeQuery.trim().toLowerCase()));

  const rSelected = robes.find(r=>r.id===form.rid);
  const prixApplique = form.prixExc ? +form.prixExc : (+form.prix||0);
  const reste = prixApplique - (+form.acompte||0);

  const save = async () => {
    if (!form.nom || !form.rid || !form.debut || !form.acompte) return;
    setFormError("");
    let cl = clientes.find(c=>c.nom.toLowerCase()===form.nom.toLowerCase());
    let clienteJusteCreee = false; // pour rollback si la réservation échoue ensuite

    try {
      // Créer la cliente si elle n'existe pas — SANS id local bidon (l'ancien
      // `c${Date.now()}` n'était pas un UUID valide et faisait échouer l'insertion
      // de la réservation sans que la cliente ne voie d'erreur).
      if (!cl) {
        const r = await api("POST","clientes",{ nom:form.nom, tel:form.tel, user_id:_userId });
        if (!Array.isArray(r) || !r[0] || !r[0].id) throw new Error("Échec création cliente");
        cl = r[0];
        clienteJusteCreee = true;
        setClientes(p => [...p, cl]);
      }

      const prixFinal = form.prixExc ? +form.prixExc : +form.prix;
      const data = { cliente_id:cl.id, robe_id:form.rid, debut:form.debut, fin:form.fin||form.debut, prix:prixFinal, caution:+form.caution, acompte:+form.acompte, statut:"confirmee", moyen_paiement:form.paiement||null, note:form.note, user_id:_userId };

      if (editResaId) {
        await api("PATCH",`reservations?id=eq.${editResaId}`,data);
        setReservations(p=>p.map(x=>x.id===editResaId?{...x,...data,cid:cl.id,rid:form.rid,id:editResaId}:x));
        toast("Réservation modifiée");
      } else {
        const r = await api("POST","reservations",data);
        if (!Array.isArray(r) || !r[0] || !r[0].id) throw new Error("Échec création réservation");
        setReservations(p=>[...p,{...r[0],cid:r[0].cliente_id,rid:r[0].robe_id}]);
        toast("Réservation confirmée ✓");
      }

      setModal(false);
      setEditResaId(null);
      setForm({ nom:"", tel:"", rid:"", debut:"", fin:"", prix:"", caution:"", acompte:"", note:"", prixExc:"", modeCliente:"existante" });

    } catch(e) {
      console.error('Erreur réservation:', e);

      // Rollback : si on venait de créer la cliente pour cette réservation
      // et que la réservation échoue finalement, on supprime la fiche
      // orpheline plutôt que de la laisser traîner sans réservation.
      if (clienteJusteCreee && cl?.id) {
        try {
          await api("DELETE", `clientes?id=eq.${cl.id}`, null);
          setClientes(p => p.filter(x => x.id !== cl.id));
        } catch(delErr) {
          console.error('Erreur lors du rollback cliente:', delErr);
        }
      }

      const msg = String(e?.message || e);
      const isConflit = msg.includes("no_overlapping_reservations") || msg.includes("23P01") || msg.includes("exclusion");
      const msgPlain = isConflit
        ? "Cette pièce est déjà réservée sur ces dates. Choisis d'autres dates ou une autre pièce."
        : "La réservation n'a pas pu être enregistrée. Réessaie.";
      toast((isConflit ? "⚠️ " : "❌ ") + msgPlain, "error");
      // Bannière persistante dans le formulaire — contrairement au toast (2,5s puis
      // disparaît), elle reste visible tant que la cliente n'a pas relancé une tentative.
      // (Le pictogramme est déjà affiché par la bannière elle-même, on ne le répète pas ici.)
      setFormError(msgPlain);
      // On ne ferme PAS le modal et on n'ajoute RIEN à l'affichage tant que
      // ce n'est pas confirmé en base — plus de fausse confirmation.
    }
  };

  const statCol = { confirmee:T.rose, enCours:T.vert, terminee:T.gris, archivee:T.gris };
  const statLbl = { confirmee:"Confirmée", enCours:"En cours", terminee:"Terminée", archivee:"Archivée" };
  const statutEffectif = (r) => (r.statut==="confirmee" && r.fin < TODAY) ? "archivee" : r.statut;

  return (
    <div>
      <div style={{ padding:"0 16px" }}>
        <div style={{ position:"relative", marginBottom:12 }}>
          <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une cliente..." style={{ ...inputStyle, paddingLeft:40, borderRadius:100 }}/>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:T.gris, marginBottom:10 }}>{filtered.length} réservation{filtered.length>1?"s":""}</div>
      </div>
      <div style={{ padding:"0 16px" }}>
        {filtered.map((r,i) => {
          const robe = robes.find(x=>x.id===r.rid);
          const cl = clientes.find(x=>x.id===r.cid);
          const reste = r.prix - r.acompte;
          return (
            <div key={r.id} onClick={()=>setDetail({r,robe,cl,reste})} className="tap-card card-anim" style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, padding:"13px 15px", marginBottom:10, cursor:"pointer", boxShadow:"0 2px 10px rgba(31,58,46,.07)", animationDelay:`${Math.min(i*40,320)}ms` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                                {robe?.photo_url
                  ? <img src={robe.photo_url} alt={robe.nom} style={{width:60,height:60,borderRadius:9,objectFit:"cover",flexShrink:0}}/>
                  : <Avatar color={robe?.shade} nom={robe?.nom} size={60}/>
                } <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>{cl?.nom}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.encre }}>{robe?.nom}</div>
                </div>
                <span style={{ background:(statCol[statutEffectif(r)]||T.gris)+"1A", color:statCol[statutEffectif(r)]||T.gris, border:`1px solid ${statCol[statutEffectif(r)]||T.gris}33`, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{statLbl[statutEffectif(r)]||statutEffectif(r)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.gris, marginBottom:r.note?8:(r.prix>0?8:0) }}>
                <Clock size={12}/> {new Date(r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → {new Date(r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
              </div>
              {cleanNote(r.note) && (
                <div style={{ background:"#FCEAEA", border:`1.5px solid #D6293A44`, borderRadius:8, padding:"7px 11px", marginBottom:r.prix>0?8:0, fontSize:11.5, color:"#D6293A", fontWeight:700, fontStyle:"italic", display:"flex", alignItems:"flex-start", gap:6 }}>
                  ⚠️ {cleanNote(r.note)}
                </div>
              )}
              {r.prix>0 && (
                <div style={{ background:r.statut==="terminee"?T.vertL:reste>0?"#FFF0EC":T.vertL, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:T.gris, fontWeight:600 }}>{r.statut==="terminee"?"Soldée ✓":`Reste à payer`}</span>
                  <span style={{ fontWeight:900, fontSize:14, color:r.statut==="terminee"?T.vert:reste>0?T.rose:T.vert }}>{r.statut==="terminee"?"0€":`${reste}€`}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setModal(true)} className="fab-pulse" style={{ position:"fixed", bottom:90, right:20, width:56, height:56, borderRadius:"50%", background:T.rose, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.rose}55`, zIndex:150 }}>
        <Plus size={24}/>
      </button>

      {/* Modal détail réservation */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail réservation">
        {detail && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:14, background:T.fond, borderRadius:10, padding:14, marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:17, color:T.encre }}>{detail.cl?.nom}</div>
                <div style={{ fontSize:12, color:T.gris, marginTop:3 }}>{detail.cl?.tel}</div>
                <span style={{ marginTop:6, display:"inline-block", background:(statCol[statutEffectif(detail.r)]||T.gris)+"1A", color:statCol[statutEffectif(detail.r)]||T.gris, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{statLbl[statutEffectif(detail.r)]||statutEffectif(detail.r)}</span>
              </div>
            </div>
            <div style={{ background:T.blanc, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:10, padding:"11px 14px", marginBottom:12, display:"flex", gap:12, alignItems:"center" }}>
              {detail.robe?.photo_url
                ? <img src={detail.robe.photo_url} alt={detail.robe.nom} style={{ width:38, height:38, borderRadius:11, objectFit:"cover", flexShrink:0 }}/>
                : <Avatar color={detail.robe?.shade} nom={detail.robe?.nom} size={38}/>
              }
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:T.encre }}>{detail.robe?.nom}</div>
                <div style={{ fontSize:11, color:T.gris }}>{detail.robe?.categorie} · T.{detail.robe?.taille}</div>
              </div>
            </div>
            <div style={{ background:T.blanc, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:10, padding:"11px 14px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Dates</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.encre }}>
                {new Date(detail.r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})} → {new Date(detail.r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>
            {/* Prix location */}
            <div style={{ background:T.blanc, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:10, padding:"11px 14px", marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Prix location</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[["Prix",`${detail.r.prix}€`,T.vert],["Acompte versé",`${detail.r.acompte}€`,T.gris]].map(([l,v,col]) => (
                  <div key={l} style={{ background:T.fond, borderRadius:8, padding:8, textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:800, color:T.gris, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>{l}</div>
                    <div style={{ fontWeight:900, fontSize:16, color:col }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:detail.r.statut==="terminee"?T.vertL:detail.reste>0?"#FFF0EC":T.vertL, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:detail.r.statut==="terminee"?T.vert:detail.reste>0?T.rose:T.vert }}>{detail.r.statut==="terminee"?"Soldée ✓":"Reste à payer"}</span>
                <span style={{ fontWeight:900, fontSize:18, color:detail.r.statut==="terminee"?T.vert:detail.reste>0?T.rose:T.vert }}>{detail.r.statut==="terminee"?"0€":`${detail.reste}€`}</span>
              </div>
              {detail.r.moyen_paiement && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                <span style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".08em", textTransform:"uppercase" }}>Paiement</span>
                <span style={{ background:T.roseL, color:T.rose, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:100 }}>{detail.r.moyen_paiement}</span>
              </div>}
            </div>
            {/* Caution séparée */}
            <div style={{ background:T.vertL, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", borderRadius:10, padding:"11px 14px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase" }}>Caution</div>
                <span style={{ fontWeight:900, fontSize:16, color:T.encre }}>{detail.r.caution}€</span>
              </div>
              <div style={{ fontSize:11, color:T.gris, fontWeight:600 }}>Chèque caution — séparé du prix · à rendre à la fin</div>
            </div>
            {cleanNote(detail.r.note) && <div style={{ background:"#FCEAEA", border:`1.5px solid #D6293A44`, borderRadius:10, padding:"10px 14px", marginBottom:10, fontSize:12, color:"#D6293A", fontWeight:600, fontStyle:"italic" }}>{cleanNote(detail.r.note)}</div>}
            {/* Boutons modifier / supprimer */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
              <button onClick={()=>{
                setDetail(null);
                setModal(true);
                setForm({ nom:detail.cl?.nom||"", tel:detail.cl?.tel||"", rid:detail.r.rid, debut:detail.r.debut, fin:detail.r.fin, prix:detail.r.prix?.toString()||"", caution:detail.r.caution?.toString()||"", acompte:detail.r.acompte?.toString()||"", note:detail.r.note||"", paiement:detail.r.moyen_paiement||"", prixExc:"" });
                setEditResaId(detail.r.id);
              }} style={{ padding:"12px", borderRadius:9, background:T.vertL, border:"none", color:T.vert, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                <Edit3 size={14}/> Modifier
              </button>
              <button onClick={async()=>{
                if(!window.confirm(`Supprimer cette réservation ?`)) return;
                try{await api("DELETE",`reservations?id=eq.${detail.r.id}`,null);}catch(e){}
                setReservations(p=>p.filter(x=>x.id!==detail.r.id));
                setDetail(null);
                toast("Réservation supprimée");
              }} style={{ padding:"12px", borderRadius:9, background:T.roseL, border:"none", color:"#A5432E", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                <Trash2 size={14}/> Supprimer
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal nouvelle réservation */}
      <Modal open={modal} onClose={() => { setModal(false); setFormError(""); setRobeQuery(""); }} title="Nouvelle réservation">
        {formError && (
          <div style={{ background:"#FDECEC", border:"1.5px solid #E24C4C", borderRadius:9, padding:"11px 14px", marginBottom:14, fontSize:12.5, color:"#B01E1E", fontWeight:700, display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ fontSize:15, lineHeight:1 }}>⚠️</span>
            <span>{formError}</span>
          </div>
        )}
        <div style={{ background:T.vertL, borderRadius:8, padding:"9px 13px", marginBottom:14, fontSize:12, color:T.vert, fontWeight:700 }}>✨ Suite à un essayage ? La cliente sera retrouvée automatiquement</div>
        <Field label="Cliente">
          <div style={{ position:"relative" }}>
            <input
              style={inputStyle}
              value={form.nom}
              onChange={e=>{ setForm(p=>({...p,nom:e.target.value})); setShowSuggest(true); setFormError(""); }}
              onFocus={()=>setShowSuggest(true)}
              onBlur={()=>setTimeout(()=>setShowSuggest(false),150)}
              placeholder="Prénom Nom"
              autoComplete="off"
            />
            {showSuggest && suggestions.length>0 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:T.blanc, border:`1px solid ${T.vertM}`, borderRadius:8, boxShadow:"0 8px 24px rgba(30,74,48,.12)", zIndex:50, maxHeight:200, overflowY:"auto" }}>
                {suggestions.map(c => (
                  <div
                    key={c.id}
                    onMouseDown={()=>{ setForm(p=>({...p,nom:c.nom,tel:c.tel||p.tel})); setShowSuggest(false); }}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", cursor:"pointer", borderBottom:`1px solid ${T.vertM}44` }}
                  >
                    <div>
                      <div style={{ fontWeight:800, fontSize:13, color:T.encre }}>{c.nom}</div>
                      {c.tel && <div style={{ fontSize:11, color:T.gris }}>{c.tel}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Pièce choisie">
          <div style={{ position:"relative", marginBottom:8 }}>
            <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }}/>
            <input
              value={robeQuery}
              onChange={e=>setRobeQuery(e.target.value)}
              placeholder="Rechercher une pièce (ex: vert, karako...)"
              style={{ ...inputStyle, paddingLeft:36, padding:"9px 12px 9px 36px", fontSize:13 }}
            />
          </div>
          {robesFiltrees.length===0 && (
            <div style={{ fontSize:12, color:T.gris, padding:"10px 4px", textAlign:"center" }}>Aucune pièce ne correspond à "{robeQuery}"</div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:200, overflowY:"auto" }}>
            {robesFiltrees.map(r => (
              <div key={r.id} onClick={()=>setForm(p=>({...p,rid:r.id,prix:r.prix?.toString()||"",caution:r.caution?.toString()||""}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:form.rid===r.id?`2px solid ${T.vert}`:`1.5px solid ${T.vertM}88`, background:form.rid===r.id?T.vertL:T.blanc, cursor:"pointer" }}>
                {r.photo_url
                  ? <img src={r.photo_url} alt={r.nom} style={{width:34,height:34,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                  : <Avatar color={r.shade} nom={r.nom} size={34}/>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:form.rid===r.id?T.vert:T.encre }}>{r.nom}</div>
                  <div style={{ fontSize:11, color:T.gris }}>T.{r.taille} · {r.prix}€</div>
                </div>
                {form.rid===r.id && <Check size={16} color={T.vert}/>}
              </div>
            ))}
          </div>
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Date début"><input style={inputStyle} type="date" value={form.debut} onChange={e=>{setForm(p=>({...p,debut:e.target.value})); setFormError("");}}/></Field>
          <Field label="Date fin"><input style={inputStyle} type="date" value={form.fin} onChange={e=>{setForm(p=>({...p,fin:e.target.value})); setFormError("");}}/></Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Prix (€)"><input style={inputStyle} type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder={rSelected?.prix?.toString()||""}/></Field>
          <Field label="Caution (€)"><input style={inputStyle} type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder={rSelected?.caution?.toString()||""}/></Field>
        </div>
        <Field label="Acompte versé (€) *">
          <input style={{ ...inputStyle, borderColor:!form.acompte?T.rose:T.vertM }} type="number" value={form.acompte} onChange={e=>setForm(p=>({...p,acompte:e.target.value}))} placeholder="Obligatoire pour confirmer"/>
          {!form.acompte && <div style={{ fontSize:11, color:T.rose, fontWeight:700, marginTop:4 }}>⚠️ L'acompte est obligatoire pour bloquer la pièce</div>}
        </Field>
        <Field label="Moyen de paiement">
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["Espèces","Carte","Virement","PayPal","Wero","Chèque"].map(m => (
              <button key={m} type="button" onClick={()=>setForm(p=>({...p,paiement:p.paiement===m?"":m}))}
                style={{ padding:"7px 13px", borderRadius:100, border:`1px solid ${form.paiement===m?T.rose:T.vertM}`, background:form.paiement===m?T.rose:T.blanc, color:form.paiement===m?"#fff":T.encre, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {m}
              </button>
            ))}
          </div>
        </Field>
        {+form.prix>0 && (
          <div style={{ background:T.roseL, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
            {form.prixExc && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.gris, marginBottom:2 }}><span>Prix catalogue</span><span style={{textDecoration:"line-through"}}>{form.prix}€</span></div>}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:form.prixExc?T.rose:T.gris, marginBottom:4, fontWeight:form.prixExc?700:600 }}><span>{form.prixExc?"✏️ Prix exceptionnel":"Prix dû"}</span><span>{form.prixExc||form.prix}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.gris, marginBottom:8 }}><span>Acompte</span><span>−{form.acompte||0}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:16, color:T.vert, borderTop:`1.5px solid ${T.vertM}`, paddingTop:8 }}><span>Reste à payer</span><span>{reste}€</span></div>
          </div>
        )}
        {/* Prix exceptionnel */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".14em", textTransform:"uppercase", marginBottom:5 }}>
            Prix exceptionnel (optionnel)
            <span style={{ background:T.roseL, color:T.rose, fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:6, marginLeft:6 }}>✏️ ristourne</span>
          </div>
          <input style={{ ...inputStyle, borderColor:form.prixExc?T.rose:T.vertM, background:form.prixExc?T.roseL:T.fond }} type="number" value={form.prixExc||""} onChange={e=>setForm(p=>({...p,prixExc:e.target.value}))} placeholder={`Catalogue : ${rSelected?.prix||""}€ — laisser vide si prix normal`}/>
          {form.prixExc && <div style={{ fontSize:11, color:T.rose, fontWeight:700, marginTop:4 }}>✏️ Prix modifié · catalogue : {rSelected?.prix}€ · appliqué : {form.prixExc}€</div>}
        </div>
        <Field label="Note"><input style={inputStyle} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: suite à l'essayage du 11 juil."/></Field>
        <BtnPrimary onClick={save} disabled={!form.nom||!form.rid||!form.debut||!form.acompte}>Confirmer la réservation ✓</BtnPrimary>
      </Modal>
    </div>
  );
}

// ── STATS ─────────────────────────────────────────────────────
function Stats({ reservations, robes }) {
  const [moisDetail, setMoisDetail] = useState(null);
  const caTotal = reservations.reduce((s,r)=>s+(r.prix||0),0);
  const pm = reservations.length ? Math.round(caTotal/reservations.length) : 0;
  const cautions = reservations.filter(r=>r.statut!=="terminee").reduce((s,r)=>s+(r.caution||0),0);

  const parMois = useMemo(() => {
    const m={};
    reservations.forEach(r=>{ const k=r.debut?.slice(0,7); if(k) m[k]=(m[k]||0)+(r.prix||0); });
    return Object.entries(m).sort().slice(-6);
  },[reservations]);
  const maxCA = Math.max(...parMois.map(([,v])=>v),1);

  const parRobe = useMemo(() => {
    const m={};
    reservations.forEach(r=>{ m[r.rid]=(m[r.rid]||0)+(r.prix||0); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[reservations]);

  const MN={"2026-01":"Jan","2026-02":"Fév","2026-03":"Mar","2026-04":"Avr","2026-05":"Mai","2026-06":"Jun","2026-07":"Jul","2026-08":"Aoû","2026-09":"Sep","2026-10":"Oct","2026-11":"Nov","2026-12":"Déc"};
  const resDetail = moisDetail ? reservations.filter(r=>r.debut?.startsWith(moisDetail)) : [];

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div style={{ background:`linear-gradient(135deg,${T.vert}18,${T.vertL})`, border:`1px solid ${T.vert}33`, borderRadius:10, padding:14 }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.vert, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Chiffre d'affaires</div>
          <div style={{ fontWeight:900, fontSize:26, color:T.vert }}>{caTotal.toLocaleString("fr-FR")}€</div>
          <div style={{ fontSize:11, color:T.gris, marginTop:4 }}>{reservations.length} réservations</div>
        </div>
        <div style={{ background:`linear-gradient(135deg,${T.rose}18,${T.roseL})`, border:`1px solid ${T.rose}33`, borderRadius:10, padding:14 }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.rose, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Panier moyen</div>
          <div style={{ fontWeight:900, fontSize:26, color:T.rose }}>{pm}€</div>
          <div style={{ fontSize:11, color:T.gris, marginTop:4 }}>par réservation</div>
        </div>
      </div>
      <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:14, marginBottom:10 }}>
        <div style={{ fontWeight:800, fontSize:14, color:T.encre, marginBottom:4 }}>CA par mois</div>
        <div style={{ fontSize:11, color:T.gris, marginBottom:14 }}>Tap sur une barre pour le détail</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:90 }}>
          {parMois.map(([k,v],i) => {
            const isLast=i===parMois.length-1, isSel=k===moisDetail;
            return (
              <div key={k} onClick={()=>setMoisDetail(isSel?null:k)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%", justifyContent:"flex-end", cursor:"pointer" }}>
                <div style={{ fontSize:8, fontWeight:700, color:isSel?T.vert:T.gris }}>{v>0?`${Math.round(v/100)/10}k`:""}</div>
                <div style={{ width:"100%", borderRadius:"6px 6px 0 0", background:isSel?`linear-gradient(180deg,${T.rose},${T.rose}AA)`:isLast?`linear-gradient(180deg,${T.vert},${T.vert2})`:T.vertM, height:`${Math.max(Math.round((v/maxCA)*100),4)}%`, border:isSel?`1.5px solid ${T.rose}`:"none" }}/>
                <div style={{ fontSize:9, fontWeight:700, color:isSel?T.rose:isLast?T.vert:T.gris }}>{MN[k]||k}</div>
              </div>
            );
          })}
        </div>
      </div>
      {moisDetail && resDetail.length>0 && (
        <div style={{ background:T.blanc, border:`1.5px solid ${T.rose}`, borderRadius:10, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:14, color:T.encre }}>{MN[moisDetail]||moisDetail}</div>
              <div style={{ fontSize:11, color:T.gris }}>{resDetail.length} réservations · {resDetail.reduce((s,r)=>s+(r.prix||0),0)}€</div>
            </div>
            <button onClick={()=>setMoisDetail(null)} style={{ background:T.fond, border:"none", borderRadius:8, width:28, height:28, cursor:"pointer" }}><X size={14} color={T.gris}/></button>
          </div>
          {resDetail.map(r => {
            const robe=robes.find(x=>x.id===r.rid);
            return (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.vertM}` }}>
                {robe?.photo_url
                  ? <img src={robe.photo_url} alt={robe.nom} style={{ width:32, height:32, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>
                  : <Avatar color={robe?.shade} nom={robe?.nom} size={32}/>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.encre }}>{robe?.nom}</div>
                  <div style={{ fontSize:11, color:T.gris }}>{new Date(r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:900, color:T.vert }}>{r.prix}€</span>
              </div>
            );
          })}
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:15, color:T.vert, marginTop:10, paddingTop:10, borderTop:`1.5px solid ${T.vertM}` }}>
            <span>Total</span><span>{resDetail.reduce((s,r)=>s+(r.prix||0),0)}€</span>
          </div>
        </div>
      )}
      <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:14 }}>
        <div style={{ fontWeight:800, fontSize:14, color:T.encre, marginBottom:12 }}>Top pièces</div>
        {parRobe.map(([rid,ca],i) => {
          const r=robes.find(x=>x.id===rid);
          return (
            <div key={rid} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:i===0?T.rose:T.vertL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:i===0?"#fff":T.vert }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:800, color:T.encre }}>{r?.nom||rid}</div>
                <div style={{ height:4, background:T.vertL, borderRadius:100, marginTop:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round((ca/parRobe[0][1])*100)}%`, background:`linear-gradient(90deg,${T.vert},${T.vertM})`, borderRadius:100 }}/>
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:900, color:T.vert }}>{ca}€</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CLIENTES ─────────────────────────────────────────────────
function ClientesTab({ clientes, setClientes, reservations, essayages, robes, toast }) {
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom:"", tel:"" });

  const filtered = clientes.filter(cl =>
    !q || cl.nom?.toLowerCase().includes(q.toLowerCase()) || cl.tel?.includes(q)
  );

  const save = async () => {
    if (!form.nom) return;
    try {
      const r = await api("POST","clientes",{ nom:form.nom, tel:form.tel, user_id:_userId });
      const newCl = Array.isArray(r)&&r[0] ? r[0] : { id:`c${Date.now()}`, ...form };
      setClientes(p => [...p, newCl]);
      toast("Cliente ajoutée");
    } catch(e) { toast("Erreur","error"); }
    setModal(false);
    setForm({ nom:"", tel:"" });
  };

  const deleteCl = async (cl) => {
    if (!window.confirm(`Supprimer ${cl.nom} ?`)) return;
    try { await api("DELETE",`clientes?id=eq.${cl.id}`,null); } catch(e) {}
    setClientes(p => p.filter(x => x.id !== cl.id));
    setDetail(null);
    toast("Cliente supprimée");
  };

  return (
    <div>
      <div style={{ padding:"0 16px" }}>
        <div style={{ position:"relative", marginBottom:10 }}>
          <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une cliente..." style={{ ...inputStyle, paddingLeft:40, borderRadius:100 }}/>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:T.gris, marginBottom:10 }}>{filtered.length} cliente{filtered.length>1?"s":""}</div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {filtered.length === 0 && (
          <div style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"32px 16px", textAlign:"center", color:T.gris }}>
            <div style={{ fontSize:24, marginBottom:8 }}>👥</div>
            <div style={{ fontSize:13, fontWeight:700 }}>Aucune cliente pour l'instant</div>
            <div style={{ fontSize:12, marginTop:4 }}>Elles apparaissent automatiquement lors des essayages et réservations</div>
          </div>
        )}
        {filtered.map((cl,idx) => {
          const clResa = reservations.filter(r => r.cid===cl.id);
          const clEss = essayages.filter(e => e.cid===cl.id);
          const caTotal = clResa.reduce((s,r)=>s+(r.prix||0),0);
          return (
            <div key={cl.id} onClick={()=>setDetail(cl)}
              className="tap-card"
              style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, padding:"13px 15px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 10px rgba(31,58,46,.07)", animation:`fadeUp .4s cubic-bezier(.22,1,.36,1) ${idx*.05}s both` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16, color:T.encre }}>{cl.nom}</div>
                {cl.tel && <div style={{ fontSize:12, color:T.gris, marginTop:2 }}>{cl.tel}</div>}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  {clResa.length>0 && <span style={{ background:T.vertL, color:T.vert, fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:100 }}>{clResa.length} résa</span>}
                  {clEss.length>0 && <span style={{ background:T.roseL, color:T.rose, fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:100 }}>{clEss.length} essayage{clEss.length>1?"s":""}</span>}
                  {caTotal>0 && <span style={{ background:T.orL, color:T.or, fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:100 }}>{caTotal}€</span>}
                </div>
              </div>
              <ChevronRight size={16} color={T.gris}/>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={() => setModal(true)} className="fab-pulse" style={{ position:"fixed", bottom:90, right:20, width:56, height:56, borderRadius:"50%", background:T.rose, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.rose}55`, zIndex:150 }}>
        <Plus size={24}/>
      </button>

      {/* Modal ajout */}
      <Modal open={modal} onClose={() => { setModal(false); setForm({ nom:"", tel:"" }); }} title="Nouvelle cliente">
        <Field label="Nom complet">
          <input style={inputStyle} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
        </Field>
        <Field label="Téléphone">
          <input style={inputStyle} value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX" type="tel"/>
        </Field>
        <BtnPrimary onClick={save} disabled={!form.nom}>Ajouter la cliente ✓</BtnPrimary>
      </Modal>

      {/* Modal fiche cliente */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?.nom||""}>
        {detail && (() => {
          const clResa = reservations.filter(r=>r.cid===detail.id);
          const clEss = essayages.filter(e=>e.cid===detail.id);
          const caTotal = clResa.reduce((s,r)=>s+(r.prix||0),0);
          return (
            <>
              {/* Infos */}
              <div style={{ background:T.fond, borderRadius:10, padding:14, marginBottom:14, display:"flex", gap:14, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:900, fontSize:18, color:T.encre }}>{detail.nom}</div>
                  {detail.tel && <div style={{ fontSize:13, color:T.gris, marginTop:3 }}>📞 {detail.tel}</div>}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[["Réservations",clResa.length,T.vert,T.vertL],["Essayages",clEss.length,T.rose,T.roseL],["CA total",`${caTotal}€`,T.or,T.vertL]].map(([l,v,col,bg])=>(
                  <div key={l} style={{ background:bg, borderRadius:8, padding:"11px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:T.gris, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>{l}</div>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:19, color:col }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Historique réservations */}
              {clResa.length>0 && (
                <>
                  <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:8 }}>Réservations</div>
                  {clResa.map(r=>{
                    const robe=robes.find(x=>x.id===r.rid);
                    return (
                      <div key={r.id} style={{ background:T.blanc, borderRadius:8, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"10px 12px", marginBottom:8, display:"flex", gap:10, alignItems:"center" }}>
                        {robe?.photo_url
                          ? <img src={robe.photo_url} alt={robe.nom} style={{width:36,height:36,borderRadius:9,objectFit:"cover",flexShrink:0}}/>
                          : <Avatar color={robe?.shade} nom={robe?.nom} size={36}/>
                        }
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:12, color:T.encre }}>{robe?.nom||"Pièce inconnue"}</div>
                          <div style={{ fontSize:11, color:T.gris }}>{new Date(r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → {new Date(r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
                        </div>
                        <span style={{ fontWeight:900, fontSize:13, color:T.vert }}>{r.prix}€</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Historique essayages */}
              {clEss.length>0 && (
                <>
                  <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:8, marginTop:clResa.length>0?12:0 }}>Essayages</div>
                  {clEss.map(e=>{
                    const robe=robes.find(x=>x.id===e.rid);
                    return (
                      <div key={e.id} style={{ background:T.blanc, borderRadius:8, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"10px 12px", marginBottom:8, display:"flex", gap:10, alignItems:"center" }}>
                        {robe?.photo_url
                          ? <img src={robe.photo_url} alt={robe.nom} style={{width:36,height:36,borderRadius:9,objectFit:"cover",flexShrink:0}}/>
                          : <Avatar color={robe?.shade} nom={robe?.nom} size={36}/>
                        }
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800, fontSize:12, color:T.encre }}>{robe?.nom||"Pièce inconnue"}</div>
                          <div style={{ fontSize:11, color:T.gris }}>{new Date(e.date).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} · {e.heure}</div>
                        </div>
                        <span style={{ background:T.roseL, color:T.rose, fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:100 }}>Essayage</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Actions */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
                <button onClick={()=>{}} style={{ padding:"12px", borderRadius:9, background:T.vertL, border:"none", color:T.vert, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Edit3 size={14}/> Modifier
                </button>
                <button onClick={()=>deleteCl(detail)} style={{ padding:"12px", borderRadius:9, background:T.roseL, border:"none", color:"#A5432E", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Trash2 size={14}/> Supprimer
                </button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────
function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmailJS().catch(e => console.error("EmailJS non chargé:", e));
    fetch(`${SUPABASE_URL}/rest/v1/users_approved?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}` }
    }).then(r=>r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data);
    }).finally(()=>setLoading(false));
  },[]);

  // Realtime : voit apparaître les nouvelles inscriptions et les paiements
  // confirmés automatiquement, sans avoir à recharger la page.
  useEffect(() => {
    let channel;
    let cancelled = false;
    (async () => {
      try {
        const client = await getRealtimeClient();
        client.realtime.setAuth(_token);
        channel = client
          .channel('planme-admin-users')
          .on('postgres_changes', { event:'*', schema:'public', table:'users_approved' }, payload => {
            setUsers(prev => {
              if (payload.eventType === 'DELETE') return prev.filter(u => u.email !== payload.old.email);
              const exists = prev.some(u => u.email === payload.new.email);
              if (exists) return prev.map(u => u.email === payload.new.email ? payload.new : u);
              return [payload.new, ...prev];
            });
          })
          .subscribe();
        if (cancelled && channel) channel.unsubscribe();
      } catch(e) { console.error('Erreur connexion Realtime admin:', e); }
    })();
    return () => { cancelled = true; if (channel) channel.unsubscribe(); };
  },[]);

  const approve = async (email) => {
    if (!EMAILJS_SERVICE_ID.startsWith("REMPLACE")) {
      try {
        const emailjs = await loadEmailJS();
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_APPROVE_ID, {
          to_email: email,
          email_subject: "Ton accès Plan Me a été validé ! 🎉",
          titre: "Ta demande a été validée !",
          message: "Bonne nouvelle, ta demande d'accès à Plan Me a été validée ! Clique sur le bouton ci-dessous pour finaliser ton paiement et débloquer ton accès complet.",
          lien_action: `${window.location.origin}/?payer=${encodeURIComponent(email.toLowerCase().trim())}`,
          texte_bouton: "Payer et débloquer mon accès",
        });
      } catch(e) { console.error("Erreur envoi email approbation:", e); }
    }
    await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email)}`, {
      method:"PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ approved:true, approved_at: new Date().toISOString() })
    });
    setUsers(p => p.map(u => u.email===email ? {...u, approved:true} : u));
  };

  const setPaid = async (email, plan, prix) => {
    await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email)}`, {
      method:"PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ paid:true, plan, prix, paid_at: new Date().toISOString() })
    });
    setUsers(p => p.map(u => u.email===email ? {...u, paid:true, plan, prix} : u));
  };

  const revoke = async (email) => {
    if (!window.confirm(`Révoquer l'accès de ${email} ?`)) return;
    await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email)}`, {
      method:"PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ approved:false, paid:false })
    });
    setUsers(p => p.map(u => u.email===email ? {...u, approved:false, paid:false} : u));
  };

  const reject = async (email) => {
    if (!window.confirm(`Refuser et supprimer la demande de ${email} ?`)) return;
    if (!EMAILJS_SERVICE_ID.startsWith("REMPLACE")) {
      try {
        const emailjs = await loadEmailJS();
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: email,
          name: "Plan Me",
          time: new Date().toLocaleDateString("fr-FR"),
          message: "Votre demande d'accès à Plan Me n'a malheureusement pas pu être validée. N'hésitez pas à nous contacter pour plus d'informations."
        });
      } catch(e) {
        console.error("Erreur envoi email refus:", e);
        if (!window.confirm("L'envoi de l'email de refus a échoué. Continuer quand même la suppression de la demande ?")) return;
      }
    }
    try {
      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email)}`, {
        method:"DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${_token}`, Prefer:"return=representation" }
      });
      if (!delRes.ok) {
        const errBody = await delRes.text();
        console.error("Échec suppression users_approved:", delRes.status, errBody);
        alert(`La suppression a échoué (${delRes.status}). Vérifie les policies RLS sur la table users_approved.`);
        return;
      }
      const delData = await delRes.json();
      if (!Array.isArray(delData) || delData.length === 0) {
        alert("Aucune ligne supprimée — la policy RLS bloque probablement cette action pour ton compte.");
        return;
      }
    } catch(e) { console.error(e); alert("Erreur réseau lors de la suppression."); return; }
    setUsers(p => p.filter(u => u.email!==email));
  };

  const pending = users.filter(u => !u.approved);
  const active = users.filter(u => u.approved);

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ fontWeight:900, fontSize:18, color:T.encre, marginBottom:4 }}>⚙️ Administration</div>
      <div style={{ fontSize:12, color:T.gris, marginBottom:16 }}>{users.length} comptes · {pending.length} en attente</div>

      {pending.length > 0 && (
        <>
          <div style={{ fontWeight:800, fontSize:13, color:T.rose, marginBottom:10 }}>⏳ En attente de validation ({pending.length})</div>
          {pending.map(u => (
            <div key={u.email} style={{ background:T.blanc, borderRadius:10, border:`1.5px solid ${T.rose}44`, padding:"12px 14px", marginBottom:10, boxShadow:"0 2px 10px rgba(31,58,46,.06)" }}>
              <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:4 }}>{u.email}</div>
              <div style={{ fontSize:11, color:T.gris, marginBottom:10 }}>Demande le {new Date(u.created_at).toLocaleDateString("fr-FR")} · {u.note}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <button onClick={()=>approve(u.email)} style={{ padding:"9px", borderRadius:8, background:T.rose, color:"#fff", border:"none", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  ✅ Approuver
                </button>
                <button onClick={()=>reject(u.email)} style={{ padding:"9px", borderRadius:8, background:"#FFF0EC", border:"1.5px solid #F5C0B0", color:"#D04040", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  ❌ Refuser
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ fontWeight:800, fontSize:13, color:T.vert, marginBottom:10, marginTop:pending.length>0?16:0 }}>✅ Comptes actifs ({active.length})</div>
      {active.map(u => (
        <div key={u.email} style={{ background:T.blanc, borderRadius:10, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", padding:"12px 14px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <div style={{ fontWeight:800, fontSize:13, color:T.encre }}>{u.email}</div>
            <div style={{ display:"flex", gap:6 }}>
              <span style={{ background:u.paid?T.vertL:T.roseL, color:u.paid?T.vert:T.rose, fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:100 }}>
                {u.paid?"✓ Payé":"Non payé"}
              </span>
              <span style={{ background:T.vertL, color:T.vert, fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:100 }}>
                {u.plan} {u.prix>0?`${u.prix}€`:""}
              </span>
            </div>
          </div>
          <div style={{ fontSize:11, color:T.gris, marginBottom:8 }}>{u.note}</div>
          {!u.paid && u.plan!=="admin" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <button onClick={()=>setPaid(u.email,"fondateur",79)} style={{ padding:"8px", borderRadius:8, background:T.vertL, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", color:T.vert, fontWeight:800, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                💚 Fondateur 79€
              </button>
              <button onClick={()=>setPaid(u.email,"standard",99)} style={{ padding:"8px", borderRadius:8, background:T.vertL, border:`1px solid ${T.vertM}`, boxShadow:"0 1px 3px rgba(28,27,23,.05)", color:T.vert, fontWeight:800, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                ✓ Standard 99€
              </button>
            </div>
          )}
          {u.plan !== "admin" && (
            <button onClick={()=>revoke(u.email)} style={{ width:"100%", padding:"8px", borderRadius:8, background:"#FFF0EC", border:"1.5px solid #F5C0B0", color:"#D04040", fontWeight:800, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
              🚫 Révoquer l'accès
            </button>
          )}
        </div>
      ))}

      {loading && <div style={{ textAlign:"center", color:T.gris, padding:20 }}>Chargement...</div>}
    </div>
  );
}

// Précharge une liste d'images (photos des robes) avant d'afficher l'app —
// évite l'effet "popcorn" où les photos apparaissent une par une pendant que
// la personne navigue déjà dans l'interface.
function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(unique.map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // une photo cassée ne doit pas bloquer tout le chargement
    img.src = url;
  })));
}

// Applique un événement Realtime (INSERT/UPDATE/DELETE) reçu de Supabase à un
// état React local, sans avoir besoin de tout recharger depuis le serveur.
function applyRealtimeChange(setState, payload, mapExtra) {
  setState(prev => {
    if (payload.eventType === 'DELETE') {
      return prev.filter(x => x.id !== payload.old.id);
    }
    const row = mapExtra ? { ...payload.new, ...mapExtra(payload.new) } : payload.new;
    const exists = prev.some(x => x.id === row.id);
    if (exists) return prev.map(x => x.id === row.id ? { ...x, ...row } : x);
    return [...prev, row];
  });
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("catalogue");
  const [robes, setRobes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [essayages, setEssayages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Préparation de ton espace...");
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null); // null = non connecté
  const [authChecked, setAuthChecked] = useState(false);

  const showToast = (msg, type="success") => setToast({ msg, type, key:Date.now() });

  useEffect(() => { injectStyles(); }, []);

  // Vérifier session existante au démarrage + gérer confirmation email
  const [pendingAuthError, setPendingAuthError] = useState("");
  const [pendingPaymentEmail, setPendingPaymentEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState(null);
  const [payerEmail, setPayerEmail] = useState(null);

  // Lien direct de paiement envoyé par email (?payer=email@x.com) — pas besoin
  // d'être connectée, redirige directement vers Stripe.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('payer');
    if (p) {
      setPayerEmail(p);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  useEffect(() => {
    (async () => {
      // Vérifier si on revient d'une confirmation email (hash dans l'URL)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#',''));
        const token = params.get('access_token');
        const linkType = params.get('type');

        // Lien "mot de passe oublié" : on affiche le vrai formulaire de
        // réinitialisation, on ne connecte PAS automatiquement.
        if (token && linkType === 'recovery') {
          window.history.replaceState({}, '', window.location.pathname);
          setRecoveryToken(token);
          setAuthChecked(true);
          return;
        }

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const email = payload.email || '';
            const uid = payload.sub || '';
            window.history.replaceState({}, '', window.location.pathname);

            // ⚠️ Vérification obligatoire de l'approbation — même via un lien email
            const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=approved,paid,plan`, {
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
            const checkData = await checkRes.json();
            const access = Array.isArray(checkData) && checkData.length > 0 && checkData[0];

            if (!access) {
              await fetch(`${SUPABASE_URL}/rest/v1/users_approved`, {
                method:"POST",
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type":"application/json", Prefer:"return=representation" },
                body: JSON.stringify({ email:email.toLowerCase().trim(), approved:false, paid:false, note:"Confirmation email" })
              }).catch(()=>{});
              setPendingAuthError("⏳ Email confirmé ! Votre demande d'accès est enregistrée, vous serez contactée sous 24h.");
            } else if (!access.approved) {
              setPendingAuthError("⏳ Email confirmé ! Votre demande est en cours de validation, vous serez contactée sous 24h.");
            } else if (!access.paid && access.plan !== 'admin' && access.plan !== 'fondateur') {
              setPendingAuthError(""); // pas d'écran d'erreur ici, on gère via paymentPending côté AuthScreen
              setPendingPaymentEmail(email.toLowerCase().trim());
            } else {
              // Accès OK — connexion autorisée
              _token = token;
              _userId = uid;
              try { localStorage.setItem('planme_session', JSON.stringify({ token, userId:uid, email })); } catch(e) {}
              setUser({ token, userId:uid, email });
            }
            setAuthChecked(true);
            return;
          } catch(e) { console.error(e); }
        }
      }
      const session = auth.getSession();
      if (session) setUser(session);
      setAuthChecked(true);
    })();
  }, []);

  // Onboarding — voir quels onglets ont déjà été vus
  const [seenTabs, setSeenTabs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('planme_seen_tabs') || '{}'); } catch(e) { return {}; }
  });
  const dismissOnboarding = (tab) => {
    const updated = { ...seenTabs, [tab]: true };
    setSeenTabs(updated);
    try { localStorage.setItem('planme_seen_tabs', JSON.stringify(updated)); } catch(e) {}
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setLoadingStep("Chargement de tes données...");
    Promise.all([
      api("GET",`robes?select=*&user_id=eq.${_userId}&order=created_at`),
      api("GET",`clientes?select=*&user_id=eq.${_userId}&order=nom`),
      api("GET",`reservations?select=*&user_id=eq.${_userId}&order=created_at`),
      api("GET",`essayages?select=*&user_id=eq.${_userId}&order=date`),
    ]).then(async ([r,cl,res,ess]) => {
      if (Array.isArray(r)) setRobes(r);
      if (Array.isArray(cl)) setClientes(cl);
      if (Array.isArray(res)) setReservations(res.map(x=>({...x,cid:x.cliente_id,rid:x.robe_id})));
      if (Array.isArray(ess)) setEssayages(ess.map(x=>({...x,cid:x.cliente_id,rid:x.robe_id})));

      // Précharge les photos du catalogue AVANT de donner accès à l'app —
      // avec une limite de 8 secondes pour ne jamais bloquer indéfiniment
      // si une photo est lente ou cassée.
      if (Array.isArray(r) && r.length) {
        setLoadingStep(`Chargement des photos...`);
        const photoUrls = r.map(x=>x.photo_url).filter(Boolean);
        if (photoUrls.length) {
          await Promise.race([
            preloadImages(photoUrls),
            new Promise(resolve => setTimeout(resolve, 8000)),
          ]);
        }
      }
    }).catch(async (e) => {
      console.error(e);
      if (String(e.message||"").includes("Session expirée")) {
        await auth.signOut();
        setUser(null);
        setRobes([]); setClientes([]); setReservations([]); setEssayages([]);
      }
    }).finally(()=>setLoading(false));
  },[user]);

  // ── Realtime : mise à jour instantanée dès qu'une donnée change en base,
  // sans avoir besoin de rafraîchir la page (multi-appareils, multi-onglets). ──
  useEffect(() => {
    if (!user) return;
    let channel;
    let cancelled = false;
    (async () => {
      try {
        const client = await getRealtimeClient();
        client.realtime.setAuth(_token);
        channel = client
          .channel(`planme-${_userId}`)
          .on('postgres_changes', { event:'*', schema:'public', table:'robes', filter:`user_id=eq.${_userId}` }, payload => applyRealtimeChange(setRobes, payload))
          .on('postgres_changes', { event:'*', schema:'public', table:'clientes', filter:`user_id=eq.${_userId}` }, payload => applyRealtimeChange(setClientes, payload))
          .on('postgres_changes', { event:'*', schema:'public', table:'reservations', filter:`user_id=eq.${_userId}` }, payload => applyRealtimeChange(setReservations, payload, row=>({cid:row.cliente_id, rid:row.robe_id})))
          .on('postgres_changes', { event:'*', schema:'public', table:'essayages', filter:`user_id=eq.${_userId}` }, payload => applyRealtimeChange(setEssayages, payload, row=>({cid:row.cliente_id, rid:row.robe_id})))
          .subscribe();
        if (cancelled && channel) channel.unsubscribe();
      } catch(e) { console.error('Erreur connexion Realtime:', e); }
    })();
    return () => { cancelled = true; if (channel) channel.unsubscribe(); };
  },[user]);

  const TABS = [
    { id:"catalogue", label:"Catalogue", Icon:Package },
    { id:"essayages", label:"Essayages", Icon:Sparkles },
    { id:"resa",      label:"Résa",      Icon:Check },
    { id:"planning",  label:"Planning",  Icon:Calendar },
    { id:"clientes",  label:"Clientes",  Icon:TrendingUp },
    { id:"stats",     label:"Stats",     Icon:BarChart3 },
  ];

  const titles = { catalogue:"Catalogue", essayages:"Essayages", planning:"Planning", resa:"Réservations", clientes:"Clientes", stats:"Statistiques" };

  const [signingOut, setSigningOut] = useState(false);

  if (payerEmail) return <PayerRedirectScreen email={payerEmail} />;
  if (recoveryToken) return <ResetPasswordScreen token={recoveryToken} onDone={() => setRecoveryToken(null)} />;
  if (!authChecked) return null;
  if (!user) return <AuthScreen onAuth={u => setUser(u)} initialError={pendingAuthError} initialPaymentEmail={pendingPaymentEmail} />;
  if (loading) return <AppLoadingScreen step={loadingStep} />;
  const handleSignOut = async () => {
    if (!window.confirm("Se déconnecter de Plan Me ?")) return;
    setSigningOut(true);
    setTimeout(async () => {
      await auth.signOut();
      setUser(null);
      setRobes([]); setClientes([]); setReservations([]); setEssayages([]);
      setSigningOut(false);
    }, 600);
  };

  return (
    <div style={{ fontFamily:"'Manrope',sans-serif", background:T.blanc, minHeight:"100vh", maxWidth:430, margin:"0 auto", position:"relative", paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {signingOut && (
        <div style={{ position:"fixed", inset:0, background:T.roseL, zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"fadeIn .4s ease both" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:36, color:T.encre, letterSpacing:-0.5, marginBottom:10 }}>Plan<span style={{ color:T.rose }}>me</span></div>
          <div style={{ fontSize:12, color:T.encre, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", opacity:.7 }}>À bientôt</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.blanc, padding:"14px 18px 12px", position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.vertM}` }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:1 }}>
          <span style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:23, color:T.encre, letterSpacing:-0.3 }}>Plan</span>
          <span style={{ fontFamily:"'Fraunces',serif", fontStyle:"italic", fontWeight:600, fontSize:23, color:T.vert, letterSpacing:-0.3 }}>me</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ borderLeft:`1px solid ${T.vertM}`, paddingLeft:12, marginRight:2 }}>
            <span style={{ fontSize:10, fontWeight:700, color:T.gris, letterSpacing:".1em", textTransform:"uppercase" }}>{titles[tab]}</span>
          </div>
          {user?.email==="nafissa.tizaoui@hotmail.com" && (
            <button onClick={()=>setTab("admin")} title="Admin" style={{ width:34, height:34, borderRadius:8, background:tab==="admin"?T.vert:T.fond, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Settings size={15} color={tab==="admin"?"#fff":T.encre}/>
            </button>
          )}
          <button onClick={handleSignOut} title="Se déconnecter" style={{ width:34, height:34, borderRadius:8, background:T.fond, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <LogOut size={15} color={T.encre}/>
          </button>
        </div>
      </div>

      <div className="tab-content" key={tab} style={{ paddingTop:16 }}>
          {tab==="catalogue" && <>
            {!seenTabs.catalogue && <OnboardingBubble tab="catalogue" onDismiss={()=>dismissOnboarding("catalogue")}/>}
            <Catalogue robes={robes} setRobes={setRobes} toast={showToast}/>
          </>}
          {tab==="essayages" && <>
            {!seenTabs.essayages && <OnboardingBubble tab="essayages" onDismiss={()=>dismissOnboarding("essayages")}/>}
            <Essayages essayages={essayages} setEssayages={setEssayages} robes={robes} clientes={clientes} setClientes={setClientes} toast={showToast}/>
          </>}
          {tab==="planning" && <>
            {!seenTabs.planning && <OnboardingBubble tab="planning" onDismiss={()=>dismissOnboarding("planning")}/>}
            <Planning key={reservations.length} reservations={reservations} robes={robes} clientes={clientes}/>
          </>}
          {tab==="resa" && <>
            {!seenTabs.resa && <OnboardingBubble tab="resa" onDismiss={()=>dismissOnboarding("resa")}/>}
            <Reservations reservations={reservations} setReservations={setReservations} robes={robes} clientes={clientes} setClientes={setClientes} toast={showToast}/>
          </>}
          {tab==="clientes" && <ClientesTab clientes={clientes} setClientes={setClientes} reservations={reservations} essayages={essayages} robes={robes} toast={showToast}/>}
          {tab==="stats" && <>
            {!seenTabs.stats && <OnboardingBubble tab="stats" onDismiss={()=>dismissOnboarding("stats")}/>}
            <Stats reservations={reservations} robes={robes}/>
          </>}
          {tab==="admin" && <AdminPanel/>}
      </div>

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:T.blanc, borderTop:`1px solid ${T.vertM}`, display:"flex", zIndex:200 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"10px 4px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", color:tab===id?T.rose:T.gris, fontFamily:"inherit", position:"relative", transition:"color .2s" }}>
            {tab===id && <div style={{ position:"absolute", top:0, left:"28%", right:"28%", height:3, borderRadius:"0 0 3px 3px", background:T.rose, animation:"popCheck .3s cubic-bezier(.34,1.56,.64,1) both" }}/>}
            <Icon size={18} strokeWidth={tab===id?2.4:1.8} style={{ transition:"transform .2s cubic-bezier(.34,1.56,.64,1)", transform:tab===id?"scale(1.12)":"scale(1)" }}/>
            <span style={{ fontSize:9.5, fontWeight:tab===id?800:600, letterSpacing:".02em" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
