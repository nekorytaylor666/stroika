import { SeedButton } from "@/components/admin/seed-button";
import { OrganizationalHierarchy } from "@/components/permissions/organizational-hierarchy";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Database, Shield } from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/admin")({
	component: AdminSettings,
});

function AdminSettings() {
	return (
		<div className="container mx-auto space-y-8 py-8">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-3xl">
					<Shield className="h-8 w-8" />
					Администрирование
				</h1>
				<p className="mt-2 text-muted-foreground">
					Управление ролями, разрешениями и организационной структурой
				</p>
			</div>

			<Tabs defaultValue="database" className="space-y-4">
				<TabsList>
					<TabsTrigger value="database">База данных</TabsTrigger>
					<TabsTrigger value="hierarchy">Организационная структура</TabsTrigger>
					<TabsTrigger value="roles">Роли и разрешения</TabsTrigger>
				</TabsList>

				<TabsContent value="database" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Инициализация базы данных
							</CardTitle>
							<CardDescription>
								Создание начальных данных для системы управления правами
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<p className="text-muted-foreground text-sm">
									Используйте эту кнопку для создания начальной структуры ролей,
									разрешений и отделов. Это действие безопасно и не удаляет
									существующие данные.
								</p>
								<SeedButton />
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="hierarchy" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								Структура компании
							</CardTitle>
							<CardDescription>
								Иерархия отделов и подразделений
							</CardDescription>
						</CardHeader>
						<CardContent>
							<OrganizationalHierarchy />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="roles" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Системные роли</CardTitle>
							<CardDescription>
								Управление ролями и их разрешениями
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="rounded-lg border p-4">
									<h4 className="mb-2 font-medium">Иерархия ролей:</h4>
									<ol className="list-inside list-decimal space-y-2 text-sm">
										<li>
											<strong>Владелец</strong> - Полный доступ ко всей системе
										</li>
										<li>
											<strong>Генеральный директор (CEO)</strong> - Управление
											компанией
										</li>
										<li>
											<strong>Главный инженер проекта (ГИП)</strong> -
											Управление техническими аспектами
										</li>
										<li>
											<strong>Руководитель отдела</strong> - Управление своим
											отделом
										</li>
										<li>
											<strong>Руководитель проекта</strong> - Управление
											проектами
										</li>
										<li>
											<strong>Инженер</strong> - Работа с задачами
										</li>
										<li>
											<strong>Наблюдатель</strong> - Только просмотр
										</li>
									</ol>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
