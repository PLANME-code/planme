import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, X, Check, Calendar, BarChart3, Package, Sparkles, ChevronLeft, ChevronRight, Clock, TrendingUp, AlertCircle } from "lucide-react";

const SUPABASE_URL = "https://drgiyafkcmfydkabctxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZ2l5YWZrY21meWRrYWJjdHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTA5MDAsImV4cCI6MjEwMTkyNjkwMH0.Ak3tEWz5PL9DRhGKOswtqujW7dHM3-x79hd8ItteIQo";

const api = async (method, path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const T = {
  vert: "#3A7D57", vert2: "#2E6347", vertL: "#EDF7F1", vertM: "#C8DEC8",
  rose: "#D4A0C0", roseL: "#F5ECF3",
  encre: "#1A2E1F", gris: "#7A9C82", fond: "#F0F7F3", blanc: "#FFFFFF",
};

const SHADES = ["#3A7D57","#5BA37A","#D4A0C0","#A87098","#6AAB85","#C8A0D0","#4A9068","#7B5EA7"];

const TODAY = new Date().toISOString().slice(0,10);

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:T.blanc, border:`1.5px solid ${T.vertM}`, borderRadius:14, padding:"12px 20px", display:"flex", gap:10, alignItems:"center", boxShadow:"0 8px 32px rgba(0,0,0,.15)", zIndex:999, fontFamily:"inherit", whiteSpace:"nowrap" }}>
      <span style={{ fontSize:18 }}>✅</span>
      <span style={{ fontWeight:800, fontSize:13, color:T.encre }}>{msg}</span>
    </div>
  );
}

