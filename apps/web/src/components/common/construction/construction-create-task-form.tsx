"use client";

import { TemplatePreview } from "@/components/common/construction/template-preview";
import { TemplateSelector } from "@/components/common/construction/template-select";
import { AssigneeSelector } from "@/components/layout/sidebar/create-new-issue/assignee-selector";
import {
	AttachmentUpload,
	type UploadedAttachment,
} from "@/components/layout/sidebar/create-new-issue/attachment-upload";
import { ConstructionStatusSelector } from "@/components/layout/sidebar/create-new-issue/construction-status-selector";
import { LabelSelector } from "@/components/layout/sidebar/create-new-issue/label-selector";
import { PrioritySelector } from "@/components/layout/sidebar/create-new-issue/priority-selector";
import { ProjectSelector } from "@/components/layout/sidebar/create-new-issue/project-selector";
import {
	type SubtaskData,
	SubtasksInput,
} from "@/components/layout/sidebar/create-new-issue/subtasks-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ConstructionTaskForm {
	identifier: string;
	title: string;
	description: string;
	statusId: Id<"status"> | null;
	assigneeId: Id<"user"> | null;
	priorityId: Id<"priorities"> | null;
	labelIds: Id<"labels">[];
	cycleId: string;
	projectId: Id<"constructionProjects"> | null;
	rank: string;
	dueDate?: string;
	attachments?: UploadedAttachment[];
	subtasks: SubtaskData[];
}

interface ConstructionCreateTaskFormProps {
	defaultStatus?: { id: Id<"status">; name: string };
	defaultProjectId?: Id<"constructionProjects"> | null;
	onSuccess?: (taskId: Id<"issues">) => void;
	onCancel?: () => void;
	className?: string;
	showHeader?: boolean;
	embedded?: boolean;
}

