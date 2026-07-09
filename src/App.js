import React from "react";
import { useState, useMemo } from "react";
import {
  Search, Calendar, BarChart3, Plus, X, ChevronLeft, ChevronRight,
  Package, Sparkles, Check, Clock, AlertCircle, TrendingUp,
} from "lucide-react";

// ─── PALETTE ───────────────────────────────────────────────
const C = {
  vert:      "#3A7D57",
  vert2:     "#2E6347",
  vertPale:  "#D4EAD8",
  vertFond:  "#F0F7F3",
  rose:      "#D4A0C0",
  rosePale:  "#F5ECF3",
  encre:     "#1A2E1F",
  gris:      "#7A9C82",
  blanc:     "#FFFFFF",
  bordure:   "#C8DEC8",
};

const S = {
  // Layout
  app: { fontFamily: "'Nunito', sans-serif", background: C.vertFond, minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", paddingBottom: 80 },
  // Header
  header: { background: C.vert, padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  headerTitle: { color: C.blanc, fontWeight: 900, fontSize: 18, letterSpacing: -0.5 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, marginTop: 1 },
  // Tab bar
  tabBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.blanc, borderTop: `1.5px solid ${C.bordure}`, display: "flex", zIndex: 200 },
  tab: (active) => ({ flex: 1, padding: "10px 4px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? C.vert : C.gris }),
  tabLabel: { fontSize: 10, fontWeight: 700 },
  // Cards
  card: { background: C.blanc, borderRadius: 16, border: `1.5px solid ${C.bordure}`, padding: 14, marginBottom: 10, boxShadow: "0 2px 8px rgba(58,125,87,0.06)" },
  // Page
  page: { padding: "16px 16px 0" },
  pageTitle: { fontWeight: 900, fontSize: 22, color: C.encre, letterSpacing: -0.5, marginBottom: 4 },
  pageSub: { fontSize: 12, color: C.gris, fontWeight: 600, marginBottom: 14 },
  // Boutons
  btnPrimary: { background: `linear-gradient(135deg, ${C.vert}, ${C.vert2})`, color: C.blanc, border: "none", borderRadius: 14, padding: "13px 20px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: `0 4px 14px rgba(58,125,87,0.3)`, width: "100%" },
  btnSecondary: { background: C.vertPale, color: C.vert, border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif" },
  fab: { position: "fixed", bottom: 90, right: 20, width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.vert}, ${C.vert2})`, color: C.blanc, border: "none", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px rgba(58,125,87,0.4)`, zIndex: 150 },
  // Badge
  badge: (color = C.vert) => ({ background: color + "22", color, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 100, display: "inline-block" }),
  // Input
  input: { width: "100%", background: C.vertFond, border: `2px solid ${C.bordure}`, borderRadius: 12, padding: "11px 14px", fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: C.encre, outline: "none", boxSizing: "border-box" },
  // Robe dot
  robeDot: (shade) => {
    const cols = { a: C.vert, b: "#5BA37A", c: C.rose, d: "#A87098", e: "#6AAB85", f: "#C8A0D0" };
    return { width: 38, height: 38, borderRadius: 12, background: cols[shade] || C.vert, display: "flex", alignItems: "center", justifyContent: "center", color: C.blanc, fontWeight: 900, fontSize: 14, flexShrink: 0 };
  },
};

// ─── DONNÉES DE DÉMO ────────────────────────────────────────
const CATS = ["Karakou", "Caftan", "Robe de soirée", "Ensemble"];
const NOMS = ["Lila","Amira","Yasmine","Inès","Sarah","Nour","Kenza","Lina","Sofia","Maya","Rim","Imane","Salma","Asma","Dounia","Houda","Meriem","Aya","Sabrina","Feriel","Wissal","Chahd","Bahia","Soraya"];
const SHADES = ["a","b","c","d","e","f"];

const CATALOGUE_INIT = Array.from({ length: 22 }, (_, i) => ({
  id: `r${i+1}`, nom: `${CATS[i%4]} ${NOMS[i%NOMS.length]}`,
  categorie: CATS[i%4], taille: ["36","38","40","42","44"][i%5],
  prix: 80 + (i%6)*20, caution: 200 + (i%4)*100,
  shade: SHADES[i%6], photo: null,
}));

const CLIENTES_INIT = [
  {id:"cl1",nom:"Yasmine B.",telephone:"06 12 34 56 78"},
  {id:"cl2",nom:"Amira K.",telephone:"06 23 45 67 89"},
  {id:"cl3",nom:"Lina D.",telephone:"07 34 56 78 90"},
  {id:"cl4",nom:"Sofia T.",telephone:"06 45 67 89 01"},
  {id:"cl5",nom:"Nour H.",telephone:"07 56 78 90 12"},
  {id:"cl6",nom:"Maya R.",telephone:"06 67 89 01 23"},
];

const TODAY = new Date(2026,5,29);
const fmt = (d) => d.toISOString().slice(0,10);
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

const RESA_INIT = [
  {id:"res1",clienteId:"cl1",robeId:"r1",dateDebut:fmt(addDays(TODAY,-6)),dateFin:fmt(addDays(TODAY,-4)),prix:120,caution:300,acompte:60,statut:"terminee",note:""},
  {id:"res2",clienteId:"cl2",robeId:"r3",dateDebut:fmt(addDays(TODAY,2)),dateFin:fmt(addDays(TODAY,4)),prix:140,caution:400,acompte:0,statut:"confirmee",note:"Suite à l'essayage"},
  {id:"res3",clienteId:"cl3",robeId:"r5",dateDebut:fmt(addDays(TODAY,7)),dateFin:fmt(addDays(TODAY,9)),prix:100,caution:300,acompte:50,statut:"confirmee",note:""},
  {id:"res4",clienteId:"cl4",robeId:"r2",dateDebut:fmt(addDays(TODAY,-2)),dateFin:fmt(addDays(TODAY,1)),prix:160,caution:400,acompte:80,statut:"enCours",note:""},
  {id:"res5",clienteId:"cl5",robeId:"r7",dateDebut:fmt(addDays(TODAY,14)),dateFin:fmt(addDays(TODAY,16)),prix:120,caution:300,acompte:0,statut:"confirmee",note:""},
];

const ESS_INIT = [
  {id:"e1",clienteId:"cl1",robeId:"r1",date:fmt(addDays(TODAY,-3)),heure:"14:00",statut:"passe",note:""},
  {id:"e2",clienteId:"cl2",robeId:"r3",date:fmt(TODAY),heure:"10:30",statut:"aVenir",note:"Souhaite voir taille 38"},
  {id:"e3",clienteId:"cl3",robeId:"r5",date:fmt(addDays(TODAY,3)),heure:"15:00",statut:"aVenir",note:""},
  {id:"e4",clienteId:"cl6",robeId:"r4",date:fmt(addDays(TODAY,5)),heure:"11:00",statut:"aVenir",note:""},
];

// ─── COMPOSANTS UI ──────────────────────────────────────────

function Avatar({ shade, nom, size=38 }) {
  const cols = { a:C.vert, b:"#5BA37A", c:C.rose, d:"#A87098", e:"#6AAB85", f:"#C8A0D0" };
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.32, background:cols[shade]||C.vert, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:size*0.37, flexShrink:0 }}>
      {nom?.[0] || "?"}
    </div>
  );
}

