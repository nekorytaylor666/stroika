import {
	BarChart,
	Bell,
	Box,
	Building,
	Clock,
	ContactRound,
	FileText,
	FolderKanban,
	Inbox,
	KeyRound,
	Layers,
	LifeBuoy,
	MessageSquare,
	Package,
	Paperclip,
	Settings,
	Shield,
	Tag,
	UserRound,
	Users,
	Zap,
} from "lucide-react";

export const inboxItems: unknown[] = [];

export const workspaceItems = [
	{
		name: "Команды",
		url: "/lndev-ui/teams",
		icon: ContactRound,
	},
	{
		name: "Проекты",
		url: "/lndev-ui/projects",
		icon: Box,
	},
	{
		name: "Участники",
		url: "/lndev-ui/members",
		icon: UserRound,
	},
];

export const accountItems = [
	{
		name: "Профиль",
		url: "#",
		icon: Users,
	},
	{
		name: "Платежи",
		url: "#",
		icon: Settings,
	},
];

export const featuresItems = [
	{ name: "Циклы", url: "#", icon: Package },
	{ name: "Задачи", url: "/", icon: Layers },
	{ name: "Проекты", url: "/projects", icon: BarChart },
	{ name: "Триаж", url: "#", icon: LifeBuoy },
];

export const settingsItems = [
	{ name: "Участники", url: "/lndev-ui/members", icon: Users },
	{ name: "Команды", url: "/lndev-ui/teams", icon: Users },
	{ name: "Общие", url: "#", icon: Settings },
	{ name: "Администрирование", url: "/lndev-ui/settings/admin", icon: Shield },
	{ name: "Организация", url: "/lndev-ui/settings", icon: Building },
];

export const resourcesItems = [
	{ name: "Вложения", url: "/lndev-ui/attachments", icon: Paperclip },
];
