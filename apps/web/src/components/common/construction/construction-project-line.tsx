import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useConstructionData } from "@/hooks/use-construction-data";
import type { ConstructionProject } from "@/store/construction/construction-convex-store";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Building,
	Building2,
	Car,
	ExternalLink,
	Factory,
	Home,
} from "lucide-react";
import { useState } from "react";
import { AssigneeUser } from "../issues/assignee-user";
import { ConstructionProjectDetails } from "./construction-project-details";

interface ConstructionProjectLineProps {
	project: ConstructionProject;
}

export function ConstructionProjectLine({
	project,
}: ConstructionProjectLineProps) {
	const [detailsOpen, setDetailsOpen] = useState(false);
	const { getUserById, getStatusById, getPriorityById } = useConstructionData();
	const navigate = useNavigate();
	const params = useParams({
		from: "/construction/$orgId/construction-projects",
	});

	// Populate relationships from store
	const lead = project.leadId ? getUserById(project.leadId) : null;
	const status = project.statusId ? getStatusById(project.statusId) : null;
	const priority = project.priorityId
		? getPriorityById(project.priorityId)
		: null;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ru-KZ", {
			style: "currency",
			currency: "KZT",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getHealthColor = (healthId: string) => {
		switch (healthId) {
			case "on-track":
				return "text-green-600 bg-green-100 dark:bg-green-900/20";
			case "at-risk":
				return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
			case "off-track":
				return "text-red-600 bg-red-100 dark:bg-red-900/20";
			case "no-update":
				return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
			default:
				return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
		}
	};

	const getProjectTypeIcon = (type: string) => {
		switch (type) {
			case "residential":
				return Home;
			case "commercial":
				return Building2;
			case "industrial":
				return Factory;
			case "infrastructure":
				return Car;
			default:
				return Building;
		}
	};

	const IconComponent = getProjectTypeIcon(project.projectType);

	const handleNavigateToOverview = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigate({
			to: "/construction/$orgId/projects/$projectId/overview",
			params: {
				orgId: params.orgId,
				projectId: project._id,
			},
		});
	};

	return (
		<>
			<div
				className="group flex w-full cursor-pointer items-center gap-4 border-muted-foreground/5 border-b px-6 py-3 text-sm hover:bg-sidebar/50"
				onClick={() => setDetailsOpen(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setDetailsOpen(true);
					}
				}}
				role="button"
				tabIndex={0}
			>
				<div className="flex w-[35%] min-w-[300px] items-center gap-3 md:w-[30%] lg:w-[25%]">
					<div className="relative">
						<div className="inline-flex size-8 shrink-0 items-center justify-center rounded bg-muted/50">
							<IconComponent className="size-4 text-muted-foreground" />
						</div>
					</div>
					<div className="flex flex-col items-start overflow-hidden">
						<span className="w-full truncate font-medium">{project.name}</span>
						<div className="mt-1 flex items-center gap-2">
							<Badge variant="outline" className="text-xs">
								{project.projectType === "residential"
									? "Жилое"
									: project.projectType === "commercial"
										? "Коммерческое"
										: project.projectType === "industrial"
											? "Промышленное"
											: "Инфраструктура"}
							</Badge>
							<Badge className={`text-xs ${getHealthColor(project.healthId)}`}>
								{project.healthName}
							</Badge>
						</div>
					</div>
				</div>

				<div className="w-[20%] text-sm md:w-[15%] lg:w-[15%]">
					<div className="truncate">{project.client}</div>
					<div className="text-muted-foreground text-xs">
						{project.location}
					</div>
				</div>

				<div className="w-[15%] md:w-[10%] lg:w-[10%]">
					<div className="font-medium text-sm">{project.percentComplete}%</div>
					<Progress value={project.percentComplete} className="mt-1 h-1.5" />
				</div>

				<div className="w-[15%] text-sm md:w-[15%] lg:w-[15%]">
					<div className="font-semibold text-green-600">
						{formatCurrency(project.contractValue)}
					</div>
					<div className="text-muted-foreground text-xs">
						{project.startDate &&
							new Date(project.startDate).toLocaleDateString("ru-RU")}
					</div>
				</div>

				<div className="hidden lg:block lg:w-[10%]">
					{priority && (
						<Badge variant="outline" className="text-xs">
							{priority.name}
						</Badge>
					)}
				</div>

				<div className="hidden lg:block lg:w-[10%]">
					{status && (
						<Badge
							variant="outline"
							className="text-xs"
							style={{ color: status.color }}
						>
							{status.name}
						</Badge>
					)}
				</div>

				<div className="flex w-[15%] items-center gap-2 md:w-[15%] lg:w-[15%]">
					{lead && <AssigneeUser user={lead as any} />}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
						onClick={handleNavigateToOverview}
						title="Открыть обзор проекта"
					>
						<ExternalLink className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<ConstructionProjectDetails
				project={project}
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
			/>
		</>
	);
}
