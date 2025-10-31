"use client";

import { AssigneeSelector } from "@/components/layout/sidebar/create-new-issue/assignee-selector";
import { LabelSelector } from "@/components/layout/sidebar/create-new-issue/label-selector";
import { PrioritySelector } from "@/components/layout/sidebar/create-new-issue/priority-selector";
import { StatusSelector } from "@/components/layout/sidebar/create-new-issue/status-selector";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConstructionDocumentSelector } from "../common/construction/construction-document-selector";

interface ProjectTaskCreateModalProps {
	projectId: Id<"constructionProjects">;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	defaultStatus?: any;
}

export function ProjectTaskCreateModal({
	projectId,
	isOpen,
	onOpenChange,
	defaultStatus,
}: ProjectTaskCreateModalProps) {
	const { priorities, statuses, isLoading } = useConstructionData();
	const createTask = useMutation(api.constructionTasks.create);
	const linkToTask = useMutation(api.documentTasks.linkToTask);

	// Fetch project details to show in the modal
	const project = useQuery(api.constructionProjects.getById, { id: projectId });

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [assignee, setAssignee] = useState<any>(null);
	const [selectedLabels, setSelectedLabels] = useState<any[]>([]);
	const [priority, setPriority] = useState<any>(null);
	const [issueStatus, setIssueStatus] = useState<any>(null);
	const [selectedDocuments, setSelectedDocuments] = useState<
		Array<{ _id: Id<"documents">; title: string }>
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentUser = useCurrentUser();
	// Set default values when data is loaded
	useEffect(() => {
		if (priorities?.length > 0 && !priority) {
			setPriority(
				priorities.find((p) => p.name === "Средний") || priorities[0],
			);
		}
		if (statuses?.length > 0 && !issueStatus) {
			setIssueStatus(
				defaultStatus ||
					statuses.find((s) => s.name === "К выполнению") ||
					statuses[0],
			);
		}
	}, [priorities, statuses, priority, issueStatus, defaultStatus]);

	const handleCreateTask = async () => {
		if (!title.trim() || !priority || !issueStatus || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const taskId = await createTask({
				identifier: `CONST-${Date.now()}`,
				title: title.trim(),
				description: description.trim(),
				statusId: issueStatus._id,
				assigneeId: assignee?._id,
				priorityId: priority._id,
				labelIds: selectedLabels.map((label) => label._id),
				cycleId: "construction-cycle",
				projectId: projectId, // Construction project ID
				userId: currentUser?._id as Id<"user">,
				rank: `${Date.now()}`,
				dueDate: undefined,
			});

			// Link selected documents to the task
			if (taskId && selectedDocuments.length > 0) {
				for (const document of selectedDocuments) {
					await linkToTask({
						taskId: taskId as Id<"issues">,
						documentId: document._id,
						linkType: "attachment",
					});
				}
			}

			// Reset form
			setTitle("");
			setDescription("");
			setAssignee(null);
			setSelectedLabels([]);
			setSelectedDocuments([]);
			setPriority(
				priorities?.find((p) => p.name === "Средний") || priorities?.[0],
			);
			setIssueStatus(
				defaultStatus ||
					statuses?.find((s) => s.name === "К выполнению") ||
					statuses?.[0],
			);

			// Close modal
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create task:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			handleCreateTask();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]" onKeyDown={handleKeyDown}>
				<DialogHeader>
					<DialogTitle>Создать новую задачу</DialogTitle>
					<DialogDescription>
						{project && (
							<div className="mt-2 flex items-center gap-2">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">
									Проект: <span className="font-medium">{project.name}</span>
								</span>
							</div>
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">Название задачи</Label>
						<Input
							id="title"
							placeholder="Введите название задачи..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full"
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Описание</Label>
						<Textarea
							id="description"
							placeholder="Добавьте описание..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[100px] w-full resize-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Статус</Label>
							{issueStatus && (
								<StatusSelector
									status={issueStatus}
									setStatus={setIssueStatus}
								/>
							)}
						</div>

						<div className="space-y-2">
							<Label>Приоритет</Label>
							{priority && (
								<PrioritySelector
									priority={priority}
									setPriority={setPriority}
								/>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Исполнитель</Label>
							<AssigneeSelector assignee={assignee} setAssignee={setAssignee} />
						</div>

						<div className="space-y-2">
							<Label>Метки</Label>
							<LabelSelector
								selectedLabels={selectedLabels}
								setSelectedLabels={setSelectedLabels}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Документы</Label>
						<ConstructionDocumentSelector
							selectedDocuments={selectedDocuments}
							onSelectionChange={setSelectedDocuments}
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Отмена
					</Button>
					<Button
						onClick={handleCreateTask}
						disabled={
							!title.trim() || !priority || !issueStatus || isSubmitting
						}
					>
						{isSubmitting ? "Создание..." : "Создать задачу"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
