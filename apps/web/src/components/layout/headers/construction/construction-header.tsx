import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Activity,
	Calendar,
	Filter,
	LayoutGrid,
	List,
	Plus,
	Search,
} from "lucide-react";
import { useState } from "react";

export default function ConstructionHeader() {
	const [searchQuery, setSearchQuery] = useState("");
	const [view, setView] = useState<"activity" | "board" | "list" | "gantt">(
		"activity",
	);
	const navigate = useNavigate();
	const { orgId } = useParams({ from: "/construction/$orgId" });

	const handleViewChange = (newView: string) => {
		setView(newView as any);

		// Navigate to different routes based on view
		switch (newView) {
			case "activity":
				navigate({ to: `/construction/${orgId}/construction-tasks` });
				break;
			case "board":
				navigate({ to: `/construction/${orgId}/tasks` });
				break;
			case "list":
				navigate({ to: `/construction/${orgId}/tasks` });
				break;
			case "gantt":
				navigate({ to: `/construction/${orgId}/gantt` });
				break;
		}
	};

	return (
		<header className="flex h-14 items-center justify-between border-b bg-background px-6">
			<div className="flex items-center gap-4">
				<h1 className="font-semibold text-lg">Строительство</h1>

				<Tabs value={view} onValueChange={handleViewChange}>
					<TabsList className="h-9">
						<TabsTrigger value="activity" className="h-7">
							<Activity className="mr-2 h-4 w-4" />
							Активность
						</TabsTrigger>
						<TabsTrigger value="board" className="h-7">
							<LayoutGrid className="mr-2 h-4 w-4" />
							Доска
						</TabsTrigger>
						<TabsTrigger value="list" className="h-7">
							<List className="mr-2 h-4 w-4" />
							Список
						</TabsTrigger>
						<TabsTrigger value="gantt" className="h-7">
							<Calendar className="mr-2 h-4 w-4" />
							Диаграмма Ганта
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск задач..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-9 w-64 pl-9"
					/>
				</div>

				<Select defaultValue="all-projects">
					<SelectTrigger className="h-9 w-48">
						<SelectValue placeholder="Все проекты" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all-projects">Все проекты</SelectItem>
						<SelectItem value="active">Активные проекты</SelectItem>
						<SelectItem value="completed">Завершенные проекты</SelectItem>
					</SelectContent>
				</Select>

				<Button variant="outline" size="sm" className="h-9">
					<Filter className="mr-2 h-4 w-4" />
					Фильтры
				</Button>

				<Button size="sm" className="h-9">
					<Plus className="mr-2 h-4 w-4" />
					Новая задача
				</Button>
			</div>
		</header>
	);
}
