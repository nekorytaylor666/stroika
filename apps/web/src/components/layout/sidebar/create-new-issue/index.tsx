import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { DialogTitle } from "@radix-ui/react-dialog";
import { RiEditLine } from "@remixicon/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AssigneeSelector } from "./assignee-selector";
import { AttachmentUpload, type UploadedAttachment } from "./attachment-upload";
import { LabelSelector } from "./label-selector";
import { PrioritySelector } from "./priority-selector";
import { ProjectSelector } from "./project-selector";
import { StatusSelector } from "./status-selector";

interface ConstructionTaskForm {
	identifier: string;
	title: string;
	description: string;
	statusId: Id<"status"> | null;
	assigneeId: Id<"users"> | null;
	priorityId: Id<"priorities"> | null;
	labelIds: Id<"labels">[];
	cycleId: string;
	projectId: Id<"projects"> | null;
	rank: string;
	dueDate?: string;
	attachments?: UploadedAttachment[];
}

export function CreateNewIssue() {
	const [createMore, setCreateMore] = useState<boolean>(false);
	const { isOpen, defaultStatus, openModal, closeModal } =
		useCreateIssueStore();
	const {
		createTask,
		statuses,
		priorities,
		labels,
		users,
		projects,
		tasks,
		isLoading,
	} = useConstructionData();

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

	const createDefaultData = useCallback((): ConstructionTaskForm => {
		const identifier = generateUniqueIdentifier();
		const defaultStatusId = defaultStatus
			? statuses?.find((s) => s.name === defaultStatus) || statuses?.[0]
			: statuses?.[0];
		const defaultPriorityId =
			priorities?.find((p) => p.name === "Средний") || priorities?.[0];

		return {
			identifier: `СТРФ-${identifier}`,
			title: "",
			description: "",
			statusId: defaultStatusId?._id || null,
			assigneeId: null,
			priorityId: defaultPriorityId?._id || null,
			labelIds: [],
			cycleId: "cycle-1",
			projectId: null,
			rank: `rank-${Date.now()}`,
			attachments: [],
		};
	}, [defaultStatus, generateUniqueIdentifier, statuses, priorities]);

	const [addTaskForm, setAddTaskForm] = useState<ConstructionTaskForm>(
		createDefaultData(),
	);

	useEffect(() => {
		setAddTaskForm(createDefaultData());
	}, [createDefaultData]);

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

	// Show loading state while data is loading
	if (isLoading) {
		return null;
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(value) => (value ? openModal() : closeModal())}
		>
			<DialogTrigger asChild>
				<Button className="size-8 shrink-0" variant="secondary" size="icon">
					<RiEditLine />
				</Button>
			</DialogTrigger>
			<DialogContent className="top-[30%] w-full p-0 shadow-xl sm:max-w-[750px]">
				<DialogHeader>
					<DialogTitle>
						<div className="flex items-center gap-2 px-4 pt-4">
							<Button size="sm" variant="outline" className="gap-1.5">
								<Heart className="size-4 fill-orange-500 text-orange-500" />
								<span className="font-medium">СТРОИТЕЛЬСТВО</span>
							</Button>
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="w-full space-y-3 px-4 pb-0">
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
						<StatusSelector
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
								priorities?.find((p) => p._id === addTaskForm.priorityId) ||
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
							selectedLabels={
								labels?.filter((l) => addTaskForm.labelIds.includes(l._id)) ||
								[]
							}
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
				</div>
				<div className="flex w-full items-center justify-between border-t px-4 py-2.5">
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
					<Button
						size="sm"
						onClick={createConstructionTask}
						disabled={isLoading}
					>
						Создать задачу
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
