import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ConstructionTeam } from '@/store/construction/construction-convex-store';
import { MembersTooltip } from '../teams/members-tooltip';
import { ProjectsTooltip } from '../teams/projects-tooltip';
import { Button } from '@/components/ui/button';
import { Check, Users, FolderIcon } from 'lucide-react';
import { useConstructionData } from '@/hooks/use-construction-data';

interface ConstructionTeamLineProps {
    team: ConstructionTeam;
}

export function ConstructionTeamLine({ team }: ConstructionTeamLineProps) {
    const { getUserById, getProjectById } = useConstructionData();

    // Populate team members and projects from store
    const members = team.memberIds?.map(id => getUserById(id)).filter(Boolean) || [];
    const projects = team.projectIds?.map(id => getProjectById(id)).filter(Boolean) || [];

    const getWorkloadColor = (workload: number) => {
        if (workload >= 90) return 'text-red-600';
        if (workload >= 80) return 'text-yellow-600';
        if (workload >= 70) return 'text-blue-600';
        return 'text-green-600';
    };

    const getWorkloadBgColor = (workload: number) => {
        if (workload >= 90) return 'bg-red-100 dark:bg-red-900/20';
        if (workload >= 80) return 'bg-yellow-100 dark:bg-yellow-900/20';
        if (workload >= 70) return 'bg-blue-100 dark:bg-blue-900/20';
        return 'bg-green-100 dark:bg-green-900/20';
    };

    const getDepartmentBadgeColor = (department: string) => {
        switch (department) {
            case 'design':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
            case 'construction':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
            case 'engineering':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'management':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const getDepartmentName = (department: string) => {
        switch (department) {
            case 'design':
                return 'Проектирование';
            case 'construction':
                return 'Строительство';
            case 'engineering':
                return 'Инженерия';
            case 'management':
                return 'Управление';
            default:
                return 'Прочие';
        }
    };

    return (
        <div className="w-full flex gap-4 items-center py-3 px-6 border-b hover:bg-sidebar/50 border-muted-foreground/5 text-sm">
            <div className="w-[25%] md:w-[20%] lg:w-[20%] min-w-[200px] flex items-center gap-2">
                <div className="relative">
                    <div className="inline-flex size-8 bg-muted/50 items-center justify-center rounded shrink-0">
                        <div className="text-lg">{team.icon}</div>
                    </div>
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-medium truncate w-full">{team.name}</span>
                    <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${getDepartmentBadgeColor(team.department)}`}
                    >
                        {getDepartmentName(team.department)}
                    </Badge>
                </div>
            </div>

            <div className="w-[20%] md:w-[15%] lg:w-[15%] text-sm font-medium">
                {team.shortName}
            </div>

            <div className="w-[15%] md:w-[15%] lg:w-[15%] flex items-center">
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm">{members.length}</span>
                    {members.length > 0 && <MembersTooltip members={members} />}
                </div>
            </div>

            <div className="w-[20%] md:w-[20%] lg:w-[20%] flex items-center">
                <div className="flex items-center gap-2">
                    <FolderIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm">{projects.length}</span>
                    {projects.length > 0 && <ProjectsTooltip projects={projects} />}
                </div>
            </div>

            <div className="w-[20%] md:w-[15%] lg:w-[15%]">
                <div className={`rounded-md p-2 ${getWorkloadBgColor(team.workload)}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-semibold ${getWorkloadColor(team.workload)}`}>
                            {team.workload}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {team.workload >= 90 ? 'Перегружен' :
                                team.workload >= 80 ? 'Высокая' :
                                    team.workload >= 70 ? 'Нормальная' : 'Низкая'}
                        </span>
                    </div>
                    <Progress value={team.workload} className="h-1.5" />
                </div>
            </div>

            <div className="hidden lg:block lg:w-[15%]">
                {team.joined ? (
                    <Button variant="secondary" size="xs" className="text-xs">
                        <Check className="size-3 mr-1" />
                        Активная
                    </Button>
                ) : (
                    <Button variant="outline" size="xs" className="text-xs">
                        Неактивная
                    </Button>
                )}
            </div>
        </div>
    );
} 