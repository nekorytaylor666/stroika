"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import { 
	Building,
	Building2,
	Calendar,
	ChevronRight,
	DollarSign,
	Factory,
	Flag,
	Home,
	MapPin,
	Plus,
	Sparkles,
	Users,
	X
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

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
			<DialogContent className="flex h-[90vh] max-h-[900px] w-full max-w-4xl flex-col overflow-hidden p-0" hideCloseButton>
				{/* Header */}
				<div className="flex-shrink-0 border-b bg-muted/30 px-8 py-6">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Building className="h-6 w-6 text-primary" />
								</div>
								<div>
									<DialogTitle className="text-xl">Новый строительный проект</DialogTitle>
									<DialogDescription>
										Создайте новый проект и начните отслеживать прогресс
									</DialogDescription>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onOpenChange(false)}
								className="h-8 w-8"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</DialogHeader>
				</div>

				{/* Form Content */}
				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-0">
						{/* Project Details Section */}
						<div className="px-8 py-6">
							<div className="mb-6 flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-muted-foreground">Основная информация</h3>
							</div>
							
							<div className="grid gap-6">
								<div className="space-y-2">
									<Label htmlFor="name" className="text-sm font-medium">
										Название проекта
									</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Жилой комплекс 'Алматы'"
										className="h-10"
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="client" className="text-sm font-medium">
											Заказчик
										</Label>
										<Input
											id="client"
											value={formData.client}
											onChange={(e) =>
												setFormData({ ...formData, client: e.target.value })
											}
											placeholder="ТОО 'Строй Инвест'"
											className="h-10"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="projectType" className="text-sm font-medium">
											Тип проекта
										</Label>
										<Select
											value={formData.projectType}
											onValueChange={(value: any) =>
												setFormData({ ...formData, projectType: value })
											}
										>
											<SelectTrigger className="h-10">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="residential">
													<div className="flex items-center gap-2">
														<Home className="h-4 w-4" />
														Жилое
													</div>
												</SelectItem>
												<SelectItem value="commercial">
													<div className="flex items-center gap-2">
														<Building2 className="h-4 w-4" />
														Коммерческое
													</div>
												</SelectItem>
												<SelectItem value="industrial">
													<div className="flex items-center gap-2">
														<Factory className="h-4 w-4" />
														Промышленное
													</div>
												</SelectItem>
												<SelectItem value="infrastructure">
													<div className="flex items-center gap-2">
														<Building className="h-4 w-4" />
														Инфраструктура
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>

						{/* Location & Budget Section */}
						<Separator />
						<div className="px-8 py-6">
							<div className="mb-6 flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-muted-foreground">Местоположение и бюджет</h3>
							</div>
							
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="location" className="text-sm font-medium">
										Местоположение
									</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="location"
											value={formData.location}
											onChange={(e) =>
												setFormData({ ...formData, location: e.target.value })
											}
											placeholder="г. Алматы, ул. Абая 150"
											className="h-10 pl-10"
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="contractValue" className="text-sm font-medium">
										Стоимость контракта
									</Label>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="contractValue"
											type="number"
											value={formData.contractValue}
											onChange={(e) =>
												setFormData({ ...formData, contractValue: e.target.value })
											}
											placeholder="1 000 000 000"
											className="h-10 pl-10"
											required
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
											₸
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Project Management Section */}
						<Separator />
						<div className="px-8 py-6">
							<div className="mb-6 flex items-center gap-2">
								<Flag className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-muted-foreground">Управление проектом</h3>
							</div>
							
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="statusId" className="text-sm font-medium">
										Статус
									</Label>
									<Select
										value={formData.statusId}
										onValueChange={(value) =>
											setFormData({ ...formData, statusId: value })
										}
									>
										<SelectTrigger className="h-10">
											<SelectValue placeholder="Выберите статус" />
										</SelectTrigger>
										<SelectContent>
											{statuses?.map((status) => (
												<SelectItem key={status._id} value={status._id}>
													<div className="flex items-center gap-2">
														<div
															className="h-2 w-2 rounded-full"
															style={{ backgroundColor: status.color }}
														/>
														{status.name}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="priorityId" className="text-sm font-medium">
										Приоритет
									</Label>
									<Select
										value={formData.priorityId}
										onValueChange={(value) =>
											setFormData({ ...formData, priorityId: value })
										}
									>
										<SelectTrigger className="h-10">
											<SelectValue placeholder="Выберите приоритет" />
										</SelectTrigger>
										<SelectContent>
											{priorities?.map((priority) => (
												<SelectItem key={priority._id} value={priority._id}>
													<div className="flex items-center gap-2">
														<div className="h-2 w-2 rounded-full bg-muted-foreground" />
														{priority.name}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="col-span-2 space-y-2">
									<Label htmlFor="leadId" className="text-sm font-medium">
										Руководитель проекта
									</Label>
									<Select
										value={formData.leadId}
										onValueChange={(value) =>
											setFormData({ ...formData, leadId: value })
										}
									>
										<SelectTrigger className="h-10">
											<SelectValue placeholder="Выберите руководителя" />
										</SelectTrigger>
										<SelectContent>
											{users?.map((user) => (
												<SelectItem key={user._id} value={user._id}>
													<div className="flex items-center gap-2">
														<Avatar className="h-6 w-6">
															<AvatarImage src={user.avatarUrl || undefined} />
															<AvatarFallback className="text-xs">
																{user.name?.charAt(0)}
															</AvatarFallback>
														</Avatar>
														{user.name}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						{/* Timeline Section */}
						<Separator />
						<div className="px-8 py-6">
							<div className="mb-6 flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-muted-foreground">Сроки выполнения</h3>
							</div>
							
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Дата начала
									</Label>
									<DatePicker
										date={formData.startDate}
										onDateChange={(date) =>
											date && setFormData({ ...formData, startDate: date })
										}
										placeholder="Выберите дату начала"
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Целевая дата завершения
									</Label>
									<DatePicker
										date={formData.targetDate}
										onDateChange={(date) =>
											setFormData({ ...formData, targetDate: date || undefined })
										}
										placeholder="Выберите дату завершения"
									/>
								</div>
							</div>
						</div>

						{/* Team Members Section */}
						<Separator />
						<div className="px-8 py-6">
							<div className="mb-6 flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-medium text-sm text-muted-foreground">Команда проекта</h3>
							</div>
							
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-medium">Члены команды</Label>
									<Badge variant="secondary" className="text-xs">
										{formData.teamMemberIds.length} выбрано
									</Badge>
								</div>
								<div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-3">
									<div className="grid gap-2">
										{users?.map((user) => (
											<motion.label
												key={user._id}
												whileHover={{ scale: 1.01 }}
												whileTap={{ scale: 0.99 }}
												className={cn(
													"flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
													formData.teamMemberIds.includes(user._id)
														? "bg-primary/10"
														: "hover:bg-muted"
												)}
											>
												<input
													type="checkbox"
													checked={formData.teamMemberIds.includes(user._id)}
													onChange={() => handleTeamMemberToggle(user._id)}
													className="h-4 w-4 rounded border-muted-foreground/30"
												/>
												<Avatar className="h-8 w-8">
													<AvatarImage src={user.avatarUrl || undefined} />
													<AvatarFallback className="text-xs">
														{user.name?.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1">
													<div className="font-medium text-sm">{user.name}</div>
													<div className="text-muted-foreground text-xs">{user.email}</div>
												</div>
												{formData.teamMemberIds.includes(user._id) && (
													<ChevronRight className="h-4 w-4 text-primary" />
												)}
											</motion.label>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Notes Section */}
						<Separator />
						<div className="px-8 py-6">
							<div className="space-y-2">
								<Label htmlFor="notes" className="text-sm font-medium">
									Примечания
								</Label>
								<Textarea
									id="notes"
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									placeholder="Дополнительная информация о проекте..."
									rows={4}
									className="resize-none"
								/>
							</div>
						</div>

				</form>

				{/* Footer Actions */}
				<div className="flex-shrink-0 border-t bg-muted/30 px-8 py-4">
					<div className="flex justify-between">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="text-muted-foreground"
						>
							Отмена
						</Button>
						<Button 
							type="submit" 
							disabled={isSubmitting}
							onClick={handleSubmit}
							className="min-w-[140px]"
						>
							{isSubmitting ? (
								<>
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
										className="mr-2 h-4 w-4"
									>
										<Plus className="h-4 w-4" />
									</motion.div>
									Создание...
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" />
									Создать проект
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
