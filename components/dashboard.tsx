"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  CarIcon,
  ArrowDownRight,
  ArrowUp,
  ArrowUpDown,
  CheckCheck,
  CircleAlert,
  ChevronDown,
  ChevronRight,
  Database,
  DollarSign,
  Eye,
  FileDown,
  Loader2,
  PiggyBank,
  Receipt,
  Repeat,
  Search,
  TrendingUp,
  Wallet,
  ExternalLinkIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard-card";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useTasa } from "@/components/tasa-context";
import { useSeccion } from "@/components/seccion-context";
import datos from "@/data/gastos.json";
import estadosJson from "@/data/estados_cuenta.json";
import bancoJson from "@/data/banco.json";
import fondoJson from "@/data/fondo.json";

/* ---------- tipos cuenta bancaria ---------- */
type MovBanco = {
  f: string; ym: string; cod: string; tipo: string; concepto: string; para: string; ref: string;
  dir: number; bs: number; saldo: number;
  usd: number | null; tasa: number | null;
  taurus: boolean; gladys: string | null; comision: boolean;
  subcat: string; archivos: string[]; verbatim: string;
};
type PendienteUsd = { fila_csv: number; fecha: string; concepto: string; verbatim: string; bs: number; ref: string; archivos: string[] };
const BANCO = bancoJson as {
  meta: {
    n_movs: number; n_meses: number; desde: string; hasta: string;
    total_entro_bs: number; total_salio_bs: number; saldo_final_bs: number;
    n_compras_usd: number; n_compras_verificadas: number; usd_comprados: number;
    n_taurus: number; taurus_bs: number;
    n_gladys_envios: number; gladys_enviados_bs: number; n_gladys_devoluciones: number; gladys_devueltos_bs: number;
  };
  auditoria_usd: {
    verificadas: number; discrepancias_tasa: number;
    pendientes: PendienteUsd[];
    salvedad: { desde: string; n: number; bs: number };
  };
  meses: { ym: string; n: number; entro: number; salio: number; saldo_fin: number; comisiones: number; n_compras: number; usd: number }[];
  movs: MovBanco[];
};
const SUBCAT_BANCO: Record<string, string> = {
  cuota_condominio: "Cuota de condominio",
  estacionamiento: "Estacionamiento",
  ingreso_credito_inmediato: "Ingreso · crédito inmediato",
  reintegro: "Reintegro / devolución",
  compra_usd: "Compra de dólares",
  pago_credito_inmediato: "Pago · crédito inmediato",
  comision_credito_inmediato: "Comisión de crédito inmediato",
  comision_mantenimiento: "Comisión de mantenimiento",
  servicio_tecnico: "Servicio técnico",
  transferencia: "Transferencia recibida",
  interes: "Intereses",
  islr: "ISLR",
  otro: "Otro",
};

/* ---------- tipos estados de cuenta ---------- */
type EstadoArchivo = {
  anio: string; nombre: string; ruta: string; sha256: string; bytes: number;
  meses: string[]; n_movs: number; entro_bs: number; salio_bs: number;
  primer_mov: string; ultimo_mov: string; compras_usd: number;
};
type EstadoHueco = { ultimo_mov: string; saldo_antes: number; primer_mov: string; saldo_despues: number; diferencia: number };
type EstadoSolape = { mes: string; n: number; archivos: string[] };
const EST = estadosJson as {
  meta: {
    csv_consolidado: string; csv_sha256: string; cuenta: string;
    n_archivos: number; n_movimientos: number; n_meses: number; desde: string; hasta: string;
    total_entro_bs: number; total_salio_bs: number; saldo_final_bs: number;
    n_duplicados: number; n_movs_en_varios_archivos: number;
    meses_cuadran: number; meses_revisables: number; n_huecos: number; n_compras_usd: number;
  };
  huecos: EstadoHueco[];
  solapes: EstadoSolape[];
  archivos: EstadoArchivo[];
};

/* ---------- tipos conciliación: fondo de reserva → US$ ---------- */
type FondoMes = {
  ym: string; fondo_bs: number; fondo_n: number; prest_bs: number; trabajo_bs: number;
  c_mes_bs: number; c_mes_usd: number; c_mes_n: number;
  c_sig_bs: number; c_sig_usd: number;
  eg_mes_bs: number;
  usd_equiv: number | null; usd_tasa: string | null; veredicto: string | null;
  detalle: { f: string; concepto: string; bs: number }[];
};
const FONDO = fondoJson as {
  meta: {
    alcance: string; regla: string; tolerancia_pct: number;
    n_meses: number; n_meses_con_fondo: number;
    fondo_total_bs: number; fondo_total_usd_equiv: number;
    fondo_sacado_bs: number; fondo_sacado_usd: number; n_sacado: number;
    n_ese_mes: number; n_siguiente: number; n_sin_monto: number; n_parcial: number; n_no: number;
    prest_total_bs: number; trabajo_total_bs: number;
  };
  salvedad: {
    desde: string; nota: string; n: number; bs: number;
    detalle: { fecha: string; razon: string; bs: number; destino: string; archivos: string[] }[];
  };
  recibo_vs_banco: {
    regla: string; n_recibo: number; n_coinciden: number; n_aproximado: number;
    n_no: number; n_sin_entrada: number;
    meses: { ym: string; recibo_bs: number; banco_bs: number; dif_bs: number; estado: string }[];
  };
  meses: FondoMes[];
};
const ESTADO_RECIBO: Record<string, { label: string; color: string }> = {
  coincide: { label: "Coincide", color: "var(--c-positive)" },
  aproximado: { label: "Aproximado", color: "var(--c-warning)" },
  no_coincide: { label: "No coincide", color: "var(--c-negative)" },
  sin_entrada_banco: { label: "Sin entrada en el banco", color: "var(--c-warning)" },
  anterior_al_recibo: { label: "Antes del primer recibo", color: "var(--c-neutral)" },
};

/* ---------- visor de estados de cuenta ---------- */
type VisorTarget = { nombre: string; ruta: string } | null;
type VisorHoja = { nombre: string; filas: string[][] };

