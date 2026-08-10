import React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Calendar, BarChart3, Plus, X, ChevronLeft, ChevronRight,
  Package, Sparkles, Check, AlertCircle, TrendingUp, Clock, FileText
} from "lucide-react";

// ─── SUPABASE ───────────────────────────────────────────────
const SUPABASE_URL = "https://drgiyafkcmfydkabctxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZ2l5YWZrY21meWRrYWJjdHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTA5MDAsImV4cCI6MjEwMTkyNjkwMH0.Ak3tEWz5PL9DRhGKOswtqujW7dHM3-x79hd8ItteIQo";

const sb = {
  async query(table, select='*', order='created_at') {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&order=${order}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });
  }
};

// ─── TOKENS ─────────────────────────────────────────────────
const T = {
  vert:"#2D7A4F", vert2:"#1E5C38", vert3:"#0F3D22", vertL:"#E8F5EE", vertM:"#B8D8C0",
  rose:"#B8789E", rose2:"#9A5E84", roseL:"#F5EAF3", roseM:"#DDB8CE",
  encre:"#0F1E13", gris1:"#3A5C42", gris2:"#6B8F74", gris3:"#A8CCAE",
  fond:"#EEF7F1", blanc:"#FFFFFF",
  warn:"#D04040", warnL:"#FFF0EC",
  gold:"#C8962A",
};

// ─── DONNÉES ────────────────────────────────────────────────
const CATS=["Karakou","Caftan","Robe de soirée","Ensemble"];
const NOMS_R=["Lila","Amira","Yasmine","Inès","Sarah","Nour","Kenza","Lina","Sofia","Maya","Rim","Imane","Salma","Asma","Dounia","Houda"];
const SHADES=[T.vert,"#5BA37A",T.rose,"#A87098","#6AAB85","#C8A0D0","#4A9068","#7B5EA7"];
const TODAY_STR="2026-07-11";
const TODAY=new Date(TODAY_STR);
const addDays=(d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
const fmt=d=>d instanceof Date?d.toISOString().slice(0,10):d;
const fmtDate=(s,opts)=>s?new Date(s).toLocaleDateString("fr-FR",opts||{day:"numeric",month:"short"}):""; const fmtDateFull=(s)=>s?new Date(s).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"";
const fmtDateLong=s=>s?new Date(s).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}):"";

const CAT_INIT=Array.from({length:16},(_,i)=>({
  id:`r${i+1}`,nom:`${CATS[i%4]} ${NOMS_R[i%NOMS_R.length]}`,
  categorie:CATS[i%4],taille:["36","38","40","42","44"][i%5],
  prix:80+(i%6)*20,caution:200+(i%4)*100,shade:SHADES[i%8],
}));

const CLI_INIT=[
  {id:"c1",nom:"Yasmine B.",tel:"06 12 34 56 78"},
  {id:"c2",nom:"Amira K.",tel:"06 23 45 67 89"},
  {id:"c3",nom:"Lina D.",tel:"07 34 56 78 90"},
  {id:"c4",nom:"Sofia T.",tel:"06 45 67 89 01"},
  {id:"c5",nom:"Nour H.",tel:"07 56 78 90 12"},
];

const RES_INIT=[
  {id:"v1",cid:"c1",rid:"r1",debut:"2026-07-07",fin:"2026-07-09",prix:120,caution:300,acompte:60,statut:"terminee",note:""},
  {id:"v2",cid:"c2",rid:"r3",debut:"2026-07-14",fin:"2026-07-16",prix:140,caution:400,acompte:70,statut:"confirmee",note:"Suite à l'essayage"},
  {id:"v3",cid:"c3",rid:"r5",debut:"2026-07-19",fin:"2026-07-21",prix:100,caution:300,acompte:50,statut:"confirmee",note:""},
  {id:"v4",cid:"c4",rid:"r2",debut:"2026-07-10",fin:"2026-07-13",prix:160,caution:400,acompte:80,statut:"enCours",note:""},
  {id:"v5",cid:"c5",rid:"r7",debut:"2026-06-15",fin:"2026-06-17",prix:120,caution:300,acompte:120,statut:"terminee",note:""},
  {id:"v6",cid:"c1",rid:"r4",debut:"2026-06-22",fin:"2026-06-24",prix:140,caution:400,acompte:140,statut:"terminee",note:""},
  {id:"v7",cid:"c2",rid:"r6",debut:"2026-05-10",fin:"2026-05-12",prix:160,caution:400,acompte:80,statut:"terminee",note:""},
  {id:"v8",cid:"c3",rid:"r8",debut:"2026-05-20",fin:"2026-05-22",prix:100,caution:300,acompte:50,statut:"terminee",note:""},
];

const ESS_INIT=[
  {id:"e1",cid:"c1",rid:"r1",date:"2026-07-09",heure:"14:00",statut:"passe",note:""},
  {id:"e2",cid:"c2",rid:"r3",date:"2026-07-11",heure:"10:30",statut:"aVenir",note:"Voir aussi T.38"},
  {id:"e3",cid:"c3",rid:"r5",date:"2026-07-15",heure:"15:00",statut:"aVenir",note:""},
];

// ─── HOOKS ANIMATION ────────────────────────────────────────
const useTap = () => {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: {
      onMouseDown: ()=>setPressed(true),
      onMouseUp: ()=>setPressed(false),
      onMouseLeave: ()=>setPressed(false),
      onTouchStart: ()=>setPressed(true),
      onTouchEnd: ()=>setPressed(false),
    }
  };
};

