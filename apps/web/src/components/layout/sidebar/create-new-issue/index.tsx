import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { RiEditLine } from "@remixicon/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AssigneeSelector } from "./assignee-selector";
import { AttachmentUpload, type UploadedAttachment } from "./attachment-upload";
import { ConstructionStatusSelector } from "./construction-status-selector";
import { LabelSelector } from "./label-selector";
import { PrioritySelector } from "./priority-selector";
import { ProjectSelector } from "./project-selector";
import { type SubtaskData, SubtasksInput } from "./subtasks-input";
import { TemplateSelector } from "./template-select";

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

export function CreateNewIssue() {
	const [createMore, setCreateMore] = useState<boolean>(false);
	const { isOpen, defaultStatus, defaultProjectId, openModal, closeModal } =
		useCreateIssueStore();
	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const { users } = useConstructionData();
	const projects = useQuery(api.constructionProjects.getAll);
	const tasks = useQuery(api.constructionTasks.getAll);
	const createTask = useMutation(api.constructionTasks.create);
	const createSubtask = useMutation(api.subtasks.createSubtask);

	const attachToIssue = useMutation(api.files.attachToIssue);

	const generateUniqueIdentifier = useCallback(() => {
		const identifiers = tasks?.map((task: any) => task.identifier) || [];
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
		// Use the defaultStatus from store if available, otherwise fallback
		const defaultStatusId = defaultStatus
			? defaultStatus.id
			: statuses?.find((s: any) => s.name === "К выполнению")?._id ||
				statuses?.[0]?._id;
		const defaultPriorityId =
			priorities?.find((p: any) => p.name === "Средний")?._id ||
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
			projectId: defaultProjectId || null, // Use project from store
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
		if (!template) {
			// Clear template
			setSelectedTemplate(null);
			// Optionally reset form to defaults
			return;
		}

		// Apply template values to form
		setAddTaskForm((prev) => ({
			...prev,
			title: template.defaultTitle || "",
			description: template.defaultDescription || "",
			statusId: template.defaultStatusId || prev.statusId,
			priorityId: template.defaultPriorityId || prev.priorityId,
			labelIds: template.defaultLabelIds?.length > 0 ? template.defaultLabelIds : prev.labelIds,
			assigneeId: template.defaultAssigneeId || prev.assigneeId,
			projectId: template.defaultProjectId || prev.projectId,
			// Convert template subtasks to form subtasks
			subtasks:
				template.subtasksParsed?.map((subtask: any) => ({
					title: subtask.title,
					description: subtask.description || "",
					assigneeId: subtask.defaultAssigneeId || template.defaultAssigneeId || null,
					dueDate: undefined,
					attachments: [],
					// Include status and priority from subtask if available
					statusId: subtask.defaultStatusId || template.defaultStatusId || null,
					priorityId: subtask.defaultPriorityId || template.defaultPriorityId || null,
				})) || prev.subtasks,
			// Preserve other form fields
			dueDate: prev.dueDate,
			attachments: prev.attachments,
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
				userId: currentUser?.id as Id<"user">,
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
						description: subtask.description || "",
						// Use subtask's own status/priority if set (from template), otherwise use parent's
						statusId: subtask.statusId || addTaskForm.statusId,
						assigneeId:
							subtask.assigneeId || addTaskForm.assigneeId || undefined,
						priorityId: subtask.priorityId || addTaskForm.priorityId,
						labelIds: [],
						projectId: addTaskForm.projectId || undefined,
						dueDate: subtask.dueDate || undefined,
						userId: currentUser?.id as Id<"user">,
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

			if (!createMore) {
				closeModal();
			}
			setAddTaskForm(createDefaultData());
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
		return null;
	}
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(value) => {
				if (value) {
					openModal({});
				} else {
					closeModal();
					setSelectedTemplate(null);
					setAddTaskForm(createDefaultData());
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="size-8 shrink-0" variant="secondary" size="icon">
					<RiEditLine />
				</Button>
			</DialogTrigger>
			<DialogContent className="top-[30%] w-full p-0 shadow-xl sm:max-w-[750px]">
				<div className="flex items-center justify-between px-4 py-2.5 border-b">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<Heart className="size-3.5 fill-orange-500 text-orange-500" />
						<span className="text-xs font-medium">СТРФ</span>
					</div>

					{/* Template Selector */}
					<TemplateSelector
						onSelect={applyTemplate}
						selectedTemplateId={selectedTemplate?._id}
					/>
				</div>

				<div className="w-full space-y-3 px-4 py-3">
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
								statuses?.find((s: any) => s._id === addTaskForm.statusId) || null
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
								priorities?.find((p: any) => p._id === addTaskForm.priorityId) ||
								null
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
								users?.find((u: any) => u.id === addTaskForm.assigneeId) || null
							}
							onChange={(newAssignee: any) =>
								setAddTaskForm({
									...addTaskForm,
									assigneeId: newAssignee?.id || null,
								})
							}
						/>
						<ProjectSelector
							project={
								projects?.find((p: any) => p._id === addTaskForm.projectId) || null
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
						onChange={(subtasks) =>
							setAddTaskForm({ ...addTaskForm, subtasks })
						}
					/>
				</div>
				<div className="flex w-full items-center justify-between border-t px-4 py-2">
					<div className="flex items-center gap-2">
						<Switch
							id="create-more"
							checked={createMore}
							onCheckedChange={setCreateMore}
							className="h-4 w-7"
						/>
						<Label htmlFor="create-more" className="text-xs">Создать ещё</Label>
					</div>
					<Button
						size="sm"
						onClick={createConstructionTask}
						disabled={isLoading}
						className="h-7 px-3 text-xs"
					>
						Создать задачу
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
