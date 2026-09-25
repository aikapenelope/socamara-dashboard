import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BookOpenIcon,
  ExternalLinkIcon,
  LayoutGridIcon,
  ListIcon,
  PiggyBankIcon,
  ReceiptIcon,
  RepeatIcon,
  Undo2Icon,
} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	id?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{ title: "Resumen", id: "resumen", path: "#resumen", icon: <LayoutGridIcon /> },
			{ title: "Conceptos", id: "conceptos", path: "#conceptos", icon: <BarChart3Icon /> },
			{ title: "Partidas", id: "partidas", path: "#partidas", icon: <ListIcon /> },
		],
	},
	{
		label: "Dinero del edificio",
		items: [
			{ title: "Fondos", id: "fondos", path: "#fondos", icon: <PiggyBankIcon /> },
			{ title: "Devoluciones", id: "devoluciones", path: "#devoluciones", icon: <Undo2Icon /> },
			{ title: "Facturación", id: "facturas", path: "#facturas", icon: <ReceiptIcon /> },
			{ title: "Recurrentes", id: "recurrentes", path: "#recurrentes", icon: <RepeatIcon /> },
		],
	},
	{
		label: "Referencia",
		items: [
			{ title: "Metodología", id: "metodologia", path: "#metodologia", icon: <BookOpenIcon /> },
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Repositorio (GitHub)",
		path: "https://github.com/aikapenelope/socamara-dashboard",
		icon: <ExternalLinkIcon />,
	},
];

export const TITULOS_SECCION: Record<string, string> = {
	resumen: "Resumen",
	conceptos: "Conceptos",
	partidas: "Partidas",
	fondos: "Fondos",
	devoluciones: "Devoluciones",
	facturas: "Facturación",
	recurrentes: "Recurrentes",
	metodologia: "Metodología",
};
