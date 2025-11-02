"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Copy, FileText, MoreVertical, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { TemplateFormModalSimple } from "./template-form-modal-simple";

interface TemplateManagementProps {
	organizationId?: string;
}

export function LinearTemplateManagement({}: TemplateManagementProps) {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<any>(null);
	const [deletingTemplate, setDeletingTemplate] = useState<any>(null);

	// Fetch templates using Convex React hooks
	const templates = useQuery(api.taskTemplates.getAll);
	const deleteTemplateMutation = useMutation(api.taskTemplates.deleteTemplate);
	const duplicateTemplateMutation = useMutation(api.taskTemplates.duplicateTemplate);

	const handleDelete = async () => {
		if (deletingTemplate) {
			try {
				await deleteTemplateMutation({ id: deletingTemplate._id });
				toast.success("Шаблон удален");
				setDeletingTemplate(null);
			} catch (error) {
				toast.error("Ошибка при удалении шаблона");
			}
		}
	};

	// Group templates by category
	const templatesByCategory = templates?.reduce(
		(acc: Record<string, any[]>, template: any) => {
			const category = template.category || "Без категории";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(template);
			return acc;
		},
		{} as Record<string, any[]>,
	);

	if (templates === undefined) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">Шаблоны задач</h2>
						<p className="text-muted-foreground text-sm">
							Создавайте шаблоны для быстрого создания типовых задач
						</p>
					</div>
					<Skeleton className="h-10 w-40" />
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-xl">Шаблоны задач</h2>
						<p className="text-muted-foreground text-sm mt-1">
							Создавайте шаблоны для быстрого создания типовых задач с
							подзадачами
						</p>
					</div>
					<Button
						onClick={() => setIsCreateModalOpen(true)}
						className="gap-1.5"
					>
						<Plus className="h-4 w-4" />
						Создать шаблон
					</Button>
				</div>

				{/* Templates list */}
				{!templates || templates.length === 0 ? (
					<Card className="border-2 border-dashed p-12">
						<div className="flex flex-col items-center justify-center text-center space-y-3">
							<div className="rounded-full bg-muted p-3">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<h3 className="font-semibold text-lg">Нет шаблонов</h3>
								<p className="text-muted-foreground text-sm max-w-sm mx-auto">
									Создайте первый шаблон для быстрого создания однотипных задач с подзадачами
								</p>
							</div>
							<Button
								onClick={() => setIsCreateModalOpen(true)}
								className="gap-1.5"
							>
								<Plus className="h-4 w-4" />
								Создать первый шаблон
							</Button>
						</div>
					</Card>
				) : (
					<div className="space-y-6">
						{templatesByCategory && Object.entries(templatesByCategory).map(
							([category, categoryTemplates]) => (
								<div key={category} className="space-y-3">
									<h3 className="font-medium text-muted-foreground text-sm">
										{category}
									</h3>
									<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
										{(categoryTemplates as any[])?.map((template: any) => (
											<Card
												key={template._id}
												className="group relative overflow-hidden border-l-4 p-4 transition-all hover:shadow-lg hover:translate-y-[-2px]"
												style={{
													borderLeftColor: `hsl(${
														Math.abs(template.name.charCodeAt(0) * 13) % 360
													}, 70%, 60%)`,
												}}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1 space-y-2">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																<div className="flex items-center gap-2">
																	<h4 className="font-semibold text-base">
																		{template.name}
																	</h4>
																	{template.isPublic && (
																		<Badge
																			variant="secondary"
																			className="text-xs px-1.5 py-0"
																		>
																			Публичный
																		</Badge>
																	)}
																</div>
																{template.description && (
																	<p className="text-muted-foreground text-sm line-clamp-2">
																		{template.description}
																	</p>
																)}
															</div>
														</div>

														<div className="flex items-center gap-4 pt-1">
															<div className="flex items-center gap-1.5">
																<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
																<span className="text-muted-foreground text-xs">
																	{template.subtasksParsed.length} подзадач
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
																<span className="text-muted-foreground text-xs">
																	{template.usageCount} использований
																</span>
															</div>
															{template.creator && (
																<div className="flex items-center gap-1.5">
																	<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
																	<span className="text-muted-foreground text-xs">
																		{template.creator.name}
																	</span>
																</div>
															)}
														</div>
													</div>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
															>
																<MoreVertical className="h-4 w-4" />
																<span className="sr-only">Меню</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-48">
															<DropdownMenuItem
																onClick={() => setEditingTemplate(template)}
															>
																Редактировать
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={async () => {
																	try {
																		await duplicateTemplateMutation({ id: template._id });
																		toast.success("Шаблон успешно дублирован");
																	} catch (error) {
																		toast.error("Ошибка при дублировании шаблона");
																	}
																}}
															>
																<Copy className="mr-2 h-4 w-4" />
																Дублировать
															</DropdownMenuItem>
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																onClick={() => setDeletingTemplate(template)}
															>
																<Trash className="mr-2 h-4 w-4" />
																Удалить
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</Card>
										))}
									</div>
								</div>
							),
						)}
					</div>
				)}
			</div>

			{/* Create/Edit Modal */}
			{(isCreateModalOpen || editingTemplate) && (
				<TemplateFormModalSimple
					open={isCreateModalOpen || !!editingTemplate}
					onOpenChange={(open) => {
						if (!open) {
							setIsCreateModalOpen(false);
							setEditingTemplate(null);
						}
					}}
					template={editingTemplate}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deletingTemplate}
				onOpenChange={(open) => !open && setDeletingTemplate(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
						<AlertDialogDescription>
							Вы уверены, что хотите удалить шаблон "{deletingTemplate?.name}"?
							Это действие нельзя отменить.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Удалить
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
