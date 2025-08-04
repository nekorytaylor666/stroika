"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TeamSettingsTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamSettingsTab({ teamId }: TeamSettingsTabProps) {
	const team = useQuery(api.constructionTeams.getTeamWithStats, { teamId });
	const updateTeam = useMutation(api.constructionTeams.update);

	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [department, setDepartment] = useState("");

	// Update local state when team data loads
	useEffect(() => {
		if (team) {
			setName(team.name);
			setDepartment(team.department || "");
		}
	}, [team]);

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Название команды не может быть пустым");
			return;
		}

		setIsLoading(true);
		try {
			await updateTeam({
				teamId,
				name: name.trim(),
				department: department as any,
			});
			toast.success("Настройки команды сохранены");
		} catch (error) {
			console.error("Failed to update team:", error);
			toast.error("Не удалось сохранить настройки");
		} finally {
			setIsLoading(false);
		}
	};

	if (!team) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<Card>
				<CardHeader>
					<CardTitle>Настройки команды</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="name">Название команды</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Введите название команды"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="department">Отдел</Label>
						<Select value={department} onValueChange={setDepartment}>
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

					<div className="flex justify-end">
						<Button onClick={handleSave} disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Сохранение...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Сохранить изменения
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
