"use client";

import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTasa } from "@/components/tasa-context";
import { Button } from "@/components/ui/button";
import { useSeccion } from "@/components/seccion-context";
import { TITULOS_SECCION } from "@/components/app-shared";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
	const { seccion } = useSeccion();
	const { tasa, setTasa } = useTasa();

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={{ title: TITULOS_SECCION[seccion] ?? seccion }} />
			</div>
			<div className="flex items-center gap-2">
				<div className="flex items-center rounded-lg border p-0.5" role="group" aria-label="Tasa de conversión a dólares">
					<Button variant={tasa === "bcv" ? "secondary" : "ghost"} size="sm"
						className="h-7 px-2.5 text-xs" aria-pressed={tasa === "bcv"}
						onClick={() => setTasa("bcv")}>BCV</Button>
					<Button variant={tasa === "paralelo" ? "secondary" : "ghost"} size="sm"
						className="h-7 px-2.5 text-xs" aria-pressed={tasa === "paralelo"}
						onClick={() => setTasa("paralelo")}>Paralelo</Button>
				</div>
				<Badge variant="outline" className="hidden gap-1.5 py-1.5 px-3 lg:flex">
					<ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
					48/48 recibos validados
				</Badge>
				<ThemeToggle />
			</div>
		</header>
	);
}
