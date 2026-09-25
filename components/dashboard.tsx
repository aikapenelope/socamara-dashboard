"use client";

import { useMemo, useState } from "react";
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
  ArrowDownRight,
  ArrowUp,
  ArrowUpDown,
  Database,
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
  const sel = (o: { usd: number; usd_par?: number }) => (enParalelo ? (o.usd_par ?? o.usd) : o.usd);
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
  }, [conceptosFiltrados, orden]);

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
    </div>
  );
}
