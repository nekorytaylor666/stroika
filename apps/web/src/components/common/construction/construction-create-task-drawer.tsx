"use client";

import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useMobile } from "@/hooks/use-mobile";
import { useConstructionCreateIssueStore } from "@/store/construction/construction-create-issue-store";
import { api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { StatusSelector } from "@/components/layout/sidebar/create-new-issue/status-selector";
import { PrioritySelector } from "@/components/layout/sidebar/create-new-issue/priority-selector";
import { ConstructionCreateIssueModal } from "./construction-create-issue-modal";

export function ConstructionCreateTaskDrawer() {
	const isMobile = useMobile();
	const { isOpen, defaultStatus, closeModal, openModal } =
		useConstructionCreateIssueStore();
	const params = useParams({ from: "/construction/$orgId" });
	const { createTask: handleCreateTask } = useConstructionData();
	const priorities = useQuery(api.metadata.getAllPriorities);
	const statuses = useQuery(api.metadata.getAllStatus);
	const users = useQuery(api.users.getAll);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState<any | null>(null);
	const [issueStatus, setIssueStatus] = useState<any | null>(null);

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
			return;
		}

		try {
			await handleCreateTask({
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

	// Use drawer on mobile, modal on desktop
	if (!isMobile) {
		return <ConstructionCreateIssueModal />;
	}

	return (
		<Drawer open={isOpen} onOpenChange={(open) => !open && closeModal()}>
			<DrawerContent className="max-h-[90vh]">
				<DrawerHeader className="text-left">
					<DrawerTitle>Создать новую задачу</DrawerTitle>
					<DrawerDescription>
						Добавьте новую задачу для строительного проекта
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 overflow-y-auto">
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="title">Название задачи</Label>
							<Input
								id="title"
								placeholder="Введите название задачи..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="text-base" // Larger text for mobile
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
								className="text-base resize-none"
							/>
						</div>

						<div className="grid gap-4">
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
				</div>

				<DrawerFooter className="pt-2">
					<Button
						onClick={createIssue}
						disabled={!title.trim() || !priority || !issueStatus}
						className="w-full"
						size="lg"
					>
						Создать задачу
					</Button>
					<DrawerClose asChild>
						<Button variant="outline" size="lg" className="w-full">
							Отмена
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}