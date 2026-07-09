import React from "react";
import { useState, useMemo } from "react";
import {
  Search, Calendar, BarChart3, Plus, X, ChevronLeft, ChevronRight,
  Package, Phone, Sparkles, Bell, Palette,
} from "lucide-react";

// ---------- Thèmes (couleur au choix de la prestataire) ----------
// accent = couleur principale vive · flash = couleur complémentaire pour CTA/highlights
// fond reste clair et neutre pour ne jamais nuire à la lisibilité

const THEMES = {
  rose: { nom: "Corail", accent: "#FF6B5B", flash: "#FFB23E", accentSoft: "#FFE0D6", encre: "#241A22", taupe: "#8C7A82", bordure: "#F0E4E6", fond: "#FFFBF8", lignePale: "#F7EEEA", surface: "#FFFFFF" },
  lavande: { nom: "Violet électrique", accent: "#8B5CF6", flash: "#22D3EE", accentSoft: "#EDE3FF", encre: "#211B33", taupe: "#857E99", bordure: "#E9E2FA", fond: "#FBF9FF", lignePale: "#F2EDFC", surface: "#FFFFFF" },
  emeraude: { nom: "Émeraude vif", accent: "#10B981", flash: "#FBBF24", accentSoft: "#D4F5E5", encre: "#152A22", taupe: "#6E8A7C", bordure: "#DCF1E6", fond: "#F6FCF9", lignePale: "#E9F8EF", surface: "#FFFFFF" },
  ocre: { nom: "Mangue", accent: "#F59E0B", flash: "#EC4899", accentSoft: "#FEEBC8", encre: "#2E2210", taupe: "#9C8662", bordure: "#FBE8C2", fond: "#FFFAF0", lignePale: "#FCF1DA", surface: "#FFFFFF" },
};

// CATEGORIES est maintenant un state dans App (libre, personnalisable par la prestataire)
// Valeurs initiales de démo :
const CATEGORIES_DEFAUT = ["Karakou", "Caftan", "Robe de soirée", "Ensemble"];

const STATUTS_LOC = {
  confirmee: { label: "Confirmée" },
  enCours: { label: "En cours" },
  terminee: { label: "Terminée" },
};

const STATUTS_ESSAYAGE = {
  aVenir: { label: "À venir" },
  passe: { label: "Passé" },
};

// ---------- Données de démo ----------

function genCatalogue() {
  const noms = [
    "Lila", "Amira", "Yasmine", "Inès", "Sarah", "Nour", "Kenza", "Lina",
    "Sofia", "Maya", "Rim", "Imane", "Salma", "Asma", "Dounia", "Houda",
    "Meriem", "Aya", "Sabrina", "Feriel", "Wissal", "Chahd", "Bahia", "Soraya",
];
  const palette6 = ["a", "b", "c", "d", "e", "f"];
  const items = [];
  for (let i = 0; i < 44; i++) {
    const nom = noms[i % noms.length] + (i >= noms.length ? ` II` : "");
    const cat = CATEGORIES_DEFAUT[i % CATEGORIES_DEFAUT.length];
    const prix = 80 + (i % 6) * 20;
    const caution = 200 + (i % 4) * 100;
    items.push({
      id: `r${i + 1}`,
      nom: `${cat} ${nom}`,
      categorie: cat,
      taille: ["36", "38", "40", "42", "44"][i % 5],
      prix,
      caution,
      shade: palette6[i % palette6.length],
      etat: i % 9 === 0 ? "nettoyage" : "disponible",
    });
  }
  return items;
}

function genClientes() {
  const data = [
    ["Yasmine B.", "06 12 34 56 78"], ["Amira K.", "06 23 45 67 89"], ["Lina D.", "07 34 56 78 90"],
    ["Sofia T.", "06 45 67 89 01"], ["Nour H.", "07 56 78 90 12"], ["Maya R.", "06 67 89 01 23"],
    ["Rim S.", "07 78 90 12 34"], ["Imane Z.", "06 89 01 23 45"], ["Asma L.", "07 90 12 34 56"],
    ["Houda M.", "06 01 23 45 67"], ["Aya F.", "07 12 34 56 78"], ["Salma N.", "06 13 24 35 46"],
];
  return data.map(([nom, tel], i) => ({ id: `cl${i + 1}`, nom, telephone: tel }));
}

function genEssayages(catalogue, clientes) {
  const today = new Date(2026, 5, 29);
  const out = [];
  for (let i = 0; i < 18; i++) {
    const robe = catalogue[(i * 5 + 1) % catalogue.length];
    const cliente = clientes[i % clientes.length];
    const offset = Math.floor(i * 2.1) - 6;
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    out.push({
      id: `ess${i + 1}`,
      clienteId: cliente.id,
      robeId: robe.id,
      date: d.toISOString().slice(0, 10),
      heure: ["10:00", "11:30", "14:00", "15:30", "17:00"][i % 5],
      statut: offset < 0 ? "passe" : "aVenir",
      note: i % 4 === 0 ? "Souhaite voir aussi en taille 38" : "",
    });
  }
  return out;
}

function genReservations(catalogue, clientes) {
  const today = new Date(2026, 5, 29);
  const out = [];
  // Volume par mois (janvier à juin 2026) — variable pour un graphique réaliste
  const volumeParMois = [9, 12, 15, 11, 18, 14];
  let idx = 0;
  volumeParMois.forEach((volume, moisIndex) => {
    for (let j = 0; j < volume; j++) {
      const robe = catalogue[(idx * 3 + 2) % catalogue.length];
      const cliente = clientes[idx % clientes.length];
      const jour = 1 + Math.floor((j / volume) * 27);
      const start = new Date(2026, moisIndex, jour);
      const end = new Date(start);
      end.setDate(end.getDate() + 1 + (idx % 3));
      const statutKey = start < today ? "terminee" : start.toDateString() === today.toDateString() ? "enCours" : "confirmee";
      out.push({
        id: `res${idx + 1}`,
        clienteId: cliente.id,
        robeId: robe.id,
        debut: start.toISOString().slice(0, 10),
        fin: end.toISOString().slice(0, 10),
        prixModifie: idx % 7 === 0 ? robe.prix - 10 : null,
        acompte: idx % 3 === 0 ? Math.round((robe.prix * 0.5) / 5) * 5 : 0,
        commentaire: idx % 5 === 0 ? "Reprise jupe -3cm" : "",
        statut: statutKey,
      });
      idx++;
    }
  });
  // Quelques réservations à venir (juillet-août) pour le planning/réservations
  for (let k = 0; k < 7; k++) {
    const robe = catalogue[(idx * 3 + 2) % catalogue.length];
    const cliente = clientes[idx % clientes.length];
    const start = new Date(today);
    start.setDate(start.getDate() + k * 4 + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 1 + (idx % 3));
    out.push({
      id: `res${idx + 1}`,
      clienteId: cliente.id,
      robeId: robe.id,
      debut: start.toISOString().slice(0, 10),
      fin: end.toISOString().slice(0, 10),
      prixModifie: idx % 7 === 0 ? robe.prix - 10 : null,
      acompte: idx % 3 === 0 ? Math.round((robe.prix * 0.5) / 5) * 5 : 0,
      commentaire: idx % 5 === 0 ? "Reprise jupe -3cm" : "",
      statut: "confirmee",
    });
    idx++;
  }
  return out;
}