// ─── ATOMS ──────────────────────────────────────────────────
const Avatar=({color,nom,size=42})=>(
  <div style={{width:size,height:size,borderRadius:size*.28,background:`linear-gradient(135deg,${color||T.vert},${color||T.vert}BB)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:size*.38,flexShrink:0,letterSpacing:-0.5,boxShadow:`0 4px 12px ${color||T.vert}55, inset 0 1px 0 rgba(255,255,255,0.25)`}}>
    {nom?.[0]?.toUpperCase()||"?"}
  </div>
);

const Badge=({label,color=T.vert})=>(
  <span style={{background:`linear-gradient(135deg,${color}22,${color}11)`,color,fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:100,whiteSpace:"nowrap",border:`1px solid ${color}44`,boxShadow:`0 1px 4px ${color}22`}}>
    {label}
  </span>
);

const TapCard=({children,onClick,style={}})=>{
  const {pressed,handlers}=useTap();
  return (
    <div onClick={onClick} {...handlers} style={{
      background:`linear-gradient(160deg, ${T.blanc} 0%, #F8FCF9 100%)`,
      borderRadius:20,
      border:`1px solid ${T.vertM}88`,
      padding:"14px 16px",
      marginBottom:10,
      boxShadow:pressed
        ?"0 1px 4px rgba(15,62,34,0.06)"
        :"0 4px 16px rgba(15,62,34,0.08), 0 1px 4px rgba(15,62,34,0.04)",
      cursor:onClick?"pointer":"default",
      transform:pressed&&onClick?"scale(0.984)":"scale(1)",
      transition:"transform .12s cubic-bezier(.32,1.2,.55,1), box-shadow .12s",
      ...style
    }}>
      {children}
    </div>
  );
};

