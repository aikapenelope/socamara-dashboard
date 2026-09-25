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
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  Database,
  PiggyBank,
  Receipt,
  Repeat,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import datos from "@/data/gastos.json";

/* ---------- tipos ---------- */
type Concepto = {
  concepto: string;
  codes: string[];
  n: number;
  meses: number;
  bs: number;
  usd: number;
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
};
type Fondo = { n: number; bs: number; usd: number };

const D = datos as {
  meta: { meses: number; desde: string; hasta: string; partidas: number; tot_bs: number; tot_usd: number };
  por_anio: { anio: string; bs: number; usd: number; n: number }[];
  por_seccion: { seccion: string; bs: number; usd: number; n: number }[];
  conceptos: Concepto[];
  serie_mes: { ym: string; bs: number; usd: number }[];
  fondo_acum: { ym: string; acum_bs: number }[];
  fondo_acum_usd: { ym: string; acum_usd: number }[];
  fondos: Record<string, Fondo>;
  devoluciones: {
    total_bs: number;
    total_usd: number;
    por_concepto: { concepto: string; n: number; bs: number; usd: number; ejemplo: string }[];
  };
  facturacion: { cat: string; n: number; bs: number; usd: number }[];
  recurrentes: Concepto[];
  items: Item[];
};

/* ---------- formato ---------- */
const nf2 = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });
const fmt = (v: number) => nf2.format(v);
const fmt0 = (v: number) => nf0.format(v);
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fmtUsd = (v: unknown) => "US$ " + fmt(Number(v));
const fmtBs = (v: unknown) => "Bs " + fmt(Number(v));

const C = {
  azul: "#1B2A4A",
  azul2: "#2d4370",
  verde: "#1B7D46",
  ambar: "#D4820A",
  rojo: "#C0392B",
  gris: "#8C8A84",
};
const PALETA = [C.azul, C.verde, C.ambar, C.rojo, C.gris, "#54718f", "#3a8f6b", "#b3701e", "#a33f2f", "#6f6d66"];

const CAT_FACT = {
  factura_citada: "Con factura citada en el recibo",
  recibo_servicio: "Servicios públicos (recibo oficial)",
  nomina_parafiscales: "Nómina y parafiscales",
  administracion_fondos: "Administración, fondos e IVA",
  terceros_verificar_factura: "Terceros: verificar factura",
};

function Kpi({ icono, titulo, valor, sub, tono }: { icono: React.ReactNode; titulo: string; valor: string; sub: string; tono?: string }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icono}
          <span>{titulo}</span>
        </div>
        <div className="mt-1.5 text-xl sm:text-2xl font-bold" style={tono ? { color: tono } : undefined}>
          {valor}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ChartTooltipBsUsd() {
  return (
    <Tooltip
      formatter={(v: unknown, nombre: unknown) => {
        const n = String(nombre)
        return n.startsWith("Bs") ? (["Bs " + fmt(Number(v)), n] as [string, string]) : (["US$ " + fmt(Number(v)), n] as [string, string])
      }}
    />
  );
}

