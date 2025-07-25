"use client";

import { Button } from "@/components/ui/button";
import { useConstructionData } from "@/hooks/use-construction-data";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ConstructionProjectCreateDialog } from "./construction-project-create-dialog";
import { ConstructionProjectLine } from "./construction-project-line";

export default function ConstructionProjects() {
	const projects = useQuery(api.constructionProjects.getAll);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	if (!projects) {
		return (
			<div className="flex w-full items-center justify-center p-8">
				<div className="text-muted-foreground text-sm">
					Загружаем проекты...
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="flex items-center justify-between border-b px-6 py-4">
				<h2 className="font-semibold text-lg">Строительные проекты</h2>
				<Button
					onClick={() => setCreateDialogOpen(true)}
					size="sm"
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Новый проект
				</Button>
			</div>

			<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
				<div className="w-[35%] md:w-[30%] lg:w-[25%]">Название проекта</div>
				<div className="w-[20%] md:w-[15%] lg:w-[15%]">Заказчик</div>
				<div className="w-[15%] md:w-[10%] lg:w-[10%]">% выполнения</div>
				<div className="w-[15%] md:w-[15%] lg:w-[15%]">Стоимость</div>
				<div className="hidden lg:block lg:w-[10%]">Приоритет</div>
				<div className="hidden lg:block lg:w-[10%]">Статус</div>
				<div className="w-[15%] md:w-[15%] lg:w-[15%]">Руководитель</div>
			</div>

			<div className="w-full">
				{projects?.map((project) => (
					<ConstructionProjectLine key={project._id} project={project} />
				))}
			</div>

			<ConstructionProjectCreateDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
			/>
		</div>
	);
}
