# Memoria y Cuenta · Edificio Socamara 2022–2026

Dashboard profesional de gastos comunes y fondo de reserva del **Edificio Socamara** (Caracas), construido a partir de los 48 recibos mensuales de la Junta de Condominio (sep-2022 → ago-2026), todos validados contra los totales declarados.

🔗 **Demo en vivo:** https://socamara-dashboard.vercel.app

## Qué muestra

| Sección | Contenido |
|---|---|
| **Resumen** | KPIs totales (Bs y US$), gráfico por año, distribución por sección, evolución mensual |
| **Conceptos** | Top 15 conceptos + tabla de los 199 conceptos con buscador |
| **Partidas** | Las 1.227 partidas con filtros por año/sección, búsqueda y paginación |
| **Fondos** | Fondo de reserva acumulado (Bs y US$), aportes administradora vs Junta, otros fondos |
| **Dólar paralelo** | Serie mensual del dólar negro con brecha vs BCV y link de evidencia (Wayback) de cada precio |
| **Devoluciones** | Reintegros y devoluciones por concepto (incl. el ciclo del agua) |
| **Facturación** | Soporte documental: facturas citadas, servicios públicos, nómina, terceros por verificar |
| **Recurrentes** | Cargos presentes los 48 meses (gasto fijo del edificio) |
| **Metodología** | Fuentes, validación y conversión a dólares |

## Metodología (resumen)

1. **Extracción determinista** — Python + PyMuPDF lee cada PDF (`Recibos AAAA/MM-YYYY.pdf`) y genera una fila por partida (código, descripción, monto). El script valida que la suma de partidas coincida con los totales declarados en cada recibo: **48/48 meses cuadrados al céntimo**, más verificación visual de una muestra.
2. **Conversión a dólares** — cada partida se divide entre la tasa oficial **BCV del último día hábil de su mes** (API pública de rates.dolarvzla.com; sep–dic 2022: cierres BCV documentados). El selector **BCV / Paralelo** del encabezado cambia todas las cifras en dólares de la app a la **tasa paralela de cierre de mes** (promedio de monitores hasta jun-2026; USDT/Binance P2P desde jul-2026), cada una con su link de evidencia en la sección Dólar paralelo.
3. **Normalización de conceptos** — las descripciones se limpian de fechas, meses y números de factura para agrupar las 1.227 partidas en 199 conceptos comparables.
4. **Fondo de reserva** — la administradora cobra y envía a la Junta la misma cifra cada mes (códigos 0001/0010). El acumulado refleja aportes; los recibos no registran desembolsos del fondo.

## Stack

- **Next.js 16** (App Router, estático) + **TypeScript**
- **shadcn/ui** (Tailwind CSS 4 + Radix UI) — tema neutral
- **Recharts** para los gráficos
- **Vercel** para el despliegue

## Estructura

```
socamara-dashboard/
├── app/
│   ├── layout.tsx          # metadatos y fuentes
│   ├── page.tsx            # renderiza el dashboard
│   └── globals.css         # tema shadcn (Tailwind v4)
├── components/
│   ├── dashboard.tsx       # dashboard completo (cliente)
│   └── ui/                 # componentes shadcn/ui (button, card, tabs, table…)
├── data/
│   └── gastos.json         # agregados + 1.227 partidas (fuente de verdad)
└── lib/utils.ts
```

## Cómo actualizar los datos

1. Guardar los recibos nuevos en carpetas `Recibos AAAA/MM-YYYY.pdf`.
2. Ejecutar el pipeline (en la carpeta raíz del proyecto de datos, `Fondo de Reserva - Junta de Condominio/`):
   ```bash
   python3 extraer_gastos_csv.py        # extrae y valida vs totales (exit≠0 si descuadra)
   python3 convertir_gastos_a_usd.py    # añade tasa BCV y monto USD
   python3 construir_resumen_dolar.py   # serie oficial+paralelo fin de mes
   python3 preparar_datos_app.py        # regenera data/gastos.json
   ```
3. Commit + push a `main` → Vercel redespliega solo.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
```

## Despliegue

Conectado a GitHub → Vercel redespliega automáticamente en cada push a `main`.
Para enlazar manualmente: `vercel link && vercel deploy --prod`.

---

*Datos procesados con scripts deterministas y verificados en dos vías (aritmética contra los totales de cada PDF y revisión visual). Los montos en US$ son equivalentes informativos a tasa oficial de cierre de mes, no movimientos reales en divisas.*
