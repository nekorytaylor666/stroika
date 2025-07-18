"use client";

import { AssigneeSelector } from "@/components/layout/sidebar/create-new-issue/assignee-selector";
import { LabelSelector } from "@/components/layout/sidebar/create-new-issue/label-selector";
import { PrioritySelector } from "@/components/layout/sidebar/create-new-issue/priority-selector";
import { ProjectSelector } from "@/components/layout/sidebar/create-new-issue/project-selector";
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
import { useConstructionCreateIssueStore } from "@/store/construction/construction-create-issue-store";
import { api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ConstructionDocumentSelector } from "./construction-document-selector";

export function ConstructionCreateIssueModal() {
	const { isOpen, defaultStatus, closeModal } =
		useConstructionCreateIssueStore();
	const params = useParams({ from: "/construction/$orgId" });
	const { createTask: handleCreateTask } = useConstructionData();
	const priorities = useQuery(api.metadata.getAllPriorities);
	const statuses = useQuery(api.metadata.getAllStatus);

	const linkToTask = useMutation(api.documentTasks.linkToTask);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState<any | null>(null);
	const [issueStatus, setIssueStatus] = useState<any | null>(null);
	const users = useQuery(api.users.getAll);

	// Set default values when data is loaded
	useEffect(() => {
		if (priorities && priorities.length > 0 && !priority) {
			setPriority(
				priorities.find((p) => p.name === "Средний") || priorities[0],
			);
		}
		if (statuses && statuses.length > 0 && !issueStatus) {
			setIssueStatus(
				defaultStatus ||
					statuses.find((s) => s.name === "К выполнению") ||
					statuses[0],
			);
		}
	}, [priorities, statuses, priority, issueStatus, defaultStatus]);

	const createIssue = async () => {
		if (!title.trim() || !priority || !issueStatus) {
			console.error("Missing required fields:", {
				title: title.trim(),
				priority,
				issueStatus,
			});
			return;
		}

		try {

			const taskId = await handleCreateTask({
				identifier: `CONST-${Date.now()}`,
				title: title.trim(),
				description: description.trim(),
				statusId: issueStatus._id,
				assigneeId: users?.[0]?._id,
				priorityId: priority._id,
				labelIds: [],
				cycleId: "construction-cycle",
				projectId: params.orgId,
				rank: `${Date.now()}`,
				dueDate: undefined,
			});


			// Link selected documents to the task

			// Reset form
			setTitle("");
			setDescription("");

			setPriority(
				priorities?.find((p) => p.name === "Средний") || priorities?.[0],
			);
			setIssueStatus(
				defaultStatus ||
					statuses?.find((s) => s.name === "К выполнению") ||
					statuses?.[0],
			);

			closeModal();
		} catch (error) {
			console.error("Failed to create construction task:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={closeModal}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Создать новую задачу</DialogTitle>
					<DialogDescription>
						Добавьте новую задачу для строительного проекта
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Название задачи</Label>
						<Input
							id="title"
							placeholder="Введите название задачи..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="description">Описание</Label>
						<Textarea
							id="description"
							placeholder="Опишите задачу подробнее..."
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Статус</Label>
							<StatusSelector status={issueStatus} onChange={setIssueStatus} />
						</div>

						<div className="grid gap-2">
							<Label>Приоритет</Label>
							<PrioritySelector priority={priority} onChange={setPriority} />
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={closeModal}>
						Отмена
					</Button>
					<Button
						onClick={createIssue}
						disabled={!title.trim() || !priority || !issueStatus}
					>
						Создать задачу
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
