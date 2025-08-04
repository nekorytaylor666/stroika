"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	File,
	FileImage,
	FileSpreadsheet,
	FileText,
	Files,
	FolderOpen,
} from "lucide-react";
import { motion } from "motion/react";

interface TeamFilesTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamFilesTab({ teamId }: TeamFilesTabProps) {
	// Get team details
	const team = useQuery(api.constructionTeams.getTeamWithStats, { teamId });

	// Get files for team projects
	const teamFiles = useQuery(
		api.constructionTeams.getTeamFiles,
		team ? { teamId } : "skip",
	);

	const getFileIcon = (mimeType: string) => {
		if (mimeType.startsWith("image/")) return FileImage;
		if (mimeType === "application/pdf") return FileText;
		if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
			return FileSpreadsheet;
		if (mimeType.includes("document") || mimeType.includes("word"))
			return FileText;
		return File;
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Б";
		const k = 1024;
		const sizes = ["Б", "КБ", "МБ", "ГБ"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	};

	if (!teamFiles) {
		return (
			<div className="h-full p-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="p-6">
				{teamFiles.length === 0 ? (
					<Card className="p-6">
						<div className="flex flex-col items-center justify-center text-center">
							<Files className="mb-3 h-10 w-10 text-muted-foreground/40" />
							<h3 className="font-medium">Нет файлов</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								Файлы из проектов команды будут отображаться здесь
							</p>
						</div>
					</Card>
				) : (
					<div className="space-y-4">
						{/* Group files by project */}
						{Object.entries(
							teamFiles.reduce((groups: any, file: any) => {
								const projectName = file.project?.name || "Без проекта";
								if (!groups[projectName]) {
									groups[projectName] = [];
								}
								groups[projectName].push(file);
								return groups;
							}, {}),
						).map(([projectName, files]: [string, any[]]) => (
							<div key={projectName}>
								<div className="mb-3 flex items-center gap-2">
									<FolderOpen className="h-4 w-4 text-muted-foreground" />
									<h3 className="font-medium">{projectName}</h3>
									<Badge variant="secondary" className="text-xs">
										{files.length}
									</Badge>
								</div>

								<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
									{files.map((file, index) => {
										const Icon = getFileIcon(file.mimeType);
										return (
											<motion.div
												key={file._id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
											>
												<Card className="overflow-hidden transition-all hover:shadow-md">
													<CardContent className="p-4">
														<div className="flex items-start gap-3">
															<div className="rounded-lg bg-muted p-2">
																<Icon className="h-5 w-5 text-muted-foreground" />
															</div>
															<div className="flex-1 space-y-1">
																<h4 className="line-clamp-1 font-medium text-sm">
																	{file.fileName}
																</h4>
																<div className="flex items-center gap-2 text-muted-foreground text-xs">
																	<span>{formatFileSize(file.fileSize)}</span>
																	<span>•</span>
																	<span>
																		{format(
																			new Date(file.uploadedAt),
																			"d MMM",
																			{ locale: ru },
																		)}
																	</span>
																</div>
																{file.task && (
																	<p className="text-muted-foreground text-xs">
																		Задача: {file.task.title}
																	</p>
																)}
																{file.uploader && (
																	<p className="text-muted-foreground text-xs">
																		Загрузил: {file.uploader.name}
																	</p>
																)}
															</div>
														</div>
													</CardContent>
												</Card>
											</motion.div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
