"use client";

import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	BarChart3,
	BookOpen,
	CheckCircle2,
	FileText,
	GraduationCap,
	Layers,
	LifeBuoy,
	Package,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	SiFigma,
	SiGithub,
	SiGitlab,
	SiGooglesheets,
	SiSentry,
	SiSlack,
	SiTablecheck,
	SiZapier,
	SiZendesk,
} from "react-icons/si";

interface Feature {
	icon: ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	activated?: boolean;
	teamsActivated?: number;
}

interface Integration {
	icon: ReactNode;
	title: string;
	description: string;
	enabled?: boolean;
	actionLabel: string;
}

interface Guide {
	icon: ReactNode;
	iconBg: string;
	iconColor: string;
	title: string;
	description: string;
}

const features: Feature[] = [
	{
		icon: <LifeBuoy className="" size={20} />,
		title: "Запросы клиентов",
		description:
			"Отслеживайте и управляйте запросами клиентов вместе с работой вашей команды",
		actionLabel: "Попробовать запросы клиентов",
	},
	{
		icon: <SiTablecheck className="" size={20} />,
		title: "Инициативы",
		description:
			"Планируйте стратегическую работу над продуктом и отслеживайте прогресс в масштабе",
		actionLabel: "Узнать больше",
		activated: true,
	},
	{
		icon: <Package className="" size={20} />,
		title: "Циклы",
		description:
			"Отслеживайте рабочую нагрузку и скорость команды с помощью циклов",
		actionLabel: "Узнать больше",
		teamsActivated: 6,
	},
	{
		icon: <BarChart3 className="" size={20} />,
		title: "Представления",
		description:
			"Создавайте фильтрованные представления, которые можно сохранять и делиться с другими",
		actionLabel: "Открыть представления",
	},
	{
		icon: <Layers className="" size={20} />,
		title: "Сортировка",
		description:
			"Расставляйте приоритеты для задач, созданных из множественных интеграций вашей команды и службы поддержки клиентов",
		actionLabel: "Узнать больше",
		teamsActivated: 4,
	},
];

const guides: Guide[] = [
	{
		icon: <BookOpen size={20} />,
		iconBg: "bg-blue-50",
		iconColor: "text-blue-600",
		title: "Начальное руководство",
		description: "Быстрые советы для новичков",
	},
	{
		icon: <FileText size={20} />,
		iconBg: "bg-indigo-50",
		iconColor: "text-indigo-600",
		title: "Руководство по функциям",
		description: "Как работает система",
	},
	{
		icon: <GraduationCap size={20} />,
		iconBg: "bg-purple-50",
		iconColor: "text-purple-600",
		title: "Методология разработки",
		description: "Лучшие практики для разработки",
	},
	{
		icon: <SiSlack size={20} />,
		iconBg: "bg-blue-50",
		iconColor: "text-blue-600",
		title: "Присоединитесь к Slack сообществу",
		description: "Задавайте вопросы и знакомьтесь с другими",
	},
];

const integrations: Integration[] = [
	{
		icon: <SiGithub size={24} />,
		title: "GitHub",
		description:
			"Связывайте pull request'ы, коммиты и автоматизируйте рабочие процессы",
		enabled: true,
		actionLabel: "Включено",
	},
	{
		icon: <SiGitlab size={24} />,
		title: "GitLab",
		description:
			"Связывайте merge request'ы и автоматизируйте рабочие процессы",
		actionLabel: "Открыть",
	},
	{
		icon: <SiSlack size={24} />,
		title: "Slack",
		description:
			"Отправляйте уведомления в каналы и создавайте задачи из сообщений",
		enabled: true,
		actionLabel: "Включено",
	},
	{
		icon: <SiFigma size={24} />,
		title: "Figma",
		description: "Встраивайте превью файлов в задачи",
		enabled: true,
		actionLabel: "Включено",
	},
	{
		icon: <SiSentry size={24} />,
		title: "Sentry",
		description: "Связывайте исключения с задачами",
		actionLabel: "Открыть",
	},
	{
		icon: <SiZapier size={20} />,
		title: "Zapier",
		description:
			"Создавайте пользовательские автоматизации и интеграции с другими приложениями",
		actionLabel: "Открыть",
	},
	{
		icon: <SiZendesk size={20} />,
		title: "Zendesk",
		description: "Связывайте и автоматизируйте тикеты Zendesk",
		actionLabel: "Открыть",
	},
	{
		icon: <SiGooglesheets size={20} />,
		title: "Google Sheets",
		description: "Экспортируйте задачи и создавайте пользовательскую аналитику",
		actionLabel: "Открыть",
	},
];