function VisorHojaCarga({ ruta }: { ruta: string }) {
  const [hojaIdx, setHojaIdx] = useState(0);
  const [hojas, setHojas] = useState<VisorHoja[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const res = await fetch(encodeURI(ruta));
        if (!res.ok) throw new Error(String(res.status));
        const wb = XLSX.read(await res.arrayBuffer(), { type: "array" });
        const parsed = wb.SheetNames.map((n) => ({
          nombre: n,
          filas: XLSX.utils.sheet_to_json<string[]>(wb.Sheets[n], { header: 1, defval: "", raw: false }) as string[][],
        }));
        if (!cancel) setHojas(parsed);
      } catch {
        if (!cancel) setError("No se pudo leer el archivo en el navegador — descárgalo para verlo.");
      }
    })();
    return () => { cancel = true; };
  }, [ruta]);

  if (error) return <p className="p-6 text-sm" style={{ color: V.negative }}>{error}</p>;
  if (!hojas) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />Leyendo el archivo…
      </div>
    );
  }
  const hoja = hojas[hojaIdx];
  return (
    <>
      {hojas.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
          {hojas.map((h, i) => (
            <button key={h.nombre + i} onClick={() => setHojaIdx(i)}
              className={"rounded-md border px-2 py-1 text-xs " + (i === hojaIdx ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {h.nombre}
            </button>
          ))}
        </div>
      )}
      <div className="max-h-[70vh] overflow-auto">
        <Table>
          <TableBody>
            {hoja.filas.map((fila, i) => (
              <TableRow key={i} className={i === 0 ? "bg-muted/60 font-medium" : ""}>
                {fila.map((celda, j) => (
                  <TableCell key={j} className="max-w-[320px] truncate whitespace-nowrap text-xs" title={String(celda)}>
                    {String(celda)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function VisorArchivo({ archivo, onClose }: { archivo: VisorTarget; onClose: () => void }) {
  if (!archivo) return null;
  const esPdf = archivo.ruta.toLowerCase().endsWith(".pdf");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{archivo.nombre}</p>
            <p className="text-xs text-muted-foreground">Archivo original tal cual emitido por el banco</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href={encodeURI(archivo.ruta)} download
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <FileDown className="size-3.5" />Descargar
            </a>
            <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
        <div className="min-h-[50vh] flex-1 overflow-auto bg-muted/20">
          {esPdf ? (
            <iframe src={encodeURI(archivo.ruta)} title={archivo.nombre} className="h-[75vh] w-full" />
          ) : (
            <VisorHojaCarga key={archivo.ruta} ruta={archivo.ruta} />
          )}
        </div>
      </div>
    </div>
  );
}
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const etiquetaMes = (ym: string) => MESES_CORTOS[Number(ym.slice(5, 7)) - 1] + "-" + ym.slice(2, 4);

/* ---------- tipos ---------- */
type Concepto = {
  concepto: string;
  codes: string[];
  n: number;
  meses: number;
  bs: number;
  usd: number;
  usd_par: number;
  ejemplo: string;
};
type Item = {
  a: number;
  m: string;
  s: string;
  c: string;
  d: string;
  q: number;
  t: number;
  u: number;
  p: number;
};
type Fondo = { n: number; bs: number; usd: number; usd_par: number };

const D = datos as {
  meta: { meses: number; desde: string; hasta: string; partidas: number; tot_bs: number; tot_usd: number; tot_usd_par: number };
  por_anio: { anio: string; bs: number; usd: number; usd_par: number; n: number }[];
  por_seccion: { seccion: string; bs: number; usd: number; usd_par: number; n: number }[];
  conceptos: Concepto[];
  serie_mes: { ym: string; bs: number; usd: number; usd_par: number }[];
  fondo_acum: { ym: string; acum_bs: number }[];
  fondo_acum_usd: { ym: string; acum_usd: number }[];
  fondo_acum_par: { ym: string; acum_usd: number }[];
  paralelo_mes: { ym: string; tasa: number; bcv: number; fuente: string; link: string; brecha: number }[];
  fondos: Record<string, Fondo>;
  devoluciones: {
    total_bs: number;
    total_usd: number;
    total_usd_par: number;
    por_concepto: { concepto: string; n: number; bs: number; usd: number; usd_par: number; ejemplo: string }[];
  };
  facturacion: { cat: string; n: number; bs: number; usd: number; usd_par: number }[];
  recurrentes: Concepto[];
  items: Item[];
};

/* ---------- formato ---------- */
const nf2 = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });
const fmt = (v: number) => nf2.format(v);
const fmt0 = (v: number) => nf0.format(v);
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/* colores desde tokens del tema (claro/oscuro) */
const V = {
  primary: "var(--c-primary)",
  positive: "var(--c-positive)",
  warning: "var(--c-warning)",
  negative: "var(--c-negative)",
  neutral: "var(--c-neutral)",
};
const PALETA = Array.from({ length: 10 }, (_, i) => `var(--c-p${i + 1})`);
const GRID = "var(--border)";
const TICK = { fill: "var(--muted-foreground)", fontSize: 11 } as const;

/* estacionamientos: cuota fija en dólares cobrada desde ene-2023 */
const CUOTA_EST = 50;
const EST_DESDE = "2023-01";

const NOMBRES_SECCION: Record<string, string> = {
  "GASTOS COMUNES": "Gastos comunes",
  FONDOS: "Fondos",
  "GASTOS NO COMUNES": "Gastos no comunes",
  "FONDOS NO COMUNES": "Fondos no comunes",
};

const CAT_FACT: Record<string, string> = {
  factura_citada: "Con factura citada en el recibo",
  recibo_servicio: "Servicios públicos (recibo oficial)",
  nomina_parafiscales: "Nómina y parafiscales",
  administracion_fondos: "Administración, fondos e IVA",
  terceros_verificar_factura: "Terceros: verificar factura",
};

/* configs de charts (patrón shadcn/efferd) */
const aniosConfig = {
  usd: { label: "US$ (cierre de mes)", color: "var(--c-primary)" },
  bs: { label: "Bs", color: "var(--c-warning)" },
} satisfies ChartConfig;

const mensualConfig = {
  usd: { label: "US$", color: "var(--c-primary)" },
} satisfies ChartConfig;

const fondoBsConfig = {
  acum_bs: { label: "Acumulado Bs", color: "var(--c-positive)" },
} satisfies ChartConfig;

const fondoUsdConfig = {
  acum_usd: { label: "Acumulado US$", color: "var(--c-primary)" },
} satisfies ChartConfig;

const seccionConfig = Object.fromEntries(
  D.por_seccion.map((s, i) => [
    s.seccion,
    { label: NOMBRES_SECCION[s.seccion] ?? s.seccion, color: PALETA[i % PALETA.length] },
  ])
) satisfies ChartConfig;

const factConfig = Object.fromEntries(
  D.facturacion.map((f, i) => [
    f.cat,
    { label: CAT_FACT[f.cat] ?? f.cat, color: PALETA[i % PALETA.length] },
  ])
) satisfies ChartConfig;

/* leyenda propia (chips HTML FUERA del contenedor del gráfico) */
function LeyendaChips({ items }: { items: { color: string; label: string; extra?: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
          <span className="truncate">{it.label}</span>
          {it.extra && <span className="font-medium tabular-nums text-foreground">{it.extra}</span>}
        </span>
      ))}
    </div>
  );
}

/* KPI al estilo efferd (DashboardCard plano) */
function Kpi({ icono, tinte, titulo, valor, sub }: {
  icono: React.ReactNode; tinte: string; titulo: string; valor: string; sub: string;
}) {
  return (
    <DashboardCard className="animar-kpi gap-1 py-4">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="text-[11px] font-medium tracking-wide text-muted-foreground">{titulo}</CardTitle>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${tinte} 14%, transparent)`, color: tinte }}
        >
          {icono}
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{valor}</p>
      </CardContent>
      <CardFooter className="px-4 pt-0">
        <span className="text-xs text-muted-foreground">{sub}</span>
      </CardFooter>
    </DashboardCard>
  );
}

function ThOrden<T extends string>({ label, clave, orden, onOrden, right }: {
  label: string; clave: T; orden: { k: T; asc: boolean }; onOrden: (k: T) => void; right?: boolean;
}) {
  const activo = orden.k === clave;
  return (
    <TableHead className={right ? "text-right" : ""}>
      <button
        onClick={() => onOrden(clave)}
        className={"inline-flex items-center gap-1 rounded text-xs font-medium hover:text-foreground " + (activo ? "text-foreground" : "text-muted-foreground")}
      >
        {label}
        {activo ? (orden.asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </TableHead>
  );
}

function EncabezadoSeccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
      <p className="text-sm text-muted-foreground">{descripcion}</p>
    </div>
  );
}

type ClaveOrden = "concepto" | "n" | "meses" | "bs" | "usd";

export default function Contenido() {
  const { seccion } = useSeccion();
  const { tasa } = useTasa();
  const enParalelo = tasa === "paralelo";
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";
  const movil = useIsMobile();
  const H = {
    anios: movil ? 240 : 300,
    pie: movil ? 240 : 280,
    mensual: movil ? 230 : 280,
    conceptos: movil ? 400 : 430,
    fondo: movil ? 230 : 280,
    dev: movil ? 310 : 340,
    rec: movil ? 380 : 420,
    fact: movil ? 240 : 280,
  };
  const W = { ejeY: movil ? 128 : 215 };
  const TRUNC = movil ? 18 : 36;

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ k: ClaveOrden; asc: boolean }>({ k: "usd", asc: false });
  const [fAnio, setFAnio] = useState("todos");
  const [fSeccion, setFSeccion] = useState("todas");
  const [pagina, setPagina] = useState(0);
  const [anioEst, setAnioEst] = useState("todos");
  const [visor, setVisor] = useState<VisorTarget>(null);
  const archivosEst = useMemo(
    () => (anioEst === "todos" ? EST.archivos : EST.archivos.filter((a) => a.anio === anioEst)),
    [anioEst]
  );
  const aniosEst = useMemo(() => Array.from(new Set(EST.archivos.map((a) => a.anio))).sort(), []);

  /* ---------- cuenta bancaria: filtros ---------- */
  const [anioB, setAnioB] = useState("todos");
  const [mesB, setMesB] = useState("todos");
  const [vistaB, setVistaB] = useState("todos");
  const [buscaB, setBuscaB] = useState("");
  const [paginaB, setPaginaB] = useState(0);
  const [abiertoB, setAbiertoB] = useState<number | null>(null);
  const nComisionesB = useMemo(() => BANCO.movs.filter((m) => m.comision).length, []);
  const movsFiltrados = useMemo(() => {
    const q = buscaB.trim().toLowerCase();
    return BANCO.movs.filter((m) => {
      if (anioB !== "todos" && m.f.slice(0, 4) !== anioB) return false;
      if (mesB !== "todos" && m.f.slice(5, 7) !== mesB) return false;
      if (vistaB === "entradas" && m.dir !== 1) return false;
      if (vistaB === "salidas" && m.dir !== -1) return false;
      if (vistaB === "compras" && m.subcat !== "compra_usd") return false;
      if (vistaB === "taurus" && !m.taurus) return false;
      if (vistaB === "gladys" && !m.gladys) return false;
      if (vistaB === "comisiones" && !m.comision) return false;
      if (q) {
        const blob = (m.concepto + " " + m.verbatim + " " + m.para + " " + m.ref).toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [anioB, mesB, vistaB, buscaB]);
  const totB = useMemo(() => ({
    n: movsFiltrados.length,
    entro: movsFiltrados.filter((m) => m.dir === 1).reduce((a, m) => a + m.bs, 0),
    salio: movsFiltrados.filter((m) => m.dir === -1).reduce((a, m) => a + m.bs, 0),
    usd: movsFiltrados.reduce((a, m) => a + (m.usd ?? 0), 0),
  }), [movsFiltrados]);
  const POR_PAG_BANCO = 100;
  const paginasB = Math.max(1, Math.ceil(movsFiltrados.length / POR_PAG_BANCO));
  const paginaBok = Math.min(paginaB, paginasB - 1);
  const visiblesB = movsFiltrados.slice(paginaBok * POR_PAG_BANCO, (paginaBok + 1) * POR_PAG_BANCO);
  const mesUnicoB = anioB !== "todos" && mesB !== "todos" ? BANCO.meses.find((x) => x.ym === `${anioB}-${mesB}`) : undefined;

  /* ---------- conciliación: fondo de reserva → US$ ---------- */
  const serieConcFondo = useMemo(
    () => FONDO.meses.map((m) => ({ mes: etiquetaMes(m.ym), fondo: m.fondo_bs, compras: m.c_mes_bs, eg: m.eg_mes_bs })),
    []
  );
  const mesesConFondo = useMemo(() => FONDO.meses.filter((m) => m.fondo_bs > 0), []);
  const VEREDICTO: Record<string, { label: string; color: string }> = {
    ese_mes: { label: "Se sacó ese mes", color: V.positive },
    siguiente: { label: "Se sacó el siguiente", color: V.primary },
    sin_monto: { label: "Se sacó sin monto declarado", color: V.warning },
    parcial: { label: "Parcial", color: V.neutral },
    no: { label: "No se sacó", color: V.negative },
  };
  const fondoConfig = {
    fondo: { label: "Fondo de reserva entrado (Bs)", color: V.positive },
    compras: { label: "Salió en compras de US$ (Bs)", color: V.primary },
    eg: { label: "Salió a Esther/Gladymar sin monto (Bs)", color: V.warning },
  } satisfies ChartConfig;
  const POR_PAG = 100;

  const fAdmin = D.fondos["FONDO DE RESERVA (administradora)"];
  const fJunta = D.fondos["FONDO DE RESERVA POR ENVIAR A JUNTA CONDOMINIO"];
  const otrosFondos = Object.entries(D.fondos).filter(([k]) => !k.startsWith("FONDO DE RESERVA"));
  const sumaOtrosFondos = otrosFondos.reduce((a, [, v]) => a + v.bs, 0);

  const conceptosFiltrados = useMemo(
    () => D.conceptos.filter((c) => c.concepto.toLowerCase().includes(busqueda.toLowerCase())),
    [busqueda]
  );

  const conceptosOrdenados = useMemo(() => {
    const arr = [...conceptosFiltrados];
    arr.sort((a, b) => {
      const v = orden.asc ? 1 : -1;
      if (orden.k === "concepto") return v * a.concepto.localeCompare(b.concepto, "es");
      if (orden.k === "usd") {
        const va = enParalelo ? a.usd_par : a.usd;
        const vb = enParalelo ? b.usd_par : b.usd;
        return v * (va - vb);
      }
      return v * ((a[orden.k] as number) - (b[orden.k] as number));
    });
    return arr;
  }, [conceptosFiltrados, orden, enParalelo]);

  const onOrden = (k: ClaveOrden) =>
    setOrden((o) => (o.k === k ? { k, asc: !o.asc } : { k, asc: k === "concepto" }));

  const statsConceptos = useMemo(() => {
    const positivos = D.conceptos.filter((c) => c.usd > 0);
    const top5 = positivos.slice(0, 5).reduce((a, c) => a + c.usd, 0);
    return {
      concentracion: D.meta.tot_usd ? (top5 / D.meta.tot_usd) * 100 : 0,
      mayor: D.conceptos[0],
    };
  }, []);

  const itemsFiltrados = useMemo(
    () =>
      D.items.filter(
        (it) =>
          (fAnio === "todos" || it.a === Number(fAnio)) &&
          (fSeccion === "todas" || it.s.startsWith(fSeccion.slice(0, 14))) &&
          (busqueda === "" || it.d.toLowerCase().includes(busqueda.toLowerCase()))
      ),
    [fAnio, fSeccion, busqueda]
  );
  const paginas = Math.max(1, Math.ceil(itemsFiltrados.length / POR_PAG));
  const paginaOk = Math.min(pagina, paginas - 1);
  const visibles = itemsFiltrados.slice(paginaOk * POR_PAG, paginaOk * POR_PAG + POR_PAG);

  const datosAnios = D.por_anio.map((a) => ({ anio: a.anio, usd: enParalelo ? a.usd_par : a.usd, bs: a.bs }));
  const datosSerie = D.serie_mes.map((m) => ({ ym: m.ym, usd: enParalelo ? m.usd_par : m.usd }));
  const topConceptos = [...D.conceptos]
    .map((c) => ({ concepto: c.concepto, usd: enParalelo ? c.usd_par : c.usd }))
    .filter((c) => c.usd > 0)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 15);
  const fac = Object.fromEntries(D.facturacion.map((f) => [f.cat, f]));

  const conceptosConfig = {
    usd: { label: "US$", color: "var(--c-primary)" },
  } satisfies ChartConfig;

  const devConfig = {
    bs: { label: "Bs devueltos", color: "var(--c-negative)" },
  } satisfies ChartConfig;

  const recConfig = {
    meses: { label: "Meses", color: "var(--c-primary)" },
  } satisfies ChartConfig;

  const serieFondo = useMemo(() => {
    const serie: { ym: string; fondo_bcv: number; fondo_par: number; est: number; total_bcv: number; total_par: number }[] = [];
    let est = 0;
    for (let i = 0; i < D.fondo_acum_usd.length; i++) {
      const mes = D.fondo_acum_usd[i];
      if (mes.ym >= EST_DESDE) est += CUOTA_EST; // $50/mes de estacionamientos desde ene-2023
      const fondo_bcv = mes.acum_usd;
      const fondo_par = D.fondo_acum_par[i].acum_usd;
      serie.push({
        ym: mes.ym,
        fondo_bcv,
        fondo_par,
        est: Math.round(est * 100) / 100,
        total_bcv: Math.round((fondo_bcv + est) * 100) / 100,
        total_par: Math.round((fondo_par + est) * 100) / 100,
      });
    }
    return serie;
  }, []);

  const ultimo = serieFondo[serieFondo.length - 1];
  const totalBcv = ultimo.total_bcv;
  const totalPar = ultimo.total_par;
  const mesesEst = serieFondo.filter((x) => x.ym >= EST_DESDE).length; // ene-2023 → ago-2026
  const acumConfig = {
    total_bcv: { label: "Total (BCV)", color: "var(--c-primary)" },
    total_par: { label: "Total (paralelo)", color: "var(--c-negative)" },
    est: { label: "Estacionamientos ($50/mes)", color: "var(--c-neutral)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-4">
      {/* KPIs generales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icono={<Wallet className="size-4" />} tinte={V.primary} titulo="Total gastado (Bs)"
          valor={"Bs " + fmt0(D.meta.tot_bs)} sub={`${D.meta.meses} meses · sep-2022 a ago-2026`} />
        <Kpi icono={<TrendingUp className="size-4" />} tinte={enParalelo ? V.negative : V.primary} titulo={"Total gastado (US$ · " + (enParalelo ? "paralelo" : "BCV") + ")"}
          valor={"US$ " + fmt0(enParalelo ? D.meta.tot_usd_par : D.meta.tot_usd)}
          sub={enParalelo ? "a tasa paralela de cierre de mes" : "a tasa BCV de cierre de mes"} />
        <Kpi icono={<Database className="size-4" />} tinte={V.primary} titulo="Partidas"
          valor={fmt0(D.meta.partidas)} sub={`${D.conceptos.length} conceptos distintos`} />
        <Kpi icono={<PiggyBank className="size-4" />} tinte={V.positive} titulo="Fondo de reserva aportado"
          valor={"Bs " + fmt0(fJunta?.bs ?? 0)} sub={`US$ ${fmt(fJunta?.usd ?? 0)} · administradora = Junta`} />
        <Kpi icono={<ArrowDownRight className="size-4" />} tinte={V.negative} titulo="Devuelto (reintegros)"
          valor={"Bs " + fmt0(D.devoluciones.total_bs)} sub={`US$ ${fmt(D.devoluciones.total_usd)}`} />
        <Kpi icono={<Receipt className="size-4" />} tinte={V.warning} titulo="Por respaldar con factura"
          valor={fmt0(fac.terceros_verificar_factura?.n ?? 0)}
          sub={`partidas · Bs ${fmt0(fac.terceros_verificar_factura?.bs ?? 0)}`} />
      </div>

      {/* ---------------- RESUMEN ---------------- */}
      {seccion === "resumen" && (
<section id="resumen" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Resumen general" descripcion="Panorama de los 48 meses: totales, distribución y evolución." />
        <DashboardCard>
          <CardHeader>
            <CardTitle>Total por año</CardTitle>
            <CardDescription>
              Barras: equivalente en dólares a tasa BCV de cierre de mes (comparable entre años). Línea: bolívares.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={aniosConfig} className="aspect-auto w-full" style={{ height: H.anios }}>
              <ComposedChart data={datosAnios} margin={{ top: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="anio" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis yAxisId="usd" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                <YAxis yAxisId="bs" orientation="right" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v / 1e6) + " MM"} />
                <ChartTooltip
                  cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        String(name) === "Bs"
                          ? ["Bs " + fmt(Number(value)), name]
                          : ["US$ " + fmt(Number(value)), name]
                      }
                    />
                  }
                />
                <Bar yAxisId="usd" dataKey="usd" fill={V.primary} radius={[6, 6, 0, 0]} maxBarSize={64} />
                <Line yAxisId="bs" dataKey="bs" stroke={V.warning} strokeWidth={2} dot={{ r: 4, fill: V.warning, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard>
            <CardHeader>
              <CardTitle>Distribución por sección</CardTitle>
              <CardDescription>Participación en el total (US$)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={seccionConfig} className="aspect-auto w-full" style={{ height: H.pie }}>
                <PieChart>
                  <Pie data={D.por_seccion} dataKey="usd" nameKey="seccion"
                    innerRadius={movil ? 54 : 62} outerRadius={movil ? 88 : 100}
                    paddingAngle={movil ? 2 : 3} strokeWidth={0} cornerRadius={4} cy="46%">
                    {D.por_seccion.map((_, i) => (
                      <Cell key={i} fill={PALETA[i % PALETA.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <LeyendaChips items={D.por_seccion.map((sec, i) => ({
                color: PALETA[i % PALETA.length],
                label: NOMBRES_SECCION[sec.seccion] ?? sec.seccion,
                extra: `${((sec.usd / D.meta.tot_usd) * 100).toFixed(0)}%`,
              }))} />
            </CardContent>
          </DashboardCard>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Evolución mensual (US$)</CardTitle>
              <CardDescription>Gasto total de cada mes convertido a tasa de cierre</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={mensualConfig} className="aspect-auto w-full" style={{ height: H.mensual }}>
                <AreaChart data={datosSerie} margin={{ top: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="gradMes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={V.primary} stopOpacity={oscuro ? 0.45 : 0.3} />
                      <stop offset="100%" stopColor={V.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="ym" tick={TICK} interval={movil ? 8 : 5} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="usd" stroke={V.primary} fill="url(#gradMes)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </DashboardCard>
        </div>

        <DashboardCard>
          <CardHeader><CardTitle>Resumen por año</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año</TableHead>
                  <TableHead className="text-right">Partidas</TableHead>
                  <TableHead className="text-right">Total (Bs)</TableHead>
                  <TableHead className="text-right">Total (US$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {D.por_anio.map((a) => (
                  <TableRow key={a.anio}>
                    <TableCell className="font-medium">{a.anio}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt0(a.n)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(a.bs)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(a.usd)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt0(D.meta.partidas)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(D.meta.tot_bs)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(D.meta.tot_usd)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- CONCEPTOS ---------------- */}
      {seccion === "conceptos" && (
<section id="conceptos" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Gasto por concepto" descripcion="Cuánto se gastó en cada cosa, con búsqueda y orden." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icono={<Database className="size-4" />} tinte={V.primary} titulo="Conceptos"
            valor={fmt0(D.conceptos.length)} sub="agrupación normalizada" />
          <Kpi icono={<TrendingUp className="size-4" />} tinte={V.primary} titulo="Mayor concepto"
            valor={"US$ " + fmt0(statsConceptos.mayor.usd)} sub={trunc(statsConceptos.mayor.concepto, 26)} />
          <Kpi icono={<PiggyBank className="size-4" />} tinte={V.warning} titulo="Concentración top 5"
            valor={statsConceptos.concentracion.toFixed(0) + "%"} sub="del total facturado (US$)" />
          <Kpi icono={<Repeat className="size-4" />} tinte={V.positive} titulo="Recurrencia máxima"
            valor="48 / 48" sub="meses con el mismo cargo" />
        </div>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Top 15 conceptos por monto (US$)</CardTitle>
            <CardDescription>
              En dólares a tasa de cierre de mes para poder comparar 2022 con 2026 (el bolívar se devaluó ~100×).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={conceptosConfig} className="aspect-auto w-full" style={{ height: H.conceptos }}>
              <BarChart data={topConceptos} layout="vertical" margin={{ left: 8, right: 64 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                <YAxis type="category" dataKey="concepto" width={W.ejeY} tick={{ ...TICK, fontSize: 11.5 }}
                  axisLine={false} tickLine={false} tickFormatter={(v: string) => trunc(v, TRUNC)} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }} />
                <Bar dataKey="usd" fill={V.primary} radius={[0, 6, 6, 0]} barSize={18}>
                  <LabelList dataKey="usd" position="right" className="fill-foreground" fontSize={11}
                    formatter={(v: React.ReactNode) => fmt0(Number(v))} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Todos los conceptos ({fmt0(conceptosFiltrados.length)})</CardTitle>
              <CardDescription className="mt-1">
                Haz clic en los encabezados para ordenar. Busca cualquier gasto («agua», «puerta», «sueldo»…).
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar concepto…" className="pl-8" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                  <TableRow className="hover:bg-transparent">
                    <ThOrden label="Concepto" clave="concepto" orden={orden} onOrden={onOrden} />
                    <TableHead>Códigos</TableHead>
                    <ThOrden label="Partidas" clave="n" orden={orden} onOrden={onOrden} right />
                    <ThOrden label="Meses" clave="meses" orden={orden} onOrden={onOrden} right />
                    <ThOrden label="Total (Bs)" clave="bs" orden={orden} onOrden={onOrden} right />
                    <ThOrden label="Total (US$)" clave="usd" orden={orden} onOrden={onOrden} right />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conceptosOrdenados.map((c) => (
                    <TableRow key={c.concepto}>
                      <TableCell className="max-w-[340px] whitespace-normal">{c.concepto}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.codes.map((code) => (
                            <Badge key={code} variant="outline" className="px-1.5 py-0 font-mono text-[10px]">{code}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmt0(c.n)}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.meses}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(c.bs)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{fmt(enParalelo ? c.usd_par : c.usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- PARTIDAS ---------------- */}
      {seccion === "partidas" && (
<section id="partidas" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Explorador de partidas" descripcion="Las 1.227 partidas de los 48 recibos, con la tasa aplicada a cada mes." />
        <DashboardCard>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={fAnio}
                onChange={(e) => { setFAnio(e.target.value); setPagina(0); }}
                className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="todos">Todos los años</option>
                {D.por_anio.map((a) => (
                  <option key={a.anio} value={a.anio}>{a.anio}</option>
                ))}
              </select>
              <select
                value={fSeccion}
                onChange={(e) => { setFSeccion(e.target.value); setPagina(0); }}
                className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="todas">Todas las secciones</option>
                {D.por_seccion.map((s) => (
                  <option key={s.seccion} value={s.seccion}>{s.seccion}</option>
                ))}
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input placeholder="Buscar en la descripción…" className="pl-8"
                  value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{fmt0(itemsFiltrados.length)} partidas coinciden</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={paginaOk === 0}
                  onClick={() => setPagina(paginaOk - 1)}>← Anterior</Button>
                <span>Página {paginaOk + 1} de {paginas}</span>
                <Button variant="outline" size="sm" disabled={paginaOk >= paginas - 1}
                  onClick={() => setPagina(paginaOk + 1)}>Siguiente →</Button>
              </div>
            </div>
            <div className="max-h-[560px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Periodo</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Cód.</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto (Bs)</TableHead>
                    <TableHead className="text-right">Tasa usada</TableHead>
                    <TableHead className="text-right">Monto (US$ · {tasa === "bcv" ? "BCV" : "paralelo"})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.map((it, i) => (
                    <TableRow key={`${it.a}-${it.m}-${it.c}-${i}`}>
                      <TableCell className="text-muted-foreground tabular-nums">{it.a}-{it.m}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{it.s}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{it.c}</TableCell>
                      <TableCell className="max-w-[360px] truncate" title={it.d}>{it.d}</TableCell>
                      <TableCell className={"text-right tabular-nums" + (it.q < 0 ? " text-red-600 dark:text-red-400" : "")}>{fmt(it.q)}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(enParalelo ? (D.paralelo_mes.find((x) => x.ym === it.a + "-" + it.m)?.tasa ?? it.t) : it.t)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(enParalelo ? it.p : it.u)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- FONDOS ---------------- */}
      {seccion === "fondos" && (
<section id="fondos" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Fondos" descripcion="Cuánto debe haber en el fondo de reserva de la Junta y de la administradora." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icono={<PiggyBank className="size-4" />} tinte={V.positive} titulo="Aportado (administradora)"
            valor={"Bs " + fmt0(fAdmin?.bs ?? 0)} sub={`US$ ${fmt(enParalelo ? fAdmin?.usd_par ?? 0 : fAdmin?.usd ?? 0)} · ${fAdmin?.n ?? 0} aportes`} />
          <Kpi icono={<PiggyBank className="size-4" />} tinte={V.primary} titulo="Enviado a la Junta"
            valor={"Bs " + fmt0(fJunta?.bs ?? 0)} sub={`US$ ${fmt(enParalelo ? fJunta?.usd_par ?? 0 : fJunta?.usd ?? 0)} · ${fJunta?.n ?? 0} envíos`} />
          <Kpi icono={<Database className="size-4" />} tinte={V.neutral} titulo="Nivelación del fondo"
            valor={"Bs " + fmt0(D.fondos["NIVELACION FONDO DE RESERVA"]?.bs ?? 0)} sub="ajuste mensual" />
          <Kpi icono={<Wallet className="size-4" />} tinte={V.warning} titulo="Otros fondos"
            valor={"Bs " + fmt0(sumaOtrosFondos)} sub="bonificación, prestaciones, pensiones" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard>
            <CardHeader>
              <CardTitle>Fondo de reserva acumulado (Bs)</CardTitle>
              <CardDescription>Suma de los aportes mensuales desde sep-2022</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={fondoBsConfig} className="aspect-auto w-full" style={{ height: H.fondo }}>
                <AreaChart data={D.fondo_acum} margin={{ top: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="gradFondo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={V.positive} stopOpacity={oscuro ? 0.45 : 0.3} />
                      <stop offset="100%" stopColor={V.positive} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="ym" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 8 : 5} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="acum_bs" stroke={V.positive} fill="url(#gradFondo)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </DashboardCard>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Fondo de reserva acumulado (US$)</CardTitle>
              <CardDescription>Aportes convertidos a la tasa de cierre de cada mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={fondoUsdConfig} className="aspect-auto w-full" style={{ height: H.fondo }}>
                <AreaChart data={enParalelo ? D.fondo_acum_par : D.fondo_acum_usd} margin={{ top: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="gradFondoUsd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={V.primary} stopOpacity={oscuro ? 0.45 : 0.3} />
                      <stop offset="100%" stopColor={V.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="ym" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 8 : 5} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="acum_usd" stroke={V.primary} fill="url(#gradFondoUsd)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </DashboardCard>
        </div>

        <DashboardCard>
          <CardHeader>
            <CardTitle>¿Cuánto debe haber en el fondo de reserva?</CardTitle>
            <CardDescription>
              La administradora cobra y envía a la Junta la misma cifra cada mes, por lo que el fondo de la Junta debía acumular{" "}
              <b>Bs {fmt(fJunta?.bs ?? 0)}</b> (US$ {fmt(fJunta?.usd ?? 0)} a tasa de cierre de mes) entre sep-2022 y ago-2026, más las nivelaciones.
              Los recibos no registran desembolsos del fondo: si se pagaron trabajos con él, hay que descontarlos con sus soportes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fondo</TableHead>
                  <TableHead className="text-right">Aportes</TableHead>
                  <TableHead className="text-right">Total (Bs)</TableHead>
                  <TableHead className="text-right">Total (US$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(D.fondos).map(([k, v]) => (
                  <TableRow key={k}>
                    <TableCell className="whitespace-normal">{k}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt0(v.n)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(v.bs)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(v.usd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- DÓLAR PARALELO ---------------- */}
      {seccion === "paralelo" && (
      <section id="paralelo" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Dólar paralelo" descripcion="El precio del dólar negro mes a mes, con el link a la página donde cada precio queda evidenciado." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icono={<TrendingUp className="size-4" />} tinte={V.negative} titulo="Paralelo último mes"
            valor={"Bs " + fmt(D.paralelo_mes[D.paralelo_mes.length - 1].tasa)}
            sub={D.paralelo_mes[D.paralelo_mes.length - 1].ym} />
          <Kpi icono={<ArrowDownRight className="size-4" />} tinte={V.negative} titulo="Brecha vs BCV"
            valor={D.paralelo_mes[D.paralelo_mes.length - 1].brecha.toFixed(1) + "%"}
            sub="del último mes" />
          <Kpi icono={<Repeat className="size-4" />} tinte={V.warning} titulo="Brecha promedio"
            valor={(D.paralelo_mes.reduce((a, m) => a + m.brecha, 0) / D.paralelo_mes.length).toFixed(1) + "%"}
            sub={`promedio ${D.paralelo_mes.length} meses`} />
          <Kpi icono={<Receipt className="size-4" />} tinte={V.neutral} titulo="Fuente actual"
            valor="USDT / Binance" sub="promedio de monitores hasta jun-2026" />
        </div>

        <DashboardCard>
          <CardHeader>
            <CardTitle>BCV vs Paralelo (escala logarítmica)</CardTitle>
            <CardDescription>
              Ambas tasas de cierre de mes. La escala logarítmica permite ver el movimiento temprano (2022-2023) sin aplanar el salto de 2025-2026.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ bcv: { label: "BCV (oficial)", color: "var(--c-primary)" }, paralelo: { label: "Paralelo", color: "var(--c-negative)" } }}
              className="aspect-auto w-full" style={{ height: movil ? 260 : 320 }}>
              <ComposedChart data={D.paralelo_mes} margin={{ top: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="ym" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 7 : 4} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={[1, "auto"]} allowDataOverflow tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="bcv" name="BCV (oficial)" stroke={V.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tasa" name="Paralelo" stroke={V.negative} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Brecha del paralelo sobre el oficial (%)</CardTitle>
            <CardDescription>Cuánto más caro estaba el dólar negro que el oficial cada mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ brecha: { label: "Brecha %", color: "var(--c-warning)" } }}
              className="aspect-auto w-full" style={{ height: movil ? 230 : 260 }}>
              <BarChart data={D.paralelo_mes} margin={{ top: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="ym" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 7 : 4} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }} />
                <Bar dataKey="brecha" fill={V.warning} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Serie mensual con evidencia</CardTitle>
            <CardDescription>
              Cada fila tiene el link al archivo de la página donde ese precio está publicado (Wayback Machine). «Fuente» indica cómo se midió el paralelo ese mes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">BCV (Bs)</TableHead>
                    <TableHead className="text-right">Paralelo (Bs)</TableHead>
                    <TableHead className="text-right">Brecha</TableHead>
                    <TableHead className="max-w-[180px]">Fuente</TableHead>
                    <TableHead className="text-right">Evidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {D.paralelo_mes.map((m) => (
                    <TableRow key={m.ym}>
                      <TableCell className="tabular-nums">{m.ym}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(m.bcv)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{fmt(m.tasa)}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">{m.brecha.toFixed(1)}%</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-normal max-w-[180px]">{m.fuente}</TableCell>
                      <TableCell className="text-right">
                        <a href={m.link} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          Ver precio <ExternalLinkIcon className="size-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Cómo se mide el dólar paralelo aquí</CardTitle>
            <CardDescription>
              Desde sep-2022 hasta jun-2026 se usa el <b>promedio de monitores</b> (la referencia estándar del mercado negro, la misma que
              publican Investing.com y Wikipedia). Desde jul-2026 se usa el <b>USDT del P2P de Binance</b>, que es como se forma hoy el
              dólar negro y suele correr 1-3% por encima del promedio de monitores. El link de cada mes abre la portada archivada de
              Banca y Negocios (diario que publica ambas tasas a diario) más cercana al cierre, como evidencia independiente del precio.
            </CardDescription>
          </CardHeader>
        </DashboardCard>
      </section>
      )}

      {/* ---------------- DEVOLUCIONES ---------------- */}
      {seccion === "devoluciones" && (
<section id="devoluciones" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Devoluciones" descripcion="Cuánto dinero se ha devuelto a los residentes y por qué concepto." />
        <div className="grid grid-cols-2 gap-3">
          <Kpi icono={<ArrowDownRight className="size-4" />} tinte={V.negative} titulo="Total devuelto (Bs)"
            valor={"Bs " + fmt(D.devoluciones.total_bs)} sub="suma de partidas negativas" />
          <Kpi icono={<ArrowDownRight className="size-4" />} tinte={V.negative} titulo="Total devuelto (US$)"
            valor={"US$ " + fmt(enParalelo ? D.devoluciones.total_usd_par : D.devoluciones.total_usd)}
            sub={enParalelo ? "a tasa paralela de cierre de mes" : "a tasa de cierre de cada mes"} />
        </div>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Devoluciones y reintegros por concepto (Bs)</CardTitle>
            <CardDescription>
              La mayor parte son reintegros de agua: el edificio paga Hidrocapital/Hidroven y reintegra a los residentes el consumo del local,
              que a su vez se cobra en «Gastos No Comunes» (0056) — devoluciones y cobros se compensan entre sí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={devConfig} className="aspect-auto w-full" style={{ height: H.dev }}>
              <BarChart data={D.devoluciones.por_concepto.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmt0(v)} />
                <YAxis type="category" dataKey="concepto" width={W.ejeY} tick={TICK}
                  axisLine={false} tickLine={false} tickFormatter={(v: string) => trunc(v, TRUNC)} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }} />
                <Bar dataKey="bs" fill={V.negative} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[480px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Concepto</TableHead>
                    <TableHead>Ejemplo original</TableHead>
                    <TableHead className="text-right">Veces</TableHead>
                    <TableHead className="text-right">Bs</TableHead>
                    <TableHead className="text-right">US$</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {D.devoluciones.por_concepto.map((d) => (
                    <TableRow key={d.concepto}>
                      <TableCell className="whitespace-normal max-w-[280px]">{d.concepto}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[280px] truncate" title={d.ejemplo}>{d.ejemplo}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt0(d.n)}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">{fmt(d.bs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(enParalelo ? d.usd_par : d.usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- FACTURACIÓN ---------------- */}
      {seccion === "facturas" && (
<section id="facturas" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Facturación" descripcion="Cuántos gastos llevan factura y cuáles hay que respaldar." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <DashboardCard>
            <CardHeader>
              <CardTitle>Soporte documental de las partidas</CardTitle>
              <CardDescription>Cómo se documenta cada gasto según su naturaleza</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <ChartContainer config={factConfig} className="aspect-auto w-full" style={{ height: H.fact }}>
                <PieChart>
                  <Pie data={D.facturacion} dataKey="n" nameKey="cat"
                    innerRadius={movil ? 54 : 62} outerRadius={movil ? 88 : 100}
                    paddingAngle={movil ? 2 : 3} strokeWidth={0} cornerRadius={4} cy="46%">
                    {D.facturacion.map((_, i) => (
                      <Cell key={i} fill={PALETA[i % PALETA.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <LeyendaChips items={D.facturacion.map((f, i) => ({
                color: PALETA[i % PALETA.length],
                label: CAT_FACT[f.cat] ?? f.cat,
                extra: fmt0(f.n),
              }))} />
            </CardContent>
          </DashboardCard>
          <DashboardCard>
            <CardHeader>
              <CardTitle>Detalle por categoría</CardTitle>
              <CardDescription>
                «Terceros: verificar factura» es el universo a respaldar con factura fiscal archivada ante la administración.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Partidas</TableHead>
                    <TableHead className="text-right">Total (Bs)</TableHead>
                    <TableHead className="text-right">Total (US$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {D.facturacion.map((f) => (
                    <TableRow key={f.cat}>
                      <TableCell className="whitespace-normal">{CAT_FACT[f.cat] ?? f.cat}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt0(f.n)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(f.bs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(enParalelo ? f.usd_par : f.usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </DashboardCard>
        </div>
      </section>
)}

      {/* ---------------- RECURRENCIA ---------------- */}
      {seccion === "recurrentes" && (
<section id="recurrentes" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Gastos recurrentes" descripcion="Los cargos más repetidos: la cuota fija del edificio." />
        <DashboardCard>
          <CardHeader>
            <CardTitle>Cargos presentes casi todos los meses (de 48)</CardTitle>
            <CardDescription>Lo que se cobra mes a mes sin excepción</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={recConfig} className="aspect-auto w-full" style={{ height: H.rec }}>
              <BarChart data={D.recurrentes.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 48]} tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="concepto" width={W.ejeY} tick={TICK}
                  axisLine={false} tickLine={false} tickFormatter={(v: string) => trunc(v, TRUNC)} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }} />
                <Bar dataKey="meses" fill={V.primary} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader><CardTitle>Tabla de recurrencia</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Códigos</TableHead>
                  <TableHead className="text-right">Meses (de 48)</TableHead>
                  <TableHead className="text-right">Veces</TableHead>
                  <TableHead className="text-right">Total (US$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {D.recurrentes.map((r) => (
                  <TableRow key={r.concepto}>
                    <TableCell className="whitespace-normal max-w-[300px]">{r.concepto}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.codes.map((code) => (
                          <Badge key={code} variant="outline" className="px-1.5 py-0 font-mono text-[10px]">{code}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.meses}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt0(r.n)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.usd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </DashboardCard>
      </section>
)}

      {/* ---------------- ESTACIONAMIENTOS + FONDO ACUMULADO ---------------- */}
      {seccion === "estacionamientos" && (
        <section id="estacionamientos" className="space-y-4 scroll-mt-20">
          <EncabezadoSeccion titulo="Cuánto debe haber en el fondo" descripcion="Todo en dólares: si se cobraron $50 mensuales de estacionamientos desde ene-2023 y se suman los aportes del fondo de reserva convertidos a dólares a ambas tasas, este es el acumulado que debió formarse cada mes." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icono={<CarIcon className="size-4" />} tinte={V.primary} titulo="Estacionamientos ($50/mes)"
              valor={"US$ " + fmt0(ultimo.est)} sub={"5 puestos × $10 × " + mesesEst + " meses (ene-2023 → ago-2026)"} />
            <Kpi icono={<PiggyBank className="size-4" />} tinte={V.positive} titulo="Fondo de reserva (BCV)"
              valor={"US$ " + fmt0(ultimo.fondo_bcv)} sub="aportes sep-2022 → ago-2026" />
            <Kpi icono={<PiggyBank className="size-4" />} tinte={V.warning} titulo="Fondo de reserva (paralelo)"
              valor={"US$ " + fmt0(ultimo.fondo_par)} sub="mismos aportes a tasa paralela" />
            <Kpi icono={<TrendingUp className="size-4" />} tinte={V.primary} titulo="Total a justificar"
              valor={"US$ " + fmt0(totalBcv)} sub={"fondo + estacionamientos · a paralelo: US$ " + fmt0(totalPar)} />
          </div>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Cuánto debe haber acumulado en el fondo, mes a mes (US$)</CardTitle>
              <CardDescription>
                La línea punteada es la recaudación de estacionamientos a $50 fijos cada mes; las áreas le suman encima los aportes
                del fondo de reserva convertidos a dólares (BCV y paralelo). Si el fondo pagó gastos, hay que restarlos de estas
                líneas: lo desembolsado es lo que la Junta debe justificar con facturas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={acumConfig} className="aspect-auto w-full" style={{ height: movil ? 300 : 360 }}>
                <ComposedChart data={serieFondo} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="ym" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 11 : 4} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + fmt0(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="total_bcv" name="Total (BCV)" stroke={V.primary} fill={V.primary} fillOpacity={oscuro ? 0.10 : 0.06} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="total_par" name="Total (paralelo)" stroke={V.negative} fill={V.negative} fillOpacity={oscuro ? 0.08 : 0.05} strokeWidth={2} />
                  <Line type="monotone" dataKey="est" name="Estacionamientos ($50/mes)" stroke={V.neutral} strokeWidth={2} dot={false} strokeDasharray="2 3" />
                </ComposedChart>
              </ChartContainer>
              <LeyendaChips items={[
                { color: V.primary, label: "Total (BCV)", extra: "US$ " + fmt0(totalBcv) },
                { color: V.negative, label: "Total (paralelo)", extra: "US$ " + fmt0(totalPar) },
                { color: V.neutral, label: "Estacionamientos ($50/mes)", extra: "US$ " + fmt0(ultimo.est) },
              ]} />
            </CardContent>
          </DashboardCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardCard className="border-t-2 border-t-primary">
              <CardHeader>
                <CardTitle>Debe haber en el fondo · tasa BCV</CardTitle>
                <CardDescription>Aportes del fondo a tasa oficial de cierre de mes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Fondo de reserva acumulado</span><span className="font-medium tabular-nums">US$ {fmt(ultimo.fondo_bcv)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">+ Estacionamientos ($50 × {mesesEst} meses)</span><span className="font-medium tabular-nums">US$ {fmt(ultimo.est)}</span></div>
              </CardContent>
              <CardFooter className="px-6">
                <div className="flex w-full justify-between items-baseline">
                  <span className="text-sm font-semibold">Total que debe haber</span>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: V.primary }}>US$ {fmt(totalBcv)}</span>
                </div>
              </CardFooter>
            </DashboardCard>
            <DashboardCard className="border-t-2" style={{ borderTopColor: V.negative }}>
              <CardHeader>
                <CardTitle>Debe haber en el fondo · tasa paralela</CardTitle>
                <CardDescription>Mismos aportes convertidos a la tasa del mercado paralelo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Fondo de reserva acumulado</span><span className="font-medium tabular-nums">US$ {fmt(ultimo.fondo_par)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">+ Estacionamientos ($50 × {mesesEst} meses)</span><span className="font-medium tabular-nums">US$ {fmt(ultimo.est)}</span></div>
              </CardContent>
              <CardFooter className="px-6">
                <div className="flex w-full justify-between items-baseline">
                  <span className="text-sm font-semibold">Total que debe haber</span>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: V.negative }}>US$ {fmt(totalPar)}</span>
                </div>
              </CardFooter>
            </DashboardCard>
          </div>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Gastos extra a justificar</CardTitle>
              <CardDescription>
                Este es el dinero total que entró al fondo: <b>US$ {fmt0(totalBcv)}</b> a tasa BCV o <b>US$ {fmt0(totalPar)}</b> a tasa paralela.
                Los recibos mensuales no registran desembolsos del fondo, así que todo lo que la Junta haya pagado con este dinero
                (trabajos, reparaciones, gastos extra) debe restarse de estas cifras y estar respaldado con facturas. El saldo
                resultante es lo que debe existir hoy en la cuenta del fondo.
              </CardDescription>
            </CardHeader>
          </DashboardCard>
        </section>
      )}

      {/* ---------------- ESTADOS DE CUENTA (PRUEBAS) ---------------- */}
      {seccion === "estados" && (
        <section id="estados" className="space-y-4 scroll-mt-20">
          <EncabezadoSeccion
            titulo="Estados de cuenta · las pruebas"
            descripcion="Los estados de cuenta originales de la cuenta bancaria de la Junta, subidos tal cual los emitió el banco: mismo nombre y mismos bytes. Cada archivo se descarga y su contenido se verificó contra el consolidado de 699 movimientos que alimenta este dashboard."
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icono={<Database className="size-4" />} tinte={V.primary} titulo="Archivos originales" valor={fmt0(EST.meta.n_archivos)} sub="PDF y Excel tal cual · 1,8 MB" />
            <Kpi icono={<Wallet className="size-4" />} tinte={V.positive} titulo="Meses cubiertos" valor={`${EST.meta.n_meses} / ${EST.meta.n_meses}`} sub="ago 2022 → sep 2026" />
            <Kpi icono={<Receipt className="size-4" />} tinte={V.warning} titulo="Movimientos" valor={fmt0(EST.meta.n_movimientos)} sub={`0 duplicados · ${EST.meta.n_compras_usd} compras US$`} />
            <Kpi icono={<CheckCheck className="size-4" />} tinte={V.negative} titulo="Solapes deduplicados" valor={fmt0(EST.meta.n_movs_en_varios_archivos)} sub="movs. en 2+ archivos, contados 1 vez" />
          </div>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Los {EST.meta.n_archivos} archivos, descargables</CardTitle>
              <CardDescription>
                Subidos sin modificación. El SHA-256 de cada archivo prueba que es el original byte por byte;
                «movs.» es cuántos movimientos del consolidado salieron de ese archivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={anioEst}
                  onChange={(e) => setAnioEst(e.target.value)}
                  className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="todos">Todos los años ({EST.archivos.length})</option>
                  {aniosEst.map((a) => (
                    <option key={a} value={a}>{a} ({EST.archivos.filter((x) => x.anio === a).length})</option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground">
                  {archivosEst.length} archivos · {fmt0(archivosEst.reduce((a, x) => a + x.n_movs, 0))} movimientos respaldados
                </span>
              </div>
              <div className="max-h-[560px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Archivo original</TableHead>
                      <TableHead>Meses</TableHead>
                      <TableHead className="text-right">Movs.</TableHead>
                      <TableHead className="text-right">Entró (Bs)</TableHead>
                      <TableHead className="text-right">Salió (Bs)</TableHead>
                      <TableHead className="text-right">Compras US$</TableHead>
                      <TableHead className="text-right">SHA-256</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivosEst.map((a) => (
                      <TableRow key={a.ruta}>
                        <TableCell className="max-w-[340px]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVisor({ nombre: a.nombre, ruta: a.ruta })}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
                              style={{ color: V.primary }}
                            >
                              <Eye className="size-3.5" />Ver
                            </button>
                            <a
                              href={encodeURI(a.ruta)}
                              download
                              className="inline-flex items-center gap-1.5 font-medium underline-offset-2 hover:underline"
                              style={{ color: V.primary }}
                              title="Descargar archivo original"
                            >
                              <FileDown className="size-3.5 shrink-0" />
                              <span className="truncate">{a.nombre}</span>
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{a.meses.map(etiquetaMes).join(", ")}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.n_movs}</TableCell>
                        <TableCell className="text-right tabular-nums" style={{ color: a.entro_bs > 0 ? V.positive : undefined }}>{a.entro_bs > 0 ? fmt(a.entro_bs) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums" style={{ color: a.salio_bs > 0 ? V.negative : undefined }}>{a.salio_bs > 0 ? fmt(a.salio_bs) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.compras_usd > 0 ? a.compras_usd : "—"}</TableCell>
                        <TableCell className="text-right font-mono text-[10px] text-muted-foreground" title={a.sha256}>{a.sha256.slice(0, 10)}…</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>¿El consolidado machea con los originales?</CardTitle>
              <CardDescription>
                El consolidado <code className="rounded bg-muted px-1">{EST.meta.csv_consolidado}</code> se armó extrayendo cada movimiento de estos archivos.
                Verificación automática, regla por regla:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <ul className="space-y-2.5">
                {[
                  { ok: true, titulo: "Sin duplicados", detalle: `Ninguna transacción repetida (misma fecha + referencia + monto): ${EST.meta.n_movimientos} movimientos únicos en ${EST.meta.n_meses} meses.` },
                  { ok: true, titulo: "Solapes contados una sola vez", detalle: `${EST.meta.n_movs_en_varios_archivos} movimientos aparecen en dos estados (cortes que repiten el mes) y están exactamente una vez en el consolidado.` },
                  { ok: true, titulo: "Saldo fila a fila", detalle: "Dentro de cada estado el saldo cuadra exactamente: cada fila es saldo anterior − débito + crédito. Los 699 movimientos pasan la prueba dentro de su corte." },
                  { ok: true, titulo: "Cierre mensual", detalle: `${EST.meta.meses_cuadran} de ${EST.meta.meses_revisables} meses verificables cierran aritméticamente: saldo final = saldo inicial + entró − salió.` },
                ].map((c) => (
                  <li key={c.titulo} className="flex items-start gap-2.5">
                    <CheckCheck className="mt-0.5 size-4 shrink-0" style={{ color: V.positive }} />
                    <div>
                      <p className="text-sm font-medium">{c.titulo}</p>
                      <p className="text-sm text-muted-foreground">{c.detalle}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border p-3" style={{ borderColor: V.warning }}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CircleAlert className="size-4" style={{ color: V.warning }} />
                  {EST.meta.n_huecos} fronteras entre estados donde el saldo no engancha
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Días que ningún estado de cuenta cubre: el saldo salta entre el último movimiento de un corte y el primero del siguiente sin movimientos que expliquen la diferencia. Es la lista de períodos a pedir al banco.
                </p>
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Último mov. cubierto</TableHead>
                        <TableHead className="text-right">Saldo ahí</TableHead>
                        <TableHead>Primer mov. siguiente</TableHead>
                        <TableHead className="text-right">Saldo ahí</TableHead>
                        <TableHead className="text-right">Diferencia sin explicar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {EST.huecos.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap tabular-nums">{h.ultimo_mov}</TableCell>
                          <TableCell className="text-right tabular-nums">Bs {fmt(h.saldo_antes)}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{h.primer_mov}</TableCell>
                          <TableCell className="text-right tabular-nums">Bs {fmt(h.saldo_despues)}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium" style={{ color: V.negative }}>Bs {fmt(h.diferencia)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1.5">
                  <Database className="size-3" />
                  Consolidado: SHA-256 {EST.meta.csv_sha256.slice(0, 16)}…
                </Badge>
                <Badge variant="outline" style={{ color: V.positive, borderColor: V.positive }}>
                  Entró total: Bs {fmt(EST.meta.total_entro_bs)}
                </Badge>
                <Badge variant="outline" style={{ color: V.negative, borderColor: V.negative }}>
                  Salió total: Bs {fmt(EST.meta.total_salio_bs)}
                </Badge>
                <Badge variant="outline">Saldo final: Bs {fmt(EST.meta.saldo_final_bs)}</Badge>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Solapes entre archivos</CardTitle>
              <CardDescription>
                Estados que cubren el mismo período (el corte de un mes repetido en el estado siguiente, o el mismo mes
                exportado en dos formatos). Sus movimientos compartidos están una sola vez en el consolidado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Mes</TableHead>
                      <TableHead>Archivos que lo cubren</TableHead>
                      <TableHead className="text-right">Movs. compartidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EST.solapes.map((s) => (
                      <TableRow key={s.mes}>
                        <TableCell className="whitespace-nowrap font-medium">{etiquetaMes(s.mes)}</TableCell>
                        <TableCell className="max-w-[520px]">
                          <div className="flex flex-wrap gap-1.5">
                            {s.archivos.map((a) => (
                              <span key={a} className="inline-flex items-center overflow-hidden rounded-md border text-xs">
                                <button
                                  onClick={() => setVisor({ nombre: a.split("/")[1], ruta: "/estados-cuenta/" + a })}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-muted"
                                  style={{ color: V.primary }}
                                >
                                  <Eye className="size-3 shrink-0" />Ver
                                </button>
                                <a
                                  href={encodeURI("/estados-cuenta/" + a)}
                                  download
                                  title={"Descargar " + a.split("/")[1]}
                                  className="inline-flex items-center gap-1 border-l px-1.5 py-0.5 hover:bg-muted"
                                >
                                  <FileDown className="size-3 shrink-0" style={{ color: V.primary }} />
                                  <span className="truncate">{a.split("/")[1]}</span>
                                </a>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{s.n}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>
        </section>
      )}

      {/* ---------------- CUENTA BANCARIA ---------------- */}
      {seccion === "banco" && (
        <section id="banco" className="space-y-4 scroll-mt-20">
          <EncabezadoSeccion
            titulo="Cuenta bancaria · todos los movimientos"
            descripcion={`Los ${BANCO.meta.n_movs} movimientos de la cuenta de la Junta (${BANCO.meta.desde} → ${BANCO.meta.hasta}), en orden de fecha. Cada fila se abre para ver el concepto original tal cual lo escribió el banco y descargar el estado de cuenta exacto de donde salió.`}
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icono={<Receipt className="size-4" />} tinte={V.primary} titulo="Movimientos" valor={fmt0(BANCO.meta.n_movs)} sub={`${BANCO.meta.n_meses} meses · en orden de fecha`} />
            <Kpi icono={<DollarSign className="size-4" />} tinte={V.warning} titulo="US$ comprados" valor={`US$ ${fmt0(BANCO.meta.usd_comprados)}`} sub={`${BANCO.meta.n_compras_usd} compras marcadas en la razón`} />
            <Kpi icono={<Wallet className="size-4" />} tinte={V.positive} titulo="Entró de Taurus" valor={`Bs ${fmt0(BANCO.meta.taurus_bs)}`} sub={`${BANCO.meta.n_taurus} entradas de la administradora`} />
            <Kpi icono={<PiggyBank className="size-4" />} tinte={V.negative} titulo="Enviado a Gladymar" valor={`Bs ${fmt0(BANCO.meta.gladys_enviados_bs)}`} sub={`${BANCO.meta.n_gladys_envios} envíos · ${BANCO.meta.n_gladys_devoluciones} devoluciones Bs ${fmt0(BANCO.meta.gladys_devueltos_bs)}`} />
          </div>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Explorador de movimientos</CardTitle>
              <CardDescription>
                Busca por concepto, beneficiario o referencia. Los filtros combinan: año + mes + vista + búsqueda.
                Al lado de cada concepto: <Badge variant="outline" className="mx-0.5 px-1 py-0" style={{ color: V.warning, borderColor: V.warning }}>US$ monto @ tasa</Badge> cuando se compraron dólares.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={anioB}
                  onChange={(e) => { setAnioB(e.target.value); setPaginaB(0); }}
                  className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="todos">Todos los años</option>
                  {["2022", "2023", "2024", "2025", "2026"].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select
                  value={mesB}
                  onChange={(e) => { setMesB(e.target.value); setPaginaB(0); }}
                  className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="todos">Todos los meses</option>
                  {MESES_CORTOS.map((nombre, i) => (
                    <option key={nombre} value={String(i + 1).padStart(2, "0")}>{nombre}</option>
                  ))}
                </select>
                <select
                  value={vistaB}
                  onChange={(e) => { setVistaB(e.target.value); setPaginaB(0); }}
                  className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="todos">Todo</option>
                  <option value="entradas">Solo entradas</option>
                  <option value="salidas">Solo salidas</option>
                  <option value="compras">Compras de dólares ({BANCO.meta.n_compras_usd})</option>
                  <option value="taurus">Entradas de Taurus ({BANCO.meta.n_taurus})</option>
                  <option value="gladys">Movimientos de Gladymar ({BANCO.meta.n_gladys_envios + BANCO.meta.n_gladys_devoluciones})</option>
                  <option value="comisiones">Comisiones bancarias ({nComisionesB})</option>
                </select>
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar concepto, beneficiario, referencia…" className="pl-8"
                    value={buscaB} onChange={(e) => { setBuscaB(e.target.value); setPaginaB(0); }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">{fmt0(totB.n)} movimientos</span>
                <span>Entró: <b className="tabular-nums" style={{ color: V.positive }}>Bs {fmt(totB.entro)}</b></span>
                <span>Salió: <b className="tabular-nums" style={{ color: V.negative }}>Bs {fmt(totB.salio)}</b></span>
                {totB.usd > 0 && <span>US$ comprados: <b className="tabular-nums">US$ {fmt(totB.usd)}</b></span>}
                {mesUnicoB && <span className="text-muted-foreground">Saldo al cierre: <b className="tabular-nums text-foreground">Bs {fmt(mesUnicoB.saldo_fin)}</b> · comisiones Bs {fmt(mesUnicoB.comisiones)}</span>}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Página {paginaBok + 1} de {paginasB}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={paginaBok === 0}
                    onClick={() => setPaginaB(paginaBok - 1)}>← Anterior</Button>
                  <Button variant="outline" size="sm" disabled={paginaBok >= paginasB - 1}
                    onClick={() => setPaginaB(paginaBok + 1)}>Siguiente →</Button>
                </div>
              </div>

              <div className="max-h-[560px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[92px]">Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto (Bs)</TableHead>
                      <TableHead className="text-right">Saldo (Bs)</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiblesB.map((m, i) => {
                      const idxAbs = paginaBok * POR_PAG_BANCO + i;
                      const abierto = abiertoB === idxAbs;
                      return (
                        <Fragment key={idxAbs}>
                          <TableRow className="cursor-pointer" onClick={() => setAbiertoB(abierto ? null : idxAbs)}>
                            <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{m.f.slice(8)}/{m.f.slice(5, 7)}/{m.f.slice(2, 4)}</TableCell>
                            <TableCell className="max-w-[440px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate" title={m.concepto}>{m.concepto}</span>
                                {m.usd ? (
                                  <Badge variant="outline" className="gap-0.5 px-1.5 py-0" style={{ color: V.warning, borderColor: V.warning }}>
                                    <DollarSign className="size-2.5" />US$ {fmt0(m.usd)} @ {m.tasa}
                                  </Badge>
                                ) : m.subcat === "compra_usd" ? (
                                  <Badge variant="outline" className="gap-0.5 px-1.5 py-0" style={{ color: V.warning, borderColor: V.warning }}>
                                    <CircleAlert className="size-2.5" />compra US$ · monto por confirmar
                                  </Badge>
                                ) : null}
                                {m.taurus && <Badge variant="secondary" className="px-1.5 py-0">Taurus</Badge>}
                                {m.gladys === "envio" && <Badge variant="outline" className="px-1.5 py-0" style={{ color: V.primary, borderColor: V.primary }}>Gladymar</Badge>}
                                {m.gladys === "devolucion" && <Badge variant="outline" className="px-1.5 py-0" style={{ color: V.positive, borderColor: V.positive }}>Devolución Gladymar</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium" style={{ color: m.dir === 1 ? V.positive : V.negative }}>
                              {m.dir === 1 ? "+" : "−"}{fmt(m.bs)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(m.saldo)}</TableCell>
                            <TableCell>{abierto ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}</TableCell>
                          </TableRow>
                          {abierto && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={5} className="p-3">
                                <div className="space-y-2 text-sm">
                                  <p className="break-words text-muted-foreground">
                                    <span className="font-medium text-foreground">Concepto original del banco: </span>{m.verbatim}
                                  </p>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span>Fecha: <b className="tabular-nums text-foreground">{m.f}</b></span>
                                    <span>Referencia: <b className="tabular-nums text-foreground">{m.ref}</b></span>
                                    <span>Código: <b className="text-foreground">{m.cod}</b></span>
                                    <span>Tipo: <b className="text-foreground">{m.tipo}</b></span>
                                    <span>Categoría: <b className="text-foreground">{SUBCAT_BANCO[m.subcat] ?? m.subcat}</b></span>
                                    {m.para && <span>Beneficiario: <b className="text-foreground">{m.para}</b></span>}
                                    {m.usd && <span>Compra: <b className="text-foreground">US$ {fmt0(m.usd)} @ {m.tasa} (tasa implícita Bs ÷ US$)</b></span>}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-xs text-muted-foreground">Respaldo descargable:</span>
                                    {m.archivos.map((a) => (
                                      <span key={a} className="inline-flex items-center overflow-hidden rounded-md border text-xs">
                                        <button onClick={() => setVisor({ nombre: a.split("/")[1], ruta: "/estados-cuenta/" + a })}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-muted" style={{ color: V.primary }}>
                                          <Eye className="size-3 shrink-0" />Ver
                                        </button>
                                        <a href={encodeURI("/estados-cuenta/" + a)} download title={"Descargar " + a.split("/")[1]}
                                          className="inline-flex items-center gap-1 border-l px-1.5 py-0.5 hover:bg-muted">
                                          <FileDown className="size-3 shrink-0" style={{ color: V.primary }} />
                                          <span className="truncate">{a.split("/")[1]}</span>
                                        </a>
                                        </span>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                    {visiblesB.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          Ningún movimiento coincide con esos filtros.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Auditoría de las marcas de dólares</CardTitle>
              <CardDescription>
                Las compras de dólares se marcaron una por una según el monto declarado en la razón de cada
                transferencia («compra 100», «cambio 40»…). Verificación aritmética de cada marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" style={{ color: V.positive, borderColor: V.positive }}>
                  <CheckCheck className="mr-1 size-3.5" /> {BANCO.auditoria_usd.verificadas} compras verificadas
                </Badge>
                <Badge variant="outline" style={{ color: V.positive, borderColor: V.positive }}>
                  {BANCO.auditoria_usd.discrepancias_tasa} discrepancias de tasa
                </Badge>
                <Badge variant="outline" style={{ color: V.warning, borderColor: V.warning }}>
                  US$ {fmt0(BANCO.meta.usd_comprados)} declarados en las razones
                </Badge>
                <Badge variant="outline" style={{ color: V.negative, borderColor: V.negative }}>
                  <CircleAlert className="mr-1 size-3.5" /> {BANCO.auditoria_usd.pendientes.length} por confirmar
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Cada compra verificada cumple exactamente <code className="rounded bg-muted px-1">tasa implícita = Bs pagados ÷ US$ declarados</code>.
                Quedan {BANCO.auditoria_usd.pendientes.length} transferencias marcadas como compra de dólares cuyo monto en US$ no está escrito en la razón:
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Bs pagados</TableHead>
                      <TableHead>Respaldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BANCO.auditoria_usd.pendientes.map((p) => (
                      <TableRow key={p.fecha + p.ref}>
                        <TableCell className="whitespace-nowrap tabular-nums">{p.fecha}</TableCell>
                        <TableCell className="max-w-[420px]">{p.concepto}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(p.bs)}</TableCell>
                        <TableCell>
                          {p.archivos.map((a) => (
                            <span key={a} className="mr-2 inline-flex items-center overflow-hidden rounded-md border text-xs">
                              <button onClick={() => setVisor({ nombre: a.split("/")[1], ruta: "/estados-cuenta/" + a })}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-muted" style={{ color: V.primary }}>
                                <Eye className="size-3" />Ver
                              </button>
                              <a href={encodeURI("/estados-cuenta/" + a)} download title={"Descargar " + a.split("/")[1]}
                                className="inline-flex items-center gap-1 border-l px-1.5 py-0.5 hover:bg-muted">
                                <FileDown className="size-3" style={{ color: V.primary }} />
                                <span className="truncate">{a.split("/")[1]}</span>
                              </a>
                              </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                <b className="text-foreground" style={{ color: V.warning }}>Salvedad:</b> además, desde {BANCO.auditoria_usd.salvedad.desde} hay{" "}
                <b className="text-foreground">{BANCO.auditoria_usd.salvedad.n} transferencias</b> (a Esther, Gladymar y otros) por{" "}
                <b className="text-foreground">Bs {fmt0(BANCO.auditoria_usd.salvedad.bs)}</b> cuya razón no declara el monto en US$ —
                el total real comprado es mayor que el registrado. Detalle en la sección <b className="text-foreground">Conciliación</b>.
              </p>
            </CardContent>
          </DashboardCard>
        </section>
      )}

      {/* ---------------- CONCILIACIÓN: FONDO → US$ ---------------- */}
      {seccion === "conciliacion" && (
        <section id="conciliacion" className="space-y-4 scroll-mt-20">
          <EncabezadoSeccion
            titulo="Conciliación · el fondo que entró y los dólares que salieron"
            descripcion="Cada mes la administradora (Taurus) envía el Fondo de Reserva a la cuenta. Aquí se verifica mes por mes si ese dinero se sacó en compras de dólares ese mismo mes o el siguiente. Es una conciliación únicamente del fondo contra los estados de cuenta de la cuenta bancaria — documentos proporcionados por Gladymar —; no cubre el resto del dinero de la cuenta."
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icono={<PiggyBank className="size-4" />} tinte={V.positive} titulo="Fondo recibido" valor={`Bs ${fmt0(FONDO.meta.fondo_total_bs)}`} sub={`${FONDO.meta.n_meses_con_fondo} meses · Bs ${fmt0(FONDO.meta.fondo_sacado_bs)} salieron en dólares (≈ US$ ${fmt0(FONDO.meta.fondo_sacado_usd)})`} />
            <Kpi icono={<CheckCheck className="size-4" />} tinte={V.primary} titulo="Sacado con monto declarado" valor={fmt0(FONDO.meta.n_ese_mes + FONDO.meta.n_siguiente)} sub={`${FONDO.meta.n_ese_mes} ese mes + ${FONDO.meta.n_siguiente} al siguiente`} />
            <Kpi icono={<CircleAlert className="size-4" />} tinte={V.warning} titulo="Sacado sin monto declarado" valor={fmt0(FONDO.meta.n_sin_monto)} sub="Esther/Gladymar cubrieron el fondo — ver salvedad" />
            <Kpi icono={<CircleAlert className="size-4" />} tinte={V.negative} titulo="No se sacó o parcial" valor={fmt0(FONDO.meta.n_no + FONDO.meta.n_parcial)} sub={`${FONDO.meta.n_no} sin salida · ${FONDO.meta.n_parcial} parciales`} />
          </div>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Fondo entrado vs. comprado en dólares</CardTitle>
              <CardDescription>
                Mes a mes: lo que Taurus envió como fondo de reserva (verde) y lo que ese mes se gastó en compras de dólares (azul). Desde mediados de 2025 el fondo siguió entrando pero las compras se detuvieron.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <ChartContainer config={fondoConfig} className="aspect-auto w-full" style={{ height: movil ? 300 : 360 }}>
                <ComposedChart data={serieConcFondo} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="mes" tick={{ ...TICK, fontSize: 10 }} interval={movil ? 7 : 2} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => "Bs " + fmt0(v)} width={movil ? 64 : 84} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="fondo" name="Fondo de reserva entrado (Bs)" fill={V.positive} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="compras" name="Salió en compras de US$ (Bs)" fill={V.primary} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="eg" name="Salió a Esther/Gladymar sin monto (Bs)" fill={V.warning} radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ChartContainer>
              <LeyendaChips items={[
                { color: V.positive, label: "Fondo de reserva entrado (Taurus)", extra: "Bs " + fmt0(FONDO.meta.fondo_total_bs) },
                { color: V.primary, label: "Compras de US$ del mes", extra: "Bs " + fmt0(FONDO.meses.reduce((a, m) => a + m.c_mes_bs, 0)) },
                { color: V.warning, label: "Esther/Gladymar sin monto", extra: "Bs " + fmt0(FONDO.meses.reduce((a, m) => a + m.eg_mes_bs, 0)) },
              ]} />
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Mes por mes · ¿se sacó el fondo?</CardTitle>
              <CardDescription>
                Los {mesesConFondo.length} meses con fondo entrado. «Compras del mes» son los Bs de las compras de dólares de ese mes (con los US$ declarados); «el siguiente», las del mes posterior.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-h-[560px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Fondo entró (Bs)</TableHead>
                      <TableHead className="text-right">≈ US$ del fondo</TableHead>
                      <TableHead className="text-right">Compras del mes</TableHead>
                      <TableHead className="text-right">Compras del mes sig.</TableHead>
                      <TableHead className="text-right">Sin monto (Bs)</TableHead>
                      <TableHead>Veredicto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mesesConFondo.map((m) => {
                      const v = m.veredicto ? VEREDICTO[m.veredicto] : undefined;
                      return (
                        <TableRow key={m.ym}>
                          <TableCell className="whitespace-nowrap font-medium">{etiquetaMes(m.ym)}</TableCell>
                          <TableCell className="text-right tabular-nums" style={{ color: V.positive }}>{fmt(m.fondo_bs)}</TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                            {m.usd_equiv ? <>US$ {fmt0(m.usd_equiv)}{m.usd_tasa === "paralelo" && <span className="text-muted-foreground/70"> (paralelo)</span>}</> : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">{m.c_mes_bs > 0 ? <>{fmt(m.c_mes_bs)} <span className="text-muted-foreground">· {m.c_mes_usd > 0 ? "US$ " + fmt0(m.c_mes_usd) : "US$ sin declarar"}</span></> : "—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">{m.c_sig_bs > 0 ? <>{fmt(m.c_sig_bs)} <span className="text-muted-foreground">· {m.c_sig_usd > 0 ? "US$ " + fmt0(m.c_sig_usd) : "US$ sin declarar"}</span></> : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums" style={{ color: m.eg_mes_bs > 0 ? V.warning : undefined }}>{m.eg_mes_bs > 0 ? fmt(m.eg_mes_bs) : "—"}</TableCell>
                          <TableCell>{v && <Badge variant="outline" style={{ color: v.color, borderColor: v.color }}>{v.label}</Badge>}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>El recibo de la administradora vs. el banco · coincide al céntimo</CardTitle>
              <CardDescription>
                El fondo que el recibo declara (código 0010, «Fondo de reserva por enviar a Junta») contra lo que realmente
                entró a la cuenta: {FONDO.recibo_vs_banco.n_coinciden} de {FONDO.recibo_vs_banco.n_recibo} meses coinciden exactos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" style={{ color: V.positive, borderColor: V.positive }}>
                  <CheckCheck className="mr-1 size-3.5" /> {FONDO.recibo_vs_banco.n_coinciden}/{FONDO.recibo_vs_banco.n_recibo} meses coinciden
                </Badge>
                <Badge variant="outline">0 aproximados · 0 no coinciden · 0 sin entrada</Badge>
                <Badge variant="outline">+2 meses de fondo antes del primer recibo (jul–ago 2022)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{FONDO.recibo_vs_banco.regla}.</p>
              <div className="max-h-[420px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="bg-muted/50">
                      <TableHead>Mes del fondo</TableHead>
                      <TableHead className="text-right">Recibo declara (Bs)</TableHead>
                      <TableHead className="text-right">Entró al banco (Bs)</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FONDO.recibo_vs_banco.meses.map((m) => {
                      const e = ESTADO_RECIBO[m.estado];
                      return (
                        <TableRow key={m.ym}>
                          <TableCell className="whitespace-nowrap font-medium">{etiquetaMes(m.ym)}</TableCell>
                          <TableCell className="text-right tabular-nums">{m.recibo_bs > 0 ? fmt(m.recibo_bs) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums" style={{ color: m.banco_bs > 0 ? V.positive : undefined }}>{m.banco_bs > 0 ? fmt(m.banco_bs) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{m.recibo_bs > 0 && m.banco_bs > 0 ? fmt(m.dif_bs) : "—"}</TableCell>
                          <TableCell>{e && <Badge variant="outline" style={{ color: e.color, borderColor: e.color }}>{e.label}</Badge>}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Salvedad · Esther y Gladymar sin monto declarado</CardTitle>
              <CardDescription>
                Las {FONDO.salvedad.n} transferencias desde {FONDO.salvedad.desde} cuya razón es solo el nombre del receptor, sin el monto en US$ escrito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="rounded-lg border p-3" style={{ borderColor: V.warning }}>
                <p className="text-sm leading-relaxed">{FONDO.salvedad.nota}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" style={{ color: V.warning, borderColor: V.warning }}>
                  <CircleAlert className="mr-1 size-3.5" /> {FONDO.salvedad.n} transferencias
                </Badge>
                <Badge variant="outline" style={{ color: V.warning, borderColor: V.warning }}>
                  Bs {fmt0(FONDO.salvedad.bs)} en bolívares sin equivalente US$ declarado
                </Badge>
                <Badge variant="outline">desde {FONDO.salvedad.desde}</Badge>
              </div>
              <div className="max-h-[420px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="bg-muted/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Razón de la transferencia</TableHead>
                      <TableHead>Receptor</TableHead>
                      <TableHead className="text-right">Bs</TableHead>
                      <TableHead>Respaldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FONDO.salvedad.detalle.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap tabular-nums">{s.fecha}</TableCell>
                        <TableCell className="font-medium">«{s.razon}»</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{s.destino}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(s.bs)}</TableCell>
                        <TableCell>
                          {s.archivos.map((a) => (
                            <span key={a} className="mr-2 inline-flex items-center overflow-hidden rounded-md border text-xs">
                              <button onClick={() => setVisor({ nombre: a.split("/")[1], ruta: "/estados-cuenta/" + a })}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-muted" style={{ color: V.primary }}>
                                <Eye className="size-3" />Ver
                              </button>
                              <a href={encodeURI("/estados-cuenta/" + a)} download title={"Descargar " + a.split("/")[1]}
                                className="inline-flex items-center gap-1 border-l px-1.5 py-0.5 hover:bg-muted">
                                <FileDown className="size-3" style={{ color: V.primary }} />
                                <span className="truncate">{a.split("/")[1]}</span>
                              </a>
                              </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </DashboardCard>

          <DashboardCard>
            <CardHeader>
              <CardTitle>Cómo se lee (regla fija)</CardTitle>
              <CardDescription>Regla declarada de antemano, sin interpretaciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-relaxed">
              <p className="text-muted-foreground">
                {FONDO.meta.regla}. La equivalencia en dólares del fondo usa la tasa implícita de las compras del propio
                mes (Bs pagados ÷ US$ declarados en las razones de las transferencias); cuando el mes no tuvo compras
                con monto, se usa la tasa paralela de cierre de mes y se marca «(paralelo)». Es una regla simple: las
                salidas de un mes pueden estar cubriendo el fondo de dos — por eso el veredicto se lee junto con los
                números de al lado, no solo con el color.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.values(VEREDICTO).map((v) => (
                  <Badge key={v.label} variant="outline" style={{ color: v.color, borderColor: v.color }}>{v.label}</Badge>
                ))}
              </div>
              <p className="text-muted-foreground">
                <b className="text-foreground">Alcance:</b> {FONDO.meta.alcance}
              </p>
              <p className="text-muted-foreground">
                Solo cuenta el <b className="text-foreground">fondo de reserva</b> (conceptos FDO / FONDO RESERVA / FR).
                Los otros dos fondos que envía Taurus quedan fuera de la conciliación y se muestran como contexto:
                fondo de prestaciones sociales <b className="tabular-nums text-foreground">Bs {fmt0(FONDO.meta.prest_total_bs)}</b> y
                fondo de trabajo <b className="tabular-nums text-foreground">Bs {fmt0(FONDO.meta.trabajo_total_bs)}</b>.
                Datos: <code className="rounded bg-muted px-1">data/fondo.json</code>, generado por{" "}
                <code className="rounded bg-muted px-1">preparar_fondo.py</code>.
              </p>
            </CardContent>
          </DashboardCard>
        </section>
      )}

      {/* ---------------- METODOLOGÍA ---------------- */}
      {seccion === "metodologia" && (
<section id="metodologia" className="space-y-4 scroll-mt-20">
        <EncabezadoSeccion titulo="Metodología" descripcion="Fuentes, validación y conversión a dólares." />
        <DashboardCard>
          <CardContent className="space-y-4 pt-6 text-sm leading-relaxed">
            <div>
              <p className="font-semibold">1. Extracción y validación</p>
              <p className="text-muted-foreground mt-1">
                Los 48 recibos mensuales (PDF, sep-2022 a ago-2026) se convirtieron a tabla con un script determinista
                (Python + PyMuPDF): cada partida con su código, descripción y monto. El script valida que la suma de partidas
                coincida con los totales declarados en cada recibo — <b>48/48 meses cuadrados al céntimo</b>. Una muestra de meses
                fue además verificada visualmente contra los PDF.
              </p>
            </div>
            <div>
              <p className="font-semibold">2. Conversión a dólares</p>
              <p className="text-muted-foreground mt-1">
                Cada partida se divide entre la tasa oficial BCV del último día hábil de su mes (API rates.dolarvzla.com;
                sep–dic 2022: cierres BCV documentados). Se usa el dólar oficial —no el paralelo— como tasa contable de referencia. El selector «BCV / Paralelo» del encabezado cambia todas las cifras en dólares de la app a la tasa paralela de cierre de mes.
              </p>
            </div>
            <div>
              <p className="font-semibold">3. Agrupación de conceptos</p>
              <p className="text-muted-foreground mt-1">
                Las descripciones se normalizaron (se quitan fechas, meses y números de factura) para agrupar las{" "}
                {fmt0(D.meta.partidas)} partidas en {fmt0(D.conceptos.length)} conceptos comparables.
              </p>
            </div>
            <div>
              <p className="font-semibold">4. Fondo de reserva</p>
              <p className="text-muted-foreground mt-1">
                La administradora cobra y envía a la Junta la misma cifra cada mes (códigos 0001 y 0010). El acumulado
                refleja aportes; los recibos no registran desembolsos del fondo.
              </p>
            </div>
            <div>
              <p className="font-semibold">5. Cómo actualizar</p>
              <p className="text-muted-foreground mt-1">
                Guardar los recibos nuevos en carpetas «Recibos AAAA», re-ejecutar los scripts del pipeline y hacer push;
                Vercel redespliega solo. Los datos viven en <code className="rounded bg-muted px-1">data/gastos.json</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Python · PyMuPDF</Badge>
              <Badge variant="secondary">Next.js 16</Badge>
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="secondary">Recharts</Badge>
              <Badge variant="secondary">Tailwind CSS 4</Badge>
              <Badge variant="secondary">Modo claro y oscuro</Badge>
              <Badge variant="secondary">Vercel</Badge>
            </div>
          </CardContent>
        </DashboardCard>
      </section>
)}
      <VisorArchivo archivo={visor} onClose={() => setVisor(null)} />
    </div>
  );
}