export default function Dashboard() {
  const [busqueda, setBusqueda] = useState("");
  const [fAnio, setFAnio] = useState("todos");
  const [fSeccion, setFSeccion] = useState("todas");
  const [pagina, setPagina] = useState(0);
  const POR_PAG = 100;

  const fAdmin = D.fondos["FONDO DE RESERVA (administradora)"];
  const fJunta = D.fondos["FONDO DE RESERVA POR ENVIAR A JUNTA CONDOMINIO"];
  const otrosFondos = Object.entries(D.fondos).filter(
    ([k]) => !k.startsWith("FONDO DE RESERVA")
  );
  const sumaOtrosFondos = otrosFondos.reduce((a, [, v]) => a + v.bs, 0);

  const conceptosFiltrados = useMemo(
    () =>
      D.conceptos.filter((c) =>
        c.concepto.toLowerCase().includes(busqueda.toLowerCase())
      ),
    [busqueda]
  );

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

  const topConceptos = D.conceptos.filter((c) => c.usd > 0).slice(0, 15);
  const fac = Object.fromEntries(D.facturacion.map((f) => [f.cat, f]));

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      {/* encabezado */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Memoria y Cuenta · Edificio Socamara
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gastos comunes y fondo de reserva · {D.meta.desde} → {D.meta.hasta} ·{" "}
                {D.meta.meses} meses · {fmt0(D.meta.partidas)} partidas
              </p>
            </div>
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <ShieldCheck className="size-4 text-emerald-600" />
              48/48 recibos validados
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Kpi icono={<Wallet className="size-4" />} titulo="Total gastado (Bs)"
            valor={"Bs " + fmt0(D.meta.tot_bs)} sub={`${D.meta.meses} meses · sep-2022 a ago-2026`} />
          <Kpi icono={<TrendingUp className="size-4" />} titulo="Total gastado (US$)"
            valor={"US$ " + fmt0(D.meta.tot_usd)} sub="a tasa BCV de cierre de mes" />
          <Kpi icono={<Database className="size-4" />} titulo="Partidas"
            valor={fmt0(D.meta.partidas)} sub={`${D.conceptos.length} conceptos distintos`} />
          <Kpi icono={<PiggyBank className="size-4" />} titulo="Fondo de reserva aportado"
            valor={"Bs " + fmt0(fJunta?.bs ?? 0)} sub={`US$ ${fmt(fJunta?.usd ?? 0)} · administradora = Junta`} />
          <Kpi icono={<ArrowDownRight className="size-4" />} titulo="Devuelto (reintegros)"
            valor={"Bs " + fmt0(D.devoluciones.total_bs)} sub={`US$ ${fmt(D.devoluciones.total_usd)}`} tono={C.rojo} />
          <Kpi icono={<Receipt className="size-4" />} titulo="Por respaldar con factura"
            valor={fmt0(fac.terceros_verificar_factura?.n ?? 0)}
            sub={`partidas · Bs ${fmt0(fac.terceros_verificar_factura?.bs ?? 0)}`} tono={C.ambar} />
        </div>

        <Tabs defaultValue="resumen" className="mt-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto py-1">
            <TabsTrigger value="resumen" className="flex-none">Resumen</TabsTrigger>
            <TabsTrigger value="conceptos" className="flex-none">Conceptos</TabsTrigger>
            <TabsTrigger value="partidas" className="flex-none">Partidas</TabsTrigger>
            <TabsTrigger value="fondos" className="flex-none">Fondos</TabsTrigger>
            <TabsTrigger value="devoluciones" className="flex-none">Devoluciones</TabsTrigger>
            <TabsTrigger value="facturas" className="flex-none">Facturación</TabsTrigger>
            <TabsTrigger value="recurrentes" className="flex-none">Recurrentes</TabsTrigger>
            <TabsTrigger value="metodologia" className="flex-none">Metodología</TabsTrigger>
          </TabsList>

          {/* ---------------- RESUMEN ---------------- */}
          <TabsContent value="resumen" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Total por año</CardTitle>
                <CardDescription>
                  Barras: equivalente en dólares a tasa BCV de cierre de mes (comparable entre años). Línea: bolívares.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={D.por_anio}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="usd" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                    <YAxis yAxisId="bs" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v / 1e6) + " MM"} />
                    <ChartTooltipBsUsd />
                    <Legend />
                    <Bar yAxisId="usd" dataKey="usd" name="US$ (cierre de mes)" fill={C.azul} radius={[6, 6, 0, 0]} />
                    <Line yAxisId="bs" dataKey="bs" name="Bs" stroke={C.ambar} strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por sección</CardTitle>
                  <CardDescription>Participación en el total (US$)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={D.por_seccion} dataKey="usd" nameKey="seccion" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {D.por_seccion.map((_, i) => (
                          <Cell key={i} fill={PALETA[i % PALETA.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={fmtUsd} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Evolución mensual (US$)</CardTitle>
                  <CardDescription>Gasto total de cada mes convertido a tasa de cierre</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={D.serie_mes}>
                      <defs>
                        <linearGradient id="gradMes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.azul} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.azul} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="ym" tick={{ fontSize: 10 }} interval={5} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                      <Tooltip formatter={fmtUsd} />
                      <Area type="monotone" dataKey="usd" name="US$" stroke={C.azul} fill="url(#gradMes)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen por año</CardTitle>
              </CardHeader>
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
                        <TableCell className="text-right">{fmt0(a.n)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(a.bs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(a.usd)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{fmt0(D.meta.partidas)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(D.meta.tot_bs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(D.meta.tot_usd)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- CONCEPTOS ---------------- */}
          <TabsContent value="conceptos" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 15 conceptos por monto (US$)</CardTitle>
                <CardDescription>
                  En dólares a tasa de cierre de mes para poder comparar 2022 con 2026 (el bolívar se devaluó ~100×).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={topConceptos} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                    <YAxis type="category" dataKey="concepto" width={210} tick={{ fontSize: 11 }} tickFormatter={(v: string) => trunc(v, 34)} />
                    <Tooltip formatter={fmtUsd} />
                    <Bar dataKey="usd" name="US$" fill={C.azul} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Todos los conceptos ({fmt0(conceptosFiltrados.length)})</CardTitle>
                  <CardDescription>Agrupación de las {fmt0(D.meta.partidas)} partidas normalizando fechas y números de factura</CardDescription>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar concepto…" className="pl-8" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Códigos</TableHead>
                      <TableHead className="text-right">Partidas</TableHead>
                      <TableHead className="text-right">Meses</TableHead>
                      <TableHead className="text-right">Total (Bs)</TableHead>
                      <TableHead className="text-right">Total (US$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conceptosFiltrados.map((c) => (
                      <TableRow key={c.concepto}>
                        <TableCell className="max-w-[320px] whitespace-normal">{c.concepto}</TableCell>
                        <TableCell className="text-muted-foreground">{c.codes.join(", ")}</TableCell>
                        <TableCell className="text-right">{fmt0(c.n)}</TableCell>
                        <TableCell className="text-right">{c.meses}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(c.bs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(c.usd)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- PARTIDAS ---------------- */}
          <TabsContent value="partidas" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Explorador de partidas</CardTitle>
                <CardDescription>
                  Las {fmt0(D.meta.partidas)} partidas de los 48 recibos, con la tasa aplicada a cada mes. Filtro + búsqueda + paginación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Cód.</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto (Bs)</TableHead>
                      <TableHead className="text-right">Tasa</TableHead>
                      <TableHead className="text-right">Monto (US$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibles.map((it, i) => (
                      <TableRow key={`${it.a}-${it.m}-${it.c}-${i}`}>
                        <TableCell className="text-muted-foreground">{it.a}-{it.m}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{it.s}</TableCell>
                        <TableCell className="text-muted-foreground">{it.c}</TableCell>
                        <TableCell className="max-w-[360px] truncate" title={it.d}>{it.d}</TableCell>
                        <TableCell className={"text-right tabular-nums" + (it.q < 0 ? " text-red-600" : "")}>{fmt(it.q)}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(it.t)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(it.u)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- FONDOS ---------------- */}
          <TabsContent value="fondos" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi icono={<PiggyBank className="size-4" />} titulo="Aportado (administradora)"
                valor={"Bs " + fmt0(fAdmin?.bs ?? 0)} sub={`US$ ${fmt(fAdmin?.usd ?? 0)} · ${fAdmin?.n ?? 0} aportes`} />
              <Kpi icono={<PiggyBank className="size-4" />} titulo="Enviado a la Junta"
                valor={"Bs " + fmt0(fJunta?.bs ?? 0)} sub={`US$ ${fmt(fJunta?.usd ?? 0)} · ${fJunta?.n ?? 0} envíos`} />
              <Kpi icono={<Database className="size-4" />} titulo="Nivelación del fondo"
                valor={"Bs " + fmt0(D.fondos["NIVELACION FONDO DE RESERVA"]?.bs ?? 0)} sub="ajuste mensual" />
              <Kpi icono={<Wallet className="size-4" />} titulo="Otros fondos"
                valor={"Bs " + fmt0(sumaOtrosFondos)} sub="bonificación, prestaciones, pensiones" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fondo de reserva acumulado (Bs)</CardTitle>
                  <CardDescription>Suma de los aportes mensuales desde sep-2022</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={D.fondo_acum}>
                      <defs>
                        <linearGradient id="gradFondo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.verde} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.verde} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="ym" tick={{ fontSize: 10 }} interval={5} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                      <Tooltip formatter={fmtBs} />
                      <Area type="monotone" dataKey="acum_bs" name="Acumulado Bs" stroke={C.verde} fill="url(#gradFondo)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Fondo de reserva acumulado (US$)</CardTitle>
                  <CardDescription>Aportes convertidos a la tasa de cierre de cada mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={D.fondo_acum_usd}>
                      <defs>
                        <linearGradient id="gradFondoUsd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.azul} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.azul} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="ym" tick={{ fontSize: 10 }} interval={5} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                      <Tooltip formatter={fmtUsd} />
                      <Area type="monotone" dataKey="acum_usd" name="Acumulado US$" stroke={C.azul} fill="url(#gradFondoUsd)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
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
                        <TableCell className="text-right">{fmt0(v.n)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(v.bs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(v.usd)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- DEVOLUCIONES ---------------- */}
          <TabsContent value="devoluciones" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Kpi icono={<ArrowDownRight className="size-4" />} titulo="Total devuelto (Bs)"
                valor={"Bs " + fmt(D.devoluciones.total_bs)} sub="suma de partidas negativas" tono={C.rojo} />
              <Kpi icono={<ArrowDownRight className="size-4" />} titulo="Total devuelto (US$)"
                valor={"US$ " + fmt(D.devoluciones.total_usd)} sub="a tasa de cierre de cada mes" tono={C.rojo} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Devoluciones y reintegros por concepto (Bs)</CardTitle>
                <CardDescription>
                  La mayor parte son reintegros de agua: el edificio paga Hidrocapital/Hidroven y reintegra a los residentes el consumo del local,
                  que a su vez se cobra en «Gastos No Comunes» (0056) — devoluciones y cobros se compensan entre sí.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={D.devoluciones.por_concepto.slice(0, 10)} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt0(v)} />
                    <YAxis type="category" dataKey="concepto" width={210} tick={{ fontSize: 11 }} tickFormatter={(v: string) => trunc(v, 32)} />
                    <Tooltip formatter={fmtBs} />
                    <Bar dataKey="bs" name="Bs devueltos" fill={C.rojo} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        <TableCell className="text-right">{fmt0(d.n)}</TableCell>
                        <TableCell className="text-right tabular-nums text-red-600">{fmt(d.bs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.usd)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- FACTURACIÓN ---------------- */}
          <TabsContent value="facturas" className="mt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <Card>
                <CardHeader>
                  <CardTitle>Soporte documental de las partidas</CardTitle>
                  <CardDescription>Cómo se documenta cada gasto según su naturaleza</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={D.facturacion} dataKey="n" nameKey="cat" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {D.facturacion.map((_, i) => (
                          <Cell key={i} fill={PALETA[i % PALETA.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => fmt0(Number(v)) + " partidas"} />
                      <Legend formatter={(v: string) => CAT_FACT[v as keyof typeof CAT_FACT] ?? v} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
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
                          <TableCell className="whitespace-normal">{CAT_FACT[f.cat as keyof typeof CAT_FACT] ?? f.cat}</TableCell>
                          <TableCell className="text-right">{fmt0(f.n)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(f.bs)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(f.usd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- RECURRENCIA ---------------- */}
          <TabsContent value="recurrentes" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cargos presentes casi todos los meses (de 48)</CardTitle>
                <CardDescription>El «altura fija» del edificio: lo que se cobra mes a mes sin excepción</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={D.recurrentes.slice(0, 15)} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" domain={[0, 48]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="concepto" width={210} tick={{ fontSize: 11 }} tickFormatter={(v: string) => trunc(v, 34)} />
                    <Tooltip formatter={(v: unknown) => v + " de 48 meses"} />
                    <Bar dataKey="meses" name="Meses" fill={C.azul2} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
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
                        <TableCell className="text-muted-foreground">{r.codes.join(", ")}</TableCell>
                        <TableCell className="text-right">{r.meses}</TableCell>
                        <TableCell className="text-right">{fmt0(r.n)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.usd)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- METODOLOGÍA ---------------- */}
          <TabsContent value="metodologia" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cómo se construyó esta memoria</CardTitle>
                <CardDescription>Fuentes, validación y conversión a dólares</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
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
                    sep–dic 2022: cierres BCV documentados). Se usa el dólar oficial —no el paralelo— como tasa contable de referencia.
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
                    Guardar los recibos nuevos en carpetas «Recibos AAAA», re-ejecutar los scripts del pipeline y redeployar;
                    los datos viven en <code className="rounded bg-muted px-1">src/data/gastos.json</code>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">Python · PyMuPDF</Badge>
                  <Badge variant="secondary">Next.js 16</Badge>
                  <Badge variant="secondary">shadcn/ui</Badge>
                  <Badge variant="secondary">Recharts</Badge>
                  <Badge variant="secondary">Tailwind CSS 4</Badge>
                  <Badge variant="secondary">Vercel</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          Generado a partir de 48 recibos validados · 1.227 partidas · Tasas BCV oficiales de cierre de mes ·
          Datos: <code className="rounded bg-muted px-1">src/data/gastos.json</code>
        </div>
      </footer>
    </div>
  );
}
