import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Menu, X, Home, ClipboardList, Users, Package, Clock, Plus, Search,
  Pencil, Trash2, Building2, Loader2, AlertCircle, ChevronDown, LogOut,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "parte", label: "Parte diario", icon: ClipboardList },
  { id: "empleados", label: "Empleados", icon: Users },
  { id: "productos", label: "Productos", icon: Package },
  { id: "tiempos", label: "Tiempos", icon: Clock },
];

const TURNOS = ["Mañana", "Tarde", "N/A"];

const PUESTOS = [
  "Operario de producción",
  "Operario de limpieza",
  "Operario de mantenimiento",
  "Supervisor de producción",
  "Jefe de producción",
];

const CATEGORIAS = [
  "Peón",
  "No calificado",
  "Semicalificado",
  "Calificado",
  "Operario especializado",
  "Calificado especializado",
  "Planta química",
  "Título habilitante",
  "Fuera de convenio",
  "Líder de producción",
  "Analista de producción",
];

const LINEAS = ["Domisanitarios", "Ectoparasiticidas"];

const ENTES_REGULADORES = ["ANMAT", "SENASA", "Otro"];

const EMPRESAS = ["Binka", "König"];

const UNIDADES_MEDIDA = ["kg", "Ltrs", "Unid", "CJ", "Hs", "N/A"];

const ESTADOS = ["Programado", "En curso", "Para continuar", "Terminado"];

const ESTADO_CONFIG = {
  "Programado":     { dot: "bg-slate-400",  fill: "bg-slate-300",  badge: "bg-slate-100 text-slate-600",  hex: "#94a3b8" },
  "En curso":       { dot: "bg-cyan-500",   fill: "bg-cyan-400",   badge: "bg-cyan-100 text-cyan-700",    hex: "#06b6d4" },
  "Para continuar": { dot: "bg-amber-400",  fill: "bg-amber-300",  badge: "bg-amber-100 text-amber-700",  hex: "#fbbf24" },
  "Terminado":      { dot: "bg-teal-500",   fill: "bg-teal-400",   badge: "bg-teal-100 text-teal-700",    hex: "#14b8a6" },
};

function uid() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function historialOrdenadoDe(historial) {
  return [...(historial || [])].sort((a, b) => a.desde.localeCompare(b.desde));
}

function ultimoDe(historial, key) {
  const ordenado = historialOrdenadoDe(historial);
  return ordenado.length ? ordenado[ordenado.length - 1][key] : null;
}

function categoriaActualDe(emp) {
  return ultimoDe(emp.historialCategorias, "categoria");
}

function puestoActualDe(emp) {
  return ultimoDe(emp.historialPuestos, "puesto");
}

