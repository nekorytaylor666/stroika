import { PermissionsManagement } from "@/components/settings/permissions-management";
import { LinearPermissionsManagement } from "@/components/settings/linear-style/permissions-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, Settings, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/construction/$orgId/permissions")({
	component: PermissionsManagementPage,
});

function PermissionsManagementPage() {
	const { orgId } = Route.useParams();
	const [viewStyle, setViewStyle] = useState<"classic" | "linear">("linear");

	return (
		<div className="container mx-auto space-y-8 py-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-3xl">
						<Shield className="h-8 w-8" />
						Управление правами доступа
					</h1>
					<p className="mt-2 text-muted-foreground">
						Управление ролями, разрешениями и правами пользователей в
						организации
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={viewStyle === "classic" ? "default" : "outline"}
						size="sm"
						onClick={() => setViewStyle("classic")}
					>
						Классический вид
					</Button>
					<Button
						variant={viewStyle === "linear" ? "default" : "outline"}
						size="sm"
						onClick={() => setViewStyle("linear")}
					>
						Linear стиль
					</Button>
				</div>
			</div>

			<Tabs defaultValue="permissions" className="space-y-4">
				<TabsList>
					<TabsTrigger value="permissions">Права доступа</TabsTrigger>
					<TabsTrigger value="overview">Обзор системы</TabsTrigger>
				</TabsList>

				<TabsContent value="permissions" className="space-y-4">
					<Card>
						<CardContent className="p-0">
							{viewStyle === "linear" ? (
								<LinearPermissionsManagement organizationId={orgId} />
							) : (
								<div className="p-6">
									<PermissionsManagement organizationId={orgId} />
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5" />
								Обзор системы прав доступа
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-6 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="font-semibold">Основные принципы</h3>
									<ul className="space-y-2 text-sm">
										<li className="flex items-start gap-2">
											<div className="mt-1.5 h-1 w-1 rounded-full bg-current" />
											<span>
												<strong>Роли</strong> - базовые наборы разрешений для
												типичных должностей в организации
											</span>
										</li>
										<li className="flex items-start gap-2">
											<div className="mt-1.5 h-1 w-1 rounded-full bg-current" />
											<span>
												<strong>Разрешения</strong> - конкретные права на
												выполнение действий с ресурсами
											</span>
										</li>
										<li className="flex items-start gap-2">
											<div className="mt-1.5 h-1 w-1 rounded-full bg-current" />
											<span>
												<strong>Индивидуальные права</strong> - персональные
												разрешения или ограничения для конкретных пользователей
											</span>
										</li>
									</ul>
								</div>
								<div className="space-y-4">
									<h3 className="font-semibold">Иерархия ролей</h3>
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
							<div className="rounded-lg bg-muted/50 p-4">
								<div className="flex gap-2">
									<Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
									<div className="text-muted-foreground text-sm">
										<p className="font-medium">Безопасность</p>
										<p className="mt-1">
											Все изменения прав доступа логируются и могут быть
											просмотрены в разделе "История изменений". Системные роли
											защищены от случайного изменения.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
