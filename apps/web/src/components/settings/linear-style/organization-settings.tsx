"use client";

import { cn } from "@/lib/utils";
import { Building, FileText, Shield, Users } from "lucide-react";
import { useState } from "react";
import { LinearMemberManagement } from "./member-management";
import { LinearPermissionsManagement } from "./permissions-management";
import { LinearTeamManagement } from "./team-management";
import { LinearTemplateManagement } from "./template-management";

interface OrganizationSettingsProps {
	organizationId?: string;
}

type TabValue = "members" | "teams" | "permissions" | "templates";

const tabs = [
	{
		value: "members" as TabValue,
		label: "Участники",
		icon: Users,
		description: "Управление участниками организации",
	},
	{
		value: "teams" as TabValue,
		label: "Команды",
		icon: Building,
		description: "Создание и управление командами",
	},
	{
		value: "permissions" as TabValue,
		label: "Права доступа",
		icon: Shield,
		description: "Настройка ролей и разрешений",
	},
	{
		value: "templates" as TabValue,
		label: "Шаблоны задач",
		icon: FileText,
		description: "Создание шаблонов для типовых задач",
	},
];

export function LinearOrganizationSettings({
	organizationId,
}: OrganizationSettingsProps) {
	const [activeTab, setActiveTab] = useState<TabValue>("members");

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b px-8 py-6">
				<h1 className="font-semibold text-2xl">Настройки организации</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Управляйте участниками, командами и правами доступа
				</p>
			</div>

			{/* Navigation */}
			<div className="border-b">
				<nav className="flex px-8" aria-label="Tabs">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.value;
						return (
							<button
								key={tab.value}
								onClick={() => setActiveTab(tab.value)}
								className={cn(
									"group relative flex items-center gap-2 border-b-2 px-1 py-4 font-medium text-sm transition-colors",
									isActive
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
								{isActive && (
									<div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" />
								)}
							</button>
						);
					})}
				</nav>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-8 py-6">
					{activeTab === "members" && (
						<LinearMemberManagement organizationId={organizationId} />
					)}
					{activeTab === "teams" && (
						<LinearTeamManagement organizationId={organizationId} />
					)}
					{activeTab === "permissions" && (
						<LinearPermissionsManagement organizationId={organizationId} />
					)}
					{activeTab === "templates" && (
						<LinearTemplateManagement organizationId={organizationId} />
					)}
				</div>
			</div>
		</div>
	);
}
