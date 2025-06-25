"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { ConstructionTeamLine } from "./construction-team-line";

export default function ConstructionTeams() {
	const { teams, isLoading } = useConstructionData();

	if (isLoading) {
		return (
			<div className="flex w-full items-center justify-center p-8">
				<div className="text-muted-foreground text-sm">
					Загружаем команды...
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
				<div className="w-[25%] md:w-[20%] lg:w-[20%]">Отдел</div>
				<div className="w-[20%] md:w-[15%] lg:w-[15%]">Краткое название</div>
				<div className="w-[15%] md:w-[15%] lg:w-[15%]">Сотрудники</div>
				<div className="w-[20%] md:w-[20%] lg:w-[20%]">Проекты</div>
				<div className="w-[20%] md:w-[15%] lg:w-[15%]">Загруженность</div>
				<div className="hidden lg:block lg:w-[15%]">Статус</div>
			</div>

			<div className="w-full">
				{teams?.map((team) => (
					<ConstructionTeamLine key={team._id} team={team} />
				))}
			</div>
		</div>
	);
}
