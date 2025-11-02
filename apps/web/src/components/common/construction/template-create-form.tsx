"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { FileText, Plus, Trash, GripVertical } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SubtaskTemplate {
	id: string;
	title: string;
	description?: string;
	order: number;
	defaultStatusId?: string;
	defaultPriorityId?: string;
}

interface TemplateForm {
	name: string;
	description: string;
	category: string;
	defaultTitle: string;
	defaultDescription: string;
	defaultStatusId: Id<"status"> | null;
	defaultAssigneeId: Id<"user"> | null;
	defaultPriorityId: Id<"priorities"> | null;
	defaultLabelIds: Id<"labels">[];
	defaultProjectId: Id<"constructionProjects"> | null;
	subtasks: SubtaskTemplate[];
	isPublic: boolean;
}

// Sortable subtask item
function SortableSubtask({
	subtask,
	index,
	onRemove,
	onChange,
	statuses,
	priorities,
}: {
	subtask: SubtaskTemplate;
	index: number;
	onRemove: () => void;
	onChange: (field: keyof SubtaskTemplate, value: any) => void;
	statuses: any[];
	priorities: any[];
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: subtask.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={cn("p-4", isDragging && "opacity-50 shadow-lg")}
		>
			<div className="flex items-start gap-3">
				<button
					type="button"
					className="mt-2 cursor-grab touch-none"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-5 w-5 text-muted-foreground" />
				</button>
				<div className="flex-1 space-y-3">
					<Input
						value={subtask.title}
						onChange={(e) => onChange("title", e.target.value)}
						placeholder="Название подзадачи"
						className="font-medium"
					/>
					<Textarea
						value={subtask.description || ""}
						onChange={(e) => onChange("description", e.target.value)}
						placeholder="Описание подзадачи (необязательно)"
						className="min-h-[60px]"
					/>
					<div className="grid gap-3 md:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-xs">Статус по умолчанию</Label>
							<Select
								value={subtask.defaultStatusId || "none"}
								onValueChange={(value) => onChange("defaultStatusId", value === "none" ? undefined : value)}
							>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Выберите статус" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Без статуса</SelectItem>
									{statuses.map((status) => (
										<SelectItem key={status._id} value={status._id}>
											{status.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Приоритет по умолчанию</Label>
							<Select
								value={subtask.defaultPriorityId || "none"}
								onValueChange={(value) => onChange("defaultPriorityId", value === "none" ? undefined : value)}
							>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Выберите приоритет" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Без приоритета</SelectItem>
									{priorities.map((priority) => (
										<SelectItem key={priority._id} value={priority._id}>
											{priority.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onRemove}
					className="mt-2"
				>
					<Trash className="h-4 w-4" />
				</Button>
			</div>
		</Card>
	);
}

interface TemplateCreateFormProps {
	template?: any; // For editing existing template
	onSuccess?: (templateId: Id<"taskTemplates">) => void;
	onCancel?: () => void;
	className?: string;
	showHeader?: boolean;
	embedded?: boolean;
}

export function TemplateCreateForm({
	template,
	onSuccess,
	onCancel,
	className,
	showHeader = true,
	embedded = false,
}: TemplateCreateFormProps) {
	const [createMore, setCreateMore] = useState<boolean>(false);
	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const labels = useQuery(api.metadata.getAllLabels);
	const users = useQuery(api.users.getAll);
	const projects = useQuery(api.constructionProjects.getAll);
	const categories = useQuery(api.taskTemplates.getCategories);

	const createTemplate = useMutation(api.taskTemplates.create);
	const updateTemplate = useMutation(api.taskTemplates.update);
	const currentUser = useCurrentUser();

	// Predefined categories if none exist
	const predefinedCategories = [
		"Фундамент",
		"Кровля",
		"Электрика",
		"Сантехника",
		"Отделка",
		"Фасад",
		"Ландшафт",
		"Общее",
	];

	const allCategories = categories?.length ? categories : predefinedCategories;

	const createDefaultData = useCallback((): TemplateForm => {
		const defaultStatusId =
			statuses?.find((s) => s.name === "К выполнению")?._id ||
			statuses?.[0]?._id;
		const defaultPriorityId =
			priorities?.find((p) => p.name === "Средний")?._id ||
			priorities?.[0]?._id;

		return {
			name: "",
			description: "",
			category: "Общее",
			defaultTitle: "",
			defaultDescription: "",
			defaultStatusId: defaultStatusId || null,
			defaultAssigneeId: null,
			defaultPriorityId: defaultPriorityId || null,
			defaultLabelIds: [],
			defaultProjectId: null,
			subtasks: [],
			isPublic: false,
		};
	}, [statuses, priorities]);

	const [templateForm, setTemplateForm] = useState<TemplateForm>(
		createDefaultData(),
	);

	// Load template data if editing
	useEffect(() => {
		if (template) {
			setTemplateForm({
				name: template.name,
				description: template.description || "",
				category: template.category || "Общее",
				defaultTitle: template.defaultTitle,
				defaultDescription: template.defaultDescription || "",
				defaultStatusId: template.defaultStatusId || null,
				defaultAssigneeId: template.defaultAssigneeId || null,
				defaultPriorityId: template.defaultPriorityId || null,
				defaultLabelIds: template.defaultLabelIds || [],
				defaultProjectId: template.defaultProjectId || null,
				subtasks: template.subtasksParsed || [],
				isPublic: template.isPublic,
			});
		} else {
			setTemplateForm(createDefaultData());
		}
	}, [template, createDefaultData]);

	const addSubtask = () => {
		const newSubtask: SubtaskTemplate = {
			id: `subtask-${Date.now()}`,
			title: "",
			description: "",
			order: templateForm.subtasks.length,
			defaultStatusId: templateForm.defaultStatusId === null ? undefined : templateForm.defaultStatusId,
			defaultPriorityId: templateForm.defaultPriorityId === null ? undefined : templateForm.defaultPriorityId,
		};
		setTemplateForm({
			...templateForm,
			subtasks: [...templateForm.subtasks, newSubtask],
		});
	};

	const removeSubtask = (index: number) => {
		const newSubtasks = templateForm.subtasks.filter((_, i) => i !== index);
		setTemplateForm({
			...templateForm,
			subtasks: newSubtasks.map((s, i) => ({ ...s, order: i })),
		});
	};

	const updateSubtask = (
		index: number,
		field: keyof SubtaskTemplate,
		value: any,
	) => {
		const newSubtasks = [...templateForm.subtasks];
		newSubtasks[index] = { ...newSubtasks[index], [field]: value };
		setTemplateForm({
			...templateForm,
			subtasks: newSubtasks,
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (active.id !== over?.id && over) {
			const oldIndex = templateForm.subtasks.findIndex(
				(item) => item.id === active.id,
			);
			const newIndex = templateForm.subtasks.findIndex(
				(item) => item.id === over.id,
			);
			const newSubtasks = arrayMove(templateForm.subtasks, oldIndex, newIndex);
			setTemplateForm({
				...templateForm,
				subtasks: newSubtasks.map((s, i) => ({ ...s, order: i })),
			});
		}
	};

	const saveTemplate = async () => {
		if (!templateForm.name.trim()) {
			toast.error("Название шаблона обязательно");
			return;
		}

		if (!templateForm.defaultTitle.trim()) {
			toast.error("Название задачи по умолчанию обязательно");
			return;
		}

		try {
			// Ensure subtasks have proper order
			const orderedSubtasks = templateForm.subtasks.map((subtask, index) => ({
				...subtask,
				order: index,
			}));

			let templateId: Id<"taskTemplates">;

			if (template) {
				// Update existing template
				await updateTemplate({
					id: template._id,
					name: templateForm.name,
					description: templateForm.description || undefined,
					category: templateForm.category || undefined,
					defaultTitle: templateForm.defaultTitle,
					defaultDescription: templateForm.defaultDescription || undefined,
					defaultStatusId: templateForm.defaultStatusId || undefined,
					defaultPriorityId: templateForm.defaultPriorityId || undefined,
					defaultLabelIds: templateForm.defaultLabelIds,
					defaultAssigneeId: templateForm.defaultAssigneeId || undefined,
					defaultProjectId: templateForm.defaultProjectId || undefined,
					subtasks: orderedSubtasks,
					isPublic: templateForm.isPublic,
				});
				templateId = template._id;
				toast.success("Шаблон обновлен");
			} else {
				// Create new template
				templateId = await createTemplate({
					name: templateForm.name,
					description: templateForm.description || undefined,
					category: templateForm.category || undefined,
					defaultTitle: templateForm.defaultTitle,
					defaultDescription: templateForm.defaultDescription || undefined,
					defaultStatusId: templateForm.defaultStatusId || undefined,
					defaultPriorityId: templateForm.defaultPriorityId || undefined,
					defaultLabelIds: templateForm.defaultLabelIds,
					defaultAssigneeId: templateForm.defaultAssigneeId || undefined,
					defaultProjectId: templateForm.defaultProjectId || undefined,
					subtasks: orderedSubtasks,
					isPublic: templateForm.isPublic,
				});
				toast.success("Шаблон создан");
			}

			if (onSuccess) {
				onSuccess(templateId);
			}

			if (!createMore) {
				setTemplateForm(createDefaultData());
			} else {
				// Reset form but keep category for next template
				const category = templateForm.category;
				setTemplateForm({ ...createDefaultData(), category });
			}
		} catch (error) {
			console.error("Failed to save template:", error);
			toast.error(template ? "Ошибка при обновлении шаблона" : "Ошибка при создании шаблона");
		}
	};

	const isLoading =
		statuses === undefined ||
		priorities === undefined ||
		users === undefined ||
		projects === undefined ||
		labels === undefined;

	if (isLoading) {
		return (
			<Card className={cn("p-6", className)}>
				<div className="flex items-center justify-center">
					<div className="text-muted-foreground">Загрузка...</div>
				</div>
			</Card>
		);
	}

	const FormContent = (
		<>
			{showHeader && (
				<div className="flex items-center gap-2 pb-4">
					<Button size="sm" variant="outline" className="gap-1.5">
						<FileText className="size-4" />
						<span className="font-medium">ШАБЛОН ЗАДАЧИ</span>
					</Button>
				</div>
			)}

			<div className="w-full space-y-4">
				{/* Template Info Section */}
				<div className="space-y-3">
					<Input
						className="h-auto w-full overflow-hidden text-ellipsis whitespace-normal break-words border-none px-0 font-medium text-2xl shadow-none outline-none focus-visible:ring-0"
						placeholder="Название шаблона"
						value={templateForm.name}
						onChange={(e) =>
							setTemplateForm({ ...templateForm, name: e.target.value })
						}
					/>

					<Textarea
						className="overflow-wrap min-h-16 w-full resize-none whitespace-normal break-words border-none px-0 shadow-none outline-none focus-visible:ring-0"
						placeholder="Описание шаблона (необязательно)..."
						value={templateForm.description}
						onChange={(e) =>
							setTemplateForm({ ...templateForm, description: e.target.value })
						}
					/>

					<div className="flex flex-wrap items-center gap-3">
						<Select
							value={templateForm.category}
							onValueChange={(value) =>
								setTemplateForm({ ...templateForm, category: value })
							}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Категория" />
							</SelectTrigger>
							<SelectContent>
								{allCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex items-center space-x-2">
							<Switch
								id="is-public"
								checked={templateForm.isPublic}
								onCheckedChange={(checked) =>
									setTemplateForm({ ...templateForm, isPublic: checked })
								}
							/>
							<Label htmlFor="is-public">Публичный шаблон</Label>
						</div>
					</div>
				</div>

				<Separator />

				{/* Default Task Values Section */}
				<div className="space-y-3">
					<h3 className="font-medium text-sm text-muted-foreground">
						Значения задачи по умолчанию
					</h3>

					<Input
						className="font-medium"
						placeholder="Название задачи по умолчанию"
						value={templateForm.defaultTitle}
						onChange={(e) =>
							setTemplateForm({ ...templateForm, defaultTitle: e.target.value })
						}
					/>

					<Textarea
						className="min-h-[80px]"
						placeholder="Описание задачи по умолчанию (необязательно)"
						value={templateForm.defaultDescription}
						onChange={(e) =>
							setTemplateForm({
								...templateForm,
								defaultDescription: e.target.value,
							})
						}
					/>

					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={templateForm.defaultStatusId || "none"}
							onValueChange={(value) =>
								setTemplateForm({
									...templateForm,
									defaultStatusId: value === "none" ? null : value as Id<"status">,
								})
							}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Статус" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Без статуса</SelectItem>
								{statuses?.map((status) => (
									<SelectItem key={status._id} value={status._id}>
										{status.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={templateForm.defaultPriorityId || "none"}
							onValueChange={(value) =>
								setTemplateForm({
									...templateForm,
									defaultPriorityId: value === "none" ? null : value as Id<"priorities">,
								})
							}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Приоритет" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Без приоритета</SelectItem>
								{priorities?.map((priority) => (
									<SelectItem key={priority._id} value={priority._id}>
										{priority.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={templateForm.defaultAssigneeId || "none"}
							onValueChange={(value) =>
								setTemplateForm({
									...templateForm,
									defaultAssigneeId: value === "none" ? null : value as Id<"user">,
								})
							}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Исполнитель" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Без исполнителя</SelectItem>
								{users?.map((user) => (
									<SelectItem key={user._id} value={user._id}>
										{user.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={templateForm.defaultProjectId || "none"}
							onValueChange={(value) =>
								setTemplateForm({
									...templateForm,
									defaultProjectId: value === "none" ? null : value as Id<"constructionProjects">,
								})
							}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Проект" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Без проекта</SelectItem>
								{projects?.map((project) => (
									<SelectItem key={project._id} value={project._id}>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<Separator />

				{/* Subtasks Section */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="font-medium text-sm text-muted-foreground">
							Подзадачи ({templateForm.subtasks.length})
						</h3>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addSubtask}
						>
							<Plus className="mr-2 h-4 w-4" />
							Добавить подзадачу
						</Button>
					</div>

					{templateForm.subtasks.length > 0 ? (
						<DndContext
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={templateForm.subtasks.map((s) => s.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-3">
									{templateForm.subtasks.map((subtask, index) => (
										<SortableSubtask
											key={subtask.id}
											subtask={subtask}
											index={index}
											onRemove={() => removeSubtask(index)}
											onChange={(field, value) =>
												updateSubtask(index, field, value)
											}
											statuses={statuses || []}
											priorities={priorities || []}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					) : (
						<Card className="p-6">
							<p className="text-center text-muted-foreground text-sm">
								Нет подзадач. Нажмите "Добавить подзадачу" для создания.
							</p>
						</Card>
					)}
				</div>
			</div>

			<Separator className="my-4" />

			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-2">
					{!template && (
						<div className="flex items-center space-x-2">
							<Switch
								id="create-more"
								checked={createMore}
								onCheckedChange={setCreateMore}
							/>
							<Label htmlFor="create-more">Создать ещё</Label>
						</div>
					)}
				</div>
				<div className="flex items-center gap-2">
					{onCancel && (
						<Button size="sm" variant="outline" onClick={onCancel}>
							Отмена
						</Button>
					)}
					<Button size="sm" onClick={saveTemplate} disabled={isLoading}>
						{template ? "Сохранить изменения" : "Создать шаблон"}
					</Button>
				</div>
			</div>
		</>
	);

	// If embedded, return without Card wrapper
	if (embedded) {
		return <div className={cn("w-full", className)}>{FormContent}</div>;
	}

	// Otherwise, wrap in a Card
	return <Card className={cn("p-6", className)}>{FormContent}</Card>;
}