const FeatureCard = ({ feature }: { feature: Feature }) => {
	return (
		<div className="flex h-full flex-col rounded-lg border bg-card p-5">
			<div className="mb-3 flex items-start gap-4">
				{feature.icon}
				<div className="flex-1">
					<h3 className="font-medium text-card-foreground">{feature.title}</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						{feature.description}
					</p>
				</div>
			</div>
			<div className="mt-auto flex items-center gap-3">
				{feature.activated && (
					<div className="flex items-center gap-1 text-muted-foreground text-xs">
						<div className="h-2 w-2 rounded-full bg-green-500"></div>
						<span>Активировано</span>
					</div>
				)}
				{feature.teamsActivated && (
					<div className="flex items-center gap-1 text-muted-foreground text-xs">
						<CheckCircle2 size={14} />
						<span>Активировано {feature.teamsActivated} команд</span>
					</div>
				)}
			</div>
		</div>
	);
};

const IntegrationCard = ({ integration }: { integration: Integration }) => {
	return (
		<div className="mb-3 flex items-start gap-4">
			<div className="text-card-foreground">{integration.icon}</div>
			<div className="flex h-full flex-col space-y-2">
				<div className="flex-1">
					<h3 className="font-medium text-card-foreground">
						{integration.title}
					</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						{integration.description}
					</p>
				</div>
				<Button variant="outline" size="sm" className="w-fit text-sm">
					{integration.actionLabel}
				</Button>
			</div>
		</div>
	);
};

const GuideCard = ({ guide }: { guide: Guide }) => {
	return (
		<div className="flex items-start gap-3 rounded-lg border bg-card p-5">
			<div className="shrink-0">{guide.icon}</div>
			<div className="-mt-1 w-full">
				<h3 className="font-medium text-card-foreground text-sm">
					{guide.title}
				</h3>
				<p className="mt-1 line-clamp-1 text-muted-foreground text-xs">
					{guide.description}
				</p>
			</div>
			<Button variant="ghost" size="icon" className="shrink-0">
				<ArrowRight size={16} />
			</Button>
		</div>
	);
};

export default function Settings() {
	return (
		<div className="mx-auto w-full max-w-7xl px-8 py-8">
			<div className="mb-10">
				<h1 className="mb-1 font-semibold text-2xl">Рабочая область</h1>
				<p className="text-muted-foreground">
					Управляйте настройками рабочей области. Ваша рабочая область находится
					в регионе <span className="font-medium">Россия</span>
				</p>
			</div>

			<div className="mb-10">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Исследовать возможности</h2>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<FeatureCard key={index} feature={feature} />
					))}
				</div>
			</div>

			<div className="mb-10">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Интеграции</h2>
					<Button variant="outline" size="sm" className="text-sm">
						Просмотреть все
					</Button>
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{integrations.map((integration, index) => (
						<IntegrationCard key={index} integration={integration} />
					))}
				</div>
			</div>

			<div className="mb-10">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-semibold text-xl">Дополнительно</h2>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{guides.map((guide, index) => (
						<GuideCard key={index} guide={guide} />
					))}
				</div>
			</div>
		</div>
	);
}
