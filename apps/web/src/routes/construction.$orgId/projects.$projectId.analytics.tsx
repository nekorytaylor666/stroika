import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import {
	GanttFeatureItem,
	GanttFeatureList,
	GanttFeatureListGroup,
	GanttHeader,
	GanttMarker,
	type GanttMarkerProps,
	GanttProvider,
	GanttSidebar,
	GanttSidebarGroup,
	GanttSidebarItem,
	GanttTimeline,
	GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructionGanttData } from "@/hooks/use-construction-gantt-data";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/analytics",
)({
	component: ProjectAnalyticsPage,
});

function ProjectAnalyticsPage() {
	const { projectId } = Route.useParams();
	const { features, projectMarkers, project, isLoading } =
		useConstructionGanttData(projectId as Id<"constructionProjects">);

	// Prepare timeline markers
	const timelineMarkers: GanttMarkerProps[] = [];
	if (projectMarkers.startDate) {
		timelineMarkers.push({
			id: "project-start",
			date: projectMarkers.startDate,
			label: "Начало проекта",
		});
	}
	if (projectMarkers.targetDate) {
		timelineMarkers.push({
			id: "project-deadline",
			date: projectMarkers.targetDate,
			label: "Дедлайн",
		});
	}

	// Group features by status
	const featuresByStatus = features.reduce(
		(acc, feature) => {
			const statusName = feature.status.name;
			if (!acc[statusName]) acc[statusName] = [];
			acc[statusName].push(feature);
			return acc;
		},
		{} as Record<string, typeof features>,
	);

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-3">
				<BarChart3 className="h-8 w-8 text-muted-foreground" />
				<h1 className="font-semibold text-2xl">Аналитика проекта</h1>
			</div>

			{/* Gantt Chart Section */}
			<Card className="mb-6">
				<div className="border-b p-4">
					<div className="flex items-center gap-2">
						<CalendarDays className="h-5 w-5 text-muted-foreground" />
						<h2 className="font-semibold text-lg">График задач</h2>
					</div>
				</div>
				<div className="p-4">
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : features.length > 0 ? (
						<div className="h-[600px]">
							<GanttProvider range="daily" zoom={100}>
								<GanttSidebar>
									{Object.entries(featuresByStatus).map(
										([statusName, statusFeatures]) => (
											<GanttSidebarGroup key={statusName} name={statusName}>
												{statusFeatures.map((feature) => (
													<GanttSidebarItem
														key={feature.id}
														feature={feature}
													/>
												))}
											</GanttSidebarGroup>
										),
									)}
								</GanttSidebar>
								<GanttTimeline>
									<GanttHeader />
									<GanttFeatureList>
										{Object.entries(featuresByStatus).map(
											([statusName, statusFeatures]) => (
												<GanttFeatureListGroup key={statusName}>
													{statusFeatures.map((feature) => (
														<GanttFeatureItem key={feature.id} {...feature} />
													))}
												</GanttFeatureListGroup>
											),
										)}
									</GanttFeatureList>
									{/* Timeline markers */}
									{timelineMarkers.map((marker) => (
										<GanttMarker
											key={marker.id}
											{...marker}
											className={
												marker.id === "project-deadline"
													? "bg-red-500"
													: "bg-green-500"
											}
										/>
									))}
									<GanttToday />
								</GanttTimeline>
							</GanttProvider>
						</div>
					) : (
						<div className="flex h-[400px] items-center justify-center">
							<p className="text-muted-foreground">
								Нет задач для отображения на графике
							</p>
						</div>
					)}
				</div>
			</Card>

			{/* Other Analytics */}
			<Card className="p-6">
				<p className="text-muted-foreground">
					Дополнительная аналитика проекта будет добавлена позже.
				</p>
			</Card>
		</div>
	);
}
