'use client';

import { useConstructionData } from '@/hooks/use-construction-data';
import { ConstructionProjectLine } from './construction-project-line';

export default function ConstructionProjects() {
    const { projects, isLoading } = useConstructionData();

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Загружаем проекты...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="bg-container px-6 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
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
        </div>
    );
} 