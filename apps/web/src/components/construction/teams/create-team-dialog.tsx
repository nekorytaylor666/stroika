"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import type { Id } from "@backend/convex/_generated/dataModel";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateTeamDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: Id<"organizations">;
}

export function CreateTeamDialog({
	open,
	onOpenChange,
	organizationId,
}: CreateTeamDialogProps) {
	const [name, setName] = useState("");
	const [departmentId, setDepartmentId] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createTeam = useMutation(api.constructionTeams.create);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Введите название команды");
			return;
		}

		if (!departmentId) {
			toast.error("Выберите отдел");
			return;
		}

		setIsSubmitting(true);

		try {
			await createTeam({
				name: name.trim(),
				departmentId: departmentId,
				organizationId,
			});

			toast.success("Команда создана");
			onOpenChange(false);

			// Reset form
			setName("");
			setDepartmentId("");
		} catch (error) {
			console.error("Failed to create team:", error);
			toast.error("Не удалось создать команду");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Создать команду</DialogTitle>
						<DialogDescription>
							Создайте новую команду для управления проектами и задачами
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Название команды</Label>
							<Input
								id="name"
								placeholder="Например: Команда монтажа"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="department">Отдел</Label>
							<Select
								value={departmentId}
								onValueChange={setDepartmentId}
								disabled={isSubmitting}
							>
								<SelectTrigger id="department">
									<SelectValue placeholder="Выберите отдел" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="design">Дизайн</SelectItem>
									<SelectItem value="construction">Строительство</SelectItem>
									<SelectItem value="engineering">Инженерия</SelectItem>
									<SelectItem value="management">Управление</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Отмена
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Создание..." : "Создать команду"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
