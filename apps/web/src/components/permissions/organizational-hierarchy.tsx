import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { Building2, ChevronRight, User } from "lucide-react";

interface Department {
	_id: string;
	name: string;
	displayName: string;
	level: number;
	children?: Department[];
}

export function OrganizationalHierarchy() {
	const departments = useQuery(api.departments.queries.getDepartmentHierarchy);

	const renderDepartment = (dept: Department, depth = 0) => {
		return (
			<div key={dept._id} className={`${depth > 0 ? "ml-6" : ""}`}>
				<div className="flex items-center gap-2 py-2">
					{depth > 0 && (
						<ChevronRight className="h-4 w-4 text-muted-foreground" />
					)}
					<Building2 className="h-4 w-4" />
					<span className="font-medium">{dept.displayName}</span>
					<Badge variant="outline" className="text-xs">
						Уровень {dept.level}
					</Badge>
				</div>
				{dept.children && dept.children.length > 0 && (
					<div className="ml-2 border-muted border-l-2">
						{dept.children.map((child) => renderDepartment(child, depth + 1))}
					</div>
				)}
			</div>
		);
	};

	if (!departments) {
		return <div>Загрузка...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Организационная структура
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{departments.map((dept) => renderDepartment(dept))}
				</div>
			</CardContent>
		</Card>
	);
}

export function UserHierarchyInfo({ userId }: { userId: string }) {
	const userInfo = useQuery(api.departments.queries.getUserHierarchy, {
		userId: userId as any,
	});

	if (!userInfo) {
		return <div>Загрузка...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5" />
					{userInfo.user.name}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{userInfo.role && (
					<div>
						<h4 className="mb-1 font-medium text-muted-foreground text-sm">
							Роль
						</h4>
						<Badge>{userInfo.role.displayName}</Badge>
					</div>
				)}

				{userInfo.departments.length > 0 && (
					<div>
						<h4 className="mb-2 font-medium text-muted-foreground text-sm">
							Подразделения
						</h4>
						{userInfo.departments.map((dept: any) => (
							<div key={dept.department._id} className="mb-3">
								<div className="mb-1 flex items-center gap-2">
									<Badge variant={dept.isPrimary ? "default" : "secondary"}>
										{dept.isPrimary ? "Основное" : "Дополнительное"}
									</Badge>
									{dept.position && (
										<Badge variant="outline">{dept.position.displayName}</Badge>
									)}
								</div>
								<div className="text-muted-foreground text-sm">
									{dept.hierarchy.map((h: any) => h.displayName).join(" → ")}
								</div>
							</div>
						))}
					</div>
				)}

				{userInfo.permissions.length > 0 && (
					<div>
						<h4 className="mb-2 font-medium text-muted-foreground text-sm">
							Разрешения ({userInfo.permissions.length})
						</h4>
						<div className="flex flex-wrap gap-1">
							{userInfo.permissions.slice(0, 5).map((perm: any) => (
								<Badge key={perm._id} variant="outline" className="text-xs">
									{perm.resource}:{perm.action}
								</Badge>
							))}
							{userInfo.permissions.length > 5 && (
								<Badge variant="outline" className="text-xs">
									+{userInfo.permissions.length - 5} еще
								</Badge>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
