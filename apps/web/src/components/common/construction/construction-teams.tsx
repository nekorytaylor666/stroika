'use client';

import { useConstructionData } from '@/hooks/use-construction-data';
import { ConstructionTeamLine } from './construction-team-line';

export default function ConstructionTeams() {
    const { teams, isLoading } = useConstructionData();

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Загружаем команды...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="bg-container px-6 gap-4 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
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