const Input=({label,...props})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{label}</div>}
    <input {...props} style={{width:"100%",background:T.fond,border:`1.5px solid ${T.vertM}`,borderRadius:12,padding:"12px 14px",fontSize:15,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box",...props.style}}/>
  </div>
);

const Select=({label,children,...props})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{label}</div>}
    <select {...props} style={{width:"100%",background:T.fond,border:`1.5px solid ${T.vertM}`,borderRadius:12,padding:"12px 14px",fontSize:15,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box",appearance:"none"}}>
      {children}
    </select>
  </div>
);

const BtnPrimary=({children,onClick,disabled=false,style={}})=>{
  const {pressed,handlers}=useTap();
  return (
    <button onClick={onClick} {...handlers} disabled={disabled} style={{width:"100%",background:disabled?T.gris3:`linear-gradient(160deg,${T.vert},${T.vert3})`,color:"#fff",border:disabled?"none":"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"15px",fontWeight:900,fontSize:15,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:disabled?"none":`0 6px 20px ${T.vert3}55, inset 0 1px 0 rgba(255,255,255,0.15)`,transform:pressed&&!disabled?"scale(0.977)":"scale(1)",transition:"transform .12s cubic-bezier(.32,1.2,.55,1)",...style}}>
      {children}
    </button>
  );
};

// ─── MODAL BOTTOM SHEET ─────────────────────────────────────
const Modal=({open,onClose,title,children,height="auto"})=>{
  const [visible,setVisible]=useState(false);
  const [show,setShow]=useState(false);

  useEffect(()=>{
    if(open){setVisible(true);setTimeout(()=>setShow(true),10);}
    else{setShow(false);setTimeout(()=>setVisible(false),300);}
  },[open]);

  if(!visible)return null;

  return (
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"flex-end"}}>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:`rgba(26,46,31,${show?.4:0})`,backdropFilter:show?"blur(3px)":"none",transition:"background .3s, backdrop-filter .3s"}}/>
      {/* Sheet */}
      <div style={{position:"relative",width:"100%",maxWidth:430,margin:"0 auto",background:T.blanc,borderRadius:"24px 24px 0 0",padding:"0 0",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(26,46,31,0.2)",transform:show?"translateY(0)":"translateY(100%)",transition:"transform .3s cubic-bezier(.32,1.2,.55,1)"}}>
        <div style={{padding:"12px 18px 0"}}>
          <div style={{width:36,height:4,borderRadius:100,background:T.gris3,margin:"0 auto 16px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <span style={{fontWeight:900,fontSize:18,color:T.encre}}>{title}</span>
            <button onClick={onClose} style={{background:T.fond,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.gris2}}>
              <X size={16}/>
            </button>
          </div>
        </div>
        <div style={{padding:"0 18px 40px"}}>{children}</div>
      </div>
    </div>
  );
};

// ─── CALENDRIER ─────────────────────────────────────────────
const Calendrier=({mois,events=[],selected,onSelect})=>{
  const y=mois.getFullYear(),m=mois.getMonth();
  const first=(new Date(y,m,1).getDay()+6)%7;
  const days=new Date(y,m+1,0).getDate();
  const jours=["L","M","M","J","V","S","D"];
  const hasEvent=d=>{
    const ds=fmt(new Date(y,m,d));
    return events.some(e=>(e.debut||e.date)<=ds&&(e.fin||e.date)>=ds);
  };
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {jours.map((j,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:800,color:T.gris2,padding:"2px 0"}}>{j}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array(first).fill(null).map((_,i)=><div key={`e${i}`}/>)}
        {Array(days).fill(null).map((_,i)=>{
          const d=i+1,ds=fmt(new Date(y,m,d));
          const isSel=ds===selected,isToday=ds===TODAY_STR,hasEv=hasEvent(d);
          return (
            <div key={d} onClick={()=>onSelect(ds)} style={{aspectRatio:1,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:isSel?T.vert:isToday?T.vertL:"transparent",border:isToday&&!isSel?`1.5px solid ${T.vert}`:"none",transition:"all .15s",transform:"scale(1)"}}>
              <span style={{fontSize:12,fontWeight:isSel||isToday?800:600,color:isSel?"#fff":isToday?T.vert:T.encre}}>{d}</span>
              {hasEv&&<div style={{width:4,height:4,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.6)":T.rose,marginTop:1}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NavMois=({mois,setMois})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
    <button onClick={()=>setMois(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{background:T.vertL,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.vert}}>
      <ChevronLeft size={16}/>
    </button>
    <span style={{fontWeight:800,fontSize:14,color:T.encre,textTransform:"capitalize"}}>
      {mois.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
    </span>
    <button onClick={()=>setMois(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{background:T.vertL,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.vert}}>
      <ChevronRight size={16}/>
    </button>
  </div>
);

const FAB=({onClick})=>{
  const {pressed,handlers}=useTap();
  return (
    <button onClick={onClick} {...handlers} style={{position:"fixed",bottom:90,right:20,width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${T.vert},${T.vert3})`,color:"#fff",border:"2px solid rgba(255,255,255,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 28px ${T.vert3}66, 0 2px 8px ${T.vert3}44`,zIndex:150,transform:pressed?"scale(0.90)":"scale(1)",transition:"transform .12s cubic-bezier(.32,1.2,.55,1)"}}>
      <Plus size={24}/>
    </button>
  );
};

// ─── CATALOGUE ──────────────────────────────────────────────
const Catalogue=({cat,setCat})=>{
  const [q,setQ]=useState("");
  const [catF,setCatF]=useState("Toutes");
  const [modal,setModal]=useState(false);
  const [detail,setDetail]=useState(null);
  const [form,setForm]=useState({nom:"",categorie:CATS[0],taille:"38",prix:"",caution:""});

  const filtered=useMemo(()=>cat.filter(r=>(catF==="Toutes"||r.categorie===catF)&&r.nom.toLowerCase().includes(q.toLowerCase())),[cat,catF,q]);

  const add=()=>{
    if(!form.nom||!form.prix)return;
    setCat(p=>[...p,{id:`r${Date.now()}`,shade:SHADES[p.length%8],...form,prix:+form.prix,caution:+form.caution}]);
    setModal(false);setForm({nom:"",categorie:CATS[0],taille:"38",prix:"",caution:""});
  };

  return (
    <div>
      <div style={{padding:"0 16px 0"}}>
        <div style={{position:"relative",marginBottom:10}}>
          <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.gris2,pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une pièce..." style={{width:"100%",background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"11px 14px 11px 38px",fontSize:14,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12,scrollbarWidth:"none"}}>
          {["Toutes",...CATS].map(c=>(
            <button key={c} onClick={()=>setCatF(c)} style={{whiteSpace:"nowrap",padding:"7px 16px",borderRadius:100,border:"none",background:catF===c?T.vert:T.vertL,color:catF===c?"#fff":T.vert,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",transform:"scale(1)"}}>
              {c}
            </button>
          ))}
        </div>
        <div style={{fontWeight:700,fontSize:12,color:T.gris2,marginBottom:12}}>{filtered.length} pièce{filtered.length>1?"s":""}</div>
      </div>

      {/* Grille 2 colonnes */}
      <div style={{padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {filtered.map(r=>{
          const {pressed,handlers}=useTap();
          return (
            <div key={r.id} onClick={()=>setDetail(r)} {...handlers} style={{background:T.blanc,borderRadius:18,border:`1.5px solid ${T.vertM}`,overflow:"hidden",cursor:"pointer",boxShadow:pressed?"0 1px 4px rgba(58,125,87,0.06)":"0 2px 10px rgba(58,125,87,0.07)",transform:pressed?"scale(0.97)":"scale(1)",transition:"transform .1s, box-shadow .1s"}}>
              <div style={{height:110,background:`linear-gradient(135deg,${r.shade}33,${r.shade}66)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <Avatar color={r.shade} nom={r.nom} size={44}/>
                <div style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,0.9)",borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:900,color:T.vert}}>{r.prix}€</div>
              </div>
              <div style={{padding:"10px 11px 12px"}}>
                <div style={{fontWeight:800,fontSize:12,color:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.nom}</div>
                <div style={{fontSize:10,color:T.gris2,marginTop:2}}>{r.categorie} · T.{r.taille}</div>
                <div style={{fontSize:10,color:T.gris2,marginTop:1}}>Caution {r.caution}€</div>
              </div>
            </div>
          );
        })}
      </div>

      <FAB onClick={()=>setModal(true)}/>

      {/* Modal ajout */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Nouvelle pièce">
        <Input label="Nom de la pièce" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="ex: Karakou Yasmine"/>
        <Select label="Catégorie" value={form.categorie} onChange={e=>setForm(p=>({...p,categorie:e.target.value}))}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Select label="Taille" value={form.taille} onChange={e=>setForm(p=>({...p,taille:e.target.value}))}>
            {["34","36","38","40","42","44"].map(t=><option key={t}>{t}</option>)}
          </Select>
          <Input label="Prix (€)" type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder="120"/>
        </div>
        <Input label="Caution (€)" type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder="300"/>
        <div style={{border:`2px dashed ${T.vertM}`,borderRadius:14,padding:"20px",textAlign:"center",marginBottom:16,background:T.fond,cursor:"pointer"}}>
          <div style={{fontSize:24,marginBottom:6}}>📷</div>
          <div style={{fontSize:12,fontWeight:700,color:T.vert}}>Ajouter une photo</div>
          <div style={{fontSize:11,color:T.gris2,marginTop:2}}>Appuyer pour uploader</div>
        </div>
        <BtnPrimary onClick={add} disabled={!form.nom||!form.prix}>Ajouter au catalogue ✓</BtnPrimary>
      </Modal>

      {/* Modal détail */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?.nom||""}>
        {detail&&(
          <>
            <div style={{height:140,borderRadius:16,background:`linear-gradient(135deg,${detail.shade}22,${detail.shade}55)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,position:"relative"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:6}}>📷</div>
                <div style={{fontSize:12,fontWeight:700,color:detail.shade}}>Photo de la pièce</div>
              </div>
              <div style={{position:"absolute",top:10,right:10,background:T.blanc,borderRadius:10,padding:"4px 10px"}}>
                <Badge label="Disponible" color={T.vert}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[["Taille",detail.taille,T.encre],["Prix",`${detail.prix}€`,T.vert],["Caution",`${detail.caution}€`,T.encre]].map(([l,v,c])=>(
                <div key={l} style={{background:T.fond,borderRadius:14,padding:"12px",border:`1.5px solid ${T.vertM}`,textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{l}</div>
                  <div style={{fontWeight:900,fontSize:20,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.vertL,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
              <Check size={16} color={T.vert}/>
              <span style={{fontSize:13,fontWeight:700,color:T.vert}}>Disponible à la location</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ─── ESSAYAGES ──────────────────────────────────────────────
const Essayages=({ess,setEss,cat,cli,setCli})=>{
  const [mois,setMois]=useState(new Date(2026,6,1));
  const [sel,setSel]=useState(TODAY_STR);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({nom:"",tel:"",rid:"",heure:"10:00",note:""});

  const dayEss=ess.filter(e=>e.date===sel);
  const calEvts=ess.map(e=>({debut:e.date,fin:e.date}));

  const add=()=>{
    if(!form.nom||!form.rid)return;
    let c=cli.find(x=>x.nom.toLowerCase()===form.nom.toLowerCase());
    if(!c){c={id:`c${Date.now()}`,nom:form.nom,tel:form.tel};setCli(p=>[...p,c]);}
    setEss(p=>[...p,{id:`e${Date.now()}`,cid:c.id,rid:form.rid,date:sel,heure:form.heure,statut:"aVenir",note:form.note}]);
    setModal(false);setForm({nom:"",tel:"",rid:"",heure:"10:00",note:""});
  };

  return (
    <div>
      <div style={{padding:"0 16px"}}>
        <TapCard style={{marginBottom:12}}>
          <NavMois mois={mois} setMois={setMois}/>
          <Calendrier mois={mois} events={calEvts} selected={sel} onSelect={setSel}/>
        </TapCard>
        <div style={{background:T.vertL,border:`1.5px solid ${T.vert}33`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
          <Sparkles size={15} color={T.vert} style={{flexShrink:0}}/>
          <div style={{fontSize:12,color:T.vert,fontWeight:700}}>Calendrier des essayages · séparé du planning locations</div>
        </div>
        <div style={{fontWeight:800,fontSize:13,color:T.encre,marginBottom:10,textTransform:"capitalize"}}>{fmtDateLong(sel)}</div>
        {dayEss.length===0
          ?<TapCard style={{textAlign:"center",padding:"28px 16px"}}><div style={{fontSize:32,marginBottom:10}}>🗓️</div><div style={{color:T.gris2,fontSize:13,fontWeight:600}}>Aucun essayage ce jour</div></TapCard>
          :dayEss.map(e=>{
            const r=cat.find(x=>x.id===e.rid),c=cli.find(x=>x.id===e.cid);
            return (
              <TapCard key={e.id}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Avatar color={r?.shade} nom={c?.nom} size={46}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:T.encre}}>{c?.nom}</div>
                    <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{r?.nom} · {e.heure}</div>
                    {e.note&&<div style={{fontSize:11,color:T.rose,marginTop:4,fontStyle:"italic"}}>{e.note}</div>}
                  </div>
                  <Badge label={e.statut==="passe"?"Passé":"À venir"} color={e.statut==="passe"?T.gris2:T.vert}/>
                </div>
              </TapCard>
            );
          })
        }
      </div>
      <FAB onClick={()=>setModal(true)}/>
      <Modal open={modal} onClose={()=>setModal(false)} title={`Essayage — ${fmtDate(sel)}`}>
        <Input label="Cliente" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
        <Input label="Téléphone" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/>
        {/* Sélecteur pièce visuel */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Pièce à essayer</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:200,overflowY:"auto",paddingRight:4}}>
            {cat.map(r=>{
              const sel=form.rid===r.id;
              return (
                <div key={r.id} onClick={()=>setForm(p=>({...p,rid:r.id}))} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:14,border:sel?`2px solid ${T.vert}`:`1.5px solid ${T.vertM}88`,background:sel?T.vertL:T.blanc,cursor:"pointer",transition:"all .15s",boxShadow:sel?`0 2px 8px ${T.vert}33`:"none"}}>
                  <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${r.shade||T.vert},${r.shade||T.vert}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:15,flexShrink:0,boxShadow:`0 2px 8px ${r.shade||T.vert}44`}}>
                    {r.nom?.[0]?.toUpperCase()||"?"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:13,color:sel?T.vert:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.nom}</div>
                    <div style={{fontSize:11,color:T.gris2,marginTop:2}}>{r.categorie} · T.{r.taille}</div>
                  </div>
                  {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:T.vert,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Check size={12} color="#fff"/>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
        <Input label="Heure" type="time" value={form.heure} onChange={e=>setForm(p=>({...p,heure:e.target.value}))}/>
        <Input label="Note" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: voir aussi T.38"/>
        <BtnPrimary onClick={add} disabled={!form.nom||!form.rid}>Enregistrer l'essayage ✓</BtnPrimary>
      </Modal>
    </div>
  );
};

// ─── PLANNING ───────────────────────────────────────────────
const Planning=({res,cat,cli})=>{
  const [mois,setMois]=useState(new Date(2026,6,1));
  const [sel,setSel]=useState(TODAY_STR);
  const dayRes=res.filter(r=>r.debut<=sel&&r.fin>=sel);
  const calEvts=res;
  const statCol={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};
  const statLbl={confirmee:"Confirmée",enCours:"En cours",terminee:"Terminée"};
  return (
    <div style={{padding:"0 16px"}}>
      <TapCard style={{marginBottom:12}}>
        <NavMois mois={mois} setMois={setMois}/>
        <Calendrier mois={mois} events={calEvts} selected={sel} onSelect={setSel}/>
      </TapCard>
      <div style={{background:T.vertL,border:`1.5px solid ${T.vert}33`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10}}>
        <Calendar size={15} color={T.vert} style={{flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:T.vert,fontWeight:700}}>Planning des réservations · distinct du planning essayages</div>
      </div>
      <div style={{fontWeight:800,fontSize:13,color:T.encre,marginBottom:10,textTransform:"capitalize"}}>{fmtDateLong(sel)}</div>
      {dayRes.length===0
        ?<TapCard style={{textAlign:"center",padding:"28px 16px"}}><div style={{fontSize:32,marginBottom:10}}>✅</div><div style={{color:T.gris2,fontSize:13,fontWeight:600}}>Toutes les pièces sont disponibles</div></TapCard>
        :dayRes.map(r=>{
          const robe=cat.find(x=>x.id===r.rid),c=cli.find(x=>x.id===r.cid);
          return (
            <TapCard key={r.id}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={46}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{robe?.nom}</div>
                </div>
                <Badge label={statLbl[r.statut]} color={statCol[r.statut]}/>
              </div>
              <div style={{background:T.warnL,border:"1.5px solid #F5C0B0",borderRadius:12,padding:"9px 12px",display:"flex",gap:9,alignItems:"center"}}>
                <AlertCircle size={14} color={T.warn} style={{flexShrink:0}}/>
                <div style={{fontSize:11,color:"#8B3020",fontWeight:600}}>
                  {robe?.nom} <strong>grisée</strong> du {fmtDate(r.debut)} au {fmtDate(r.fin)} — double réservation impossible
                </div>
              </div>
            </TapCard>
          );
        })
      }
    </div>
  );
};

// ─── RÉSERVATIONS ───────────────────────────────────────────
const Reservations=({res,setRes,cat,cli,setCli})=>{
  const [modal,setModal]=useState(false);
  const [detail,setDetail]=useState(null);
  const [q,setQ]=useState("");
  const [form,setForm]=useState({nom:"",tel:"",rid:"",debut:"",fin:"",prix:"",caution:"",acompte:"",note:""});

  const filtered=res.filter(r=>{
    const c=cli.find(x=>x.id===r.cid);
    return !q||c?.nom.toLowerCase().includes(q.toLowerCase());
  });

  const rSelected=cat.find(x=>x.id===form.rid);
  const reste=(+form.prix||0)-(+form.acompte||0);

  const add=()=>{
    if(!form.nom||!form.rid||!form.debut)return;
    let c=cli.find(x=>x.nom.toLowerCase()===form.nom.toLowerCase());
    if(!c){c={id:`c${Date.now()}`,nom:form.nom,tel:form.tel};setCli(p=>[...p,c]);}
    setRes(p=>[...p,{id:`v${Date.now()}`,cid:c.id,rid:form.rid,debut:form.debut,fin:form.fin||form.debut,prix:+form.prix,caution:+form.caution,acompte:+form.acompte||0,statut:"confirmee",note:form.note}]);
    setModal(false);setForm({nom:"",tel:"",rid:"",debut:"",fin:"",prix:"",caution:"",acompte:"",note:""});
  };

  const statCol={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};
  const statLbl={confirmee:"Confirmée",enCours:"En cours",terminee:"Terminée"};

  return (
    <div>
      <div style={{padding:"0 16px"}}>
        <div style={{position:"relative",marginBottom:12}}>
          <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.gris2,pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une cliente..." style={{width:"100%",background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"11px 14px 11px 38px",fontSize:14,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{fontWeight:700,fontSize:12,color:T.gris2,marginBottom:10}}>{filtered.length} réservation{filtered.length>1?"s":""}</div>
        {filtered.map(r=>{
          const robe=cat.find(x=>x.id===r.rid),c=cli.find(x=>x.id===r.cid),reste=r.prix-r.acompte;
          return (
            <TapCard key={r.id} onClick={()=>setDetail({res:r,robe,cli:c,reste})}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={46}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{robe?.nom}</div>
                </div>
                <Badge label={statLbl[r.statut]||r.statut} color={statCol[r.statut]||T.gris2}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:r.prix>0?8:0,fontSize:12,color:T.gris2,fontWeight:600}}>
                <Clock size={13}/>
                {fmtDate(r.debut)} → {fmtDate(r.fin)}
              </div>
              {r.prix>0&&(
                <div style={{background:r.statut==="terminee"?T.vertL:reste>0?T.roseL:T.vertL,borderRadius:12,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:T.gris2,fontWeight:600}}>{r.statut==="terminee"?"Location terminée":"Acompte "+r.acompte+"€ · Reste à payer"}</span>
                  <span style={{fontWeight:900,fontSize:15,color:r.statut==="terminee"?T.vert:reste>0?T.rose:T.vert}}>{r.statut==="terminee"?"✓ Soldée":reste+"€"}</span>
                </div>
              )}
              {r.note&&<div style={{fontSize:11,color:T.rose,marginTop:8,fontStyle:"italic",fontWeight:600}}>{r.note}</div>}
            </TapCard>
          );
        })}
      </div>
      <FAB onClick={()=>setModal(true)}/>

      {/* Modal détail réservation */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Détail réservation">
        {detail&&(()=>{
          const {res:r,robe,cli:c,reste}=detail;
          const statCol={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};
          const statLbl={confirmee:"Confirmée",enCours:"En cours",terminee:"Terminée"};
          return (
            <>
              {/* En-tête cliente + robe */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,padding:"14px",background:T.fond,borderRadius:16}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={52}/>
                <div>
                  <div style={{fontWeight:900,fontSize:17,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:12,color:T.gris2,marginTop:3}}>{c?.tel}</div>
                  <div style={{marginTop:6}}><Badge label={statLbl[r.statut]||r.statut} color={statCol[r.statut]||T.gris2}/></div>
                </div>
              </div>

              {/* Pièce */}
              <div style={{background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:robe?.shade||T.vert,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:16,flexShrink:0}}>
                  {robe?.nom?.[0]||"?"}
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:13,color:T.encre}}>{robe?.nom}</div>
                  <div style={{fontSize:11,color:T.gris2,marginTop:2}}>{robe?.categorie} · T.{robe?.taille}</div>
                </div>
              </div>

              {/* Dates */}
              <div style={{background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <Clock size={16} color={T.gris2} style={{flexShrink:0}}/>
                <div>
                  <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Dates</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.encre}}>{fmtDateFull(r.debut)} → {fmtDateFull(r.fin)}</div>
                </div>
              </div>

              {/* Montants */}
              <div style={{background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Montants</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  {(()=>{
                const robeCat=cat.find(x=>x.id===r.rid);
                const prixModifie=robeCat&&r.prix!==robeCat.prix;
                return null;
              })()}
              {[["Prix",`${r.prix}€`,T.vert],["Caution",`${r.caution}€`,T.encre],["Acompte",`${r.acompte}€`,T.gris2]].map(([l,v,c])=>(
                    <div key={l} style={{background:T.fond,borderRadius:10,padding:"8px",textAlign:"center"}}>
                      <div style={{fontSize:9,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{l}</div>
                      <div style={{fontWeight:900,fontSize:16,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:r.statut==="terminee"?T.vertL:reste>0?T.roseL:T.vertL,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:r.statut==="terminee"?T.vert:reste>0?T.rose:T.vert}}>{r.statut==="terminee"?"Location soldée ✓":"Reste à payer"}</span>
                  <span style={{fontWeight:900,fontSize:18,color:r.statut==="terminee"?T.vert:reste>0?T.rose:T.vert}}>{r.statut==="terminee"?"0€":reste+"€"}</span>
                </div>
              </div>

              {/* Caution */}
              <div style={{background:T.warnL,border:"1.5px solid #F5C0B0",borderRadius:14,padding:"10px 14px",marginBottom:r.note?12:0,display:"flex",gap:9,alignItems:"center"}}>
                <AlertCircle size={14} color={T.warn} style={{flexShrink:0}}/>
                <div style={{fontSize:11,color:"#8B3020",fontWeight:600}}>Caution {r.caution}€ — à restituer à la fin de la location</div>
              </div>

              {/* Note */}
              {r.note&&(
                <div style={{background:T.roseL,border:`1.5px solid ${T.roseM}`,borderRadius:14,padding:"10px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
                  <FileText size={14} color={T.rose} style={{flexShrink:0,marginTop:1}}/>
                  <div style={{fontSize:12,color:T.rose,fontWeight:600,fontStyle:"italic"}}>{r.note}</div>
                </div>
              )}
            </>
          );
        })()}
      </Modal>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nouvelle réservation">
        <div style={{background:T.vertL,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.vert,fontWeight:700,display:"flex",gap:8,alignItems:"center"}}>
          <Sparkles size={14}/>Suite à un essayage ? La cliente est retrouvée automatiquement
        </div>
        <Input label="Cliente" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
        <Input label="Téléphone" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/>
        {/* Sélecteur pièce visuel */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Pièce choisie</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:220,overflowY:"auto",paddingRight:4}}>
            {cat.map(r=>{
              const sel=form.rid===r.id;
              return (
                <div key={r.id} onClick={()=>{setForm(p=>({...p,rid:r.id,prix:r.prix?.toString()||"",caution:r.caution?.toString()||""}));}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:14,border:sel?`2px solid ${T.vert}`:`1.5px solid ${T.vertM}88`,background:sel?T.vertL:T.blanc,cursor:"pointer",transition:"all .15s",boxShadow:sel?`0 2px 8px ${T.vert}33`:"none"}}>
                  <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${r.shade||T.vert},${r.shade||T.vert}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:15,flexShrink:0,boxShadow:`0 2px 8px ${r.shade||T.vert}44`}}>
                    {r.nom?.[0]?.toUpperCase()||"?"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:13,color:sel?T.vert:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.nom}</div>
                    <div style={{fontSize:11,color:T.gris2,marginTop:2}}>{r.categorie} · T.{r.taille} · {r.prix}€</div>
                  </div>
                  {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:T.vert,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Check size={12} color="#fff"/>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Date début" type="date" value={form.debut} onChange={e=>setForm(p=>({...p,debut:e.target.value}))}/>
          <Input label="Date fin" type="date" value={form.fin} onChange={e=>setForm(p=>({...p,fin:e.target.value}))}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Prix (€)</div>
            <input type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder={rSelected?.prix?.toString()||""} style={{width:"100%",background:rSelected&&form.prix&&+form.prix!==rSelected.prix?`linear-gradient(135deg,${T.roseL},${T.blanc})`:`${T.fond}`,border:rSelected&&form.prix&&+form.prix!==rSelected.prix?`1.5px solid ${T.rose}`:`1.5px solid ${T.vertM}`,borderRadius:12,padding:"12px 14px",fontSize:15,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}/>
            {rSelected&&form.prix&&+form.prix!==rSelected.prix&&(
              <div style={{fontSize:10,color:T.rose,fontWeight:700,marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                ✏️ Prix modifié · catalogue : {rSelected.prix}€
              </div>
            )}
          </div>
          <Input label="Caution (€)" type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder={rSelected?.caution?.toString()||""}/>
        </div>
        <Input label="Acompte versé (€) *" type="number" value={form.acompte} onChange={e=>setForm(p=>({...p,acompte:e.target.value}))} placeholder="ex: 60" style={{border:!form.acompte?`1.5px solid ${T.rose}`:`1.5px solid ${T.vertM}`}}/>
        {!form.acompte&&<div style={{fontSize:11,color:T.rose,fontWeight:700,marginTop:-10,marginBottom:12}}>⚠️ L'acompte est obligatoire pour bloquer la pièce</div>}
        {+form.prix>0&&(
          <div style={{background:T.roseL,border:`1.5px solid ${T.roseM}`,borderRadius:14,padding:"12px 14px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.gris2,marginBottom:4}}><span>Prix dû</span><span>{form.prix}€</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.gris2,marginBottom:8}}><span>Acompte versé</span><span>−{form.acompte||0}€</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:16,color:T.vert,borderTop:`1.5px solid ${T.vertM}`,paddingTop:8}}><span>Reste à payer</span><span>{reste}€</span></div>
          </div>
        )}
        <Input label="Note" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: suite à l'essayage du 11 juil."/>
        <BtnPrimary onClick={add} disabled={!form.nom||!form.rid||!form.debut||!form.acompte}>Confirmer la réservation ✓</BtnPrimary>
      </Modal>
    </div>
  );
};

// ─── STATS ──────────────────────────────────────────────────
const Stats=({res,cat,cli})=>{
  const [moisDetail,setMoisDetail]=useState(null); // mois sélectionné pour le détail

  const caTotal=res.reduce((s,r)=>s+(r.prix||0),0);
  const pm=res.length?Math.round(caTotal/res.length):0;
  const cautions=res.filter(r=>r.statut!=="terminee").reduce((s,r)=>s+(r.caution||0),0);

  const parMois=useMemo(()=>{
    const m={};
    res.forEach(r=>{const k=r.debut?.slice(0,7);if(k)m[k]=(m[k]||0)+(r.prix||0);});
    return Object.entries(m).sort().slice(-6);
  },[res]);
  const maxCA=Math.max(...parMois.map(([,v])=>v),1);

  const parRobe=useMemo(()=>{
    const m={};
    res.forEach(r=>{m[r.rid]=(m[r.rid]||0)+(r.prix||0);});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[res]);

  const MN={"2026-01":"Jan","2026-02":"Fév","2026-03":"Mar","2026-04":"Avr","2026-05":"Mai","2026-06":"Jun","2026-07":"Jul"};

  // Réservations du mois sélectionné
  const resDetail=moisDetail?res.filter(r=>r.debut?.startsWith(moisDetail)):[];

  return (
    <div style={{padding:"0 16px"}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <TapCard style={{margin:0,background:`linear-gradient(135deg,${T.vert}18,${T.vertL})`,border:`1px solid ${T.vert}33`}}>
          <div style={{fontSize:10,fontWeight:800,color:T.vert,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Chiffre d'affaires</div>
          <div style={{fontWeight:900,fontSize:28,color:T.vert,lineHeight:1,textShadow:`0 1px 4px ${T.vert}33`}}>{caTotal.toLocaleString("fr-FR")}€</div>
          <div style={{fontSize:11,color:T.gris1,marginTop:5,fontWeight:700}}>{res.length} réservations</div>
        </TapCard>
        <TapCard style={{margin:0,background:`linear-gradient(135deg,${T.encre}08,${T.blanc})`}}>
          <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Panier moyen</div>
          <div style={{fontWeight:900,fontSize:28,color:T.encre,lineHeight:1}}>{pm}€</div>
          <div style={{fontSize:11,color:T.gris2,marginTop:5,fontWeight:700}}>par réservation</div>
        </TapCard>
      </div>
      <TapCard style={{marginBottom:10,background:`linear-gradient(135deg,${T.rose}18,${T.roseL})`,border:`1px solid ${T.rose}33`}}>
        <div style={{fontSize:10,fontWeight:800,color:T.rose,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Cautions en cours</div>
        <div style={{fontWeight:900,fontSize:28,color:T.rose2,lineHeight:1,textShadow:`0 1px 4px ${T.rose}33`}}>{cautions.toLocaleString("fr-FR")}€</div>
        <div style={{fontSize:11,color:T.gris1,marginTop:5,fontWeight:700}}>à restituer sur réservations actives</div>
      </TapCard>

      {/* Graphique interactif */}
      <TapCard>
        <div style={{fontWeight:800,fontSize:14,color:T.encre,marginBottom:4}}>CA par mois</div>
        <div style={{fontSize:11,color:T.gris2,marginBottom:16}}>Tap sur une barre pour voir le détail</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
          {parMois.map(([k,v],i)=>{
            const isLast=i===parMois.length-1;
            const isSel=k===moisDetail;
            const {pressed,handlers}=useTap();
            return (
              <div key={k} onClick={()=>setMoisDetail(isSel?null:k)} {...handlers} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%",justifyContent:"flex-end",cursor:"pointer"}}>
                <div style={{fontSize:9,fontWeight:700,color:isSel?T.vert:T.gris2}}>{v>0?`${Math.round(v/100)/10}k`:""}</div>
                <div style={{width:"100%",borderRadius:"6px 6px 0 0",background:isSel?`linear-gradient(180deg,${T.rose},${T.rose}AA)`:isLast?`linear-gradient(180deg,${T.vert},${T.vert2})`:T.vertM,height:`${Math.max(Math.round((v/maxCA)*100),4)}%`,transition:"all .2s",transform:pressed?"scaleY(0.95)":"scaleY(1)",border:isSel?`1.5px solid ${T.rose}`:"none"}}/>
                <div style={{fontSize:9,fontWeight:700,color:isSel?T.rose:isLast?T.vert:T.gris2}}>{MN[k]||k}</div>
              </div>
            );
          })}
        </div>
      </TapCard>

      {/* Détail du mois sélectionné */}
      {moisDetail&&resDetail.length>0&&(
        <TapCard style={{border:`1.5px solid ${T.rose}`,marginTop:-4}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontWeight:900,fontSize:14,color:T.encre}}>Détail — {MN[moisDetail]||moisDetail}</div>
              <div style={{fontSize:11,color:T.gris2,marginTop:2}}>{resDetail.length} réservations · {resDetail.reduce((s,r)=>s+(r.prix||0),0)}€</div>
            </div>
            <button onClick={()=>setMoisDetail(null)} style={{background:T.fond,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.gris2}}>
              <X size={14}/>
            </button>
          </div>
          {resDetail.map(r=>{
            const robe=cat.find(x=>x.id===r.rid),c=cli.find(x=>x.id===r.cid);
            const statCol={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};
            const statLbl={confirmee:"Confirmée",enCours:"En cours",terminee:"Terminée"};
            return (
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.vertM}`}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={34}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:11,color:T.gris2}}>{robe?.nom} · {fmtDate(r.debut)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:900,fontSize:13,color:T.vert}}>{r.prix}€</div>
                  <Badge label={statLbl[r.statut]} color={statCol[r.statut]}/>
                </div>
              </div>
            );
          })}
          <div style={{marginTop:10,paddingTop:10,borderTop:`1.5px solid ${T.vertM}`,display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:15,color:T.vert}}>
            <span>Total {MN[moisDetail]}</span>
            <span>{resDetail.reduce((s,r)=>s+(r.prix||0),0)}€</span>
          </div>
        </TapCard>
      )}

      {/* Top robes */}
      <TapCard>
        <div style={{fontWeight:800,fontSize:14,color:T.encre,marginBottom:14}}>Top pièces</div>
        {parRobe.map(([rid,ca],i)=>{
          const r=cat.find(x=>x.id===rid);
          return (
            <div key={rid} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:i===0?T.rose:i===1?"#C8A020":T.vertL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:i<2?"#fff":T.vert}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r?.nom||rid}</div>
                <div style={{height:5,background:T.vertL,borderRadius:100,marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((ca/parRobe[0][1])*100)}%`,background:`linear-gradient(90deg,${T.vert},${T.vertM})`,borderRadius:100,transition:"width .4s"}}/>
                </div>
              </div>
              <div style={{fontSize:14,fontWeight:900,color:T.vert,flexShrink:0}}>{ca}€</div>
            </div>
          );
        })}
      </TapCard>
    </div>
  );
};

// ─── APP ────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("catalogue");
  const [cat,setCat]=useState(CAT_INIT);
  const [cli,setCli]=useState(CLI_INIT);
  const [res,setRes]=useState(RES_INIT);
  const [ess,setEss]=useState(ESS_INIT);
  const [loading,setLoading]=useState(true);
  const [dbOk,setDbOk]=useState(false);

  // Charger les données depuis Supabase au démarrage
  useEffect(()=>{
    async function loadData(){
      try {
        const [robes,clientes,reservations,essayages] = await Promise.all([
          sb.query('robes','*','created_at'),
          sb.query('clientes','*','nom'),
          sb.query('reservations','*','created_at'),
          sb.query('essayages','*','date'),
        ]);
        if(Array.isArray(robes)&&robes.length>0){
          setCat(robes.map(r=>({...r,shade:r.shade||'#3A7D57'})));
          setDbOk(true);
        }
        if(Array.isArray(clientes)&&clientes.length>0) setCli(clientes);
        if(Array.isArray(reservations)&&reservations.length>0){
          setRes(reservations.map(r=>({...r,cid:r.cliente_id,rid:r.robe_id,debut:r.debut,fin:r.fin})));
        }
        if(Array.isArray(essayages)&&essayages.length>0){
          setEss(essayages.map(e=>({...e,cid:e.cliente_id,rid:e.robe_id})));
        }
      } catch(e){
        console.log('Mode démo — Supabase non connecté');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  },[]);

  const TABS=[
    {id:"catalogue",label:"Catalogue",Icon:Package},
    {id:"essayages",label:"Essayages",Icon:Sparkles},
    {id:"planning",label:"Planning",Icon:Calendar},
    {id:"resa",label:"Résa",Icon:Check},
    {id:"stats",label:"Stats",Icon:BarChart3},
  ];

  const titles={catalogue:"Catalogue",essayages:"Essayages",planning:"Planning",resa:"Réservations",stats:"Statistiques"};

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:T.fond,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:T.blanc,padding:"14px 20px 12px",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.vertM}55`,boxShadow:"0 2px 16px rgba(15,62,34,0.06)"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:6}}>
          <span style={{fontWeight:900,fontSize:24,color:T.encre,letterSpacing:-1}}>Plan</span>
          <span style={{fontWeight:900,fontSize:24,color:T.vert,letterSpacing:-1}}>me</span>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.rose,display:"inline-block",marginLeft:2,marginBottom:4,flexShrink:0}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:T.vertL,borderRadius:10,padding:"5px 12px"}}>
            <span style={{fontSize:12,fontWeight:800,color:T.vert}}>{titles[tab]}</span>
          </div>
          <div style={{width:36,height:36,borderRadius:12,background:T.vertL,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <TrendingUp size={16} color={T.vert}/>
          </div>
        </div>
      </div>

      <div style={{paddingTop:16}}>
        {tab==="catalogue"&&<Catalogue cat={cat} setCat={setCat}/>}
        {tab==="essayages"&&<Essayages ess={ess} setEss={setEss} cat={cat} cli={cli} setCli={setCli}/>}
        {tab==="planning"&&<Planning res={res} cat={cat} cli={cli}/>}
        {tab==="resa"&&<Reservations res={res} setRes={setRes} cat={cat} cli={cli} setCli={setCli}/>}
        {tab==="stats"&&<Stats res={res} cat={cat} cli={cli}/>}
      </div>

      {/* Tab bar avec indicateur animé */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.blanc,borderTop:"none",display:"flex",zIndex:200,boxShadow:"0 -4px 24px rgba(15,30,19,0.12)"}}>
        {TABS.map(({id,label,Icon})=>{
          const active=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:active?T.vert:T.gris2,fontFamily:"inherit",transition:"color .2s",position:"relative"}}>
              {active&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:3,borderRadius:"0 0 3px 3px",background:T.vert,transition:"all .2s"}}/>}
              <div style={{width:34,height:34,borderRadius:10,background:active?T.vertL:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>
                <Icon size={18}/>
              </div>
              <span style={{fontSize:10,fontWeight:active?800:600,transition:"font-weight .2s"}}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