const CATALOGUE = genCatalogue();
const CLIENTES = genClientes();
const ESSAYAGES = genEssayages(CATALOGUE, CLIENTES);
const RESERVATIONS = genReservations(CATALOGUE, CLIENTES);

// ---------- Utilitaires ----------

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fmtDateLong(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function eachDay(start, end) {
  const days = [];
  const cur = new Date(start);
  const e = new Date(end);
  while (cur <= e) { days.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
  return days;
}
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
function getCliente(id) { return CLIENTES.find((c) => c.id === id); }
function getRobe(id) { return CATALOGUE.find((r) => r.id === id); }
function shadeToColor(shade, theme) {
  const map = { a: theme.accent, b: theme.flash, c: theme.encre, d: theme.flash, e: theme.taupe, f: theme.accent };
  return map[shade];
}

// ---------- Composants communs ----------

function Logo({ theme }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})` }}
      >
        <span className="font-display text-base font-bold leading-none text-white">P</span>
      </div>
      <div className="leading-tight">
        <div className="font-display text-[18px] font-bold tracking-tight" style={{ color: theme.encre }}>Plan Me</div>
        <div className="text-[10px] uppercase tracking-[0.16em] -mt-0.5 font-semibold" style={{ color: theme.taupe }}>Gestion locations</div>
      </div>
    </div>
  );
}

function TabBar({ active, setActive, theme }) {
  const tabs = [
    { id: "catalogue", label: "Catalogue", icon: Package },
    { id: "essayages", label: "Essayages", icon: Sparkles },
    { id: "planning", label: "Planning", icon: Calendar },
    { id: "reservations", label: "Résa.", icon: Search },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 backdrop-blur border-t flex z-30"
      style={{ background: `${theme.surface}F2`, borderColor: theme.bordure, paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 px-0.5 transition-all"
          >
            <span
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl"
              style={{ color: isActive ? theme.accent : theme.taupe, background: isActive ? theme.accentSoft : "transparent" }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.6 : 1.8} />
            </span>
            <span className="text-[9px] font-bold tracking-tight truncate w-full text-center" style={{ color: isActive ? theme.accent : theme.taupe }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThemeSwitcher({ themeKey, setThemeKey, theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full border"
        style={{ borderColor: theme.bordure, color: theme.accent }}
      >
        <Palette size={17} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-50 rounded-2xl border shadow-lg p-2 w-44"
            style={{ background: theme.fond, borderColor: theme.bordure }}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => { setThemeKey(key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left"
                style={{ background: key === themeKey ? t.accentSoft : "transparent" }}
              >
                <span className="w-5 h-5 rounded-full shrink-0" style={{ background: t.accent }} />
                <span className="text-[12.5px]" style={{ color: t.encre }}>{t.nom}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function shadeInitial(robe) {
  return robe.nom.split(" ")[1]?.[0] || robe.nom[0];
}

function RobeSwatch({ robe, theme, size = "h-28 w-full", textSize = "text-3xl", rounded = "rounded-t-2xl" }) {
  const color = shadeToColor(robe.shade, theme);
  if (robe.photo) {
    return (
      <div className={`${size} ${rounded} shrink-0 overflow-hidden bg-gray-100`}>
        <img src={robe.photo} alt={robe.nom} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${size} ${rounded} flex items-center justify-center relative shrink-0 overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
    >
      <span className={`font-display ${textSize}`} style={{ color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>{shadeInitial(robe)}</span>
    </div>
  );
}

// ---------- Composant champ catégorie libre avec suggestions ----------

function CategorieInput({ value, onChange, categories, theme }) {
  const [open, setOpen] = useState(false);
  const suggestions = categories.filter((c) => c.toLowerCase().includes(value.toLowerCase()) && c !== value);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ex. Karakou, Caftan, Gandoura…"
        className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 text-[14px] outline-none"
        style={{ borderColor: theme.bordure, color: theme.encre }}
      />
      {open && (categories.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white rounded-xl border shadow-lg mt-1 overflow-hidden" style={{ borderColor: theme.bordure }}>
          {value && !categories.includes(value) && (
            <button
              className="w-full text-left px-3.5 py-2.5 text-[13.5px] font-semibold border-b"
              style={{ color: theme.accent, borderColor: theme.lignePale }}
              onMouseDown={() => { onChange(value); setOpen(false); }}
            >
              + Créer "{value}"
            </button>
          )}
          {suggestions.map((c) => (
            <button
              key={c}
              className="w-full text-left px-3.5 py-2.5 text-[13.5px] border-b last:border-0"
              style={{ color: theme.encre, borderColor: theme.lignePale }}
              onMouseDown={() => { onChange(c); setOpen(false); }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Composant champ upload photo ----------

function PhotoInput({ value, onChange, theme }) {
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Photo de la pièce</label>
      <div className="mt-1.5">
        {value ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden border" style={{ borderColor: theme.bordure }}>
            <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 shadow"
            >
              <X size={14} className="text-red-500" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer"
            style={{ borderColor: theme.bordure, background: theme.fond }}>
            <span className="text-[28px] mb-1">📷</span>
            <span className="text-[12.5px] font-semibold" style={{ color: theme.taupe }}>Appuyer pour ajouter une photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
    </div>
  );
}

// ---------- Catalogue ----------

function RobeCard({ robe, onClick, theme }) {
  const indisponible = robe.etat === "nettoyage";
  return (
    <button
      onClick={() => onClick(robe)}
      className="text-left rounded-2xl overflow-hidden bg-white border shadow-sm active:scale-[0.97] transition-transform"
      style={{ borderColor: theme.bordure }}
    >
      <div className="relative">
        <RobeSwatch robe={robe} theme={theme} size="h-32 w-full" textSize="text-4xl" rounded="rounded-none" />
        {indisponible && (
          <div className="absolute top-2 right-2 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: `${theme.encre}E0` }}>
            Nettoyage
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[12px] font-bold text-white" style={{ background: theme.flash }}>
          {robe.prix}€
        </div>
      </div>
      <div className="p-3">
        <div className="font-display text-[14.5px] font-semibold leading-tight truncate" style={{ color: theme.encre }}>{robe.nom}</div>
        <div className="text-[11px] mt-0.5 font-medium" style={{ color: theme.taupe }}>{robe.categorie} · T.{robe.taille}</div>
        <div className="text-[10px] mt-1.5" style={{ color: theme.taupe }}>+ {robe.caution}€ caution</div>
      </div>
    </button>
  );
}

function CatalogueView({ catalogue, onSelectRobe, onAjouter, categories, onAjouterCategorie, theme }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", categorie: "", taille: "38", prix: "", caution: "", photo: null });

  const filtered = useMemo(() => {
    return catalogue.filter((r) => {
      const matchCat = cat === "Toutes" || r.categorie === cat;
      const matchQuery = r.nom.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [query, cat, catalogue]);

  // Catégories dynamiques issues du catalogue actuel
  const catsDisponibles = useMemo(() => [...new Set(catalogue.map((r) => r.categorie).filter(Boolean))], [catalogue]);

  function handleAjouter() {
    if (!form.nom || !form.prix || !form.caution) return;
    if (form.categorie && !categories.includes(form.categorie)) onAjouterCategorie(form.categorie);
    onAjouter({ nom: form.nom, categorie: form.categorie, taille: form.taille, prix: Number(form.prix), caution: Number(form.caution), photo: form.photo });
    setForm({ nom: "", categorie: "", taille: "38", prix: "", caution: "", photo: null });
    setShowForm(false);
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-[22px]" style={{ color: theme.encre }}>Catalogue</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: theme.taupe }}>{catalogue.length} pièces · {filtered.length} affichées</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full p-3 shadow-lg text-white active:scale-95"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})`, boxShadow: `0 6px 16px -4px ${theme.accent}66` }}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.taupe }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une pièce…"
          className="w-full bg-white border rounded-full pl-10 pr-4 py-2.5 text-[14px] outline-none"
          style={{ borderColor: theme.bordure, color: theme.encre }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 scrollbar-none">
        {["Toutes", ...catsDisponibles].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors"
            style={cat === c ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: theme.taupe }}>
          <Package size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-[13.5px]">Aucune pièce ne correspond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => <RobeCard key={r.id} robe={r} onClick={onSelectRobe} theme={theme} />)}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowForm(false)}>
          <div className="w-full rounded-t-3xl p-5 pb-8 max-h-[92vh] overflow-y-auto" style={{ background: theme.fond }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-[18px] font-bold" style={{ color: theme.encre }}>Ajouter une pièce</h2>
              <button onClick={() => setShowForm(false)} style={{ color: theme.taupe }}><X size={20} /></button>
            </div>

            <PhotoInput value={form.photo} onChange={(p) => setForm((f) => ({ ...f, photo: p }))} theme={theme} />

            <div className="mt-3.5 space-y-3.5">
              {[
                { label: "Nom de la pièce", key: "nom", placeholder: "Ex. Karakou Yasmine", type: "text" },
                { label: "Prix de location (€)", key: "prix", placeholder: "Ex. 120", type: "number" },
                { label: "Caution (€)", key: "caution", placeholder: "Ex. 300", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 text-[14px] outline-none"
                    style={{ borderColor: theme.bordure, color: theme.encre }}
                  />
                </div>
              ))}

              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Catégorie (libre)</label>
                <CategorieInput
                  value={form.categorie}
                  onChange={(v) => setForm((f) => ({ ...f, categorie: v }))}
                  categories={[...new Set([...categories, ...catsDisponibles])]}
                  theme={theme}
                />
                <p className="text-[11px] mt-1" style={{ color: theme.taupe }}>Saisissez votre propre catégorie ou choisissez parmi les existantes.</p>
              </div>

              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Taille</label>
                <div className="flex gap-2 mt-1.5">
                  {["34", "36", "38", "40", "42", "44", "46"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, taille: t }))}
                      className="flex-1 py-2 rounded-xl text-[13px] font-bold border"
                      style={form.taille === t ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleAjouter}
              disabled={!form.nom || !form.prix || !form.caution}
              className="w-full mt-5 rounded-2xl py-3.5 font-bold text-[14.5px] text-white active:scale-[0.98] shadow-lg"
              style={{
                background: form.nom && form.prix && form.caution ? `linear-gradient(135deg, ${theme.accent}, ${theme.flash})` : theme.bordure,
                boxShadow: form.nom && form.prix && form.caution ? `0 8px 20px -6px ${theme.accent}80` : "none",
              }}
            >
              Ajouter au catalogue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RobeDetail({ robe, onClose, onModifier, onSupprimer, categories, onAjouterCategorie, theme }) {
  if (!robe) return null;
  const [mode, setMode] = useState("detail");
  const [form, setForm] = useState({ nom: robe.nom, categorie: robe.categorie, taille: robe.taille, prix: String(robe.prix), caution: String(robe.caution), etat: robe.etat, photo: robe.photo || null });
  const resasFutures = RESERVATIONS.filter((r) => r.robeId === robe.id && r.statut !== "terminee");

  function handleModifier() {
    if (form.categorie && !categories.includes(form.categorie)) onAjouterCategorie(form.categorie);
    onModifier({ ...robe, ...form, prix: Number(form.prix), caution: Number(form.caution), photo: form.photo });
    setMode("detail");
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: theme.fond }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={mode === "detail" ? onClose : () => setMode("detail")} className="p-1.5 -ml-1.5" style={{ color: theme.encre }}>
          <ChevronLeft size={22} />
        </button>
        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: theme.taupe }}>
          {mode === "detail" ? "Détail pièce" : mode === "modifier" ? "Modifier la pièce" : "Supprimer"}
        </span>
        {mode === "detail" ? (
          <button onClick={() => setMode("modifier")} className="text-[12px] font-bold px-3 py-1 rounded-xl" style={{ background: theme.accentSoft, color: theme.accent }}>
            Modifier
          </button>
        ) : <div className="w-16" />}
      </div>

      <div className="px-4 overflow-y-auto pb-28">
        {mode === "detail" && (
          <>
            <RobeSwatch robe={robe} theme={theme} size="h-48" textSize="text-6xl" rounded="rounded-3xl" />
            <h2 className="font-display text-[22px] font-bold mt-4" style={{ color: theme.encre }}>{robe.nom}</h2>
            <p className="text-[13px] mt-1" style={{ color: theme.taupe }}>{robe.categorie} · Taille {robe.taille}</p>

            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Prix location</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color: theme.accent }}>{robe.prix}€</div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Caution</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color: theme.encre }}>{robe.caution}€</div>
              </div>
            </div>

            <div className="mt-3">
              <span
                className="inline-block text-[11px] px-3 py-1 rounded-full font-semibold"
                style={robe.etat === "nettoyage" ? { background: theme.encre, color: "white" } : { background: theme.accentSoft, color: theme.encre }}
              >
                {robe.etat === "nettoyage" ? "En nettoyage" : "Disponible"}
              </span>
            </div>

            <h3 className="font-display text-[16px] font-semibold mt-6 mb-2" style={{ color: theme.encre }}>Prochaines réservations</h3>
            {resasFutures.length === 0 ? (
              <p className="text-[13px]" style={{ color: theme.taupe }}>Aucune réservation à venir pour cette pièce.</p>
            ) : (
              <div className="space-y-2">
                {resasFutures.map((r) => {
                  const cliente = getCliente(r.clienteId);
                  return (
                    <div key={r.id} className="bg-white rounded-xl p-3 border flex items-center justify-between" style={{ borderColor: theme.bordure }}>
                      <div>
                        <div className="text-[13.5px] font-semibold" style={{ color: theme.encre }}>{cliente.nom}</div>
                        <div className="text-[12px]" style={{ color: theme.taupe }}>{fmtDate(r.debut)} → {fmtDate(r.fin)}</div>
                      </div>
                      <span className="text-[10.5px] px-2.5 py-1 rounded-full font-semibold" style={{ background: theme.accentSoft, color: theme.encre }}>
                        {STATUTS_LOC[r.statut].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setMode("supprimer")}
              className="w-full mt-8 rounded-2xl py-3 font-bold text-[14px] border-2"
              style={{ borderColor: "#EF4444", color: "#EF4444", background: "#FEF2F2" }}
            >
              Supprimer cette pièce du catalogue
            </button>
          </>
        )}

        {mode === "modifier" && (
          <>
            <div className="mt-2 space-y-3.5">
              {[
                { label: "Nom de la pièce", key: "nom", type: "text" },
                { label: "Prix de location (€)", key: "prix", type: "number" },
                { label: "Caution (€)", key: "caution", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 text-[14px] outline-none"
                    style={{ borderColor: theme.bordure, color: theme.encre }}
                  />
                </div>
              ))}

              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Catégorie (libre)</label>
                <CategorieInput
                  value={form.categorie}
                  onChange={(v) => setForm((f) => ({ ...f, categorie: v }))}
                  categories={categories}
                  theme={theme}
                />
              </div>

              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Taille</label>
                <div className="flex gap-2 mt-1.5">
                  {["34", "36", "38", "40", "42", "44", "46"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, taille: t }))}
                      className="flex-1 py-2 rounded-xl text-[13px] font-bold border"
                      style={form.taille === t ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <PhotoInput value={form.photo} onChange={(p) => setForm((f) => ({ ...f, photo: p }))} theme={theme} />

              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Statut</label>
                <div className="flex gap-2 mt-1.5">
                  {[{ val: "disponible", label: "Disponible" }, { val: "nettoyage", label: "En nettoyage" }].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setForm((f) => ({ ...f, etat: val }))}
                      className="flex-1 py-2 rounded-xl text-[12.5px] font-bold border"
                      style={form.etat === val ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleModifier}
              className="w-full mt-6 rounded-2xl py-3.5 font-bold text-[14.5px] text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})` }}
            >
              Enregistrer les modifications
            </button>
          </>
        )}

        {mode === "supprimer" && (
          <div className="mt-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X size={28} className="text-red-500" />
            </div>
            <h3 className="font-display text-[18px] font-bold mb-2" style={{ color: theme.encre }}>Supprimer cette pièce ?</h3>
            <p className="text-[13.5px] mb-2" style={{ color: theme.taupe }}>
              <strong style={{ color: theme.encre }}>{robe.nom}</strong> sera retirée du catalogue.
            </p>
            {resasFutures.length > 0 && (
              <div className="rounded-xl p-3 mb-4 text-left" style={{ background: "#FEF2F2" }}>
                <p className="text-[12.5px] text-red-600 font-semibold">⚠️ Attention — {resasFutures.length} réservation(s) active(s) sont liées à cette pièce.</p>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMode("detail")} className="flex-1 rounded-2xl py-3 font-bold text-[14px] border-2" style={{ borderColor: theme.bordure, color: theme.taupe }}>
                Annuler
              </button>
              <button onClick={() => onSupprimer(robe.id)} className="flex-1 rounded-2xl py-3 font-bold text-[14px] text-white bg-red-500">
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Essayages ----------

function FicheCliente({ cliente, onClose, theme }) {
  if (!cliente) return null;
  const essayages = ESSAYAGES.filter((e) => e.clienteId === cliente.id);
  const reservations = RESERVATIONS.filter((r) => r.clienteId === cliente.id);

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: theme.fond }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="p-1.5 -ml-1.5" style={{ color: theme.encre }}>
          <ChevronLeft size={22} />
        </button>
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.taupe }}>Fiche cliente</span>
        <div className="w-7" />
      </div>
      <div className="px-4 overflow-y-auto pb-28">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-display text-2xl mb-3"
          style={{ background: theme.accentSoft, color: theme.encre }}
        >
          {cliente.nom[0]}
        </div>
        <h2 className="font-display text-[20px]" style={{ color: theme.encre }}>{cliente.nom}</h2>
        <div className="flex items-center gap-1.5 mt-1.5 text-[13.5px]" style={{ color: theme.taupe }}>
          <Phone size={14} />
          <span>{cliente.telephone}</span>
        </div>

        <h3 className="font-display text-[15px] mt-6 mb-2" style={{ color: theme.encre }}>Historique essayages</h3>
        {essayages.length === 0 ? (
          <p className="text-[13px]" style={{ color: theme.taupe }}>Aucun essayage enregistré.</p>
        ) : (
          <div className="space-y-2">
            {essayages.map((e) => {
              const robe = getRobe(e.robeId);
              return (
                <div key={e.id} className="bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium" style={{ color: theme.encre }}>{robe.nom}</span>
                    <span className="text-[11px]" style={{ color: theme.taupe }}>{fmtDate(e.date)} · {e.heure}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3 className="font-display text-[15px] mt-5 mb-2" style={{ color: theme.encre }}>Historique locations</h3>
        {reservations.length === 0 ? (
          <p className="text-[13px]" style={{ color: theme.taupe }}>Aucune location enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => {
              const robe = getRobe(r.robeId);
              return (
                <div key={r.id} className="bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium" style={{ color: theme.encre }}>{robe.nom}</span>
                    <span className="text-[11px]" style={{ color: theme.taupe }}>{fmtDate(r.debut)} → {fmtDate(r.fin)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EssayagesView({ theme, onOpenCliente }) {
  const [showNew, setShowNew] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(2026, 5, 1));
  const [selectedDay, setSelectedDay] = useState("2026-06-29");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const essayagesParJour = useMemo(() => {
    const map = {};
    ESSAYAGES.forEach((e) => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return map;
  }, []);

  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const todayStr = "2026-06-29";
  const essayagesDuJour = (selectedDay ? essayagesParJour[selectedDay] || [] : []).sort((a, b) => (a.heure > b.heure ? 1 : -1));

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="font-display text-[22px]" style={{ color: theme.encre }}>Essayages</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: theme.taupe }}>Calendrier séparé des locations</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-full p-3 shadow-lg active:scale-95 text-white"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})`, boxShadow: `0 6px 16px -4px ${theme.accent}66` }}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="rounded-2xl p-3 mt-4 mb-4 flex items-start gap-2.5" style={{ background: theme.accentSoft }}>
        <Bell size={16} className="shrink-0 mt-0.5" style={{ color: theme.encre }} />
        <p className="text-[12px] leading-snug" style={{ color: theme.encre }}>
          Rappel visuel : pensez à confirmer chaque essayage la veille, et à préparer la pièce avant le retrait de la cliente pour son événement.
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-3.5" style={{ borderColor: theme.bordure }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 active:scale-95" style={{ color: theme.taupe }}>
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-[15px] capitalize" style={{ color: theme.encre }}>{monthLabel}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 active:scale-95" style={{ color: theme.taupe }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} className="text-center text-[10.5px] font-medium py-1" style={{ color: theme.taupe }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = date.toISOString().slice(0, 10);
            const essList = essayagesParJour[iso] || [];
            const count = essList.length;
            const isToday = iso === todayStr;
            const isSelected = iso === selectedDay;
            let bg = "transparent";
            let textColor = theme.encre;
            if (count >= 2) { bg = theme.accent; textColor = "white"; }
            else if (count === 1) { bg = theme.accentSoft; textColor = theme.encre; }

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(iso)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-transform active:scale-95"
                style={{ background: bg, outline: isSelected ? `2px solid ${theme.encre}` : isToday ? `1.5px solid ${theme.taupe}` : "none", outlineOffset: "1px" }}
              >
                <span className="text-[12.5px]" style={{ color: textColor }}>{date.getDate()}</span>
                {count > 0 && <span className="text-[8px] font-medium" style={{ color: textColor, opacity: 0.85 }}>{count} ess.</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3.5 pt-3 border-t" style={{ borderColor: theme.lignePale }}>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.taupe }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: theme.accentSoft }} /> 1 essayage
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.taupe }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: theme.accent }} /> 2+ essayages
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-4">
          <h3 className="font-display text-[15.5px] mb-2 capitalize" style={{ color: theme.encre }}>{fmtDateLong(selectedDay)}</h3>
          {essayagesDuJour.length === 0 ? (
            <div className="bg-white rounded-xl p-4 border text-center text-[13px]" style={{ borderColor: theme.bordure, color: theme.taupe }}>
              Aucun essayage programmé ce jour.
            </div>
          ) : (
            <div className="space-y-2">
              {essayagesDuJour.map((e) => {
                const cliente = getCliente(e.clienteId);
                const robe = getRobe(e.robeId);
                return (
                  <button
                    key={e.id}
                    onClick={() => onOpenCliente(cliente)}
                    className="w-full text-left bg-white rounded-xl p-3.5 border flex items-center gap-3"
                    style={{ borderColor: theme.bordure }}
                  >
                    <div className="rounded-xl px-2.5 py-1.5 text-center shrink-0 min-w-[52px]" style={{ background: theme.accentSoft }}>
                      <div className="font-display text-[15px] leading-none" style={{ color: theme.encre }}>{e.heure}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: theme.encre }}>{cliente.nom}</div>
                      <div className="text-[12px] truncate" style={{ color: theme.taupe }}>{robe.nom}</div>
                      {e.note && <div className="text-[11.5px] italic mt-1 truncate" style={{ color: theme.taupe }}>{e.note}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showNew && <NouvelEssayageModal onClose={() => setShowNew(false)} theme={theme} />}
    </div>
  );
}

function NouvelEssayageModal({ onClose, theme }) {
  const [clienteId, setClienteId] = useState(CLIENTES[0].id);
  const [robeId, setRobeId] = useState(CATALOGUE[0].id);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto" style={{ background: theme.fond }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px]" style={{ color: theme.encre }}>Nouvel essayage</h2>
          <button onClick={onClose} className="p-1" style={{ color: theme.taupe }}><X size={20} /></button>
        </div>

        <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Cliente</label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 mb-3.5 text-[14px] outline-none"
          style={{ borderColor: theme.bordure, color: theme.encre }}
        >
          {CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nom} — {c.telephone}</option>)}
        </select>

        <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Pièce à essayer</label>
        <select
          value={robeId}
          onChange={(e) => setRobeId(e.target.value)}
          className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 mb-3.5 text-[14px] outline-none"
          style={{ borderColor: theme.bordure, color: theme.encre }}
        >
          {CATALOGUE.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>

        <p className="text-[11.5px] mb-4" style={{ color: theme.taupe }}>
          La fiche cliente est créée automatiquement si elle n'existe pas encore — elle pourra être retrouvée directement lors de la réservation de la robe.
        </p>

        <button onClick={onClose} className="w-full rounded-2xl py-3.5 font-bold text-[14.5px] text-white active:scale-[0.98] shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})`, boxShadow: `0 8px 20px -6px ${theme.accent}80` }}>
          Enregistrer l'essayage
        </button>
        <p className="text-center text-[11px] mt-2" style={{ color: theme.taupe }}>Prototype — l'enregistrement réel sera branché à votre base.</p>
      </div>
    </div>
  );
}

// ---------- Planning ----------

function PlanningView({ theme }) {
  const [viewDate, setViewDate] = useState(new Date(2026, 5, 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const occupationParJour = useMemo(() => {
    const map = {};
    RESERVATIONS.forEach((r) => {
      eachDay(r.debut, r.fin).forEach((d) => { if (!map[d]) map[d] = []; map[d].push(r); });
    });
    return map;
  }, []);

  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const todayStr = "2026-06-29";
  const selectedReservations = selectedDay ? occupationParJour[selectedDay] || [] : [];

  return (
    <div className="px-4 pt-4 pb-28">
      <h1 className="font-display text-[22px] mb-0.5" style={{ color: theme.encre }}>Planning</h1>
      <p className="text-[12.5px] mb-4" style={{ color: theme.taupe }}>Disponibilité en temps réel par pièce</p>

      <div className="bg-white rounded-2xl border p-3.5" style={{ borderColor: theme.bordure }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 active:scale-95" style={{ color: theme.taupe }}>
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-[15px] capitalize" style={{ color: theme.encre }}>{monthLabel}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 active:scale-95" style={{ color: theme.taupe }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} className="text-center text-[10.5px] font-medium py-1" style={{ color: theme.taupe }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = date.toISOString().slice(0, 10);
            const resas = occupationParJour[iso] || [];
            const count = resas.length;
            const isToday = iso === todayStr;
            const isSelected = iso === selectedDay;
            let bg = "transparent";
            let textColor = theme.encre;
            if (count >= 2) { bg = theme.accent; textColor = "white"; }
            else if (count === 1) { bg = theme.accentSoft; textColor = theme.encre; }

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(iso)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-transform active:scale-95"
                style={{ background: bg, outline: isSelected ? `2px solid ${theme.encre}` : isToday ? `1.5px solid ${theme.taupe}` : "none", outlineOffset: "1px" }}
              >
                <span className="text-[12.5px]" style={{ color: textColor }}>{date.getDate()}</span>
                {count > 0 && <span className="text-[8px] font-medium" style={{ color: textColor, opacity: 0.85 }}>{count} loc.</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3.5 pt-3 border-t" style={{ borderColor: theme.lignePale }}>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.taupe }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: theme.accentSoft }} /> 1 location
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.taupe }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: theme.accent }} /> 2+ locations
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-4">
          <h3 className="font-display text-[15.5px] mb-2 capitalize" style={{ color: theme.encre }}>{fmtDateLong(selectedDay)}</h3>
          {selectedReservations.length === 0 ? (
            <div className="bg-white rounded-xl p-4 border text-center text-[13px]" style={{ borderColor: theme.bordure, color: theme.taupe }}>
              Aucune pièce louée ce jour — toutes disponibles.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedReservations.map((r) => {
                const robe = getRobe(r.robeId);
                const cliente = getCliente(r.clienteId);
                return (
                  <div key={r.id} className="bg-white rounded-xl p-3 border flex items-center gap-3" style={{ borderColor: theme.bordure }}>
                    <RobeSwatch robe={robe} theme={theme} size="w-10 h-10" textSize="text-[13px]" rounded="rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: theme.encre }}>{robe.nom}</div>
                      <div className="text-[11.5px] truncate" style={{ color: theme.taupe }}>{cliente.nom} · grisé jusqu'au {fmtDate(r.fin)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Réservations ----------

function ReservationsView({ theme }) {
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [robeId, setRobeId] = useState(CATALOGUE[0].id);
  const [clienteMode, setClienteMode] = useState("liste"); // "liste" ou "nouvelle"
  const [clienteId, setClienteId] = useState(CLIENTES[0].id);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [prixException, setPrixException] = useState("");
  const [acompte, setAcompte] = useState("");

  const robeChoisie = getRobe(robeId);
  const prixDu = prixException !== "" ? Number(prixException) : robeChoisie.prix;
  const acompteVerse = acompte !== "" ? Number(acompte) : 0;
  const resteAPayer = Math.max(prixDu - acompteVerse, 0);

  const filtered = RESERVATIONS
    .filter((r) => getCliente(r.clienteId).nom.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.debut < b.debut ? 1 : -1));

  function resetForm() {
    setRobeId(CATALOGUE[0].id);
    setClienteMode("liste");
    setClienteId(CLIENTES[0].id);
    setNouveauNom("");
    setNouveauTel("");
    setPrixException("");
    setAcompte("");
    setShowNew(false);
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-[22px]" style={{ color: theme.encre }}>Réservations</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: theme.taupe }}>{RESERVATIONS.length} au total</p>
        </div>
        <button onClick={() => setShowNew(true)} className="rounded-full p-3 shadow-lg active:scale-95 text-white" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})`, boxShadow: `0 6px 16px -4px ${theme.accent}66` }}>
          <Plus size={18} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.taupe }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher une cliente…"
          className="w-full bg-white border rounded-full pl-10 pr-4 py-2.5 text-[14px] outline-none"
          style={{ borderColor: theme.bordure, color: theme.encre }}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const robe = getRobe(r.robeId);
          const cliente = getCliente(r.clienteId);
          const prixFinal = r.prixModifie ?? robe.prix;
          const reste = Math.max(prixFinal - (r.acompte || 0), 0);
          const statutColors = {
            confirmee: { bg: theme.accent, fg: "white" },
            enCours: { bg: theme.flash, fg: "white" },
            terminee: { bg: theme.bordure, fg: theme.taupe },
          }[r.statut];
          return (
            <div key={r.id} className="bg-white rounded-2xl p-3.5 shadow-sm border" style={{ borderColor: theme.bordure }}>
              <div className="flex items-center gap-3">
                <RobeSwatch robe={robe} theme={theme} size="w-14 h-14" textSize="text-lg" rounded="rounded-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold truncate" style={{ color: theme.encre }}>{cliente.nom}</div>
                      <div className="text-[12.5px] mt-0.5 truncate" style={{ color: theme.taupe }}>{robe.nom}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: statutColors.bg, color: statutColors.fg }}
                    >
                      {STATUTS_LOC[r.statut].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[12px] font-medium" style={{ color: theme.taupe }}>
                    <Calendar size={12} />
                    <span>{fmtDate(r.debut)} → {fmtDate(r.fin)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-3 pt-3 border-t" style={{ borderColor: theme.lignePale }}>
                <span className="font-display text-[18px] font-bold" style={{ color: theme.accent }}>{prixFinal}€</span>
                {r.prixModifie && <span className="text-[11px] line-through" style={{ color: theme.taupe }}>{robe.prix}€ catalogue</span>}
                <span className="text-[11px] ml-auto" style={{ color: theme.taupe }}>+ {robe.caution}€ caution</span>
              </div>

              {r.acompte > 0 ? (
                <div className="flex items-center gap-2 mt-2 text-[12px]">
                  <span className="px-2 py-0.5 rounded-md" style={{ background: theme.accentSoft, color: theme.encre }}>
                    Acompte {r.acompte}€
                  </span>
                  <span className="font-semibold" style={{ color: reste > 0 ? theme.flash : theme.taupe }}>
                    Reste {reste}€
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-[12px] font-medium" style={{ color: theme.flash }}>Aucun acompte — {prixFinal}€ dus à la remise</div>
              )}

              {r.commentaire && (
                <div className="mt-2 text-[12px] italic rounded-lg px-2.5 py-1.5" style={{ color: theme.taupe, background: theme.fond }}>
                  {r.commentaire}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={resetForm}>
          <div className="w-full rounded-t-3xl p-5 pb-8 max-h-[88vh] overflow-y-auto" style={{ background: theme.fond }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[18px]" style={{ color: theme.encre }}>Nouvelle réservation</h2>
              <button onClick={resetForm} className="p-1" style={{ color: theme.taupe }}><X size={20} /></button>
            </div>

            <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Cliente</label>
            <div className="flex gap-2 mt-1.5 mb-3">
              <button
                onClick={() => setClienteMode("liste")}
                className="flex-1 py-2 rounded-xl text-[12.5px] font-medium border"
                style={clienteMode === "liste" ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
              >
                Cliente existante
              </button>
              <button
                onClick={() => setClienteMode("nouvelle")}
                className="flex-1 py-2 rounded-xl text-[12.5px] font-medium border"
                style={clienteMode === "nouvelle" ? { background: theme.accent, color: "white", borderColor: theme.accent } : { background: "white", color: theme.taupe, borderColor: theme.bordure }}
              >
                Nouvelle cliente
              </button>
            </div>

            {clienteMode === "liste" ? (
              <>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 mb-1.5 text-[14px] outline-none"
                  style={{ borderColor: theme.bordure, color: theme.encre }}
                >
                  {CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nom} — {c.telephone}</option>)}
                </select>
                <p className="text-[11px] mb-3.5" style={{ color: theme.taupe }}>Si la cliente est venue essayer, sa fiche se retrouve automatiquement ici.</p>
              </>
            ) : (
              <>
                <input
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  placeholder="Nom de la cliente"
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 mb-2 text-[14px] outline-none"
                  style={{ borderColor: theme.bordure, color: theme.encre }}
                />
                <input
                  value={nouveauTel}
                  onChange={(e) => setNouveauTel(e.target.value)}
                  placeholder="Numéro de téléphone"
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 mb-1.5 text-[14px] outline-none"
                  style={{ borderColor: theme.bordure, color: theme.encre }}
                />
                <p className="text-[11px] mb-3.5" style={{ color: theme.taupe }}>Une nouvelle fiche cliente sera créée — utile si elle n'est pas venue essayer au préalable.</p>
              </>
            )}

            <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Pièce</label>
            <div className="flex items-center gap-2.5 mt-1.5 mb-3.5">
              <RobeSwatch robe={robeChoisie} theme={theme} size="w-12 h-12" textSize="text-base" rounded="rounded-xl" />
              <select
                value={robeId}
                onChange={(e) => setRobeId(e.target.value)}
                className="flex-1 bg-white border rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: theme.bordure, color: theme.encre }}
              >
                {CATALOGUE.map((r) => <option key={r.id} value={r.id}>{r.nom} — {r.prix}€</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3.5">
              <div className="bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Prix catalogue</div>
                <div className="text-[17px] font-semibold mt-0.5" style={{ color: theme.encre }}>{robeChoisie.prix}€</div>
              </div>
              <div className="bg-white rounded-xl p-3 border" style={{ borderColor: theme.bordure }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Caution (auto)</div>
                <div className="text-[17px] font-semibold mt-0.5" style={{ color: theme.encre }}>{robeChoisie.caution}€</div>
              </div>
            </div>

            <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Prix exceptionnel (facultatif)</label>
            <input
              type="number"
              value={prixException}
              onChange={(e) => setPrixException(e.target.value)}
              placeholder={`Laisser vide pour garder ${robeChoisie.prix}€`}
              className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 mb-1.5 text-[14px] outline-none"
              style={{ borderColor: theme.bordure, color: theme.encre }}
            />
            <p className="text-[11px] mb-3.5" style={{ color: theme.taupe }}>À utiliser si vous accordez un tarif différent du catalogue pour cette cliente.</p>

            <label className="text-[11.5px] uppercase tracking-wide" style={{ color: theme.taupe }}>Acompte versé (facultatif)</label>
            <input
              type="number"
              value={acompte}
              onChange={(e) => setAcompte(e.target.value)}
              placeholder="Ex. 50"
              className="w-full bg-white border rounded-xl px-3.5 py-2.5 mt-1.5 mb-3.5 text-[14px] outline-none"
              style={{ borderColor: theme.bordure, color: theme.encre }}
            />

            <div className="rounded-xl p-3.5 mb-4" style={{ background: theme.accentSoft }}>
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: theme.encre }}>Prix dû</span>
                <span className="font-semibold" style={{ color: theme.encre }}>{prixDu}€</span>
              </div>
              <div className="flex items-center justify-between text-[13px] mt-1">
                <span style={{ color: theme.encre }}>Acompte versé</span>
                <span className="font-semibold" style={{ color: theme.encre }}>− {acompteVerse}€</span>
              </div>
              <div className="h-px my-2" style={{ background: `${theme.encre}33` }} />
              <div className="flex items-center justify-between text-[14.5px]">
                <span className="font-medium" style={{ color: theme.encre }}>Reste à payer</span>
                <span className="font-display text-[18px]" style={{ color: theme.accent }}>{resteAPayer}€</span>
              </div>
            </div>

            <button onClick={resetForm} className="w-full rounded-2xl py-3.5 font-bold text-[14.5px] text-white active:scale-[0.98] shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.flash})`, boxShadow: `0 8px 20px -6px ${theme.accent}80` }}>
              Enregistrer la réservation
            </button>
            <p className="text-center text-[11px] mt-2" style={{ color: theme.taupe }}>Prototype — l'enregistrement réel sera branché à votre base.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Stats ----------

function StatsView({ theme, catalogue }) {
  const [moisActif, setMoisActif] = useState(null); // null = tous les mois confondus

  const NOMS_MOIS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin"];

  const statsParMois = useMemo(() => {
    const buckets = NOMS_MOIS.map(() => ({ ca: 0, count: 0 }));
    RESERVATIONS.forEach((r) => {
      const d = new Date(r.debut + "T00:00:00");
      const m = d.getMonth();
      if (m < 0 || m > 5 || d.getFullYear() !== 2026) return;
      const robe = getRobe(r.robeId);
      buckets[m].ca += r.prixModifie ?? robe.prix;
      buckets[m].count += 1;
    });
    return buckets;
  }, []);

  const reservationsFiltrees = useMemo(() => {
    if (moisActif === null) return RESERVATIONS;
    return RESERVATIONS.filter((r) => {
      const d = new Date(r.debut + "T00:00:00");
      return d.getMonth() === moisActif && d.getFullYear() === 2026;
    });
  }, [moisActif]);

  const statsParRobe = useMemo(() => {
    const map = {};
    reservationsFiltrees.forEach((r) => {
      if (!map[r.robeId]) map[r.robeId] = { count: 0, ca: 0 };
      const robe = getRobe(r.robeId);
      map[r.robeId].count += 1;
      map[r.robeId].ca += r.prixModifie ?? robe.prix;
    });
    return Object.entries(map).map(([robeId, v]) => ({ robe: getRobe(robeId), ...v })).sort((a, b) => b.ca - a.ca);
  }, [reservationsFiltrees]);

  const caTotal = reservationsFiltrees.reduce((sum, r) => sum + (r.prixModifie ?? getRobe(r.robeId).prix), 0);
  const cautionEnCours = reservationsFiltrees.filter((r) => r.statut !== "terminee").reduce((sum, r) => sum + getRobe(r.robeId).caution, 0);
  const top5 = statsParRobe.slice(0, 5);
  const maxCaRobe = top5[0]?.ca || 1;
  const maxCaMois = Math.max(...statsParMois.map((b) => b.ca), 1);
  const moyenneParLocation = reservationsFiltrees.length ? Math.round(caTotal / reservationsFiltrees.length) : 0;

  return (
    <div className="px-4 pt-4 pb-28">
      <h1 className="font-display text-[22px] mb-0.5" style={{ color: theme.encre }}>Statistiques</h1>
      <p className="text-[12.5px] mb-4" style={{ color: theme.taupe }}>
        {moisActif === null ? "Vue sur 6 mois (janv. – juin 2026)" : `Focus sur ${NOMS_MOIS[moisActif]} 2026`}
      </p>

      {/* Graphique CA par mois */}
      <div className="bg-white rounded-2xl p-4 border mb-5" style={{ borderColor: theme.bordure }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[15px] font-semibold" style={{ color: theme.encre }}>Chiffre d'affaires par mois</h3>
          {moisActif !== null && (
            <button onClick={() => setMoisActif(null)} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ color: theme.accent, background: theme.accentSoft }}>
              Réinitialiser
            </button>
          )}
        </div>
        <div className="flex items-end justify-between gap-2 h-36 px-1">
          {statsParMois.map((b, i) => {
            const isActive = moisActif === i;
            const h = Math.max((b.ca / maxCaMois) * 100, 4);
            return (
              <button key={i} onClick={() => setMoisActif(isActive ? null : i)} className="flex-1 flex flex-col items-center justify-end h-full group">
                <span className="text-[10px] font-bold mb-1 transition-opacity" style={{ color: isActive ? theme.flash : theme.taupe, opacity: isActive ? 1 : 0.85 }}>
                  {b.ca >= 1000 ? `${(b.ca / 1000).toFixed(1)}k` : b.ca}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${h}%`,
                    background: isActive
                      ? `linear-gradient(180deg, ${theme.flash}, ${theme.accent})`
                      : `linear-gradient(180deg, ${theme.accent}, ${theme.accent}99)`,
                    opacity: moisActif === null || isActive ? 1 : 0.35,
                  }}
                />
                <span className="text-[10.5px] font-semibold mt-1.5" style={{ color: isActive ? theme.encre : theme.taupe }}>
                  {NOMS_MOIS[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: theme.bordure }}>
          <div className="text-[10.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Chiffre d'affaires</div>
          <div className="font-display text-[24px] font-bold mt-1" style={{ color: theme.accent }}>{caTotal.toLocaleString("fr-FR")}€</div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.taupe }}>sur {reservationsFiltrees.length} réservations</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: theme.bordure }}>
          <div className="text-[10.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Panier moyen</div>
          <div className="font-display text-[24px] font-bold mt-1" style={{ color: theme.encre }}>{moyenneParLocation}€</div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.taupe }}>par réservation</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border mb-5" style={{ borderColor: theme.bordure }}>
        <div className="text-[10.5px] uppercase tracking-wide font-semibold" style={{ color: theme.taupe }}>Cautions en cours</div>
        <div className="font-display text-[22px] font-bold mt-1" style={{ color: theme.flash }}>{cautionEnCours.toLocaleString("fr-FR")}€</div>
        <div className="text-[11px] mt-0.5" style={{ color: theme.taupe }}>à restituer sur les réservations actives</div>
      </div>

      <h3 className="font-display text-[16px] font-semibold mb-3" style={{ color: theme.encre }}>Chiffre d'affaires par robe</h3>
      <div className="bg-white rounded-2xl p-4 border space-y-3" style={{ borderColor: theme.bordure }}>
        {top5.length === 0 ? (
          <p className="text-[13px]" style={{ color: theme.taupe }}>Aucune réservation sur cette période.</p>
        ) : top5.map((s, i) => (
          <div key={s.robe.id} className="flex items-center gap-3">
            <span className="font-display text-[13px] font-bold w-4" style={{ color: theme.flash }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-semibold truncate" style={{ color: theme.encre }}>{s.robe.nom}</span>
                <span className="text-[12px] font-bold shrink-0 ml-2" style={{ color: theme.accent }}>{s.ca}€</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.lignePale }}>
                <div className="h-full rounded-full" style={{ width: `${(s.ca / maxCaRobe) * 100}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.flash})` }} />
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: theme.taupe }}>{s.count} location{s.count > 1 ? "s" : ""}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-display text-[16px] font-semibold mt-5 mb-3" style={{ color: theme.encre }}>Répartition du catalogue</h3>
      <div className="bg-white rounded-2xl p-4 border space-y-2.5" style={{ borderColor: theme.bordure }}>
        {[...new Set(catalogue.map((r) => r.categorie).filter(Boolean))].map((cat) => {
          const count = catalogue.filter((r) => r.categorie === cat).length;
          const pct = Math.round((count / catalogue.length) * 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between text-[13px] mb-1">
                <span className="font-medium" style={{ color: theme.encre }}>{cat}</span>
                <span style={{ color: theme.taupe }}>{count} pièces · {pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.lignePale }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: theme.accentSoft }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- App ----------

export default function App() {
  const [tab, setTab] = useState("catalogue");
  const [selectedRobe, setSelectedRobe] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [themeKey, setThemeKey] = useState("rose");
  const [catalogue, setCatalogue] = useState(CATALOGUE);
  const [categories, setCategories] = useState(CATEGORIES_DEFAUT);
  const theme = THEMES[themeKey];

  function ajouterCategorie(cat) {
    setCategories((prev) => prev.includes(cat) ? prev : [...prev, cat]);
  }
  function ajouterRobe(robe) {
    setCatalogue((prev) => [...prev, { ...robe, id: `r_${Date.now()}`, shade: ["a","b","c","d","e","f"][prev.length % 6], etat: "disponible" }]);
  }
  function modifierRobe(robeModifiee) {
    setCatalogue((prev) => prev.map((r) => r.id === robeModifiee.id ? robeModifiee : r));
    setSelectedRobe(robeModifiee);
  }
  function supprimerRobe(robeId) {
    setCatalogue((prev) => prev.filter((r) => r.id !== robeId));
    setSelectedRobe(null);
  }

  return (
    <div className="min-h-screen" style={{ background: theme.fond, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.01em; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="sticky top-0 z-20 backdrop-blur border-b px-4 py-3 flex items-center justify-between" style={{ background: `${theme.fond}F2`, borderColor: theme.lignePale }}>
        <Logo theme={theme} />
        <ThemeSwitcher themeKey={themeKey} setThemeKey={setThemeKey} theme={theme} />
      </div>

      {tab === "catalogue" && <CatalogueView catalogue={catalogue} onSelectRobe={setSelectedRobe} onAjouter={ajouterRobe} categories={categories} onAjouterCategorie={ajouterCategorie} theme={theme} />}
      {tab === "essayages" && <EssayagesView theme={theme} onOpenCliente={setSelectedCliente} catalogue={catalogue} />}
      {tab === "planning" && <PlanningView theme={theme} catalogue={catalogue} />}
      {tab === "reservations" && <ReservationsView theme={theme} catalogue={catalogue} categories={categories} />}
      {tab === "stats" && <StatsView theme={theme} catalogue={catalogue} />}

      <TabBar active={tab} setActive={setTab} theme={theme} />

      {selectedRobe && (
        <RobeDetail
          robe={selectedRobe}
          onClose={() => setSelectedRobe(null)}
          onModifier={modifierRobe}
          onSupprimer={supprimerRobe}
          categories={categories}
          onAjouterCategorie={ajouterCategorie}
          theme={theme}
        />
      )}
      {selectedCliente && <FicheCliente cliente={selectedCliente} onClose={() => setSelectedCliente(null)} theme={theme} />}
    </div>
  );
}
