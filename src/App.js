import React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Search, Calendar, BarChart3, Plus, X, ChevronLeft, ChevronRight,
  Package, Sparkles, Check, AlertCircle, TrendingUp, ArrowRight,
  Clock, Star, Scissors, Phone, ChevronRight as Arrow
} from "lucide-react";

// ─── DESIGN TOKENS ─────────────────────────────────────────
const T = {
  vert:     "#3A7D57",
  vert2:    "#2E6347",
  vertL:    "#EDF7F1",
  vertM:    "#C8DEC8",
  rose:     "#C48AAE",
  roseL:    "#F5ECF3",
  encre:    "#1A2E1F",
  gris1:    "#4A6B52",
  gris2:    "#7A9C82",
  gris3:    "#B8D4BC",
  fond:     "#F4FAF6",
  blanc:    "#FFFFFF",
  rouge:    "#E05050",
};

// ─── DONNÉES ────────────────────────────────────────────────
const CATS = ["Karakou","Caftan","Robe de soirée","Ensemble"];
const NOMS_R = ["Lila","Amira","Yasmine","Inès","Sarah","Nour","Kenza","Lina","Sofia","Maya","Rim","Imane"];
const SHADES = [T.vert,"#5BA37A",T.rose,"#A87098","#6AAB85","#C8A0D0","#4A9068","#D4A0C0"];
const TODAY_STR = "2026-07-11";
const TODAY = new Date(TODAY_STR);
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmt = d => d instanceof Date ? d.toISOString().slice(0,10) : d;

const CAT_INIT = Array.from({length:16},(_,i)=>({
  id:`r${i+1}`, nom:`${CATS[i%4]} ${NOMS_R[i%NOMS_R.length]}`,
  categorie:CATS[i%4], taille:["36","38","40","42","44"][i%5],
  prix:80+(i%6)*20, caution:200+(i%4)*100, shade:SHADES[i%8],
}));

const CLI_INIT = [
  {id:"c1",nom:"Yasmine B.",tel:"06 12 34 56 78"},
  {id:"c2",nom:"Amira K.",tel:"06 23 45 67 89"},
  {id:"c3",nom:"Lina D.",tel:"07 34 56 78 90"},
  {id:"c4",nom:"Sofia T.",tel:"06 45 67 89 01"},
  {id:"c5",nom:"Nour H.",tel:"07 56 78 90 12"},
];

const RES_INIT = [
  {id:"v1",cid:"c1",rid:"r1",debut:fmt(addDays(TODAY,-4)),fin:fmt(addDays(TODAY,-2)),prix:120,caution:300,acompte:60,statut:"terminee",note:""},
  {id:"v2",cid:"c2",rid:"r3",debut:fmt(addDays(TODAY,3)),fin:fmt(addDays(TODAY,5)),prix:140,caution:400,acompte:70,statut:"confirmee",note:"Suite à l'essayage"},
  {id:"v3",cid:"c3",rid:"r5",debut:fmt(addDays(TODAY,8)),fin:fmt(addDays(TODAY,10)),prix:100,caution:300,acompte:0,statut:"confirmee",note:""},
  {id:"v4",cid:"c4",rid:"r2",debut:fmt(addDays(TODAY,-1)),fin:fmt(addDays(TODAY,2)),prix:160,caution:400,acompte:80,statut:"enCours",note:""},
];

const ESS_INIT = [
  {id:"e1",cid:"c1",rid:"r1",date:fmt(addDays(TODAY,-2)),heure:"14:00",statut:"passe",note:""},
  {id:"e2",cid:"c2",rid:"r3",date:TODAY_STR,heure:"10:30",statut:"aVenir",note:"Voir aussi T.38"},
  {id:"e3",cid:"c3",rid:"r5",date:fmt(addDays(TODAY,4)),heure:"15:00",statut:"aVenir",note:""},
];

// ─── UTILS ──────────────────────────────────────────────────
const fmtDate = (s,opts={day:"numeric",month:"short"}) => new Date(s).toLocaleDateString("fr-FR",opts);
const fmtDateLong = (s) => new Date(s).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
const getInitial = s => s?.[0]?.toUpperCase()||"?";

