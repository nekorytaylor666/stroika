import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@stroika/backend";
import { useMutation } from "convex/react";
import { Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SeedButton() {
	const [isSeeding, setIsSeeding] = useState(false);
	const seedAll = useMutation(api.seed.seedAll);
	const cleanupUsers = useMutation(api.migrations.cleanupUsers.cleanupUsers);

	const handleSeed = async () => {
		setIsSeeding(true);
		try {
			// First cleanup users to fix schema
			const cleanupResult = await cleanupUsers();
			console.log("Cleanup result:", cleanupResult);

			// Then run the seed
			const result = await seedAll();
			console.log("Seed result:", result);

			// Show success message
			toast.success("База данных успешно инициализирована", {
				description:
					"Создано ролей, разрешений, отделов, пользователей, проектов и задач",
			});

			// Show detailed results
			if (result.results && Array.isArray(result.results)) {
				result.results.forEach(
					(step: { step: string; message?: string; error?: string }) => {
						if (step.error) {
							toast.error(`${step.step}: ${step.error}`);
						} else {
							toast.success(`${step.step}: ${step.message}`);
						}
					},
				);
			}
		} catch (error) {
			console.error("Seed error:", error);
			toast.error("Ошибка при инициализации базы данных", {
				description:
					error instanceof Error ? error.message : "Неизвестная ошибка",
			});
		} finally {
			setIsSeeding(false);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline" disabled={isSeeding}>
					{isSeeding ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Инициализация...
						</>
					) : (
						<>
							<Database className="mr-2 h-4 w-4" />
							Инициализировать БД
						</>
					)}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Инициализация базы данных</AlertDialogTitle>
					<AlertDialogDescription>
						Это действие создаст начальные данные в базе:
						<ul className="mt-2 list-inside list-disc space-y-1">
							<li>Системные роли (Владелец, CEO, ГИП, и т.д.)</li>
							<li>Разрешения для каждой роли</li>
							<li>Организационную структуру и отделы</li>
							<li>Примеры пользователей с иерархией</li>
							<li>Статусы, приоритеты и метки</li>
							<li>Строительные команды и отделы</li>
							<li>Строительные проекты (ЖК, бизнес-центры)</li>
							<li>Задачи и поручения</li>
							<li>Финансовые данные и категории работ</li>
						</ul>
						<p className="mt-3 font-medium">
							Внимание: Это действие не удаляет существующие данные, но может
							создать дубликаты при повторном запуске.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Отмена</AlertDialogCancel>
					<AlertDialogAction onClick={handleSeed}>
						Инициализировать
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
