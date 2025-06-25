"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionProjectCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ConstructionProjectCreateDialog({
	open,
	onOpenChange,
}: ConstructionProjectCreateDialogProps) {
	const { users, priorities, statuses, createProject } = useConstructionData();

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		client: "",
		location: "",
		contractValue: "",
		projectType: "residential" as
			| "residential"
			| "commercial"
			| "industrial"
			| "infrastructure",
		statusId: "",
		priorityId: "",
		leadId: "",
		startDate: new Date(),
		targetDate: undefined as Date | undefined,
		notes: "",
		teamMemberIds: [] as Id<"users">[],
		healthId: "no-update",
		healthName: "Нет обновлений",
		healthColor: "#6B7280",
		healthDescription: "Статус проекта не обновлен",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.name ||
			!formData.client ||
			!formData.statusId ||
			!formData.priorityId ||
			!formData.leadId
		) {
			return;
		}

		setIsSubmitting(true);

		try {
			await createProject({
				name: formData.name,
				client: formData.client,
				location: formData.location,
				contractValue: Number(formData.contractValue) || 0,
				projectType: formData.projectType,
				statusId: formData.statusId as Id<"status">,
				priorityId: formData.priorityId as Id<"priorities">,
				leadId: formData.leadId as Id<"users">,
				startDate: formData.startDate.toISOString(),
				targetDate: formData.targetDate?.toISOString(),
				notes: formData.notes,
				teamMemberIds: formData.teamMemberIds,
				percentComplete: 0,
				iconName: "building",
				healthId: formData.healthId,
				healthName: formData.healthName,
				healthColor: formData.healthColor,
				healthDescription: formData.healthDescription,
			});

			// Reset form
			setFormData({
				name: "",
				client: "",
				location: "",
				contractValue: "",
				projectType: "residential",
				statusId: "",
				priorityId: "",
				leadId: "",
				startDate: new Date(),
				targetDate: undefined,
				notes: "",
				teamMemberIds: [],
				healthId: "no-update",
				healthName: "Нет обновлений",
				healthColor: "#6B7280",
				healthDescription: "Статус проекта не обновлен",
			});

			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create project:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleTeamMemberToggle = (userId: Id<"users">) => {
		setFormData((prev) => ({
			...prev,
			teamMemberIds: prev.teamMemberIds.includes(userId)
				? prev.teamMemberIds.filter((id) => id !== userId)
				: [...prev.teamMemberIds, userId],
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Создать новый строительный проект</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Название проекта</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Жилой комплекс 'Алматы'"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="client">Заказчик</Label>
							<Input
								id="client"
								value={formData.client}
								onChange={(e) =>
									setFormData({ ...formData, client: e.target.value })
								}
								placeholder="ТОО 'Строй Инвест'"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="location">Местоположение</Label>
							<Input
								id="location"
								value={formData.location}
								onChange={(e) =>
									setFormData({ ...formData, location: e.target.value })
								}
								placeholder="г. Алматы, ул. Абая 150"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="contractValue">Стоимость контракта (тг)</Label>
							<Input
								id="contractValue"
								type="number"
								value={formData.contractValue}
								onChange={(e) =>
									setFormData({ ...formData, contractValue: e.target.value })
								}
								placeholder="1000000000"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="projectType">Тип проекта</Label>
							<Select
								value={formData.projectType}
								onValueChange={(value: any) =>
									setFormData({ ...formData, projectType: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="residential">Жилое</SelectItem>
									<SelectItem value="commercial">Коммерческое</SelectItem>
									<SelectItem value="industrial">Промышленное</SelectItem>
									<SelectItem value="infrastructure">Инфраструктура</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="statusId">Статус</Label>
							<Select
								value={formData.statusId}
								onValueChange={(value) =>
									setFormData({ ...formData, statusId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Выберите статус" />
								</SelectTrigger>
								<SelectContent>
									{statuses?.map((status) => (
										<SelectItem key={status._id} value={status._id}>
											{status.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="priorityId">Приоритет</Label>
							<Select
								value={formData.priorityId}
								onValueChange={(value) =>
									setFormData({ ...formData, priorityId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Выберите приоритет" />
								</SelectTrigger>
								<SelectContent>
									{priorities?.map((priority) => (
										<SelectItem key={priority._id} value={priority._id}>
											{priority.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="leadId">Руководитель проекта</Label>
							<Select
								value={formData.leadId}
								onValueChange={(value) =>
									setFormData({ ...formData, leadId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Выберите руководителя" />
								</SelectTrigger>
								<SelectContent>
									{users?.map((user) => (
										<SelectItem key={user._id} value={user._id}>
											{user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Дата начала</Label>
							<DatePicker
								date={formData.startDate}
								onDateChange={(date) =>
									date && setFormData({ ...formData, startDate: date })
								}
								placeholder="Выберите дату начала"
							/>
						</div>

						<div className="space-y-2">
							<Label>Целевая дата завершения</Label>
							<DatePicker
								date={formData.targetDate}
								onDateChange={(date) =>
									setFormData({ ...formData, targetDate: date || undefined })
								}
								placeholder="Выберите дату завершения"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Члены команды</Label>
						<div className="max-h-48 overflow-y-auto rounded-lg border p-4">
							<div className="grid grid-cols-2 gap-2">
								{users?.map((user) => (
									<label
										key={user._id}
										className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted"
									>
										<input
											type="checkbox"
											checked={formData.teamMemberIds.includes(user._id)}
											onChange={() => handleTeamMemberToggle(user._id)}
											className="rounded"
										/>
										<span className="text-sm">{user.name}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Примечания</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder="Дополнительная информация о проекте..."
							rows={3}
						/>
					</div>

					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Отмена
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Создание..." : "Создать проект"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
