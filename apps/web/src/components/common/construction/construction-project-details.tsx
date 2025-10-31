"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import type { ConstructionProject } from "@/store/construction/construction-convex-store";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ExternalLink, Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionProjectDetailsProps {
	project: ConstructionProject;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ConstructionProjectDetails({
	project,
	open,
	onOpenChange,
}: ConstructionProjectDetailsProps) {
	const { users, priorities, statuses, updateProject, getUserById } =
		useConstructionData();
	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const params = useParams({
		from: "/construction/$orgId/construction-projects",
	});

	// Form state - initialize with project data
	const [formData, setFormData] = useState({
		name: project.name,
		client: project.client,
		location: project.location,
		contractValue: project.contractValue.toString(),
		projectType: project.projectType,
		statusId: project.statusId,
		priorityId: project.priorityId,
		leadId: project.leadId,
		startDate: new Date(project.startDate),
		targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
		notes: project.notes || "",
		teamMemberIds: project.teamMemberIds || [],
		percentComplete: project.percentComplete,
		healthId: project.healthId,
		healthName: project.healthName,
		healthColor: project.healthColor,
		healthDescription: project.healthDescription,
	});

	// Reset form data when project changes
	useEffect(() => {
		setFormData({
			name: project.name,
			client: project.client,
			location: project.location,
			contractValue: project.contractValue.toString(),
			projectType: project.projectType,
			statusId: project.statusId,
			priorityId: project.priorityId,
			leadId: project.leadId,
			startDate: new Date(project.startDate),
			targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
			notes: project.notes || "",
			teamMemberIds: project.teamMemberIds || [],
			percentComplete: project.percentComplete,
			healthId: project.healthId,
			healthName: project.healthName,
			healthColor: project.healthColor,
			healthDescription: project.healthDescription,
		});
		setIsEditing(false);
	}, [project]);

	const handleSave = async () => {
		setIsSubmitting(true);

		try {
			await updateProject({
				id: project._id,
				name: formData.name,
				client: formData.client,
				location: formData.location,
				contractValue: Number(formData.contractValue),
				projectType: formData.projectType,
				statusId: formData.statusId,
				priorityId: formData.priorityId,
				leadId: formData.leadId,
				startDate: formData.startDate.toISOString(),
				targetDate: formData.targetDate?.toISOString(),
				notes: formData.notes,
				teamMemberIds: formData.teamMemberIds,
				percentComplete: formData.percentComplete,
				healthId: formData.healthId,
				healthName: formData.healthName,
				healthColor: formData.healthColor,
				healthDescription: formData.healthDescription,
			});

			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update project:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		// Reset form data to original project data
		setFormData({
			name: project.name,
			client: project.client,
			location: project.location,
			contractValue: project.contractValue.toString(),
			projectType: project.projectType,
			statusId: project.statusId,
			priorityId: project.priorityId,
			leadId: project.leadId,
			startDate: new Date(project.startDate),
			targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
			notes: project.notes || "",
			teamMemberIds: project.teamMemberIds || [],
			percentComplete: project.percentComplete,
			healthId: project.healthId,
			healthName: project.healthName,
			healthColor: project.healthColor,
			healthDescription: project.healthDescription,
		});
		setIsEditing(false);
	};

	const handleNavigateToOverview = () => {
		navigate({
			to: "/construction/$orgId/projects/$projectId/overview",
			params: {
				orgId: params.orgId,
				projectId: project._id,
			},
		});
		onOpenChange(false);
	};

	const handleTeamMemberToggle = (userId: Id<"user">) => {
		setFormData((prev) => ({
			...prev,
			teamMemberIds: prev.teamMemberIds.includes(userId)
				? prev.teamMemberIds.filter((id) => id !== userId)
				: [...prev.teamMemberIds, userId],
		}));
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ru-KZ", {
			style: "currency",
			currency: "KZT",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getHealthColor = (healthId: string) => {
		switch (healthId) {
			case "on-track":
				return "text-green-600 bg-green-100 dark:bg-green-900/20";
			case "at-risk":
				return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
			case "off-track":
				return "text-red-600 bg-red-100 dark:bg-red-900/20";
			case "no-update":
				return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
			default:
				return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
				<DialogHeader className="flex-shrink-0">
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl">{project.name}</DialogTitle>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleNavigateToOverview}
								className="gap-2"
								title="Открыть обзор проекта"
							>
								<ExternalLink className="h-4 w-4" />
								Обзор
							</Button>
							{!isEditing ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditing(true)}
									className="gap-2"
								>
									<Pencil className="h-4 w-4" />
									Редактировать
								</Button>
							) : (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancel}
										disabled={isSubmitting}
										className="gap-2"
									>
										<X className="h-4 w-4" />
										Отмена
									</Button>
									<Button
										size="sm"
										onClick={handleSave}
										disabled={isSubmitting}
										className="gap-2"
									>
										<Save className="h-4 w-4" />
										{isSubmitting ? "Сохранение..." : "Сохранить"}
									</Button>
								</>
							)}
						</div>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					<Tabs defaultValue="overview" className="w-full">
						<TabsList className="w-full">
							<TabsTrigger value="overview" className="flex-1">
								Обзор
							</TabsTrigger>
							<TabsTrigger value="team" className="flex-1">
								Команда
							</TabsTrigger>
							<TabsTrigger value="financial" className="flex-1">
								Финансы
							</TabsTrigger>
							<TabsTrigger value="timeline" className="flex-1">
								График
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-6 p-6">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label>Название проекта</Label>
									{isEditing ? (
										<Input
											value={formData.name}
											onChange={(e) =>
												setFormData({ ...formData, name: e.target.value })
											}
										/>
									) : (
										<p className="text-sm">{project.name}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Заказчик</Label>
									{isEditing ? (
										<Input
											value={formData.client}
											onChange={(e) =>
												setFormData({ ...formData, client: e.target.value })
											}
										/>
									) : (
										<p className="text-sm">{project.client}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Местоположение</Label>
									{isEditing ? (
										<Input
											value={formData.location}
											onChange={(e) =>
												setFormData({ ...formData, location: e.target.value })
											}
										/>
									) : (
										<p className="text-sm">{project.location}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Тип проекта</Label>
									{isEditing ? (
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
												<SelectItem value="infrastructure">
													Инфраструктура
												</SelectItem>
											</SelectContent>
										</Select>
									) : (
										<Badge variant="outline">
											{project.projectType === "residential"
												? "Жилое"
												: project.projectType === "commercial"
													? "Коммерческое"
													: project.projectType === "industrial"
														? "Промышленное"
														: "Инфраструктура"}
										</Badge>
									)}
								</div>

								<div className="space-y-2">
									<Label>Статус</Label>
									{isEditing ? (
										<Select
											value={formData.statusId}
											onValueChange={(value) =>
												setFormData({
													...formData,
													statusId: value as Id<"status">,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{statuses?.map((status) => (
													<SelectItem key={status._id} value={status._id}>
														{status.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<Badge
											variant="outline"
											style={{ color: project.status?.color }}
										>
											{project.status?.name}
										</Badge>
									)}
								</div>

								<div className="space-y-2">
									<Label>Приоритет</Label>
									{isEditing ? (
										<Select
											value={formData.priorityId}
											onValueChange={(value) =>
												setFormData({
													...formData,
													priorityId: value as Id<"priorities">,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{priorities?.map((priority) => (
													<SelectItem key={priority._id} value={priority._id}>
														{priority.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<Badge variant="outline">{project.priority?.name}</Badge>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Прогресс выполнения</Label>
								<div className="space-y-2">
									{isEditing ? (
										<Input
											type="number"
											value={formData.percentComplete}
											onChange={(e) =>
												setFormData({
													...formData,
													percentComplete: Number(e.target.value),
												})
											}
											min="0"
											max="100"
										/>
									) : (
										<div className="flex items-center gap-3">
											<Progress
												value={project.percentComplete}
												className="flex-1"
											/>
											<span className="font-medium text-sm">
												{project.percentComplete}%
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Состояние проекта</Label>
								<Badge className={`${getHealthColor(project.healthId)}`}>
									{project.healthName}
								</Badge>
								<p className="text-muted-foreground text-sm">
									{project.healthDescription}
								</p>
							</div>

							<div className="space-y-2">
								<Label>Примечания</Label>
								{isEditing ? (
									<Textarea
										value={formData.notes}
										onChange={(e) =>
											setFormData({ ...formData, notes: e.target.value })
										}
										rows={4}
									/>
								) : (
									<p className="text-sm">{project.notes || "Нет примечаний"}</p>
								)}
							</div>
						</TabsContent>

						<TabsContent value="team" className="space-y-6 p-6">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Руководитель проекта</Label>
									{isEditing ? (
										<Select
											value={formData.leadId}
											onValueChange={(value) =>
												setFormData({
													...formData,
													leadId: value as Id<"user">,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{users?.map((user) => (
													<SelectItem key={user.id} value={user.id}>
														{user.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarImage src={project.lead?.image} />
												<AvatarFallback>
													{project.lead?.name.slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm">{project.lead?.name}</span>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label>Члены команды ({formData.teamMemberIds.length})</Label>
									{isEditing ? (
										<div className="max-h-64 overflow-y-auto rounded-lg border p-4">
											<div className="grid grid-cols-2 gap-2">
												{users?.map((user) => (
													<label
														key={user.id}
														className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted"
													>
														<input
															type="checkbox"
															checked={formData.teamMemberIds.includes(user.id)}
															onChange={() => handleTeamMemberToggle(user.id)}
															className="rounded"
														/>
														<Avatar className="h-6 w-6">
															<AvatarImage src={user.avatarUrl} />
															<AvatarFallback>
																{user.name.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<span className="text-sm">{user.name}</span>
													</label>
												))}
											</div>
										</div>
									) : (
										<div className="space-y-2">
											{project.teamMemberIds?.map((memberId) => {
												const member = getUserById(memberId);
												if (!member) return null;
												return (
													<div
														key={memberId}
														className="flex items-center gap-2"
													>
														<Avatar className="h-8 w-8">
															<AvatarImage src={member.image} />
															<AvatarFallback>
																{member.name.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div>
															<p className="font-medium text-sm">
																{member.name}
															</p>
															<p className="text-muted-foreground text-xs">
																{member.position}
															</p>
														</div>
													</div>
												);
											})}
											{(!project.teamMemberIds ||
												project.teamMemberIds.length === 0) && (
												<p className="text-muted-foreground text-sm">
													Нет членов команды
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						</TabsContent>

						<TabsContent value="financial" className="space-y-6 p-6">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Стоимость контракта</Label>
									{isEditing ? (
										<Input
											type="number"
											value={formData.contractValue}
											onChange={(e) =>
												setFormData({
													...formData,
													contractValue: e.target.value,
												})
											}
										/>
									) : (
										<p className="font-semibold text-2xl text-green-600">
											{formatCurrency(project.contractValue)}
										</p>
									)}
								</div>

								{project.monthlyRevenue &&
									project.monthlyRevenue.length > 0 && (
										<div className="space-y-2">
											<Label>Ежемесячный доход</Label>
											<div className="space-y-2">
												{project.monthlyRevenue.map((revenue) => (
													<div
														key={revenue._id}
														className="flex items-center justify-between rounded border p-2"
													>
														<span className="text-sm">{revenue.month}</span>
														<div className="flex gap-4 text-sm">
															<span>
																План: {formatCurrency(revenue.planned)}
															</span>
															<span className="font-medium">
																Факт: {formatCurrency(revenue.actual)}
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
							</div>
						</TabsContent>

						<TabsContent value="timeline" className="space-y-6 p-6">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label>Дата начала</Label>
									{isEditing ? (
										<DatePicker
											date={formData.startDate}
											onDateChange={(date) =>
												date && setFormData({ ...formData, startDate: date })
											}
											placeholder="Выберите дату начала"
										/>
									) : (
										<p className="text-sm">
											{format(new Date(project.startDate), "PPP", {
												locale: ru,
											})}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label>Целевая дата завершения</Label>
									{isEditing ? (
										<DatePicker
											date={formData.targetDate}
											onDateChange={(date) =>
												setFormData({
													...formData,
													targetDate: date || undefined,
												})
											}
											placeholder="Выберите дату завершения"
										/>
									) : (
										<p className="text-sm">
											{project.targetDate
												? format(new Date(project.targetDate), "PPP", {
														locale: ru,
													})
												: "Не установлена"}
										</p>
									)}
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}
