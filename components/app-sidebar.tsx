"use client";

import { Badge } from "@/components/ui/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { navGroups, footerNavLinks } from "@/components/app-shared";
import { useSeccion, type SeccionId } from "@/components/seccion-context";
import type { SidebarNavGroup } from "@/components/app-shared";
import { cn } from "@/lib/utils";
import { PiggyBankIcon, ShieldCheckIcon } from "lucide-react";

function NavGroup({ label, items }: SidebarNavGroup) {
	const { seccion, setSeccion } = useSeccion();
	const { setOpenMobile } = useSidebar();

	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							isActive={seccion === (item.id as SeccionId)}
							tooltip={item.title}
							onClick={() => {
								setSeccion(item.id as SeccionId);
								setOpenMobile(false);
							}}
						>
							{item.icon}
							<span>{item.title}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export function AppSidebar() {
	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2">
				<SidebarMenuButton size="lg" className="pointer-events-none">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<PiggyBankIcon className="size-4.5" />
					</span>
					<span className="grid leading-tight">
						<span className="font-semibold text-foreground!">Edif. Socamara</span>
						<span className="text-[11px] text-muted-foreground">Memoria y Cuenta</span>
					</span>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<SidebarMenu className="border-t p-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild className="text-muted-foreground" size="sm">
								<a href={item.path} target="_blank" rel="noreferrer">
									{item.icon}
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
				<div className="px-4 pt-1 pb-3 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<Badge variant="outline" className="gap-1 py-1 text-[10px]">
						<ShieldCheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
						48/48 recibos validados
					</Badge>
					<p className="mt-2 text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} Junta de Condominio
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