function StatCard({ label, value, sub, color=C.vert }) {
  return (
    <div style={{ ...S.card, flex:1, margin:0 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.gris, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontWeight:900, fontSize:24, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.gris, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ─── CALENDRIER VISUEL ──────────────────────────────────────
function CalendrierVisuel({ moisDate, events, onDayClick, selectedDay }) {
  const year = moisDate.getFullYear();
  const month = moisDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const offset = (firstDay + 6) % 7; // lundi en premier

  const getEvents = (day) => {
    const d = fmt(new Date(year, month, day));
    return events.filter(e => e.date <= d && (e.dateFin || e.date) >= d);
  };

  const today = fmt(TODAY);
  const jours = ["L","M","M","J","V","S","D"];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
        {jours.map(j => (
          <div key={j} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.gris, padding:"4px 0" }}>{j}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {Array(offset).fill(null).map((_,i) => <div key={`e${i}`}/>)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day = i+1;
          const d = fmt(new Date(year, month, day));
          const evts = getEvents(day);
          const isToday = d === today;
          const isSelected = d === selectedDay;
          const hasEvt = evts.length > 0;
          const bg = isSelected ? C.vert : isToday ? C.vertPale : hasEvt ? C.rosePale : "transparent";
          const col = isSelected ? "#fff" : isToday ? C.vert : hasEvt ? C.rose : C.encre;
          return (
            <div key={day} onClick={() => onDayClick(d)} style={{ aspectRatio:1, borderRadius:8, background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", border: isSelected ? `none` : isToday ? `1.5px solid ${C.vert}` : "none" }}>
              <span style={{ fontSize:12, fontWeight: isToday||hasEvt ? 800 : 600, color:col }}>{day}</span>
              {hasEvt && <div style={{ width:4, height:4, borderRadius:"50%", background: isSelected ? "#fff" : C.vert, marginTop:1 }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODAL ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:500, display:"flex", alignItems:"flex-end" }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:430, margin:"0 auto", background:C.blanc, borderRadius:"22px 22px 0 0", padding:"20px 18px 36px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <span style={{ fontWeight:900, fontSize:17, color:C.encre }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.gris }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.gris, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── ONGLET CATALOGUE ───────────────────────────────────────
function Catalogue({ catalogue, setCatalogue }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Toutes");
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ nom:"", categorie:CATS[0], taille:"38", prix:"", caution:"", note:"" });

  const filtered = useMemo(() => catalogue.filter(r =>
    (catFilter==="Toutes" || r.categorie===catFilter) &&
    r.nom.toLowerCase().includes(search.toLowerCase())
  ), [catalogue, catFilter, search]);

  const addRobe = () => {
    if (!form.nom || !form.prix) return;
    const shade = SHADES[catalogue.length % 6];
    setCatalogue(prev => [...prev, { id:`r${Date.now()}`, ...form, prix:+form.prix, caution:+form.caution, shade, photo:null }]);
    setModal(false);
    setForm({ nom:"", categorie:CATS[0], taille:"38", prix:"", caution:"", note:"" });
  };

  return (
    <div>
      <div style={S.page}>
        <div style={S.pageTitle}>Catalogue</div>
        <div style={S.pageSub}>{catalogue.length} pièces référencées</div>
        <div style={{ position:"relative", marginBottom:10 }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.gris }}/>
          <input style={{ ...S.input, paddingLeft:36 }} placeholder="Rechercher une pièce..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:10, scrollbarWidth:"none" }}>
          {["Toutes",...CATS].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ whiteSpace:"nowrap", padding:"6px 14px", borderRadius:100, border:"none", background: catFilter===c ? C.vert : C.vertPale, color: catFilter===c ? "#fff" : C.vert, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {filtered.map(r => (
          <div key={r.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={() => setDetail(r)}>
            <Avatar shade={r.shade} nom={r.nom}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:14, color:C.encre, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.nom}</div>
              <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>{r.categorie} · T.{r.taille}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:900, fontSize:15, color:C.vert }}>{r.prix}€</div>
              <div style={{ fontSize:11, color:C.gris }}>+{r.caution}€</div>
            </div>
          </div>
        ))}
      </div>

      <button style={S.fab} onClick={() => setModal(true)}><Plus size={24}/></button>

      {/* Modal ajout */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle pièce">
        <Field label="Nom de la pièce">
          <input style={S.input} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="ex: Karakou Yasmine"/>
        </Field>
        <Field label="Catégorie">
          <select style={{...S.input}} value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Taille">
            <select style={{...S.input}} value={form.taille} onChange={e=>setForm(p=>({...p,taille:e.target.value}))}>
              {["34","36","38","40","42","44"].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Prix (€)">
            <input style={S.input} type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder="120"/>
          </Field>
        </div>
        <Field label="Caution (€)">
          <input style={S.input} type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder="300"/>
        </Field>
        <div style={{ marginTop:4, background:C.rosePale, borderRadius:12, padding:"10px 12px", marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.rose, fontWeight:700 }}>📷 Photo</div>
          <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>Upload photo disponible dans la version complète</div>
        </div>
        <button style={S.btnPrimary} onClick={addRobe}>Ajouter la pièce ✓</button>
      </Modal>

      {/* Modal détail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nom || ""}>
        {detail && (
          <div>
            <div style={{ width:"100%", height:160, borderRadius:16, border:`2px dashed ${C.bordure}`, background:C.vertFond, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.vert }}>Photo de la pièce</div>
              <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>Photo {detail.nom[0]}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              <StatCard label="Taille" value={detail.taille} color={C.encre}/>
              <StatCard label="Prix" value={`${detail.prix}€`} color={C.vert}/>
              <StatCard label="Caution" value={`${detail.caution}€`} color={C.encre}/>
            </div>
            <div style={{ ...S.badge(C.vert), fontSize:12, padding:"6px 12px" }}>✅ Disponible à la location</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ONGLET ESSAYAGES ───────────────────────────────────────
function Essayages({ essayages, setEssayages, catalogue, clientes, setClientes }) {
  const [mois, setMois] = useState(new Date(2026,5,1));
  const [selected, setSelected] = useState(fmt(TODAY));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ clienteNom:"", clienteTel:"", robeId:"", heure:"10:00", note:"" });

  const dayEvents = essayages.filter(e => e.date === selected);

  const calEvents = essayages.map(e => ({ date:e.date, dateFin:e.date }));

  const addEss = () => {
    if (!form.clienteNom || !form.robeId) return;
    let cl = clientes.find(c => c.nom.toLowerCase()===form.clienteNom.toLowerCase());
    if (!cl) { cl = {id:`cl${Date.now()}`, nom:form.clienteNom, telephone:form.clienteTel}; setClientes(p=>[...p,cl]); }
    setEssayages(p => [...p, { id:`e${Date.now()}`, clienteId:cl.id, robeId:form.robeId, date:selected, heure:form.heure, statut:"aVenir", note:form.note }]);
    setModal(false);
    setForm({ clienteNom:"", clienteTel:"", robeId:"", heure:"10:00", note:"" });
  };

  const nomMois = mois.toLocaleDateString("fr-FR", { month:"long", year:"numeric" });

  return (
    <div>
      <div style={S.page}>
        <div style={S.pageTitle}>Essayages</div>
        <div style={S.pageSub}>Calendrier séparé des locations</div>
        <div style={{ ...S.card }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()-1,1))} style={{ background:C.vertPale, border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.vert }}><ChevronLeft size={16}/></button>
            <span style={{ fontWeight:800, fontSize:14, color:C.encre, textTransform:"capitalize" }}>{nomMois}</span>
            <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()+1,1))} style={{ background:C.vertPale, border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.vert }}><ChevronRight size={16}/></button>
          </div>
          <CalendrierVisuel moisDate={mois} events={calEvents} onDayClick={setSelected} selectedDay={selected}/>
        </div>

        {/* Évènements du jour */}
        <div style={{ fontWeight:800, fontSize:13, color:C.encre, marginBottom:8 }}>
          {new Date(selected).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
        </div>
        {dayEvents.length === 0 ? (
          <div style={{ ...S.card, textAlign:"center", color:C.gris, fontSize:13, padding:20 }}>Aucun essayage ce jour</div>
        ) : dayEvents.map(e => {
          const robe = catalogue.find(r=>r.id===e.robeId);
          const cl = clientes.find(c=>c.id===e.clienteId);
          return (
            <div key={e.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12 }}>
              <Avatar shade={robe?.shade||"a"} nom={robe?.nom||"?"}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:13, color:C.encre }}>{cl?.nom}</div>
                <div style={{ fontSize:11, color:C.gris }}>{robe?.nom} · {e.heure}</div>
                {e.note && <div style={{ fontSize:11, color:C.rose, marginTop:2 }}>{e.note}</div>}
              </div>
              <div style={S.badge(e.statut==="passe" ? C.gris : C.vert)}>{e.statut==="passe" ? "Passé" : "À venir"}</div>
            </div>
          );
        })}
      </div>

      <button style={S.fab} onClick={() => setModal(true)}><Plus size={24}/></button>

      <Modal open={modal} onClose={() => setModal(false)} title={`Essayage — ${new Date(selected).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}`}>
        <Field label="Cliente">
          <input style={S.input} value={form.clienteNom} onChange={e=>setForm(p=>({...p,clienteNom:e.target.value}))} placeholder="Prénom Nom"/>
        </Field>
        <Field label="Téléphone">
          <input style={S.input} value={form.clienteTel} onChange={e=>setForm(p=>({...p,clienteTel:e.target.value}))} placeholder="06 XX XX XX XX"/>
        </Field>
        <Field label="Pièce à essayer">
          <select style={S.input} value={form.robeId} onChange={e=>setForm(p=>({...p,robeId:e.target.value}))}>
            <option value="">Choisir une pièce...</option>
            {catalogue.map(r=><option key={r.id} value={r.id}>{r.nom} · T.{r.taille}</option>)}
          </select>
        </Field>
        <Field label="Heure">
          <input style={S.input} type="time" value={form.heure} onChange={e=>setForm(p=>({...p,heure:e.target.value}))}/>
        </Field>
        <Field label="Note (optionnel)">
          <input style={S.input} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: souhaite voir taille 38 aussi"/>
        </Field>
        <button style={S.btnPrimary} onClick={addEss}>Enregistrer l'essayage ✓</button>
      </Modal>
    </div>
  );
}

// ─── ONGLET PLANNING ────────────────────────────────────────
function Planning({ reservations, catalogue, clientes }) {
  const [mois, setMois] = useState(new Date(2026,5,1));
  const [selected, setSelected] = useState(fmt(TODAY));

  const dayRes = reservations.filter(r => r.dateDebut <= selected && r.dateFin >= selected);
  const calEvents = reservations.map(r => ({ date:r.dateDebut, dateFin:r.dateFin }));
  const nomMois = mois.toLocaleDateString("fr-FR", { month:"long", year:"numeric" });

  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Planning</div>
      <div style={S.pageSub}>Disponibilité en temps réel</div>

      <div style={S.card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()-1,1))} style={{ background:C.vertPale, border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.vert }}><ChevronLeft size={16}/></button>
          <span style={{ fontWeight:800, fontSize:14, color:C.encre, textTransform:"capitalize" }}>{nomMois}</span>
          <button onClick={() => setMois(m => new Date(m.getFullYear(),m.getMonth()+1,1))} style={{ background:C.vertPale, border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.vert }}><ChevronRight size={16}/></button>
        </div>
        <CalendrierVisuel moisDate={mois} events={calEvents} onDayClick={setSelected} selectedDay={selected}/>
      </div>

      {/* Note distinction */}
      <div style={{ background:"#F0F7F3", border:`1.5px solid ${C.vert}`, borderRadius:12, padding:"9px 12px", marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.vert, marginBottom:2 }}>📅 Planning des réservations</div>
        <div style={{ fontSize:11, color:C.encre, lineHeight:1.45 }}>Distinct du planning des essayages — uniquement les locations confirmées.</div>
      </div>

      <div style={{ fontWeight:800, fontSize:13, color:C.encre, marginBottom:8 }}>
        {new Date(selected).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
      </div>

      {dayRes.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", color:C.gris, fontSize:13, padding:20 }}>Aucune réservation ce jour — pièces disponibles ✓</div>
      ) : dayRes.map(r => {
        const robe = catalogue.find(x=>x.id===r.robeId);
        const cl = clientes.find(x=>x.id===r.clienteId);
        return (
          <div key={r.id} style={S.card}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <Avatar shade={robe?.shade||"a"} nom={robe?.nom||"?"}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:13, color:C.encre }}>{cl?.nom}</div>
                <div style={{ fontSize:11, color:C.gris }}>{robe?.nom}</div>
              </div>
              <div style={S.badge(C.vert)}>Confirmée</div>
            </div>
            <div style={{ background:C.rosePale, borderRadius:10, padding:"8px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <AlertCircle size={14} color={C.rose}/>
              <div style={{ fontSize:11, color:C.encre }}>Pièce <strong style={{color:C.rose}}>grisée automatiquement</strong> du {new Date(r.dateDebut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} au {new Date(r.dateFin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ONGLET RÉSERVATIONS ────────────────────────────────────
function Reservations({ reservations, setReservations, catalogue, clientes, setClientes }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ clienteNom:"", clienteTel:"", robeId:"", dateDebut:"", dateFin:"", prix:"", caution:"", acompte:"", note:"" });

  const filtered = reservations.filter(r => {
    const cl = clientes.find(c=>c.id===r.clienteId);
    return cl?.nom.toLowerCase().includes(search.toLowerCase()) || !search;
  });

  const addResa = () => {
    if (!form.clienteNom || !form.robeId || !form.dateDebut) return;
    let cl = clientes.find(c=>c.nom.toLowerCase()===form.clienteNom.toLowerCase());
    if (!cl) { cl={id:`cl${Date.now()}`,nom:form.clienteNom,telephone:form.clienteTel}; setClientes(p=>[...p,cl]); }
    setReservations(p=>[...p,{ id:`res${Date.now()}`, clienteId:cl.id, robeId:form.robeId, dateDebut:form.dateDebut, dateFin:form.dateFin||form.dateDebut, prix:+form.prix, caution:+form.caution, acompte:+form.acompte||0, statut:"confirmee", note:form.note }]);
    setModal(false);
    setForm({ clienteNom:"", clienteTel:"", robeId:"", dateDebut:"", dateFin:"", prix:"", caution:"", acompte:"", note:"" });
  };

  const robeSelected = catalogue.find(r=>r.id===form.robeId);
  const reste = (+form.prix||0) - (+form.acompte||0);

  const statutColor = { confirmee:C.vert, enCours:C.rose, terminee:C.gris };
  const statutLabel = { confirmee:"Confirmée", enCours:"En cours", terminee:"Terminée" };

  return (
    <div>
      <div style={S.page}>
        <div style={S.pageTitle}>Réservations</div>
        <div style={S.pageSub}>{reservations.length} au total</div>
        <div style={{ position:"relative", marginBottom:12 }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.gris }}/>
          <input style={{ ...S.input, paddingLeft:36 }} placeholder="Rechercher une cliente..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {filtered.map(r => {
          const robe = catalogue.find(x=>x.id===r.robeId);
          const cl = clientes.find(x=>x.id===r.clienteId);
          const reste = r.prix - r.acompte;
          return (
            <div key={r.id} style={S.card}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <Avatar shade={robe?.shade||"a"} nom={cl?.nom||"?"}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:C.encre }}>{cl?.nom}</div>
                  <div style={{ fontSize:11, color:C.gris }}>{robe?.nom}</div>
                </div>
                <div style={S.badge(statutColor[r.statut]||C.gris)}>{statutLabel[r.statut]||r.statut}</div>
              </div>
              <div style={{ display:"flex", gap:8, fontSize:11, color:C.gris, marginBottom:r.acompte>0||r.note?8:0 }}>
                <span>📅 {new Date(r.dateDebut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → {new Date(r.dateFin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
              </div>
              {(r.acompte > 0 || r.prix > 0) && (
                <div style={{ background:C.vertFond, borderRadius:10, padding:"7px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:C.gris }}>Acompte {r.acompte}€ · Reste</span>
                  <span style={{ fontWeight:900, fontSize:14, color:C.vert }}>{reste}€</span>
                </div>
              )}
              {r.note && <div style={{ fontSize:11, color:C.rose, marginTop:6, fontStyle:"italic" }}>{r.note}</div>}
            </div>
          );
        })}
      </div>

      <button style={S.fab} onClick={() => setModal(true)}><Plus size={24}/></button>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle réservation">
        <div style={{ background:C.vertPale, borderRadius:10, padding:"8px 12px", marginBottom:12, fontSize:11, color:C.vert, fontWeight:700 }}>
          Suite à un essayage ? Retrouve la cliente dans la liste ↓
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <button style={{ ...S.btnSecondary, flex:1 }}>Cliente existante</button>
          <button style={{ ...S.btnSecondary, flex:1 }}>Nouvelle cliente</button>
        </div>
        <Field label="Cliente"><input style={S.input} value={form.clienteNom} onChange={e=>setForm(p=>({...p,clienteNom:e.target.value}))} placeholder="Prénom Nom"/></Field>
        <Field label="Téléphone"><input style={S.input} value={form.clienteTel} onChange={e=>setForm(p=>({...p,clienteTel:e.target.value}))} placeholder="06 XX XX XX XX"/></Field>
        <Field label="Pièce choisie">
          <select style={S.input} value={form.robeId} onChange={e=>{const r=catalogue.find(x=>x.id===e.target.value);setForm(p=>({...p,robeId:e.target.value,prix:r?.prix||"",caution:r?.caution||""}));}}>
            <option value="">Choisir une pièce...</option>
            {catalogue.map(r=><option key={r.id} value={r.id}>{r.nom} · T.{r.taille}</option>)}
          </select>
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Date début"><input style={S.input} type="date" value={form.dateDebut} onChange={e=>setForm(p=>({...p,dateDebut:e.target.value}))}/></Field>
          <Field label="Date fin"><input style={S.input} type="date" value={form.dateFin} onChange={e=>setForm(p=>({...p,dateFin:e.target.value}))}/></Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Prix (€)"><input style={S.input} type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder={robeSelected?.prix||""}/></Field>
          <Field label="Caution (€)"><input style={S.input} type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder={robeSelected?.caution||""}/></Field>
        </div>
        <Field label="Acompte versé (€)"><input style={S.input} type="number" value={form.acompte} onChange={e=>setForm(p=>({...p,acompte:e.target.value}))} placeholder="0"/></Field>
        {(+form.prix > 0) && (
          <div style={{ background:C.rosePale, borderRadius:12, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.gris, marginBottom:3 }}><span>Prix dû</span><span>{form.prix}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.gris, marginBottom:6 }}><span>Acompte versé</span><span>−{form.acompte||0}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:15, color:C.vert, borderTop:`1px solid ${C.bordure}`, paddingTop:6 }}><span>Reste à payer</span><span>{reste}€</span></div>
          </div>
        )}
        <Field label="Note"><input style={S.input} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: suite à l'essayage du 19 juil."/></Field>
        <button style={S.btnPrimary} onClick={addResa}>Confirmer la réservation ✓</button>
      </Modal>
    </div>
  );
}

// ─── ONGLET STATS ────────────────────────────────────────────
function Stats({ reservations, catalogue }) {
  const caTotal = reservations.reduce((s,r) => s + (r.prix||0), 0);
  const panierMoyen = reservations.length ? Math.round(caTotal/reservations.length) : 0;
  const cautionsEnCours = reservations.filter(r=>r.statut!=="terminee").reduce((s,r)=>s+(r.caution||0),0);

  const parMois = useMemo(() => {
    const m = {};
    reservations.forEach(r => {
      const k = r.dateDebut?.slice(0,7);
      if (k) m[k] = (m[k]||0) + (r.prix||0);
    });
    return Object.entries(m).sort().slice(-6);
  }, [reservations]);

  const maxCA = Math.max(...parMois.map(([,v])=>v), 1);

  const parRobe = useMemo(() => {
    const m = {};
    reservations.forEach(r => { m[r.robeId] = (m[r.robeId]||0) + (r.prix||0); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [reservations]);

  const monthNames = { "2026-01":"Jan","2026-02":"Fév","2026-03":"Mar","2026-04":"Avr","2026-05":"Mai","2026-06":"Jun","2026-07":"Jul" };

  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Statistiques</div>
      <div style={S.pageSub}>Vue d'ensemble de ton activité</div>

      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <StatCard label="Chiffre d'affaires" value={`${caTotal.toLocaleString("fr-FR")}€`} sub={`sur ${reservations.length} réservations`} color={C.vert}/>
        <StatCard label="Panier moyen" value={`${panierMoyen}€`} sub="par réservation" color={C.encre}/>
      </div>
      <div style={{ marginBottom:12 }}>
        <StatCard label="Cautions en cours" value={`${cautionsEnCours}€`} sub="à restituer sur les réservations actives" color={C.rose}/>
      </div>

      {/* Graphique CA par mois */}
      <div style={S.card}>
        <div style={{ fontWeight:800, fontSize:13, color:C.encre, marginBottom:12 }}>CA par mois</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
          {parMois.map(([k,v]) => (
            <div key={k} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%", justifyContent:"flex-end" }}>
              <div style={{ fontSize:8, fontWeight:700, color:C.gris }}>{v>0?`${Math.round(v/100)/10}k`:""}</div>
              <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background: k===parMois[parMois.length-1]?.[0] ? `linear-gradient(180deg,${C.vert},${C.vert2})` : C.vertPale, height:`${Math.round((v/maxCA)*100)}%`, minHeight:4 }}/>
              <div style={{ fontSize:9, fontWeight:700, color: k===parMois[parMois.length-1]?.[0] ? C.vert : C.gris }}>{monthNames[k]||k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top robes */}
      <div style={S.card}>
        <div style={{ fontWeight:800, fontSize:13, color:C.encre, marginBottom:10 }}>Top pièces — CA généré</div>
        {parRobe.map(([robeId,ca],i) => {
          const robe = catalogue.find(r=>r.id===robeId);
          return (
            <div key={robeId} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontWeight:900, fontSize:12, color:C.rose, width:14 }}>{i+1}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.encre }}>{robe?.nom||robeId}</div>
                <div style={{ height:4, background:C.vertPale, borderRadius:100, marginTop:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round((ca/parRobe[0][1])*100)}%`, background:`linear-gradient(90deg,${C.vert},${C.vertPale})`, borderRadius:100 }}/>
                </div>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:C.vert }}>{ca}€</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ─────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("catalogue");
  const [catalogue, setCatalogue] = useState(CATALOGUE_INIT);
  const [clientes, setClientes] = useState(CLIENTES_INIT);
  const [reservations, setReservations] = useState(RESA_INIT);
  const [essayages, setEssayages] = useState(ESS_INIT);

  const tabs = [
    { id:"catalogue", label:"Catalogue", Icon:Package },
    { id:"essayages", label:"Essayages", Icon:Sparkles },
    { id:"planning", label:"Planning", Icon:Calendar },
    { id:"resa", label:"Résa", Icon:Check },
    { id:"stats", label:"Stats", Icon:BarChart3 },
  ];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Plan<span style={{color:C.rose}}>me</span></div>
          <div style={S.headerSub}>Gestion locations</div>
        </div>
        <div style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <TrendingUp size={16} color="#fff"/>
        </div>
      </div>

      {/* Contenu */}
      {tab==="catalogue" && <Catalogue catalogue={catalogue} setCatalogue={setCatalogue}/>}
      {tab==="essayages" && <Essayages essayages={essayages} setEssayages={setEssayages} catalogue={catalogue} clientes={clientes} setClientes={setClientes}/>}
      {tab==="planning" && <Planning reservations={reservations} catalogue={catalogue} clientes={clientes}/>}
      {tab==="resa" && <Reservations reservations={reservations} setReservations={setReservations} catalogue={catalogue} clientes={clientes} setClientes={setClientes}/>}
      {tab==="stats" && <Stats reservations={reservations} catalogue={catalogue}/>}

      {/* Tab bar */}
      <div style={S.tabBar}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>
            <Icon size={20}/>
            <span style={S.tabLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