// ─── ATOMS ──────────────────────────────────────────────────
const Avatar = ({color,nom,size=40}) => (
  <div style={{width:size,height:size,borderRadius:size*.28,background:color||T.vert,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:size*.38,flexShrink:0}}>
    {getInitial(nom)}
  </div>
);

const Badge = ({label,color=T.vert,bg}) => (
  <span style={{background:bg||(color+"18"),color,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:100,whiteSpace:"nowrap"}}>
    {label}
  </span>
);

const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{whiteSpace:"nowrap",padding:"7px 16px",borderRadius:100,border:"none",background:active?T.vert:T.vertL,color:active?"#fff":T.vert,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
    {label}
  </button>
);

const Input = ({label,...props}) => (
  <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{label}</div>}
    <input {...props} style={{width:"100%",background:T.fond,border:`1.5px solid ${T.vertM}`,borderRadius:12,padding:"12px 14px",fontSize:15,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box",...props.style}}/>
  </div>
);

const Select = ({label,children,...props}) => (
  <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{label}</div>}
    <select {...props} style={{width:"100%",background:T.fond,border:`1.5px solid ${T.vertM}`,borderRadius:12,padding:"12px 14px",fontSize:15,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}>
      {children}
    </select>
  </div>
);

const BtnPrimary = ({children,onClick,style={}}) => (
  <button onClick={onClick} style={{width:"100%",background:`linear-gradient(135deg,${T.vert},${T.vert2})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${T.vert}44`,...style}}>
    {children}
  </button>
);

const Card = ({children,onClick,style={}}) => (
  <div onClick={onClick} style={{background:T.blanc,borderRadius:18,border:`1.5px solid ${T.vertM}`,padding:"14px 16px",marginBottom:10,boxShadow:"0 2px 12px rgba(58,125,87,0.07)",cursor:onClick?"pointer":"default",...style}}>
    {children}
  </div>
);

// ─── MODAL ──────────────────────────────────────────────────
const Modal = ({open,onClose,title,children}) => {
  useEffect(()=>{
    document.body.style.overflow = open?"hidden":"";
    return ()=>{document.body.style.overflow=""};
  },[open]);
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,46,31,0.45)",zIndex:999,display:"flex",alignItems:"flex-end",backdropFilter:"blur(2px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",background:T.blanc,borderRadius:"24px 24px 0 0",padding:"8px 0 0",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(26,46,31,0.15)"}}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:100,background:T.gris3,margin:"0 auto 16px"}}/>
        <div style={{padding:"0 18px 36px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <span style={{fontWeight:900,fontSize:18,color:T.encre}}>{title}</span>
            <button onClick={onClose} style={{background:T.fond,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.gris2}}>
              <X size={16}/>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── CALENDRIER ─────────────────────────────────────────────
const Calendrier = ({mois,events=[],selected,onSelect}) => {
  const y=mois.getFullYear(), m=mois.getMonth();
  const first=(new Date(y,m,1).getDay()+6)%7;
  const days=new Date(y,m+1,0).getDate();
  const jours=["L","M","M","J","V","S","D"];
  const hasEvent = d => {
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
          const d=i+1;
          const ds=fmt(new Date(y,m,d));
          const isSel=ds===selected;
          const isToday=ds===TODAY_STR;
          const hasEv=hasEvent(d);
          return (
            <div key={d} onClick={()=>onSelect(ds)} style={{aspectRatio:1,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:isSel?T.vert:isToday?T.vertL:"transparent",border:isToday&&!isSel?`1.5px solid ${T.vert}`:"none",transition:"all .1s"}}>
              <span style={{fontSize:12,fontWeight:isSel||isToday?800:600,color:isSel?"#fff":isToday?T.vert:T.encre}}>{d}</span>
              {hasEv&&<div style={{width:4,height:4,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.6)":T.rose,marginTop:1}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NavMois = ({mois,setMois}) => {
  const nom = mois.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <button onClick={()=>setMois(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{background:T.vertL,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.vert}}>
        <ChevronLeft size={16}/>
      </button>
      <span style={{fontWeight:800,fontSize:14,color:T.encre,textTransform:"capitalize"}}>{nom}</span>
      <button onClick={()=>setMois(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{background:T.vertL,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.vert}}>
        <ChevronRight size={16}/>
      </button>
    </div>
  );
};

// ─── CATALOGUE ──────────────────────────────────────────────
const Catalogue = ({cat,setCat}) => {
  const [q,setQ]=useState(""),catF,setCatF]=useState("Toutes");
  const [modal,setModal]=useState(false);
  const [detail,setDetail]=useState(null);
  const [form,setForm]=useState({nom:"",categorie:CATS[0],taille:"38",prix:"",caution:""});

  const filtered=useMemo(()=>cat.filter(r=>(catF==="Toutes"||r.categorie===catF)&&r.nom.toLowerCase().includes(q.toLowerCase())),[cat,catF,q]);

  const add=()=>{
    if(!form.nom||!form.prix)return;
    setCat(p=>[...p,{id:`r${Date.now()}`,shade:SHADES[p.length%8],...form,prix:+form.prix,caution:+form.caution}]);
    setModal(false);setForm({nom:"",categorie:CATS[0],taille:"38",prix:"",caution:""});
  };

  const statut_col={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};

  return (
    <div>
      {/* Search + filtres */}
      <div style={{padding:"0 16px 0"}}>
        <div style={{position:"relative",marginBottom:10}}>
          <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.gris2,pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une pièce..." style={{width:"100%",background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"11px 14px 11px 38px",fontSize:14,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12,scrollbarWidth:"none"}}>
          {["Toutes",...CATS].map(c=><Pill key={c} label={c} active={catF===c} onClick={()=>setCatF(c)}/>)}
        </div>
        <div style={{fontWeight:700,fontSize:12,color:T.gris2,marginBottom:10}}>{filtered.length} pièce{filtered.length>1?"s":""}</div>
      </div>

      {/* Grille */}
      <div style={{padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {filtered.map(r=>(
          <div key={r.id} onClick={()=>setDetail(r)} style={{background:T.blanc,borderRadius:18,border:`1.5px solid ${T.vertM}`,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 10px rgba(58,125,87,0.07)"}}>
            {/* Photo placeholder */}
            <div style={{height:100,background:`linear-gradient(135deg,${r.shade}22,${r.shade}44)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
              <div style={{fontSize:24,marginBottom:4}}>📷</div>
              <div style={{fontSize:10,fontWeight:700,color:r.shade}}>Photo</div>
              <div style={{position:"absolute",top:8,right:8,background:T.blanc,borderRadius:8,padding:"2px 7px",fontSize:10,fontWeight:800,color:T.vert}}>{r.prix}€</div>
            </div>
            <div style={{padding:"10px 11px 12px"}}>
              <div style={{fontWeight:800,fontSize:12,color:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.nom}</div>
              <div style={{fontSize:10,color:T.gris2,marginTop:2}}>{r.categorie} · T.{r.taille}</div>
              <div style={{fontSize:10,color:T.gris2,marginTop:1}}>Caution {r.caution}€</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={()=>setModal(true)} style={{position:"fixed",bottom:90,right:20,width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${T.vert},${T.vert2})`,color:"#fff",border:"none",fontSize:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${T.vert}55`,zIndex:150}}>
        <Plus size={24}/>
      </button>

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
        {/* Photo placeholder */}
        <div style={{border:`2px dashed ${T.vertM}`,borderRadius:14,padding:"20px",textAlign:"center",marginBottom:16,background:T.fond}}>
          <div style={{fontSize:24,marginBottom:6}}>📷</div>
          <div style={{fontSize:12,fontWeight:700,color:T.vert}}>Ajouter une photo</div>
          <div style={{fontSize:11,color:T.gris2,marginTop:2}}>Disponible dans la version complète</div>
        </div>
        <BtnPrimary onClick={add}>Ajouter au catalogue ✓</BtnPrimary>
      </Modal>

      {/* Modal détail */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?.nom||""}>
        {detail&&(
          <>
            <div style={{height:160,borderRadius:16,background:`linear-gradient(135deg,${detail.shade}22,${detail.shade}55)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <div style={{fontSize:13,fontWeight:700,color:detail.shade}}>Photo de la pièce</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[["Taille",detail.taille,T.encre],["Prix",`${detail.prix}€`,T.vert],["Caution",`${detail.caution}€`,T.encre]].map(([l,v,c])=>(
                <div key={l} style={{background:T.fond,borderRadius:12,padding:"10px 12px",border:`1.5px solid ${T.vertM}`}}>
                  <div style={{fontSize:9,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{fontWeight:900,fontSize:18,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.vertL,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <Check size={16} color={T.vert}/>
              <span style={{fontSize:12,fontWeight:700,color:T.vert}}>Disponible à la location</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ─── ESSAYAGES ──────────────────────────────────────────────
const Essayages = ({ess,setEss,cat,cli,setCli}) => {
  const [mois,setMois]=useState(new Date(2026,6,1));
  const [sel,setSel]=useState(TODAY_STR);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({nom:"",tel:"",rid:"",heure:"10:00",note:""});

  const dayEss=ess.filter(e=>e.date===sel);
  const calEvts=ess.map(e=>({date:e.date,fin:e.date}));

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
        <Card style={{marginBottom:12}}>
          <NavMois mois={mois} setMois={setMois}/>
          <Calendrier mois={mois} events={calEvts.map(e=>({debut:e.date,fin:e.date}))} selected={sel} onSelect={setSel}/>
        </Card>

        {/* Note distinction */}
        <div style={{background:T.vertL,border:`1.5px solid ${T.vert}`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
          <Sparkles size={15} color={T.vert} style={{flexShrink:0,marginTop:1}}/>
          <div style={{fontSize:12,color:T.vert,fontWeight:700,lineHeight:1.4}}>Calendrier des essayages — séparé du planning des locations</div>
        </div>

        <div style={{fontWeight:800,fontSize:13,color:T.encre,marginBottom:10,textTransform:"capitalize"}}>{fmtDateLong(sel)}</div>

        {dayEss.length===0
          ?<Card style={{textAlign:"center",padding:"24px 16px"}}><div style={{fontSize:28,marginBottom:8}}>🗓️</div><div style={{color:T.gris2,fontSize:13,fontWeight:600}}>Aucun essayage ce jour</div></Card>
          :dayEss.map(e=>{
            const r=cat.find(x=>x.id===e.rid);
            const c=cli.find(x=>x.id===e.cid);
            return (
              <Card key={e.id}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Avatar color={r?.shade} nom={c?.nom} size={44}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:T.encre}}>{c?.nom}</div>
                    <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{r?.nom} · {e.heure}</div>
                    {e.note&&<div style={{fontSize:11,color:T.rose,marginTop:4,fontStyle:"italic"}}>{e.note}</div>}
                  </div>
                  <Badge label={e.statut==="passe"?"Passé":"À venir"} color={e.statut==="passe"?T.gris2:T.vert}/>
                </div>
              </Card>
            );
          })
        }
      </div>

      <button onClick={()=>setModal(true)} style={{position:"fixed",bottom:90,right:20,width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${T.vert},${T.vert2})`,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${T.vert}55`,zIndex:150}}>
        <Plus size={24}/>
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title={`Essayage — ${fmtDate(sel)}`}>
        <Input label="Cliente" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
        <Input label="Téléphone" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/>
        <Select label="Pièce à essayer" value={form.rid} onChange={e=>setForm(p=>({...p,rid:e.target.value}))}>
          <option value="">Choisir une pièce...</option>
          {cat.map(r=><option key={r.id} value={r.id}>{r.nom} · T.{r.taille}</option>)}
        </Select>
        <Input label="Heure" type="time" value={form.heure} onChange={e=>setForm(p=>({...p,heure:e.target.value}))}/>
        <Input label="Note" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: voir aussi T.38"/>
        <BtnPrimary onClick={add}>Enregistrer l'essayage ✓</BtnPrimary>
      </Modal>
    </div>
  );
};

// ─── PLANNING ───────────────────────────────────────────────
const Planning = ({res,cat,cli}) => {
  const [mois,setMois]=useState(new Date(2026,6,1));
  const [sel,setSel]=useState(TODAY_STR);

  const dayRes=res.filter(r=>r.debut<=sel&&r.fin>=sel);
  const calEvts=res.map(r=>({debut:r.debut,fin:r.fin}));

  return (
    <div style={{padding:"0 16px"}}>
      <Card style={{marginBottom:12}}>
        <NavMois mois={mois} setMois={setMois}/>
        <Calendrier mois={mois} events={calEvts} selected={sel} onSelect={setSel}/>
      </Card>

      <div style={{background:T.vertL,border:`1.5px solid ${T.vert}`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10}}>
        <Calendar size={15} color={T.vert} style={{flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:T.vert,fontWeight:700}}>Planning des réservations — distinct du planning des essayages</div>
      </div>

      <div style={{fontWeight:800,fontSize:13,color:T.encre,marginBottom:10,textTransform:"capitalize"}}>{fmtDateLong(sel)}</div>

      {dayRes.length===0
        ?<Card style={{textAlign:"center",padding:"24px 16px"}}><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{color:T.gris2,fontSize:13,fontWeight:600}}>Toutes les pièces sont disponibles</div></Card>
        :dayRes.map(r=>{
          const robe=cat.find(x=>x.id===r.rid);
          const c=cli.find(x=>x.id===r.cid);
          const statCol={confirmee:T.vert,enCours:T.rose,terminee:T.gris2};
          const statLbl={confirmee:"Confirmée",enCours:"En cours",terminee:"Terminée"};
          return (
            <Card key={r.id}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{robe?.nom}</div>
                </div>
                <Badge label={statLbl[r.statut]} color={statCol[r.statut]}/>
              </div>
              <div style={{background:"#FFF0EC",border:`1.5px solid #F5C0B0`,borderRadius:12,padding:"9px 12px",display:"flex",gap:9,alignItems:"center"}}>
                <AlertCircle size={14} color="#C05030" style={{flexShrink:0}}/>
                <div style={{fontSize:11,color:"#8B3020",fontWeight:600}}>
                  {robe?.nom} <strong>grisée automatiquement</strong> du {fmtDate(r.debut)} au {fmtDate(r.fin)} — double réservation impossible
                </div>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
};

// ─── RÉSERVATIONS ───────────────────────────────────────────
const Reservations = ({res,setRes,cat,cli,setCli}) => {
  const [modal,setModal]=useState(false);
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
        <div style={{position:"relative",marginBottom:10}}>
          <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.gris2,pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une cliente..." style={{width:"100%",background:T.blanc,border:`1.5px solid ${T.vertM}`,borderRadius:14,padding:"11px 14px 11px 38px",fontSize:14,fontFamily:"inherit",fontWeight:600,color:T.encre,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{fontWeight:700,fontSize:12,color:T.gris2,marginBottom:10}}>{filtered.length} réservation{filtered.length>1?"s":""}</div>
      </div>

      <div style={{padding:"0 16px"}}>
        {filtered.map(r=>{
          const robe=cat.find(x=>x.id===r.rid);
          const c=cli.find(x=>x.id===r.cid);
          const reste=r.prix-r.acompte;
          return (
            <Card key={r.id}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar color={robe?.shade} nom={c?.nom} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:T.encre}}>{c?.nom}</div>
                  <div style={{fontSize:12,color:T.gris2,marginTop:2}}>{robe?.nom}</div>
                </div>
                <Badge label={statLbl[r.statut]||r.statut} color={statCol[r.statut]||T.gris2}/>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:8,fontSize:12,color:T.gris2,fontWeight:600}}>
                <Clock size={13} style={{flexShrink:0}}/>
                {fmtDate(r.debut)} → {fmtDate(r.fin)}
              </div>
              {r.prix>0&&(
                <div style={{background:T.fond,borderRadius:12,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:T.gris2,fontWeight:600}}>Acompte {r.acompte}€ · Reste à payer</span>
                  <span style={{fontWeight:900,fontSize:15,color:reste>0?T.vert:T.gris2}}>{reste}€</span>
                </div>
              )}
              {r.note&&<div style={{fontSize:11,color:T.rose,marginTop:8,fontStyle:"italic",fontWeight:600}}>{r.note}</div>}
            </Card>
          );
        })}
      </div>

      <button onClick={()=>setModal(true)} style={{position:"fixed",bottom:90,right:20,width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${T.vert},${T.vert2})`,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${T.vert}55`,zIndex:150}}>
        <Plus size={24}/>
      </button>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nouvelle réservation">
        <div style={{background:T.vertL,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.vert,fontWeight:700,display:"flex",gap:8,alignItems:"center"}}>
          <Sparkles size={14}/>Suite à un essayage ? La cliente sera pré-remplie ↓
        </div>
        <Input label="Cliente" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} placeholder="Prénom Nom"/>
        <Input label="Téléphone" value={form.tel} onChange={e=>setForm(p=>({...p,tel:e.target.value}))} placeholder="06 XX XX XX XX"/>
        <Select label="Pièce choisie" value={form.rid} onChange={e=>{const r=cat.find(x=>x.id===e.target.value);setForm(p=>({...p,rid:e.target.value,prix:r?.prix?.toString()||"",caution:r?.caution?.toString()||""}));}}>
          <option value="">Choisir une pièce...</option>
          {cat.map(r=><option key={r.id} value={r.id}>{r.nom} · T.{r.taille}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Date début" type="date" value={form.debut} onChange={e=>setForm(p=>({...p,debut:e.target.value}))}/>
          <Input label="Date fin" type="date" value={form.fin} onChange={e=>setForm(p=>({...p,fin:e.target.value}))}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Prix (€)" type="number" value={form.prix} onChange={e=>setForm(p=>({...p,prix:e.target.value}))} placeholder={rSelected?.prix?.toString()||""}/>
          <Input label="Caution (€)" type="number" value={form.caution} onChange={e=>setForm(p=>({...p,caution:e.target.value}))} placeholder={rSelected?.caution?.toString()||""}/>
        </div>
        <Input label="Acompte versé (€)" type="number" value={form.acompte} onChange={e=>setForm(p=>({...p,acompte:e.target.value}))} placeholder="0"/>
        {+form.prix>0&&(
          <div style={{background:T.roseL,borderRadius:14,padding:"12px 14px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.gris2,marginBottom:4}}><span>Prix dû</span><span>{form.prix}€</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.gris2,marginBottom:8}}><span>Acompte</span><span>−{form.acompte||0}€</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:16,color:T.vert,borderTop:`1.5px solid ${T.vertM}`,paddingTop:8}}><span>Reste à payer</span><span>{reste}€</span></div>
          </div>
        )}
        <Input label="Note" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="ex: suite à l'essayage du 11 juil."/>
        <BtnPrimary onClick={add}>Confirmer la réservation ✓</BtnPrimary>
      </Modal>
    </div>
  );
};

// ─── STATS ──────────────────────────────────────────────────
const Stats = ({res,cat}) => {
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

  return (
    <div style={{padding:"0 16px"}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <Card style={{margin:0}}>
          <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Chiffre d'affaires</div>
          <div style={{fontWeight:900,fontSize:26,color:T.vert,lineHeight:1}}>{caTotal.toLocaleString("fr-FR")}€</div>
          <div style={{fontSize:11,color:T.gris2,marginTop:4}}>{res.length} réservations</div>
        </Card>
        <Card style={{margin:0}}>
          <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Panier moyen</div>
          <div style={{fontWeight:900,fontSize:26,color:T.encre,lineHeight:1}}>{pm}€</div>
          <div style={{fontSize:11,color:T.gris2,marginTop:4}}>par réservation</div>
        </Card>
      </div>
      <Card style={{marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,color:T.gris2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Cautions en cours</div>
        <div style={{fontWeight:900,fontSize:26,color:T.rose,lineHeight:1}}>{cautions.toLocaleString("fr-FR")}€</div>
        <div style={{fontSize:11,color:T.gris2,marginTop:4}}>à restituer sur réservations actives</div>
      </Card>

      {/* Graphique */}
      <Card>
        <div style={{fontWeight:800,fontSize:14,color:T.encre,marginBottom:16}}>CA par mois</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
          {parMois.map(([k,v],i)=>{
            const isLast=i===parMois.length-1;
            return (
              <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%",justifyContent:"flex-end"}}>
                <div style={{fontSize:8,fontWeight:700,color:isLast?T.vert:T.gris2}}>{v>0?`${Math.round(v/100)/10}k`:""}</div>
                <div style={{width:"100%",borderRadius:"6px 6px 0 0",background:isLast?`linear-gradient(180deg,${T.vert},${T.vert2})`:T.vertM,height:`${Math.max(Math.round((v/maxCA)*100),4)}%`,transition:"height .3s"}}/>
                <div style={{fontSize:9,fontWeight:700,color:isLast?T.vert:T.gris2}}>{MN[k]||k}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top robes */}
      <Card>
        <div style={{fontWeight:800,fontSize:14,color:T.encre,marginBottom:14}}>Top pièces</div>
        {parRobe.map(([rid,ca],i)=>{
          const r=cat.find(x=>x.id===rid);
          return (
            <div key={rid} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:i===0?T.rose:T.vertL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i===0?T.blanc:T.vert}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:800,color:T.encre,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r?.nom||rid}</div>
                <div style={{height:4,background:T.vertL,borderRadius:100,marginTop:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((ca/parRobe[0][1])*100)}%`,background:`linear-gradient(90deg,${T.vert},${T.vertM})`,borderRadius:100,transition:"width .3s"}}/>
                </div>
              </div>
              <div style={{fontSize:13,fontWeight:900,color:T.vert,flexShrink:0}}>{ca}€</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ─── APP ────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("catalogue");
  const [cat,setCat]=useState(CAT_INIT);
  const [cli,setCli]=useState(CLI_INIT);
  const [res,setRes]=useState(RES_INIT);
  const [ess,setEss]=useState(ESS_INIT);

  const TABS=[
    {id:"catalogue",label:"Catalogue",Icon:Package},
    {id:"essayages",label:"Essayages",Icon:Sparkles},
    {id:"planning",label:"Planning",Icon:Calendar},
    {id:"resa",label:"Résa",Icon:Check},
    {id:"stats",label:"Stats",Icon:BarChart3},
  ];

  // Titre de la page active
  const titles={catalogue:"Catalogue",essayages:"Essayages",planning:"Planning",resa:"Réservations",stats:"Statistiques"};

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:T.fond,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:T.blanc,borderBottom:`1.5px solid ${T.vertM}`,padding:"14px 18px 12px",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontWeight:900,fontSize:20,color:T.encre,letterSpacing:-0.5}}>
            Plan<span style={{color:T.vert}}>me</span>
          </div>
          <div style={{fontSize:11,color:T.gris2,fontWeight:600,marginTop:1}}>{titles[tab]}</div>
        </div>
        <div style={{width:38,height:38,borderRadius:12,background:T.vertL,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <TrendingUp size={18} color={T.vert}/>
        </div>
      </div>

      {/* Contenu avec padding top */}
      <div style={{paddingTop:16}}>
        {tab==="catalogue"&&<Catalogue cat={cat} setCat={setCat}/>}
        {tab==="essayages"&&<Essayages ess={ess} setEss={setEss} cat={cat} cli={cli} setCli={setCli}/>}
        {tab==="planning"&&<Planning res={res} cat={cat} cli={cli}/>}
        {tab==="resa"&&<Reservations res={res} setRes={setRes} cat={cat} cli={cli} setCli={setCli}/>}
        {tab==="stats"&&<Stats res={res} cat={cat}/>}
      </div>

      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.blanc,borderTop:`1.5px solid ${T.vertM}`,display:"flex",zIndex:200,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(({id,label,Icon})=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:tab===id?T.vert:T.gris2,transition:"color .15s",fontFamily:"inherit"}}>
            <div style={{width:32,height:32,borderRadius:10,background:tab===id?T.vertL:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              <Icon size={18}/>
            </div>
            <span style={{fontSize:10,fontWeight:tab===id?800:600}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
