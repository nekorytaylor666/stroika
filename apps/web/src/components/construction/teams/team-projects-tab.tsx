"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, FolderOpen, Users } from "lucide-react";
import { motion } from "motion/react";

interface TeamProjectsTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamProjectsTab({ teamId }: TeamProjectsTabProps) {
	// Get team details
	const team = useQuery(api.constructionTeams.getTeamWithStats, { teamId });

	// Get team projects
	const teamProjects = useQuery(
		api.constructionTeams.getTeamProjects,
		team ? { teamId } : "skip",
	);

	if (!teamProjects) {
		return (
			<div className="h-full p-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="p-6">
				{teamProjects.length === 0 ? (
					<Card className="p-6">
						<div className="flex flex-col items-center justify-center text-center">
							<FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
							<h3 className="font-medium">Нет проектов</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								Команда пока не назначена ни на один проект
							</p>
						</div>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{teamProjects.map((project, index) => (
							<motion.div
								key={project._id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Link
									to="/construction/$orgId/projects/$projectId"
									params={{
										orgId: team?.organizationId,
										projectId: project._id,
									}}
									className="block"
								>
									<Card className="overflow-hidden transition-all hover:shadow-md">
										<CardContent className="p-5">
											<div className="space-y-3">
												{/* Project Header */}
												<div className="flex items-start justify-between">
													<h3 className="line-clamp-1 font-medium">
														{project.name}
													</h3>
													<Badge
														variant={
															project.status?.name === "Завершен"
																? "secondary"
																: project.status?.name === "В работе"
																	? "default"
																	: "outline"
														}
													>
														{project.status?.name || "Новый"}
													</Badge>
												</div>

												{/* Client */}
												{project.client && (
													<p className="line-clamp-1 text-muted-foreground text-sm">
														{project.client}
													</p>
												)}

												{/* Progress */}
												<div className="space-y-2">
													<div className="flex items-center justify-between text-sm">
														<span className="text-muted-foreground">
															Прогресс
														</span>
														<span className="font-medium">
															{project.progress || 0}%
														</span>
													</div>
													<Progress value={project.progress || 0} />
												</div>

												{/* Stats */}
												<div className="grid grid-cols-2 gap-3 pt-2">
													<div className="flex items-center gap-2">
														<CheckCircle2 className="h-4 w-4 text-green-500" />
														<div>
															<p className="font-medium text-sm">
																{project.completedTasks || 0}
															</p>
															<p className="text-muted-foreground text-xs">
																Выполнено
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Clock className="h-4 w-4 text-orange-500" />
														<div>
															<p className="font-medium text-sm">
																{project.totalTasks || 0}
															</p>
															<p className="text-muted-foreground text-xs">
																Всего задач
															</p>
														</div>
													</div>
												</div>

												{/* Footer */}
												<div className="flex items-center justify-between border-t pt-3">
													<div className="flex items-center gap-1 text-muted-foreground">
														<Users className="h-3 w-3" />
														<span className="text-xs">
															{project.teamMemberCount || 0} участников
														</span>
													</div>
													{project.dueDate && (
														<div className="flex items-center gap-1 text-muted-foreground">
															<Calendar className="h-3 w-3" />
															<span className="text-xs">
																{format(new Date(project.dueDate), "d MMM", {
																	locale: ru,
																})}
															</span>
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