export function ConstructionCreateTaskForm({
	defaultStatus,
	defaultProjectId,
	onSuccess,
	onCancel,
	className,
	showHeader = true,
	embedded = false,
}: ConstructionCreateTaskFormProps) {
	const [createMore, setCreateMore] = useState<boolean>(false);
	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const users = useQuery(api.users.getAll);
	const projects = useQuery(api.constructionProjects.getAll);
	const tasks = useQuery(api.constructionTasks.getAll);
	const createTask = useMutation(api.constructionTasks.create);
	const createSubtask = useMutation(api.subtasks.createSubtask);
	const attachToIssue = useMutation(api.files.attachToIssue);

	const generateUniqueIdentifier = useCallback(() => {
		const identifiers = tasks?.map((task) => task.identifier) || [];
		let identifier = Math.floor(Math.random() * 999)
			.toString()
			.padStart(3, "0");
		while (identifiers.includes(`СТРФ-${identifier}`)) {
			identifier = Math.floor(Math.random() * 999)
				.toString()
				.padStart(3, "0");
		}
		return identifier;
	}, [tasks]);

	const currentUser = useCurrentUser();
	const createDefaultData = useCallback((): ConstructionTaskForm => {
		const identifier = generateUniqueIdentifier();
		// Use the defaultStatus from props if available, otherwise fallback
		const defaultStatusId = defaultStatus
			? defaultStatus.id
			: statuses?.find((s) => s.name === "К выполнению")?._id ||
				statuses?.[0]?._id;
		const defaultPriorityId =
			priorities?.find((p) => p.name === "Средний")?._id ||
			priorities?.[0]?._id;

		return {
			identifier: `СТРФ-${identifier}`,
			title: "",
			description: "",
			statusId: defaultStatusId || null,
			assigneeId: null,
			priorityId: defaultPriorityId || null,
			labelIds: [],
			cycleId: "cycle-1",
			projectId: defaultProjectId || null,
			rank: `rank-${Date.now()}`,
			attachments: [],
			subtasks: [],
		};
	}, [
		defaultStatus,
		defaultProjectId,
		generateUniqueIdentifier,
		statuses,
		priorities,
	]);

	const [addTaskForm, setAddTaskForm] = useState<ConstructionTaskForm>(
		createDefaultData(),
	);
	const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

	useEffect(() => {
		setAddTaskForm(createDefaultData());
	}, [createDefaultData]);

	const applyTemplate = useCallback((template: any) => {
		if (!template) return;

		// Apply template values to form
		setAddTaskForm((prev) => ({
			...prev,
			title: template.defaultTitle || prev.title,
			description: template.defaultDescription || prev.description,
			statusId: template.defaultStatusId || prev.statusId,
			priorityId: template.defaultPriorityId || prev.priorityId,
			labelIds: template.defaultLabelIds || prev.labelIds,
			assigneeId: template.defaultAssigneeId || prev.assigneeId,
			projectId: template.defaultProjectId || prev.projectId,
			// Convert template subtasks to form subtasks
			subtasks:
				template.subtasksParsed?.map((subtask: any, index: number) => ({
					title: subtask.title,
					description: subtask.description || "",
					assigneeId: template.defaultAssigneeId || null,
					dueDate: undefined,
					attachments: [],
				})) || [],
		}));

		setSelectedTemplate(template);
		toast.success(`Шаблон "${template.name}" применен`);
	}, []);

	const createConstructionTask = async () => {
		if (!addTaskForm.title.trim()) {
			toast.error("Название обязательно");
			return;
		}

		if (!addTaskForm.statusId || !addTaskForm.priorityId) {
			toast.error("Статус и приоритет обязательны");
			return;
		}

		try {
			const taskId = await createTask({
				identifier: addTaskForm.identifier,
				title: addTaskForm.title.trim(),
				description: addTaskForm.description.trim(),
				statusId: addTaskForm.statusId,
				assigneeId: addTaskForm.assigneeId || undefined,
				priorityId: addTaskForm.priorityId,
				labelIds: addTaskForm.labelIds,
				cycleId: addTaskForm.cycleId,
				userId: currentUser?._id as Id<"user">,
				projectId: addTaskForm.projectId || undefined,
				rank: addTaskForm.rank,
				dueDate: addTaskForm.dueDate,
			});

			// Attach files if any
			if (addTaskForm.attachments && addTaskForm.attachments.length > 0) {
				for (const attachment of addTaskForm.attachments) {
					await attachToIssue({
						issueId: taskId as Id<"issues">,
						storageId: attachment.storageId,
						fileName: attachment.fileName,
						fileSize: attachment.fileSize,
						mimeType: attachment.mimeType,
					});
				}
			}

			// Create subtasks if any
			if (addTaskForm.subtasks.length > 0) {
				for (const subtask of addTaskForm.subtasks) {
					const subtaskId = await createSubtask({
						parentTaskId: taskId as Id<"issues">,
						title: subtask.title,
						description: "",
						statusId: addTaskForm.statusId,
						assigneeId:
							subtask.assigneeId || addTaskForm.assigneeId || undefined,
						priorityId: addTaskForm.priorityId,
						labelIds: [],
						projectId: addTaskForm.projectId || undefined,
						dueDate: subtask.dueDate || undefined,
						userId: currentUser?._id as Id<"user">,
					});

					// Attach files to subtask if any
					if (subtask.attachments && subtask.attachments.length > 0) {
						for (const attachment of subtask.attachments) {
							await attachToIssue({
								issueId: subtaskId as Id<"issues">,
								storageId: attachment.storageId,
								fileName: attachment.fileName,
								fileSize: attachment.fileSize,
								mimeType: attachment.mimeType,
							});
						}
					}
				}
			}

			toast.success("Задача создана");

			if (onSuccess) {
				onSuccess(taskId as Id<"issues">);
			}

			if (!createMore) {
				setAddTaskForm(createDefaultData());
				setSelectedTemplate(null);
			} else {
				// Reset form but keep some settings for next task
				setAddTaskForm(createDefaultData());
				setSelectedTemplate(null);
			}
		} catch (error) {
			console.error("Failed to create task:", error);
			toast.error("Ошибка при создании задачи");
		}
	};

	const isLoading =
		statuses === undefined ||
		priorities === undefined ||
		users === undefined ||
		projects === undefined ||
		tasks === undefined;

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
						<Heart className="size-4 fill-orange-500 text-orange-500" />
						<span className="font-medium">СТРОИТЕЛЬСТВО</span>
					</Button>
				</div>
			)}

			{/* Template Selector */}
			<div className="pb-3">
				<TemplateSelector
					onSelect={applyTemplate}
					selectedTemplateId={selectedTemplate?._id}
				/>
			</div>

			{/* Template Preview */}
			{selectedTemplate && (
				<div className="pb-3">
					<TemplatePreview template={selectedTemplate} className="max-h-48" />
				</div>
			)}

			<Separator className="mb-4" />

			<div className="w-full space-y-3">
				<Input
					className="h-auto w-full overflow-hidden text-ellipsis whitespace-normal break-words border-none px-0 font-medium text-2xl shadow-none outline-none focus-visible:ring-0"
					placeholder="Название задачи"
					value={addTaskForm.title}
					onChange={(e) =>
						setAddTaskForm({ ...addTaskForm, title: e.target.value })
					}
				/>

				<Textarea
					className="overflow-wrap min-h-16 w-full resize-none whitespace-normal break-words border-none px-0 shadow-none outline-none focus-visible:ring-0"
					placeholder="Добавить описание..."
					value={addTaskForm.description}
					onChange={(e) =>
						setAddTaskForm({ ...addTaskForm, description: e.target.value })
					}
				/>

				<div className="flex w-full flex-wrap items-center justify-start gap-1.5">
					<ConstructionStatusSelector
						status={
							statuses?.find((s) => s._id === addTaskForm.statusId) || null
						}
						onChange={(newStatus) =>
							setAddTaskForm({
								...addTaskForm,
								statusId: newStatus?._id || null,
							})
						}
					/>
					<PrioritySelector
						priority={
							priorities?.find((p) => p._id === addTaskForm.priorityId) || null
						}
						onChange={(newPriority) =>
							setAddTaskForm({
								...addTaskForm,
								priorityId: newPriority?._id || null,
							})
						}
					/>
					<AssigneeSelector
						assignee={
							users?.find((u) => u._id === addTaskForm.assigneeId) || null
						}
						onChange={(newAssignee) =>
							setAddTaskForm({
								...addTaskForm,
								assigneeId: newAssignee?._id || null,
							})
						}
					/>
					<ProjectSelector
						project={
							projects?.find((p) => p._id === addTaskForm.projectId) || null
						}
						onChange={(newProject) =>
							setAddTaskForm({
								...addTaskForm,
								projectId: newProject?._id || null,
							})
						}
					/>
					<LabelSelector
						selectedLabels={[]}
						onChange={(newLabels) =>
							setAddTaskForm({
								...addTaskForm,
								labelIds: newLabels.map((l) => l._id),
							})
						}
					/>
				</div>

				<AttachmentUpload
					onAttachmentsChange={(attachments) =>
						setAddTaskForm({ ...addTaskForm, attachments })
					}
					className="px-1"
				/>

				<SubtasksInput
					subtasks={addTaskForm.subtasks}
					onChange={(subtasks) => setAddTaskForm({ ...addTaskForm, subtasks })}
				/>
			</div>

			<Separator className="my-4" />

			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="flex items-center space-x-2">
						<Switch
							id="create-more"
							checked={createMore}
							onCheckedChange={setCreateMore}
						/>
						<Label htmlFor="create-more">Создать ещё</Label>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onCancel && (
						<Button size="sm" variant="outline" onClick={onCancel}>
							Отмена
						</Button>
					)}
					<Button
						size="sm"
						onClick={createConstructionTask}
						disabled={isLoading}
					>
						Создать задачу
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