function Avatar({ color, nom, size = 42 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size*.28, background:color||T.vert, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:size*.38, flexShrink:0 }}>
      {nom?.[0]?.toUpperCase() || "?"}
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
            <button onClick={onClose} style={{ background:T.fond, border:"none", borderRadius:10, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} color={T.gris}/></button>
          </div>
          <div style={{ paddingBottom:40 }}>{children}</div>
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

const inputStyle = { width:"100%", background:T.fond, border:`1.5px solid ${T.vertM}`, borderRadius:12, padding:"11px 14px", fontSize:15, fontFamily:"inherit", fontWeight:600, color:T.encre, outline:"none", boxSizing:"border-box" };

function BtnPrimary({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", background:disabled?T.gris:`linear-gradient(135deg,${T.vert},${T.vert2})`, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontWeight:900, fontSize:15, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:disabled?"none":`0 4px 16px ${T.vert}44` }}>
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
      const shade = SHADES[robes.length % SHADES.length];

      let photo_url = null;
      if (form.photoFile) {
        const ext = form.photoFile.name.split('.').pop();
        const fname = `robe_${Date.now()}.${ext}`;
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/photos-robes/${fname}`, {
          method:"POST",
          headers: { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, "Content-Type":form.photoFile.type, "x-upsert":"true" },
          body: form.photoFile
        });
        if (up.ok) photo_url = `${SUPABASE_URL}/storage/v1/object/public/photos-robes/${fname}`;
      }

      const data = { nom:form.nom, categorie:form.categorie, taille, prix:+form.prix, caution:+form.caution, shade, photo_url };
      const res = await api("POST", "robes", data);
      const newRobe = Array.isArray(res) ? res[0] : { id:`local_${Date.now()}`, ...data };
      setRobes(p => [...p, newRobe]);
      toast(`✨ ${form.nom} ajoutée !`);
      setModal(false);
      setForm({ nom:"", categorie:"", tailleMin:"", tailleMax:"", prix:"", caution:"", photoFile:null, photoPreview:null });
    } catch(e) {
      console.error(e);
      toast("Erreur lors de l'ajout");
    }
    setSaving(false);
  };

  const deleteRobe = async (r) => {
    if (!window.confirm(`Supprimer "${r.nom}" ?`)) return;
    try { await api("DELETE", `robes?id=eq.${r.id}`, null); } catch(e) {}
    setRobes(p => p.filter(x => x.id !== r.id));
    setDetail(null);
    toast("🗑️ Pièce supprimée");
  };

  return (
    <div>
      <div style={{ padding:"0 16px" }}>
        <div style={{ position:"relative", marginBottom:12 }}>
          <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une pièce..." style={{ ...inputStyle, paddingLeft:38 }} />
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:T.gris, marginBottom:10 }}>{filtered.length} pièce{filtered.length>1?"s":""}</div>
      </div>

      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {filtered.map(r => (
          <div key={r.id} onClick={() => setDetail(r)} style={{ background:T.blanc, borderRadius:16, border:`1.5px solid ${T.vertM}`, overflow:"hidden", cursor:"pointer", boxShadow:"0 2px 10px rgba(58,125,87,.07)" }}>
            <div style={{ height:110, position:"relative", overflow:"hidden", background:`linear-gradient(135deg,${r.shade||T.vert}33,${r.shade||T.vert}66)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {r.photo_url
                ? <img src={r.photo_url} alt={r.nom} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
                : <Avatar color={r.shade} nom={r.nom} size={44} />
              }
              <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(255,255,255,.9)", borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:900, color:T.vert }}>{r.prix}€</div>
            </div>
            <div style={{ padding:"9px 10px 11px" }}>
              <div style={{ fontWeight:800, fontSize:12, color:T.encre, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.nom}</div>
              <div style={{ fontSize:10, color:T.gris, marginTop:2 }}>{r.categorie} · T.{r.taille}</div>
              <div style={{ fontSize:10, color:T.gris }}>Caution {r.caution}€</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={() => setModal(true)} style={{ position:"fixed", bottom:90, right:20, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${T.vert},${T.vert2})`, color:"#fff", border:"none", fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.vert}55`, zIndex:150 }}>
        <Plus size={24} />
      </button>

      {/* Modal ajout */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle pièce">
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
          <label style={{ display:"block", border:`2px dashed ${T.vertM}`, borderRadius:14, padding:"16px", textAlign:"center", background:T.fond, cursor:"pointer" }}>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
            {form.photoPreview
              ? <img src={form.photoPreview} alt="preview" style={{ width:"100%", height:130, objectFit:"cover", borderRadius:10 }} />
              : <><div style={{ fontSize:24 }}>📷</div><div style={{ fontSize:12, fontWeight:700, color:T.vert, marginTop:6 }}>Appuyer pour choisir une photo</div></>
            }
          </label>
        </Field>
        <BtnPrimary onClick={save} disabled={saving||!form.nom||!form.prix}>
          {saving ? "Enregistrement..." : "Ajouter au catalogue ✓"}
        </BtnPrimary>
      </Modal>

      {/* Modal détail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.nom || ""}>
        {detail && (
          <>
            <div style={{ height:180, borderRadius:16, overflow:"hidden", background:`linear-gradient(135deg,${detail.shade||T.vert}22,${detail.shade||T.vert}55)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              {detail.photo_url
                ? <img src={detail.photo_url} alt={detail.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ textAlign:"center" }}><div style={{ fontSize:36 }}>📷</div><div style={{ fontSize:12, fontWeight:700, color:detail.shade||T.vert, marginTop:6 }}>Photo de la pièce</div></div>
              }
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              {[["Taille",detail.taille,T.encre],["Prix",`${detail.prix}€`,T.vert],["Caution",`${detail.caution}€`,T.encre]].map(([l,v,col]) => (
                <div key={l} style={{ background:T.fond, borderRadius:12, padding:"10px", textAlign:"center", border:`1.5px solid ${T.vertM}` }}>
                  <div style={{ fontSize:9, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                  <div style={{ fontWeight:900, fontSize:18, color:col }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.vertL, borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <Check size={16} color={T.vert} />
              <span style={{ fontSize:13, fontWeight:700, color:T.vert }}>Disponible à la location</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => setDetail(null)} style={{ padding:"11px", borderRadius:13, background:T.vertL, border:`1.5px solid ${T.vertM}`, color:T.vert, fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                ✏️ Modifier
              </button>
              <button onClick={() => deleteRobe(detail)} style={{ padding:"11px", borderRadius:13, background:"#FFF0EC", border:"1.5px solid #F5C0B0", color:"#D04040", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                🗑️ Supprimer
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

function CalGrid({ cells, selected, onSelect }) {
  const jours = ["L","M","M","J","V","S","D"];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {jours.map((j,i) => <div key={i} style={{ textAlign:"center", fontSize:9, fontWeight:800, color:T.gris }}>{j}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((c,i) => !c ? <div key={i}/> : (
          <div key={i} onClick={() => onSelect(c.ds)} style={{ aspectRatio:1, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:c.ds===selected?T.vert:c.ds===TODAY?T.vertL:"transparent", border:c.ds===TODAY&&c.ds!==selected?`1.5px solid ${T.vert}`:"none" }}>
            <span style={{ fontSize:11, fontWeight:600, color:c.ds===selected?"#fff":c.ds===TODAY?T.vert:T.encre }}>{c.d}</span>
            {c.hasEv && <div style={{ width:4, height:4, borderRadius:"50%", background:c.ds===selected?"rgba(255,255,255,.7)":T.rose }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Essayages({ essayages, setEssayages, robes, clientes, setClientes, toast }) {
  const [mois, setMois] = useState(new Date());
  const [sel, setSel] = useState(TODAY);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nom:"", tel:"", rid:"", heure:"10:00", note:"" });

  const cells = buildCal(mois, essayages.map(e => ({ date:e.date, debut:e.date, fin:e.date })));
  const dayEss = essayages.filter(e => e.date===sel);

  const save = async () => {
    if (!form.nom || !form.rid) return;
    let cl = clientes.find(c => c.nom.toLowerCase()===form.nom.toLowerCase());
    if (!cl) {
      cl = { id:`c${Date.now()}`, nom:form.nom, tel:form.tel };
      try { const r = await api("POST","clientes",cl); if(Array.isArray(r)&&r[0]) cl=r[0]; } catch(e) {}
      setClientes(p => [...p, cl]);
    }
    const ess = { id:`e${Date.now()}`, cid:cl.id, rid:form.rid, date:sel, heure:form.heure, statut:"aVenir", note:form.note };
    try { await api("POST","essayages",{ cliente_id:cl.id, robe_id:form.rid, date:sel, heure:form.heure, statut:"aVenir", note:form.note }); } catch(e) {}
    setEssayages(p => [...p, ess]);
    toast("📅 Essayage enregistré !");
    setModal(false);
    setForm({ nom:"", tel:"", rid:"", heure:"10:00", note:"" });
  };

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ background:T.blanc, borderRadius:18, border:`1.5px solid ${T.vertM}`, padding:14, marginBottom:12, boxShadow:"0 2px 10px rgba(58,125,87,.07)" }}>
        <CalHeader mois={mois} setMois={setMois}/>
        <CalGrid cells={cells} selected={sel} onSelect={setSel}/>
      </div>
      <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:10, textTransform:"capitalize" }}>
        {new Date(sel).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </div>
      {dayEss.length === 0
        ? <div style={{ background:T.blanc, borderRadius:16, border:`1.5px solid ${T.vertM}`, padding:"24px 16px", textAlign:"center", color:T.gris, fontSize:13 }}>Aucun essayage ce jour</div>
        : dayEss.map(e => {
            const r = robes.find(x=>x.id===e.rid);
            const cl = clientes.find(x=>x.id===e.cid);
            return (
              <div key={e.id} style={{ background:T.blanc, borderRadius:16, border:`1.5px solid ${T.vertM}`, padding:"12px 14px", marginBottom:10, display:"flex", gap:12, alignItems:"center" }}>
                <Avatar color={r?.shade} nom={cl?.nom} size={44}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>{cl?.nom}</div>
                  <div style={{ fontSize:12, color:T.gris }}>{r?.nom} · {e.heure}</div>
                  {e.note && <div style={{ fontSize:11, color:T.rose, marginTop:3, fontStyle:"italic" }}>{e.note}</div>}
                </div>
                <span style={{ background:T.vertL, color:T.vert, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>À venir</span>
              </div>
            );
          })
      }
      <button onClick={() => setModal(true)} style={{ position:"fixed", bottom:90, right:20, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${T.vert},${T.vert2})`, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.vert}55`, zIndex:150 }}>
        <Plus size={24}/>
      </button>
      <Modal open={modal} onClose={() => setModal(false)} title={`Essayage — ${new Date(sel).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`}>
        <Field label="Cliente"><input style={inputStyle} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/></Field>
        <Field label="Téléphone"><input style={inputStyle} value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/></Field>
        <Field label="Pièce à essayer">
          <select style={inputStyle} value={form.rid} onChange={e=>setForm(p=>({...p,rid:e.target.value}))}>
            <option value="">Choisir une pièce...</option>
            {robes.map(r=><option key={r.id} value={r.id}>{r.nom} · T.{r.taille}</option>)}
          </select>
        </Field>
        <Field label="Heure"><input style={inputStyle} type="time" value={form.heure} onChange={e=>setForm(p=>({...p,heure:e.target.value}))}/></Field>
        <Field label="Note"><input style={inputStyle} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: voir aussi T.38"/></Field>
        <BtnPrimary onClick={save} disabled={!form.nom||!form.rid}>Enregistrer l'essayage ✓</BtnPrimary>
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
      <div style={{ background:T.blanc, borderRadius:18, border:`1.5px solid ${T.vertM}`, padding:14, marginBottom:12, boxShadow:"0 2px 10px rgba(58,125,87,.07)" }}>
        <CalHeader mois={mois} setMois={setMois}/>
        <CalGrid cells={cells} selected={sel} onSelect={setSel}/>
      </div>
      <div style={{ background:T.vertL, border:`1.5px solid ${T.vert}33`, borderRadius:14, padding:"10px 14px", marginBottom:12, fontSize:12, color:T.vert, fontWeight:700 }}>
        📅 Planning des réservations · distinct du planning essayages
      </div>
      <div style={{ fontWeight:800, fontSize:13, color:T.encre, marginBottom:10, textTransform:"capitalize" }}>
        {new Date(sel).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </div>
      {dayRes.length === 0
        ? <div style={{ background:T.blanc, borderRadius:16, border:`1.5px solid ${T.vertM}`, padding:"24px 16px", textAlign:"center", color:T.gris, fontSize:13 }}>✅ Toutes les pièces disponibles</div>
        : dayRes.map(r => {
            const robe = robes.find(x=>x.id===r.rid);
            const cl = clientes.find(x=>x.id===r.cid);
            return (
              <div key={r.id} style={{ background:T.blanc, borderRadius:16, border:`1.5px solid ${T.vertM}`, padding:"12px 14px", marginBottom:10, boxShadow:"0 2px 10px rgba(58,125,87,.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <Avatar color={robe?.shade} nom={cl?.nom} size={44}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>{cl?.nom}</div>
                    <div style={{ fontSize:12, color:T.gris }}>{robe?.nom}</div>
                  </div>
                  <span style={{ background:T.vertL, color:T.vert, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>Confirmée</span>
                </div>
                <div style={{ background:"#FFF0EC", border:"1.5px solid #F5C0B0", borderRadius:12, padding:"9px 12px", fontSize:11, color:"#8B3020", fontWeight:600 }}>
                  🚫 {robe?.nom} grisée du {new Date(r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} au {new Date(r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} — double réservation impossible
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

// ── RÉSERVATIONS ─────────────────────────────────────────────
function Reservations({ reservations, setReservations, robes, clientes, setClientes, toast }) {
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ nom:"", tel:"", rid:"", debut:"", fin:"", prix:"", caution:"", acompte:"", note:"" });

  const filtered = reservations.filter(r => {
    const cl = clientes.find(x=>x.id===r.cid);
    return !q || cl?.nom.toLowerCase().includes(q.toLowerCase());
  });

  const rSelected = robes.find(r=>r.id===form.rid);
  const reste = (+form.prix||0) - (+form.acompte||0);

  const save = async () => {
    if (!form.nom || !form.rid || !form.debut || !form.acompte) return;
    let cl = clientes.find(c=>c.nom.toLowerCase()===form.nom.toLowerCase());
    if (!cl) {
      cl = { id:`c${Date.now()}`, nom:form.nom, tel:form.tel };
      try { const r = await api("POST","clientes",cl); if(Array.isArray(r)&&r[0]) cl=r[0]; } catch(e) {}
      setClientes(p => [...p, cl]);
    }
    const data = { cliente_id:cl.id, robe_id:form.rid, debut:form.debut, fin:form.fin||form.debut, prix:+form.prix, caution:+form.caution, acompte:+form.acompte, statut:"confirmee", note:form.note };
    const local = { id:`v${Date.now()}`, cid:cl.id, rid:form.rid, ...data };
    try { await api("POST","reservations",data); } catch(e) {}
    setReservations(p => [...p, local]);
    toast("🎉 Réservation confirmée !");
    setModal(false);
    setForm({ nom:"", tel:"", rid:"", debut:"", fin:"", prix:"", caution:"", acompte:"", note:"" });
  };

  const statCol = { confirmee:T.vert, enCours:T.rose, terminee:T.gris };
  const statLbl = { confirmee:"Confirmée", enCours:"En cours", terminee:"Terminée" };

  return (
    <div>
      <div style={{ padding:"0 16px" }}>
        <div style={{ position:"relative", marginBottom:12 }}>
          <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:T.gris, pointerEvents:"none" }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une cliente..." style={{ ...inputStyle, paddingLeft:38 }}/>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:T.gris, marginBottom:10 }}>{filtered.length} réservation{filtered.length>1?"s":""}</div>
      </div>
      <div style={{ padding:"0 16px" }}>
        {filtered.map(r => {
          const robe = robes.find(x=>x.id===r.rid);
          const cl = clientes.find(x=>x.id===r.cid);
          const reste = r.prix - r.acompte;
          return (
            <div key={r.id} onClick={()=>setDetail({r,robe,cl,reste})} style={{ background:T.blanc, borderRadius:18, border:`1.5px solid ${T.vertM}`, padding:"13px 15px", marginBottom:10, cursor:"pointer", boxShadow:"0 2px 10px rgba(58,125,87,.07)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                                {robe?.photo_url
                  ? <img src={robe.photo_url} alt={robe.nom} style={{width:44,height:44,borderRadius:12,objectFit:"cover",flexShrink:0}}/>
                  : <Avatar color={robe?.shade} nom={robe?.nom} size={44}/>
                } <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.encre }}>{cl?.nom}</div>
                  <div style={{ fontSize:12, color:T.gris }}>{robe?.nom}</div>
                </div>
                <span style={{ background:(statCol[r.statut]||T.gris)+"1A", color:statCol[r.statut]||T.gris, border:`1px solid ${statCol[r.statut]||T.gris}33`, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{statLbl[r.statut]||r.statut}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.gris, marginBottom:r.prix>0?8:0 }}>
                <Clock size={12}/> {new Date(r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → {new Date(r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
              </div>
              {r.prix>0 && (
                <div style={{ background:r.statut==="terminee"?T.vertL:reste>0?"#FFF0EC":T.vertL, borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:T.gris, fontWeight:600 }}>{r.statut==="terminee"?"Soldée ✓":`Reste à payer`}</span>
                  <span style={{ fontWeight:900, fontSize:14, color:r.statut==="terminee"?T.vert:reste>0?T.rose:T.vert }}>{r.statut==="terminee"?"0€":`${reste}€`}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setModal(true)} style={{ position:"fixed", bottom:90, right:20, width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${T.vert},${T.vert2})`, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${T.vert}55`, zIndex:150 }}>
        <Plus size={24}/>
      </button>

      {/* Modal détail réservation */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail réservation">
        {detail && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:14, background:T.fond, borderRadius:16, padding:14, marginBottom:14 }}>
              <Avatar color={detail.robe?.shade} nom={detail.cl?.nom} size={52}/>
              <div>
                <div style={{ fontWeight:900, fontSize:17, color:T.encre }}>{detail.cl?.nom}</div>
                <div style={{ fontSize:12, color:T.gris, marginTop:3 }}>{detail.cl?.tel}</div>
                <span style={{ marginTop:6, display:"inline-block", background:(statCol[detail.r.statut]||T.gris)+"1A", color:statCol[detail.r.statut]||T.gris, fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>{statLbl[detail.r.statut]||detail.r.statut}</span>
              </div>
            </div>
            <div style={{ background:T.blanc, border:`1.5px solid ${T.vertM}`, borderRadius:14, padding:"11px 14px", marginBottom:12, display:"flex", gap:12, alignItems:"center" }}>
              <Avatar color={detail.robe?.shade} nom={detail.robe?.nom} size={38}/>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:T.encre }}>{detail.robe?.nom}</div>
                <div style={{ fontSize:11, color:T.gris }}>{detail.robe?.categorie} · T.{detail.robe?.taille}</div>
              </div>
            </div>
            <div style={{ background:T.blanc, border:`1.5px solid ${T.vertM}`, borderRadius:14, padding:"11px 14px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Dates</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.encre }}>
                {new Date(detail.r.debut).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})} → {new Date(detail.r.fin).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>
            <div style={{ background:T.blanc, border:`1.5px solid ${T.vertM}`, borderRadius:14, padding:"11px 14px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.gris, letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Montants</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                {[["Prix",`${detail.r.prix}€`,T.vert],["Caution",`${detail.r.caution}€`,T.encre],["Acompte",`${detail.r.acompte}€`,T.gris]].map(([l,v,col]) => (
                  <div key={l} style={{ background:T.fond, borderRadius:10, padding:8, textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:800, color:T.gris, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>{l}</div>
                    <div style={{ fontWeight:900, fontSize:16, color:col }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:detail.r.statut==="terminee"?T.vertL:detail.reste>0?"#FFF0EC":T.vertL, borderRadius:12, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:detail.r.statut==="terminee"?T.vert:detail.reste>0?T.rose:T.vert }}>{detail.r.statut==="terminee"?"Soldée ✓":"Reste à payer"}</span>
                <span style={{ fontWeight:900, fontSize:18, color:detail.r.statut==="terminee"?T.vert:detail.reste>0?T.rose:T.vert }}>{detail.r.statut==="terminee"?"0€":`${detail.reste}€`}</span>
              </div>
            </div>
            {detail.r.note && <div style={{ background:T.roseL, border:`1.5px solid ${T.rose}44`, borderRadius:14, padding:"10px 14px", fontSize:12, color:T.rose, fontWeight:600, fontStyle:"italic" }}>{detail.r.note}</div>}
          </>
        )}
      </Modal>

      {/* Modal nouvelle réservation */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle réservation">
        <div style={{ background:T.vertL, borderRadius:12, padding:"9px 13px", marginBottom:14, fontSize:12, color:T.vert, fontWeight:700 }}>✨ Suite à un essayage ? La cliente sera retrouvée automatiquement</div>
        <Field label="Cliente"><input style={inputStyle} value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/></Field>
        <Field label="Téléphone"><input style={inputStyle} value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/></Field>
        <Field label="Pièce choisie">
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:200, overflowY:"auto" }}>
            {robes.map(r => (
              <div key={r.id} onClick={()=>setForm(p=>({...p,rid:r.id,prix:r.prix?.toString()||"",caution:r.caution?.toString()||""}))} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:12, border:form.rid===r.id?`2px solid ${T.vert}`:`1.5px solid ${T.vertM}88`, background:form.rid===r.id?T.vertL:T.blanc, cursor:"pointer" }}>
                {r.photo_url
                  ? <img src={r.photo_url} alt={r.nom} style={{width:34,height:34,borderRadius:10,objectFit:"cover",flexShrink:0}}/>
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
          <Field label="Date début"><input style={inputStyle} type="date" value={form.debut} onChange={e=>setForm(p=>({...p,debut:e.target.value}))}/></Field>
          <Field label="Date fin"><input style={inputStyle} type="date" value={form.fin} onChange={e=>setForm(p=>({...p,fin:e.target.value}))}/></Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Field label="Prix (€)"><input style={inputStyle} type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder={rSelected?.prix?.toString()||""}/></Field>
          <Field label="Caution (€)"><input style={inputStyle} type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder={rSelected?.caution?.toString()||""}/></Field>
        </div>
        <Field label="Acompte versé (€) *">
          <input style={{ ...inputStyle, borderColor:!form.acompte?T.rose:T.vertM }} type="number" value={form.acompte} onChange={e=>setForm(p=>({...p,acompte:e.target.value}))} placeholder="Obligatoire pour confirmer"/>
          {!form.acompte && <div style={{ fontSize:11, color:T.rose, fontWeight:700, marginTop:4 }}>⚠️ L'acompte est obligatoire pour bloquer la pièce</div>}
        </Field>
        {+form.prix>0 && (
          <div style={{ background:T.roseL, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.gris, marginBottom:4 }}><span>Prix dû</span><span>{form.prix}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.gris, marginBottom:8 }}><span>Acompte</span><span>−{form.acompte||0}€</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:16, color:T.vert, borderTop:`1.5px solid ${T.vertM}`, paddingTop:8 }}><span>Reste à payer</span><span>{reste}€</span></div>
          </div>
        )}
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
        <div style={{ background:`linear-gradient(135deg,${T.vert}18,${T.vertL})`, border:`1px solid ${T.vert}33`, borderRadius:18, padding:14 }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.vert, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Chiffre d'affaires</div>
          <div style={{ fontWeight:900, fontSize:26, color:T.vert }}>{caTotal.toLocaleString("fr-FR")}€</div>
          <div style={{ fontSize:11, color:T.gris, marginTop:4 }}>{reservations.length} réservations</div>
        </div>
        <div style={{ background:`linear-gradient(135deg,${T.rose}18,${T.roseL})`, border:`1px solid ${T.rose}33`, borderRadius:18, padding:14 }}>
          <div style={{ fontSize:9, fontWeight:800, color:T.rose, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>Panier moyen</div>
          <div style={{ fontWeight:900, fontSize:26, color:T.rose }}>{pm}€</div>
          <div style={{ fontSize:11, color:T.gris, marginTop:4 }}>par réservation</div>
        </div>
      </div>
      <div style={{ background:T.blanc, borderRadius:18, border:`1.5px solid ${T.vertM}`, padding:14, marginBottom:10 }}>
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
        <div style={{ background:T.blanc, border:`1.5px solid ${T.rose}`, borderRadius:18, padding:14, marginBottom:10 }}>
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
                <Avatar color={robe?.shade} nom={robe?.nom} size={32}/>
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
      <div style={{ background:T.blanc, borderRadius:18, border:`1.5px solid ${T.vertM}`, padding:14 }}>
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

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("catalogue");
  const [robes, setRobes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [essayages, setEssayages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = msg => setToast({ msg, key:Date.now() });

  useEffect(() => {
    Promise.all([
      api("GET","robes?select=*&order=created_at"),
      api("GET","clientes?select=*&order=nom"),
      api("GET","reservations?select=*&order=created_at"),
      api("GET","essayages?select=*&order=date"),
    ]).then(([r,cl,res,ess]) => {
      if (Array.isArray(r)) setRobes(r);
      if (Array.isArray(cl)) setClientes(cl);
      if (Array.isArray(res)) setReservations(res.map(x=>({...x,cid:x.cliente_id,rid:x.robe_id})));
      if (Array.isArray(ess)) setEssayages(ess.map(x=>({...x,cid:x.cliente_id,rid:x.robe_id})));
    }).catch(console.error).finally(()=>setLoading(false));
  },[]);

  const TABS = [
    { id:"catalogue", label:"Catalogue", Icon:Package },
    { id:"essayages", label:"Essayages", Icon:Sparkles },
    { id:"planning",  label:"Planning",  Icon:Calendar },
    { id:"resa",      label:"Résa",      Icon:Check },
    { id:"stats",     label:"Stats",     Icon:BarChart3 },
  ];

  const titles = { catalogue:"Catalogue", essayages:"Essayages", planning:"Planning", resa:"Réservations", stats:"Statistiques" };

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", background:T.fond, minHeight:"100vh", maxWidth:430, margin:"0 auto", position:"relative", paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ background:T.blanc, padding:"13px 18px 11px", position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.vertM}55`, boxShadow:"0 2px 12px rgba(30,74,48,.06)" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
          <span style={{ fontWeight:900, fontSize:22, color:T.encre, letterSpacing:-1 }}>Plan</span>
          <span style={{ fontWeight:900, fontSize:22, color:T.vert, letterSpacing:-1 }}>me</span>
          <span style={{ width:6, height:6, borderRadius:"50%", background:T.rose, marginLeft:2, marginBottom:3, display:"inline-block" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ background:T.vertL, borderRadius:10, padding:"5px 12px" }}>
            <span style={{ fontSize:12, fontWeight:800, color:T.vert }}>{titles[tab]}</span>
          </div>
          <div style={{ width:36, height:36, borderRadius:12, background:T.vertL, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <TrendingUp size={16} color={T.vert}/>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding:40, textAlign:"center", color:T.gris, fontSize:14, fontWeight:700 }}>
          Chargement...
        </div>
      )}

      {!loading && (
        <div style={{ paddingTop:16 }}>
          {tab==="catalogue" && <Catalogue robes={robes} setRobes={setRobes} toast={showToast}/>}
          {tab==="essayages" && <Essayages essayages={essayages} setEssayages={setEssayages} robes={robes} clientes={clientes} setClientes={setClientes} toast={showToast}/>}
          {tab==="planning" && <Planning reservations={reservations} robes={robes} clientes={clientes}/>}
          {tab==="resa" && <Reservations reservations={reservations} setReservations={setReservations} robes={robes} clientes={clientes} setClientes={setClientes} toast={showToast}/>}
          {tab==="stats" && <Stats reservations={reservations} robes={robes}/>}
        </div>
      )}

      {toast && <Toast key={toast.key} msg={toast.msg} onDone={() => setToast(null)}/>}

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:T.blanc, borderTop:`1.5px solid ${T.vertM}`, display:"flex", zIndex:200, boxShadow:"0 -4px 20px rgba(30,74,48,.08)" }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"10px 4px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", color:tab===id?T.vert:T.gris, fontFamily:"inherit", position:"relative" }}>
            {tab===id && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:3, borderRadius:"0 0 3px 3px", background:T.vert }}/>}
            <div style={{ width:32, height:32, borderRadius:10, background:tab===id?T.vertL:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon size={18}/>
            </div>
            <span style={{ fontSize:10, fontWeight:tab===id?800:600 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