function StatusDot({ active }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${active ? "bg-teal-500" : "bg-rose-500"}`} />
      <span className={active ? "text-teal-700" : "text-rose-700"}>
        {active ? "Activo" : "Inactivo"}
      </span>
    </span>
  );
}

function Tag({ children }) {
  return (
    <span
      className="inline-block bg-slate-700 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG["Programado"];
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
      {estado}
    </span>
  );
}

function DropdownSelect({ value, onChange, options, placeholder = "Seleccioná...", disabled = false, searchable = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() =>
    options.filter((opt) => !search || opt.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between border rounded-md px-3 py-2.5 text-sm text-left transition-colors ${
          disabled
            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
            : open
            ? "border-cyan-500 ring-2 ring-cyan-100 bg-white"
            : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        {selectedOpt ? (
          <span className="flex items-center gap-2 text-slate-800 truncate min-w-0">
            {selectedOpt.dot && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedOpt.dot}`} />}
            <span className="truncate">{selectedOpt.label}</span>
            {selectedOpt.sub && <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{selectedOpt.sub}</span>}
          </span>
        ) : (
          <span className="text-slate-400 truncate">{placeholder}</span>
        )}
        <ChevronDown size={15} className={`text-slate-400 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin resultados</p>
            ) : (
              filtered.map((opt) => {
                const selected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                      selected ? "bg-cyan-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      selected ? "border-cyan-500 bg-cyan-500" : "border-slate-300"
                    }`}>
                      {selected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                    {opt.dot && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dot}`} />}
                    <span className={`flex-1 truncate ${selected ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                      {opt.label}
                    </span>
                    {opt.sub && <span className="text-xs text-slate-400 flex-shrink-0">{opt.sub}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GanttBar({ estado }) {
  const estadoIdx = ESTADOS.indexOf(estado);
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG["Programado"];
  return (
    <div className="flex items-center w-full">
      {ESTADOS.map((est, i) => (
        <div key={est} className="flex items-center flex-1">
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
              i <= estadoIdx ? cfg.dot : "bg-slate-200"
            }`}
            style={i === estadoIdx ? { boxShadow: `0 0 0 3px ${cfg.hex}40` } : {}}
          />
          {i < ESTADOS.length - 1 && (
            <div className={`flex-1 h-1.5 mx-0.5 rounded ${i < estadoIdx ? cfg.fill : "bg-slate-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, muted }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p
        className="text-3xl font-bold text-slate-800"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {String(value).padStart(2, "0")}
      </p>
      <p className={`text-xs mt-1 ${muted ? "text-slate-400" : "text-slate-500"}`}>
        {label}{muted ? " · próximamente" : ""}
      </p>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "text-slate-800", footnote }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className={`text-3xl font-bold ${color}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {footnote && <p className="text-[10px] text-slate-300 mt-1">{footnote}</p>}
    </div>
  );
}

function EficienciaBar({ value, label }) {
  const pct = Math.min(value, 150);
  const color = value >= 90 ? "bg-teal-500" : value >= 70 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${(pct / 150) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-10 text-right"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

function DashboardView({ empleados, productos, partes, tiempos, ausencias, onToggleAusencia }) {
  const hoy = todayISO();
  const ausenciasHoy = ausencias[hoy] || [];
  const partesHoy = partes.filter((p) => p.fecha === hoy);

  const rawDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const today = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Operarios de producción activos
  const opProd = useMemo(() =>
    empleados.filter((e) => e.activo && puestoActualDe(e) === "Operario de producción"),
    [empleados]
  );

  const estadoOp = (op) => {
    if (ausenciasHoy.includes(op.id)) return "ausente";
    if (partesHoy.some((p) => p.empleadoId === op.id)) return "presente";
    return "sinAsignar";
  };

  const presentesCount = opProd.filter((op) => estadoOp(op) === "presente").length;
  const ausentesCount  = opProd.filter((op) => estadoOp(op) === "ausente").length;
  const sinAsigCount   = opProd.filter((op) => estadoOp(op) === "sinAsignar").length;

  // Estados del parte de hoy
  const estadosCounts = useMemo(() => {
    const c = { "Programado": 0, "En curso": 0, "Para continuar": 0, "Terminado": 0 };
    partesHoy.forEach((p) => { if (c[p.estado] !== undefined) c[p.estado]++; });
    return c;
  }, [partesHoy]);

  // Helper: tiempo estándar por producto+etapa
  const findTiempoEst = useCallback(
    (productoId, etapa) =>
      tiempos.find((t) => t.productoId === productoId && t.etapa === etapa)?.tiempoHs || null,
    [tiempos]
  );

  // Partes enriquecidas con KPIs
  const partesE = useMemo(() => partesHoy.map((p) => {
    const te = findTiempoEst(p.productoId, p.etapa);
    const cant = p.cantidad || 0;
    const meta = te && te > 0 ? 8 / te : null;
    const hsEst = te && cant > 0 ? cant * te : null;
    return { ...p, te, meta, hsEst, demora: p.demora || 0 };
  }), [partesHoy, findTiempoEst]);

  // KPI 1: % completamiento de actividades
  const totalAct = partesHoy.length;
  const terminadas = partesHoy.filter((p) => p.estado === "Terminado").length;
  const pctComplet = totalAct > 0 ? (terminadas / totalAct * 100) : null;

  // KPI 2: cantidad real vs meta derivada del tiempo estándar
  const conMeta = partesE.filter((p) => p.meta !== null && p.cantidad !== null);
  const totalReal = conMeta.reduce((s, p) => s + (p.cantidad || 0), 0);
  const totalMeta = conMeta.reduce((s, p) => s + p.meta, 0);
  const pctProd = totalMeta > 0 ? (totalReal / totalMeta * 100) : null;

  // KPI 3: eficiencia = Σ(cant × te) / (8hs × presentes − Σdemoras)
  const termConHs = partesE.filter((p) => p.estado === "Terminado" && p.hsEst !== null);
  const totalHsEst = termConHs.reduce((s, p) => s + p.hsEst, 0);
  const totalDemoras = partesE.reduce((s, p) => s + p.demora, 0);
  const horasDisp = (8 * presentesCount) - totalDemoras;
  const pctEfic = horasDisp > 0 && totalHsEst > 0 ? (totalHsEst / horasDisp * 100) : null;

  // Rendimiento individual
  const rendInd = useMemo(() => opProd.map((op) => {
    const mis = partesE.filter((p) => p.empleadoId === op.id);
    const misTerm = mis.filter((p) => p.estado === "Terminado");
    const hsEst = misTerm.reduce((s, p) => s + (p.hsEst || 0), 0);
    const dem = mis.reduce((s, p) => s + p.demora, 0);
    const hdOp = 8 - dem;
    const efi = hsEst > 0 && hdOp > 0 ? (hsEst / hdOp * 100) : null;
    const compl = mis.length > 0 ? (misTerm.length / mis.length * 100) : null;
    return {
      op, estado: estadoOp(op),
      asignadas: mis.length, terminadasN: misTerm.length,
      compl, efi, demora: dem,
    };
  }).sort((a, b) => a.op.nombre.localeCompare(b.op.nombre)), [opProd, partesE, ausenciasHoy]);

  const estadoOpConfig = {
    presente:   { dot: "bg-teal-500",  label: "Presente",    badge: "bg-teal-50 text-teal-700" },
    ausente:    { dot: "bg-rose-500",  label: "Ausente",     badge: "bg-rose-50 text-rose-700" },
    sinAsignar: { dot: "bg-amber-400", label: "Sin asignar", badge: "bg-amber-50 text-amber-700" },
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 shrink-0">
          <Building2 size={26} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Panel general
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            {today}
          </h1>
        </div>
      </div>

      {/* ── DOTACIÓN ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Dotación · Operarios de producción</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total" value={opProd.length} />
          <KpiCard label="Presentes" value={presentesCount} color="text-teal-600" />
          <KpiCard label="Ausentes" value={ausentesCount}  color="text-rose-600" />
          <KpiCard label="Sin asignar" value={sinAsigCount} color="text-amber-600" />
        </div>
        {opProd.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {opProd.map((op) => {
              const est = estadoOp(op);
              const cfg = estadoOpConfig[est];
              return (
                <div key={op.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-sm text-slate-700">{op.nombre}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <button
                    onClick={() => onToggleAusencia(op.id, hoy)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      est === "ausente"
                        ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                    }`}
                  >
                    {est === "ausente" ? "Quitar ausencia" : "Marcar ausente"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {opProd.length === 0 && (
          <p className="text-sm text-slate-400">No hay operarios de producción activos cargados.</p>
        )}
      </section>

      {/* ── ESTADOS DEL DÍA ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Estados del parte · Hoy</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ESTADOS.map((est) => {
            const cfg = ESTADO_CONFIG[est];
            const [bg, text] = cfg.badge.split(" ");
            return (
              <div key={est} className={`rounded-lg p-3 border ${bg} border-opacity-30`}>
                <p className={`text-2xl font-bold ${text}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(estadosCounts[est]).padStart(2, "0")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{est}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── INDICADORES GLOBALES ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Indicadores globales · Hoy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Completamiento de actividades"
            value={pctComplet !== null ? `${pctComplet.toFixed(0)}%` : "—"}
            sub={`${terminadas} terminadas de ${totalAct} asignadas`}
            color={pctComplet !== null ? (pctComplet >= 80 ? "text-teal-600" : pctComplet >= 50 ? "text-amber-500" : "text-rose-500") : "text-slate-300"}
          />
          <KpiCard
            label="Producción vs Meta"
            value={pctProd !== null ? `${pctProd.toFixed(0)}%` : "—"}
            sub={pctProd !== null ? `${totalReal.toFixed(1)} producidas · meta ${totalMeta.toFixed(1)}` : "Sin tiempos estándar cargados"}
            color={pctProd !== null ? (pctProd >= 90 ? "text-teal-600" : pctProd >= 70 ? "text-amber-500" : "text-rose-500") : "text-slate-300"}
            footnote="Meta = 8hs ÷ tiempo estándar por etapa"
          />
          <KpiCard
            label="Eficiencia general"
            value={pctEfic !== null ? `${pctEfic.toFixed(0)}%` : "—"}
            sub={pctEfic !== null ? `${totalHsEst.toFixed(2)} Hs est. · ${horasDisp.toFixed(2)} Hs disp.` : "Sin datos suficientes"}
            color={pctEfic !== null ? (pctEfic >= 85 ? "text-teal-600" : pctEfic >= 65 ? "text-amber-500" : "text-rose-500") : "text-slate-300"}
            footnote={`Jornada 8hs − ${totalDemoras.toFixed(2)} Hs demora`}
          />
        </div>
      </section>

      {/* ── RENDIMIENTO INDIVIDUAL ── */}
      {rendInd.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Rendimiento individual · Hoy</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm hidden md:table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 text-xs">
                  <th className="py-2.5 px-4 font-semibold">Operario</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Asig.</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Term.</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Demora</th>
                  <th className="py-2.5 px-4 font-semibold w-48">Eficiencia</th>
                </tr>
              </thead>
              <tbody>
                {rendInd.map(({ op, estado: est, asignadas, terminadasN, compl, efi, demora }) => {
                  const cfg = estadoOpConfig[est];
                  return (
                    <tr key={op.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{op.nombre}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>{asignadas}</td>
                      <td className="py-2.5 px-4 text-center text-slate-600"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>{terminadasN}</td>
                      <td className="py-2.5 px-4 text-center text-slate-400 text-xs"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {demora > 0 ? `${demora.toFixed(2)} Hs` : "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        {efi !== null ? (
                          <EficienciaBar value={efi} />
                        ) : (
                          <span className="text-xs text-slate-300">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {rendInd.map(({ op, estado: est, asignadas, terminadasN, efi, demora }) => {
                const cfg = estadoOpConfig[est];
                return (
                  <div key={op.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-800">{op.nombre}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span>Asig: <strong>{asignadas}</strong></span>
                      <span>Term: <strong>{terminadasN}</strong></span>
                      {demora > 0 && <span>Demora: <strong>{demora.toFixed(2)} Hs</strong></span>}
                    </div>
                    {efi !== null && <EficienciaBar value={efi} />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PlaceholderView({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400">
      <Icon size={40} className="mb-3 text-slate-300" />
      <h2
        className="text-lg font-semibold text-slate-600 mb-1"
        style={{ fontFamily: "'Archivo', sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-sm max-w-sm">{description}</p>
    </div>
  );
}

function ConfirmDialog({ empleado, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
        <h3
          className="font-bold text-slate-800 mb-2"
          style={{ fontFamily: "'Archivo', sans-serif" }}
        >
          Eliminar empleado
        </h3>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          ¿Seguro que querés eliminar a <strong>{empleado.nombre}</strong>? Esta acción no se puede
          deshacer. Si preferís conservarlo en el historial, marcalo como inactivo en vez de eliminarlo.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function HistorialSelector({ label, hint, opciones, valueKey, historial, setHistorial, addLabel, emptyLabel }) {
  const [showAdd, setShowAdd] = useState(historial.length === 0);
  const [nuevoValor, setNuevoValor] = useState(opciones[0]);
  const [nuevaDesde, setNuevaDesde] = useState(todayISO());
  const [errorMsg, setErrorMsg] = useState("");

  const ordenado = historialOrdenadoDe(historial);

  function handleAdd() {
    if (!nuevaDesde) {
      setErrorMsg("Elegí la fecha desde la que es válida.");
      return;
    }
    const last = ordenado[ordenado.length - 1];
    if (last && nuevaDesde <= last.desde) {
      setErrorMsg(`La fecha tiene que ser posterior al ${formatDate(last.desde)}.`);
      return;
    }
    if (last && nuevoValor === last[valueKey]) {
      setErrorMsg("Ya tiene asignado ese valor desde esa fecha.");
      return;
    }
    setHistorial((prev) => [...prev, { id: uid(), [valueKey]: nuevoValor, desde: nuevaDesde }]);
    setErrorMsg("");
    setShowAdd(false);
    setNuevoValor(opciones[0]);
    setNuevaDesde(todayISO());
  }

  function removeEntry(id) {
    setHistorial((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label} {hint && <span className="text-slate-400 font-normal">{hint}</span>}
      </label>

      {ordenado.length === 0 ? (
        <p className="text-xs text-slate-400 mb-2">{emptyLabel}</p>
      ) : (
        <div className="border border-slate-200 rounded-md divide-y divide-slate-100 mb-2">
          {ordenado.map((h, i) => {
            const hasta = i < ordenado.length - 1
              ? formatDate(addDaysISO(ordenado[i + 1].desde, -1))
              : "Actual";
            return (
              <div key={h.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <Tag>{h[valueKey]}</Tag>
                <span
                  className="text-slate-500 text-xs whitespace-nowrap"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatDate(h.desde)} → {hasta}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(h.id)}
                  className="text-slate-300 hover:text-rose-500 shrink-0"
                  aria-label="Quitar"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="text-sm text-cyan-600 font-medium hover:text-cyan-700"
        >
          + {addLabel}
        </button>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
          <select
            value={nuevoValor}
            onChange={(e) => setNuevoValor(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {opciones.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input
            type="date"
            value={nuevaDesde}
            onChange={(e) => setNuevaDesde(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errorMsg && (
            <p className="text-rose-600 text-xs flex items-center gap-1">
              <AlertCircle size={12} /> {errorMsg}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            {ordenado.length > 0 && (
              <button
                type="button"
                onClick={() => { setShowAdd(false); setErrorMsg(""); }}
                className="text-sm text-slate-500 px-3 py-1.5"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleAdd}
              className="text-sm font-semibold bg-blue-800 text-white px-3 py-1.5 rounded-md hover:bg-blue-900"
            >
              Registrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmpleadoForm({ initial, onSubmit, onClose, saving }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [turno, setTurno] = useState(initial?.turno || TURNOS[0]);
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [historialPuestos, setHistorialPuestos] = useState(initial?.historialPuestos || []);
  const [historialCategorias, setHistorialCategorias] = useState(initial?.historialCategorias || []);
  const [observaciones, setObservaciones] = useState(initial?.observaciones || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Ingresá el nombre y apellido.");
      return;
    }
    if (historialPuestos.length === 0) {
      setError("Asigná un puesto al empleado.");
      return;
    }
    if (historialCategorias.length === 0) {
      setError("Asigná al menos una categoría al empleado.");
      return;
    }
    setError("");
    onSubmit({
      id: initial?.id || uid(),
      nombre: nombre.trim(),
      turno,
      activo,
      historialPuestos: historialOrdenadoDe(historialPuestos),
      historialCategorias: historialOrdenadoDe(historialCategorias),
      observaciones: observaciones.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2
            className="font-bold text-slate-800"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            {initial ? "Editar empleado" : "Nuevo empleado"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Nombre y apellido
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <HistorialSelector
            label="Puesto"
            opciones={PUESTOS}
            valueKey="puesto"
            historial={historialPuestos}
            setHistorial={setHistorialPuestos}
            addLabel="Registrar cambio de puesto"
            emptyLabel="Todavía no tiene puesto asignado."
          />

          <HistorialSelector
            label="Categoría"
            hint="(CCT 42/89 Sanidad)"
            opciones={CATEGORIAS}
            valueKey="categoria"
            historial={historialCategorias}
            setHistorial={setHistorialCategorias}
            addLabel="Registrar cambio de categoría"
            emptyLabel="Todavía no tiene categoría asignada."
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Turno
            </label>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {TURNOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Estado
            </label>
            <button
              type="button"
              onClick={() => setActivo((a) => !a)}
              className="flex items-center gap-2"
            >
              <span
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  activo ? "bg-teal-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activo ? "translate-x-5" : ""
                  }`}
                />
              </span>
              <span className="text-sm text-slate-700">{activo ? "Activo" : "Inactivo"}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas, aptitudes, restricciones, ausencias frecuentes, etc."
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-md text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoriaChart({ empleados }) {
  const data = useMemo(() => {
    const opProduccion = empleados.filter(
      (e) => e.activo && puestoActualDe(e) === "Operario de producción"
    );
    return CATEGORIAS.map((cat) => ({
      categoria: cat,
      cantidad: opProduccion.filter((e) => categoriaActualDe(e) === cat).length,
    }));
  }, [empleados]);

  const total = data.reduce((sum, d) => sum + d.cantidad, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Distribución de categorías
          </h2>
          <p className="text-xs text-slate-400">Operario de producción · activos</p>
        </div>
        <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {total}
        </p>
      </div>
      {total === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          Todavía no hay operarios de producción activos cargados.
        </p>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="categoria"
                width={150}
                tick={{ fontSize: 11, fill: "#475569" }}
              />
              <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(value) => [value, "Empleados"]} />
              <Bar dataKey="cantidad" fill="#0891b2" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmpleadosView({ empleados, onSave }) {
  const [query, setQuery] = useState("");
  const [puestoFilter, setPuestoFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [formTarget, setFormTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return empleados
      .filter((e) => {
        if (query && !e.nombre.toLowerCase().includes(query.toLowerCase())) return false;
        if (puestoFilter && puestoActualDe(e) !== puestoFilter) return false;
        if (categoriaFilter && categoriaActualDe(e) !== categoriaFilter) return false;
        if (estadoFilter === "activos" && !e.activo) return false;
        if (estadoFilter === "inactivos" && e.activo) return false;
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [empleados, query, puestoFilter, categoriaFilter, estadoFilter]);

  async function handleSubmit(emp) {
    setSaving(true);
    const exists = empleados.some((e) => e.id === emp.id);
    const next = exists
      ? empleados.map((e) => (e.id === emp.id ? emp : e))
      : [...empleados, emp];
    await onSave(next);
    setSaving(false);
    setShowForm(false);
    setFormTarget(null);
  }

  async function handleDelete() {
    const next = empleados.filter((e) => e.id !== deleteTarget.id);
    await onSave(next);
    setDeleteTarget(null);
  }

  const activos = empleados.filter((e) => e.activo).length;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest text-slate-400 mb-1"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            Datos maestros
          </p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            Empleados
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-teal-600 font-bold">{activos}</span>{" "}
            <span className="text-slate-400">activos ·</span>{" "}
            <span className="font-bold text-slate-700">{empleados.length}</span>{" "}
            <span className="text-slate-400">en total</span>
          </p>
        </div>
        <button
          onClick={() => {
            setFormTarget(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <Plus size={16} /> Nuevo empleado
        </button>
      </div>

      <CategoriaChart empleados={empleados} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={puestoFilter}
          onChange={(e) => setPuestoFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los puestos</option>
          {PUESTOS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {empleados.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-lg text-slate-400">
          <Users size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Todavía no cargaste ningún empleado.</p>
          <p className="text-sm">Tocá <strong>+ Nuevo empleado</strong> para agregar el primero.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-medium">Nombre</th>
                  <th className="py-2.5 px-4 font-medium">Puesto actual</th>
                  <th className="py-2.5 px-4 font-medium">Categoría actual</th>
                  <th className="py-2.5 px-4 font-medium">Turno</th>
                  <th className="py-2.5 px-4 font-medium">Estado</th>
                  <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{emp.nombre}</td>
                    <td className="py-3 px-4 text-slate-600">{puestoActualDe(emp) || "—"}</td>
                    <td className="py-3 px-4">
                      <Tag>{categoriaActualDe(emp) || "Sin categoría"}</Tag>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.turno || "—"}</td>
                    <td className="py-3 px-4"><StatusDot active={emp.activo} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setFormTarget(emp); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((emp) => (
              <div key={emp.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{emp.nombre}</p>
                    <StatusDot active={emp.activo} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setFormTarget(emp); setShowForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(emp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <Tag>{categoriaActualDe(emp) || "Sin categoría"}</Tag>
                </div>
                <p className="text-xs text-slate-500">{puestoActualDe(emp) || "—"} · {emp.turno || "—"}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              Ningún empleado coincide con el filtro.
            </p>
          )}
        </>
      )}

      {showForm && (
        <EmpleadoForm
          initial={formTarget}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setFormTarget(null); }}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          empleado={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function EtapasInput({ etapas, setEtapas }) {
  const [nuevaEtapa, setNuevaEtapa] = useState("");

  function handleAdd() {
    const value = nuevaEtapa.trim();
    if (!value) return;
    if (etapas.some((e) => e.nombre === value)) {
      setNuevaEtapa("");
      return;
    }
    setEtapas((prev) => [...prev, { id: uid(), nombre: value, activo: true }]);
    setNuevaEtapa("");
  }

  function toggleActivo(id) {
    setEtapas((prev) =>
      prev.map((e) => e.id === id ? { ...e, activo: !e.activo } : e)
    );
  }

  function handleRemove(id) {
    setEtapas((prev) => prev.filter((e) => e.id !== id));
  }

  const activas = etapas.filter((e) => e.activo);
  const inactivas = etapas.filter((e) => !e.activo);

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        Etapas que componen el producto
      </label>

      {etapas.length > 0 && (
        <div className="border border-slate-200 rounded-md divide-y divide-slate-100 mb-2">
          {etapas.map((etapa, i) => (
            <div
              key={etapa.id}
              className={`flex items-center gap-2 px-3 py-2 ${!etapa.activo ? "opacity-50" : ""}`}
            >
              <span
                className="text-slate-400 text-[10px] w-4 shrink-0"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {i + 1}.
              </span>
              <span className={`flex-1 text-sm ${etapa.activo ? "text-slate-700" : "text-slate-400 line-through"}`}>
                {etapa.nombre}
              </span>
              <button
                type="button"
                onClick={() => toggleActivo(etapa.id)}
                className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${
                  etapa.activo ? "bg-teal-500" : "bg-slate-300"
                }`}
                aria-label={etapa.activo ? "Desactivar etapa" : "Activar etapa"}
                title={etapa.activo ? "Etapa activa · clic para desactivar" : "Etapa inactiva · clic para reactivar"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                    etapa.activo ? "translate-x-4" : ""
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(etapa.id)}
                className="text-slate-300 hover:text-rose-400 shrink-0"
                aria-label="Eliminar etapa"
                title="Eliminar etapa permanentemente"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {etapas.length > 0 && (
        <p className="text-xs text-slate-400 mb-2">
          <span className="text-teal-600 font-semibold">{activas.length}</span> activas
          {inactivas.length > 0 && (
            <> · <span className="text-slate-400">{inactivas.length} inactivas</span></>
          )}
          {" "}· Toggle = activa/inactiva · ✕ = elimina permanentemente
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={nuevaEtapa}
          onChange={(e) => setNuevaEtapa(e.target.value)}
          placeholder="Ej: Pesado, Mezclado, Envasado..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 rounded-md bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
        >
          Agregar
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5">Solo las etapas activas van a aparecer en el checklist del parte diario.</p>
    </div>
  );
}

function ProductoForm({ initial, onSubmit, onClose, saving }) {
  const [codigo, setCodigo] = useState(initial?.codigo || "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [unidadMedida, setUnidadMedida] = useState(initial?.unidadMedida || UNIDADES_MEDIDA[0]);
  const [linea, setLinea] = useState(initial?.linea || LINEAS[0]);
  const [enteRegulador, setEnteRegulador] = useState(initial?.enteRegulador || ENTES_REGULADORES[0]);
  const [empresa, setEmpresa] = useState(initial?.empresa || EMPRESAS[0]);
  const [etapas, setEtapas] = useState(initial?.etapas || []);
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!codigo.trim()) {
      setError("Ingresá el código del producto.");
      return;
    }
    if (!descripcion.trim()) {
      setError("Ingresá la descripción del producto.");
      return;
    }
    setError("");
    onSubmit({
      id: initial?.id || uid(),
      codigo: codigo.trim(),
      descripcion: descripcion.trim(),
      unidadMedida,
      linea,
      enteRegulador,
      empresa,
      etapas,
      activo,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            {initial ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Código
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: PAN-100"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Descripción
            </label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Panic raticida bloque 100g"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Unidad de medida
            </label>
            <select
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Línea
            </label>
            <select
              value={linea}
              onChange={(e) => setLinea(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {LINEAS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Ente regulador
              </label>
              <select
                value={enteRegulador}
                onChange={(e) => setEnteRegulador(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {ENTES_REGULADORES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Empresa
              </label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {EMPRESAS.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          </div>

          <EtapasInput etapas={etapas} setEtapas={setEtapas} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Estado
            </label>
            <button
              type="button"
              onClick={() => setActivo((a) => !a)}
              className="flex items-center gap-2"
            >
              <span
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  activo ? "bg-teal-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activo ? "translate-x-5" : ""
                  }`}
                />
              </span>
              <span className="text-sm text-slate-700">{activo ? "Activo" : "Inactivo"}</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-md text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialogProducto({ producto, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
        <h3 className="font-bold text-slate-800 mb-2" style={{ fontFamily: "'Archivo', sans-serif" }}>
          Eliminar producto
        </h3>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          ¿Seguro que querés eliminar <strong>{producto.descripcion}</strong>? Esta acción no se puede
          deshacer. Si preferís conservarlo en el historial, marcalo como inactivo en vez de eliminarlo.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductosView({ productos, onSave }) {
  const [query, setQuery] = useState("");
  const [lineaFilter, setLineaFilter] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [enteFilter, setEnteFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [formTarget, setFormTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return productos
      .filter((p) => {
        if (q && !p.codigo.toLowerCase().includes(q) && !p.descripcion.toLowerCase().includes(q)) return false;
        if (lineaFilter && p.linea !== lineaFilter) return false;
        if (empresaFilter && p.empresa !== empresaFilter) return false;
        if (enteFilter && p.enteRegulador !== enteFilter) return false;
        if (estadoFilter === "activos" && !p.activo) return false;
        if (estadoFilter === "inactivos" && p.activo) return false;
        return true;
      })
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  }, [productos, query, lineaFilter, empresaFilter, enteFilter, estadoFilter]);

  async function handleSubmit(prod) {
    setSaving(true);
    const exists = productos.some((p) => p.id === prod.id);
    const next = exists
      ? productos.map((p) => (p.id === prod.id ? prod : p))
      : [...productos, prod];
    await onSave(next);
    setSaving(false);
    setShowForm(false);
    setFormTarget(null);
  }

  async function handleDelete() {
    const next = productos.filter((p) => p.id !== deleteTarget.id);
    await onSave(next);
    setDeleteTarget(null);
  }

  const activos = productos.filter((p) => p.activo).length;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest text-slate-400 mb-1"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            Datos maestros
          </p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Productos
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-teal-600 font-bold">{activos}</span>{" "}
            <span className="text-slate-400">activos ·</span>{" "}
            <span className="font-bold text-slate-700">{productos.length}</span>{" "}
            <span className="text-slate-400">en total</span>
          </p>
        </div>
        <button
          onClick={() => { setFormTarget(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select value={lineaFilter} onChange={(e) => setLineaFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Todas las líneas</option>
          {LINEAS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Todas las empresas</option>
          {EMPRESAS.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
        </select>
        <select value={enteFilter} onChange={(e) => setEnteFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Todos los entes</option>
          {ENTES_REGULADORES.map((en) => <option key={en} value={en}>{en}</option>)}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-lg text-slate-400">
          <Package size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Todavía no cargaste ningún producto.</p>
          <p className="text-sm">Tocá <strong>+ Nuevo producto</strong> para agregar el primero.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-medium">Código</th>
                  <th className="py-2.5 px-4 font-medium">Descripción</th>
                  <th className="py-2.5 px-4 font-medium">Línea</th>
                  <th className="py-2.5 px-4 font-medium">Empresa</th>
                  <th className="py-2.5 px-4 font-medium">Ente</th>
                  <th className="py-2.5 px-4 font-medium">Estado</th>
                  <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.codigo}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.descripcion}
                      <span className="block text-xs text-slate-400">{p.unidadMedida}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.linea}</td>
                    <td className="py-3 px-4 text-slate-600">{p.empresa}</td>
                    <td className="py-3 px-4"><Tag>{p.enteRegulador}</Tag></td>
                    <td className="py-3 px-4"><StatusDot active={p.activo} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setFormTarget(p); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{p.descripcion}</p>
                    <p className="text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.codigo} · {p.unidadMedida}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setFormTarget(p); setShowForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag>{p.enteRegulador}</Tag>
                  <StatusDot active={p.activo} />
                </div>
                <p className="text-xs text-slate-500">{p.linea} · {p.empresa}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              Ningún producto coincide con el filtro.
            </p>
          )}
        </>
      )}

      {showForm && (
        <ProductoForm
          initial={formTarget}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setFormTarget(null); }}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmDialogProducto
          producto={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function GanttChart({ partes, onEdit }) {
  const byEmployee = useMemo(() => {
    const groups = {};
    partes.forEach((p) => {
      if (!groups[p.empleadoNombre]) groups[p.empleadoNombre] = [];
      groups[p.empleadoNombre].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [partes]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
      {/* Encabezado columnas */}
      <div className="hidden md:grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: "230px 1fr 150px" }}>
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 border-r border-slate-200">
          Producto · Etapa
        </div>
        <div className="px-4 py-2.5 flex">
          {ESTADOS.map((e) => (
            <div key={e} className="flex-1 text-center">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${ESTADO_CONFIG[e].badge.split(" ")[1]}`}>{e}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right border-l border-slate-200">Estado</div>
      </div>

      {byEmployee.map(([nombre, tareas]) => (
        <div key={nombre}>
          <div className="bg-slate-900 px-4 py-1.5 border-b border-slate-800">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{nombre}</p>
          </div>
          {tareas.map((tarea) => (
            <div
              key={tarea.id}
              onClick={() => onEdit(tarea)}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer md:grid items-center"
              style={{ gridTemplateColumns: "230px 1fr 150px" }}
            >
              {/* Producto y etapa */}
              <div className="px-4 py-3 md:border-r border-slate-100 flex justify-between md:block">
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {tarea.productoCodigo}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{tarea.etapa}</p>
                </div>
                <div className="md:hidden"><EstadoBadge estado={tarea.estado} /></div>
              </div>
              {/* Barra Gantt (solo desktop) */}
              <div className="hidden md:flex px-6 py-3 items-center">
                <GanttBar estado={tarea.estado} />
              </div>
              {/* Badge estado (solo desktop) */}
              <div className="hidden md:flex px-4 py-3 items-center justify-end border-l border-slate-100">
                <EstadoBadge estado={tarea.estado} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ActividadForm({ initial, empleados, productos, onSubmit, onClose, saving }) {
  const [fecha, setFecha] = useState(initial?.fecha || todayISO());
  const [empleadoId, setEmpleadoId] = useState(initial?.empleadoId || "");
  const [productoId, setProductoId] = useState(initial?.productoId || "");
  const [etapa, setEtapa] = useState(initial?.etapa || "");
  const [estado, setEstado] = useState(initial?.estado || "Programado");
  const [cantidad, setCantidad] = useState(initial?.cantidad ?? "");
  const [demora, setDemora] = useState(initial?.demora ?? "");
  const [observaciones, setObservaciones] = useState(initial?.observaciones || "");
  const [error, setError] = useState("");

  const empleadosActivos = useMemo(() => empleados.filter((e) => e.activo), [empleados]);
  const productosActivos = useMemo(() => productos.filter((p) => p.activo), [productos]);

  const productoSeleccionado = useMemo(
    () => productosActivos.find((p) => p.id === productoId),
    [productosActivos, productoId]
  );

  const etapasDisponibles = useMemo(() => {
    if (!productoSeleccionado) return [];
    return (productoSeleccionado.etapas || []).filter((e) => e.activo);
  }, [productoSeleccionado]);

  // Reset etapa cuando cambia el producto
  const prevProductoId = useRef(productoId);
  useEffect(() => {
    if (prevProductoId.current !== productoId) {
      setEtapa("");
      prevProductoId.current = productoId;
    }
  }, [productoId]);

  // Opciones para los dropdowns
  const opcionesEmpleados = useMemo(() =>
    empleadosActivos.map((e) => ({
      value: e.id,
      label: e.nombre,
      sub: puestoActualDe(e) || undefined,
    })),
    [empleadosActivos]
  );

  const opcionesProductos = useMemo(() =>
    productosActivos.map((p) => ({
      value: p.id,
      label: p.codigo,
      sub: p.descripcion,
    })),
    [productosActivos]
  );

  const opcionesEtapas = useMemo(() =>
    etapasDisponibles.map((et) => ({ value: et.nombre, label: et.nombre })),
    [etapasDisponibles]
  );

  const opcionesEstados = ESTADOS.map((est) => ({
    value: est,
    label: est,
    dot: ESTADO_CONFIG[est].dot,
  }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!empleadoId) { setError("Seleccioná un empleado."); return; }
    if (!productoId) { setError("Seleccioná un producto."); return; }
    setError("");
    const emp = empleados.find((e) => e.id === empleadoId);
    const prod = productosActivos.find((p) => p.id === productoId);
    onSubmit({
      id: initial?.id || uid(),
      fecha,
      empleadoId,
      empleadoNombre: emp?.nombre || "",
      productoId,
      productoCodigo: prod?.codigo || "",
      productoDescripcion: prod?.descripcion || "",
      productoUnidad: prod?.unidadMedida || "",
      etapa: etapa || "Sin etapa",
      estado,
      cantidad: cantidad === "" ? null : Number(cantidad),
      demora: demora === "" ? 0 : Number(demora),
      observaciones,
      creadoEn: initial?.creadoEn || new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            {initial ? "Actualizar actividad" : "Nueva actividad"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Persona */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Persona</label>
            <DropdownSelect
              value={empleadoId}
              onChange={setEmpleadoId}
              options={opcionesEmpleados}
              placeholder="Seleccioná una persona..."
              disabled={!!initial}
            />
          </div>

          {/* Código de producto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Código de producto
            </label>
            <DropdownSelect
              value={productoId}
              onChange={setProductoId}
              options={opcionesProductos}
              placeholder="Ingresá o buscá el código..."
              disabled={!!initial}
            />
          </div>

          {/* Descripción — se autocompleta al elegir el código */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Descripción
            </label>
            <div className={`w-full border rounded-md px-3 py-2.5 text-sm min-h-[42px] ${
              productoSeleccionado
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-300 italic"
            }`}>
              {productoSeleccionado
                ? productoSeleccionado.descripcion
                : "Se completa al seleccionar el código"}
            </div>
            {productoSeleccionado && (
              <p className="text-xs text-slate-400 mt-1">
                Unidad: <strong className="text-slate-500">{productoSeleccionado.unidadMedida}</strong>
                {" · "}Línea: <strong className="text-slate-500">{productoSeleccionado.linea}</strong>
              </p>
            )}
          </div>

          {/* Función / Etapa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Función / Etapa
            </label>
            {!productoSeleccionado ? (
              <div className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-slate-50 text-slate-300 italic">
                Se habilita al seleccionar el código de producto
              </div>
            ) : etapasDisponibles.length === 0 ? (
              <div className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-slate-50 text-slate-400">
                Este producto no tiene etapas activas definidas
              </div>
            ) : (
              <DropdownSelect
                value={etapa}
                onChange={setEtapa}
                options={opcionesEtapas}
                placeholder="Seleccioná la etapa..."
                searchable={etapasDisponibles.length > 5}
              />
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Estado</label>
            <DropdownSelect
              value={estado}
              onChange={setEstado}
              options={opcionesEstados}
              placeholder="Seleccioná un estado..."
              searchable={false}
            />
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Cantidad {productoSeleccionado && (
                <span className="text-slate-400 font-normal normal-case">— {productoSeleccionado.unidadMedida}</span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad producida"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Tiempo de demora */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Tiempo de demora <span className="text-slate-400 font-normal">(Hs)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.25"
              value={demora}
              onChange={(e) => setDemora(e.target.value)}
              placeholder="Ej: 0.5 = 30 min de parada"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-xs text-slate-400 mt-1">Se descuenta de las horas disponibles para el cálculo de eficiencia.</p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Observaciones / Desvíos
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Desvíos, paradas, incidentes..."
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2.5 rounded-md text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ParteView({ partes, empleados, productos, onSave }) {
  const [fecha, setFecha] = useState(todayISO());
  const [showForm, setShowForm] = useState(false);
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const partesDelDia = useMemo(
    () => partes
      .filter((p) => p.fecha === fecha)
      .sort((a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre)),
    [partes, fecha]
  );

  const counts = useMemo(() => {
    const c = { "Programado": 0, "En curso": 0, "Para continuar": 0, "Terminado": 0 };
    partesDelDia.forEach((p) => { if (c[p.estado] !== undefined) c[p.estado]++; });
    return c;
  }, [partesDelDia]);

  async function handleSubmit(actividad) {
    setSaving(true);
    const exists = partes.some((p) => p.id === actividad.id);
    const next = exists
      ? partes.map((p) => (p.id === actividad.id ? actividad : p))
      : [...partes, actividad];
    await onSave(next);
    setSaving(false);
    setShowForm(false);
    setFormTarget(null);
  }

  async function handleDelete() {
    const next = partes.filter((p) => p.id !== deleteTarget.id);
    await onSave(next);
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Registro de producción
          </p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Parte Diario
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={() => { setFormTarget(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md"
          >
            <Plus size={16} /> Nueva actividad
          </button>
        </div>
      </div>

      {/* KPIs por estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {ESTADOS.map((est) => {
          const cfg = ESTADO_CONFIG[est];
          const [bg, text] = cfg.badge.split(" ");
          return (
            <div key={est} className={`rounded-lg p-3 border ${bg} border-current border-opacity-20`}>
              <p className={`text-2xl font-bold ${text}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {String(counts[est]).padStart(2, "0")}
              </p>
              <p className="text-xs mt-0.5 text-slate-500">{est}</p>
            </div>
          );
        })}
      </div>

      {partesDelDia.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-lg text-slate-400">
          <ClipboardList size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No hay actividades para este día.</p>
          <p className="text-sm">Tocá <strong>+ Nueva actividad</strong> para empezar.</p>
        </div>
      ) : (
        <>
          {/* Gantt */}
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Gantt del día</h2>
          <GanttChart
            partes={partesDelDia}
            onEdit={(act) => { setFormTarget(act); setShowForm(true); }}
          />

          {/* Tabla detalle */}
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Detalle de actividades</h2>

          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500 border-b border-slate-200 text-xs">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Persona</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Código</th>
                  <th className="py-2.5 px-3 font-semibold">Descripción</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Función</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">Cantidad</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Unidad</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Estado</th>
                  <th className="py-2.5 px-3 font-semibold">Observaciones</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Acc.</th>
                </tr>
              </thead>
              <tbody>
                {partesDelDia.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDate(p.fecha)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">{p.empleadoNombre}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.productoCodigo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[180px] truncate">{p.productoDescripcion}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{p.etapa}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.cantidad !== null ? p.cantidad : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-xs">{p.productoUnidad}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap"><EstadoBadge estado={p.estado} /></td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[160px] truncate">
                      {p.observaciones || <span className="text-slate-200">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setFormTarget(p); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {partesDelDia.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{p.empleadoNombre}</p>
                    <p className="text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.productoCodigo} · {p.etapa}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setFormTarget(p); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-slate-700">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{p.productoDescripcion}</p>
                <div className="mb-2"><GanttBar estado={p.estado} /></div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {p.cantidad !== null ? `${p.cantidad} ${p.productoUnidad}` : "Sin cantidad"}
                  </span>
                  <EstadoBadge estado={p.estado} />
                </div>
                {p.observaciones && (
                  <p className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">{p.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <ActividadForm
          initial={formTarget}
          empleados={empleados}
          productos={productos}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setFormTarget(null); }}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="font-bold text-slate-800 mb-2" style={{ fontFamily: "'Archivo', sans-serif" }}>Eliminar actividad</h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              ¿Seguro que querés eliminar la actividad de <strong>{deleteTarget.empleadoNombre}</strong> —{" "}
              <strong>{deleteTarget.productoCodigo}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TiempoForm({ initial, productos, tiempos, onSubmit, onClose, saving }) {
  const [productoId, setProductoId] = useState(initial?.productoId || "");
  const [etapa, setEtapa] = useState(initial?.etapa || "");
  const [tiempoHs, setTiempoHs] = useState(initial?.tiempoHs ?? "");
  const [observaciones, setObservaciones] = useState(initial?.observaciones || "");
  const [error, setError] = useState("");

  const productosActivos = useMemo(() => productos.filter((p) => p.activo), [productos]);

  const productoSeleccionado = useMemo(
    () => productosActivos.find((p) => p.id === productoId),
    [productosActivos, productoId]
  );

  const etapasDisponibles = useMemo(() => {
    if (!productoSeleccionado) return [];
    return (productoSeleccionado.etapas || []).filter((e) => e.activo);
  }, [productoSeleccionado]);

  const prevProductoId = useRef(productoId);
  useEffect(() => {
    if (prevProductoId.current !== productoId) {
      setEtapa("");
      prevProductoId.current = productoId;
    }
  }, [productoId]);

  const opcionesProductos = useMemo(() =>
    productosActivos.map((p) => ({ value: p.id, label: p.codigo, sub: p.descripcion })),
    [productosActivos]
  );

  const opcionesEtapas = useMemo(() =>
    etapasDisponibles.map((et) => ({ value: et.nombre, label: et.nombre })),
    [etapasDisponibles]
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!productoId) { setError("Seleccioná un producto."); return; }
    if (!etapa && etapasDisponibles.length > 0) { setError("Seleccioná una etapa."); return; }
    if (tiempoHs === "" || isNaN(Number(tiempoHs)) || Number(tiempoHs) <= 0) {
      setError("Ingresá un tiempo válido mayor a cero.");
      return;
    }
    // Verificar duplicados (excepto al editar el mismo)
    const duplicado = tiempos.some(
      (t) => t.productoId === productoId && t.etapa === (etapa || "Sin etapa") && t.id !== initial?.id
    );
    if (duplicado) {
      setError("Ya existe un tiempo estándar para este producto y etapa.");
      return;
    }
    setError("");
    const prod = productosActivos.find((p) => p.id === productoId);
    onSubmit({
      id: initial?.id || uid(),
      productoId,
      productoCodigo: prod?.codigo || "",
      productoDescripcion: prod?.descripcion || "",
      etapa: etapa || "Sin etapa",
      tiempoHs: Number(tiempoHs),
      observaciones,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            {initial ? "Editar tiempo estándar" : "Nuevo tiempo estándar"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {/* Código */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Código de producto
            </label>
            <DropdownSelect
              value={productoId}
              onChange={setProductoId}
              options={opcionesProductos}
              placeholder="Buscá por código..."
              disabled={!!initial}
            />
          </div>

          {/* Descripción auto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Descripción
            </label>
            <div className={`w-full border rounded-md px-3 py-2.5 text-sm ${
              productoSeleccionado
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-300 italic"
            }`}>
              {productoSeleccionado ? productoSeleccionado.descripcion : "Se completa al seleccionar el código"}
            </div>
          </div>

          {/* Etapa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Etapa
            </label>
            {!productoSeleccionado ? (
              <div className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-slate-50 text-slate-300 italic">
                Se habilita al seleccionar el código
              </div>
            ) : etapasDisponibles.length === 0 ? (
              <div className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-slate-50 text-slate-400">
                Este producto no tiene etapas activas definidas
              </div>
            ) : (
              <DropdownSelect
                value={etapa}
                onChange={setEtapa}
                options={opcionesEtapas}
                placeholder="Seleccioná la etapa..."
                searchable={etapasDisponibles.length > 5}
              />
            )}
          </div>

          {/* Tiempo estándar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Tiempo estándar <span className="text-slate-400 font-normal">(Hs)</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.25"
              value={tiempoHs}
              onChange={(e) => setTiempoHs(e.target.value)}
              placeholder="Ej: 2.5"
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Usá decimales para fracciones de hora. Ej: 1.5 = 1 h 30 min
            </p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Condiciones del tiempo estándar, aclaraciones..."
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2.5 rounded-md text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TiemposView({ tiempos, productos, onSave }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Agrupa por producto y filtra
  const grupos = useMemo(() => {
    const q = query.toLowerCase();
    const filtrados = tiempos.filter((t) =>
      !q ||
      t.productoCodigo.toLowerCase().includes(q) ||
      t.productoDescripcion.toLowerCase().includes(q) ||
      t.etapa.toLowerCase().includes(q)
    );
    const map = {};
    filtrados.forEach((t) => {
      if (!map[t.productoId]) {
        map[t.productoId] = {
          codigo: t.productoCodigo,
          descripcion: t.productoDescripcion,
          etapas: [],
        };
      }
      map[t.productoId].etapas.push(t);
    });
    return Object.values(map).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [tiempos, query]);

  const totalHs = useMemo(() => tiempos.reduce((s, t) => s + t.tiempoHs, 0), [tiempos]);

  async function handleSubmit(tiempo) {
    setSaving(true);
    const exists = tiempos.some((t) => t.id === tiempo.id);
    const next = exists
      ? tiempos.map((t) => (t.id === tiempo.id ? tiempo : t))
      : [...tiempos, tiempo];
    await onSave(next);
    setSaving(false);
    setShowForm(false);
    setFormTarget(null);
  }

  async function handleDelete() {
    await onSave(tiempos.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Datos maestros
          </p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Archivo', sans-serif" }}>
            Tiempos estándar
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-cyan-600 font-bold">{tiempos.length}</span>{" "}
            <span className="text-slate-400">etapas registradas ·</span>{" "}
            <span className="font-bold text-slate-700">{totalHs.toFixed(2)}</span>{" "}
            <span className="text-slate-400">Hs totales</span>
          </p>
        </div>
        <button
          onClick={() => { setFormTarget(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <Plus size={16} /> Nuevo tiempo estándar
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código, descripción o etapa..."
          className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {tiempos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-lg text-slate-400">
          <Clock size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Todavía no cargaste tiempos estándar.</p>
          <p className="text-sm">Tocá <strong>+ Nuevo tiempo estándar</strong> para empezar.</p>
        </div>
      ) : grupos.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-8">Ningún resultado coincide con la búsqueda.</p>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const totalGrupo = grupo.etapas.reduce((s, e) => s + e.tiempoHs, 0);
            return (
              <div key={grupo.codigo} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Header del producto */}
                <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {grupo.codigo}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">— {grupo.descripcion}</span>
                  </div>
                  <span className="text-slate-400 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Total: <strong className="text-white">{totalGrupo.toFixed(2)} Hs</strong>
                  </span>
                </div>

                {/* Tabla desktop */}
                <table className="w-full text-sm hidden md:table">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-500 border-b border-slate-200 text-xs">
                      <th className="py-2 px-4 font-semibold">Etapa</th>
                      <th className="py-2 px-4 font-semibold text-right">Tiempo estándar</th>
                      <th className="py-2 px-4 font-semibold">Observaciones</th>
                      <th className="py-2 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.etapas.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-slate-700">{t.etapa}</td>
                        <td className="py-2.5 px-4 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <span className="font-bold text-slate-800">{t.tiempoHs.toFixed(2)}</span>
                          <span className="text-slate-400 text-xs ml-1">Hs</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-xs max-w-[220px] truncate">
                          {t.observaciones || <span className="text-slate-200">—</span>}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => { setFormTarget(t); setShowForm(true); }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Cards mobile */}
                <div className="md:hidden divide-y divide-slate-100">
                  {grupo.etapas.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{t.etapa}</p>
                        {t.observaciones && <p className="text-xs text-slate-400 truncate">{t.observaciones}</p>}
                      </div>
                      <span className="font-bold text-slate-800 text-sm flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {t.tiempoHs.toFixed(2)} Hs
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setFormTarget(t); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-slate-700">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-slate-400 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TiempoForm
          initial={formTarget}
          productos={productos}
          tiempos={tiempos}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setFormTarget(null); }}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="font-bold text-slate-800 mb-2" style={{ fontFamily: "'Archivo', sans-serif" }}>
              Eliminar tiempo estándar
            </h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              ¿Seguro que querés eliminar el tiempo estándar de{" "}
              <strong>{deleteTarget.productoCodigo} — {deleteTarget.etapa}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-extrabold text-blue-800 text-lg tracking-wide" style={{ fontFamily: "'Archivo', sans-serif" }}>BiNKA</p>
            <p className="text-xs text-slate-400">Parte Diario</p>
          </div>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: "'Archivo', sans-serif" }}>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 rounded-md text-sm disabled:opacity-60 mt-2">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default function App({ isAdmin = true, userEmail = "" }) {
const [authState, setAuthState] = useState(null);
const [activeTab, setActiveTab] = useState("inicio");
const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [partes, setPartes] = useState([]);
  const [tiempos, setTiempos] = useState([]);
  const [ausencias, setAusencias] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  window.supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) {
      const role = data.session.user.user_metadata?.role || "operario";
      setAuthState({ user: data.session.user, role });
    } else {
      setAuthState(false);
    }
  });
  const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((_e, session) => {
    if (session) {
      const role = session.user.user_metadata?.role || "operario";
      setAuthState({ user: session.user, role });
    } else {
      setAuthState(false);
    }
  });
  return () => subscription.unsubscribe();
}, []);
  useEffect(() => {
    let active = true;
    async function load() {
      let empleadosData = [];
      try {
        const res = await window.storage.get("empleados", true);
        if (res && res.value) empleadosData = JSON.parse(res.value);
      } catch (e) {
        // no hay datos guardados todavía
      }

      // Migración: versiones anteriores guardaban puesto/categoría como campo fijo (sin historial).
      let migrated = false;
      empleadosData = empleadosData.map((e) => {
        let updated = e;
        if (!updated.historialCategorias) {
          migrated = true;
          updated = updated.categoria
            ? { ...updated, historialCategorias: [{ id: uid(), categoria: updated.categoria, desde: todayISO() }] }
            : { ...updated, historialCategorias: [] };
        }
        if (!updated.historialPuestos) {
          migrated = true;
          updated = updated.puesto
            ? { ...updated, historialPuestos: [{ id: uid(), puesto: updated.puesto, desde: todayISO() }] }
            : { ...updated, historialPuestos: [] };
        }
        return updated;
      });
      if (migrated) {
        try {
          await window.storage.set("empleados", JSON.stringify(empleadosData), true);
        } catch (e) {
          // si falla, se reintenta en el próximo guardado manual
        }
      }

      let productosData = [];
      try {
        const resProd = await window.storage.get("productos", true);
        if (resProd && resProd.value) productosData = JSON.parse(resProd.value);
      } catch (e) {
        // no hay datos guardados todavía
      }

      let partesData = [];
      try {
        const resPart = await window.storage.get("partes", true);
        if (resPart && resPart.value) partesData = JSON.parse(resPart.value);
      } catch (e) {}

      let tiemposData = [];
      try {
        const resTiempos = await window.storage.get("tiempos", true);
        if (resTiempos && resTiempos.value) tiemposData = JSON.parse(resTiempos.value);
      } catch (e) {}

      let ausenciasData = {};
      try {
        const resAus = await window.storage.get("ausencias", true);
        if (resAus && resAus.value) ausenciasData = JSON.parse(resAus.value);
      } catch (e) {}

      if (active) {
        setEmpleados(empleadosData);
        setProductos(productosData);
        setPartes(partesData);
        setTiempos(tiemposData);
        setAusencias(ausenciasData);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const persistEmpleados = useCallback(async (next) => {
    setEmpleados(next);
    try {
      const result = await window.storage.set("empleados", JSON.stringify(next), true);
      if (!result) setError("No se pudo guardar el cambio. Probá de nuevo.");
    } catch (e) {
      setError("No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.");
    }
  }, []);

  const persistProductos = useCallback(async (next) => {
    setProductos(next);
    try {
      const result = await window.storage.set("productos", JSON.stringify(next), true);
      if (!result) setError("No se pudo guardar el cambio. Probá de nuevo.");
    } catch (e) {
      setError("No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.");
    }
  }, []);

  const persistPartes = useCallback(async (next) => {
    setPartes(next);
    try {
      const result = await window.storage.set("partes", JSON.stringify(next), true);
      if (!result) setError("No se pudo guardar el cambio. Probá de nuevo.");
    } catch (e) {
      setError("No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.");
    }
  }, []);

  const persistTiempos = useCallback(async (next) => {
    setTiempos(next);
    try {
      const result = await window.storage.set("tiempos", JSON.stringify(next), true);
      if (!result) setError("No se pudo guardar el cambio. Probá de nuevo.");
    } catch (e) {
      setError("No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.");
    }
  }, []);

  const toggleAusencia = useCallback(async (empleadoId, fecha) => {
    setAusencias((prev) => {
      const actual = prev[fecha] || [];
      const next = actual.includes(empleadoId)
        ? actual.filter((id) => id !== empleadoId)
        : [...actual, empleadoId];
      const nuevas = { ...prev, [fecha]: next };
      window.storage.set("ausencias", JSON.stringify(nuevas), true).catch(() => {});
      return nuevas;
    });
  }, []);

  function handleNav(id) {
    setActiveTab(id);
    setSidebarOpen(false);
  }

  return (
if (authState === null) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-slate-400" /></div>;
if (authState === false) return <Login />;
const isAdmin = authState.role === "jefe";
      <div className="min-h-screen bg-blue-50 flex" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');`}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-blue-900 text-slate-300 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800">
          <div className="w-9 h-9 rounded-md bg-cyan-500 flex items-center justify-center text-slate-900 shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-cyan-400 font-extrabold text-base leading-tight tracking-wide" style={{ fontFamily: "'Archivo', sans-serif" }}>
              BiNKA
            </p>
            <p className="text-[11px] text-slate-400">Parte Diario · Panel de planta</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-slate-400"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.filter(item => isAdmin || !["empleados","productos","tiempos"].includes(item.id)).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  active ? "bg-blue-800 text-cyan-400" : "text-slate-400 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <Icon size={17} /> {item.label}
              </button>
            );
          })}
        </nav>
<div className="px-5 py-4 border-t border-blue-800 space-y-2">
  <p className="text-[11px] text-blue-300">{authState.user.email}</p>
  <button onClick={() => window.supabaseClient.auth.signOut()}
    className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors">
    <LogOut size={14} /> Cerrar sesión
  </button>
</div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600" aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <span className="font-extrabold tracking-wide text-cyan-600" style={{ fontFamily: "'Archivo', sans-serif" }}>
            BiNKA <span className="text-slate-500 font-medium">· Parte Diario</span>
          </span>
        </header>

        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">
          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              <AlertCircle size={15} /> {error}
              <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600" aria-label="Cerrar aviso">
                <X size={14} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
              <Loader2 size={18} className="animate-spin" /> Cargando datos...
            </div>
          ) : (
            <>
              {activeTab === "inicio" && (
                <DashboardView
                  empleados={empleados}
                  productos={productos}
                  partes={partes}
                  tiempos={tiempos}
                  ausencias={ausencias}
                  onToggleAusencia={toggleAusencia}
                />
              )}
              {activeTab === "empleados" && (
                <EmpleadosView empleados={empleados} onSave={persistEmpleados} />
              )}
              {activeTab === "parte" && (
                <ParteView
                  partes={partes}
                  empleados={empleados}
                  productos={productos}
                  onSave={persistPartes}
                />
              )}
              {activeTab === "productos" && (
                <ProductosView productos={productos} onSave={persistProductos} />
              )}
              {activeTab === "tiempos" && (
                <TiemposView tiempos={tiempos} productos={productos} onSave={persistTiempos} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
