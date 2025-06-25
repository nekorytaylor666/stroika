import type { Issue } from '@/mock-data/issues';
import { status } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';
import { users } from '@/mock-data/users';
import { labels } from '@/mock-data/labels';
import { projects } from '@/mock-data/projects';

export const constructionTasks: Issue[] = [
    {
        id: 'CONST-001',
        identifier: 'CONST-001',
        title: 'Проверка фундамента жилого комплекса',
        description: 'Необходимо проверить качество заливки фундамента для многофункционального жилого комплекса',
        status: status[1], // In Progress
        assignee: users[0],
        priority: priorities[1], // High
        labels: [labels[0], labels[2]], // Bug, Documentation
        createdAt: '2024-06-10T09:00:00Z',
        cycleId: 'construction-cycle',
        project: projects[0],
        rank: '1000',
    },
    {
        id: 'CONST-002',
        identifier: 'CONST-002',
        title: 'Согласование электросетей с заказчиком',
        description: 'Требуется согласовать план прокладки электрических распределительных сетей с ТОО "Invest Jp"',
        status: status[4], // In Review
        assignee: users[1],
        priority: priorities[0], // Urgent
        labels: [labels[1]], // Feature
        createdAt: '2024-06-09T14:30:00Z',
        cycleId: 'construction-cycle',
        project: projects[1],
        rank: '2000',
    },
    {
        id: 'CONST-003',
        identifier: 'CONST-003',
        title: 'Закупка материалов для торгового центра',
        description: 'Организовать закупку строительных материалов для финишных работ в торговом центре New Life',
        status: status[0], // Todo
        assignee: users[2],
        priority: priorities[2], // Medium
        labels: [labels[3]], // Enhancement
        createdAt: '2024-06-08T11:15:00Z',
        cycleId: 'construction-cycle',
        project: projects[2],
        rank: '3000',
    },
    {
        id: 'CONST-004',
        identifier: 'CONST-004',
        title: 'Инспекция безопасности АНПС',
        description: 'Провести инспекцию безопасности строительства АНПС в городах Тараз и Алматы',
        status: status[2], // Review
        assignee: users[3],
        priority: priorities[1], // High
        labels: [labels[0], labels[4]], // Bug, Question
        createdAt: '2024-06-07T16:45:00Z',
        cycleId: 'construction-cycle',
        project: projects[3],
        rank: '4000',
    },
    {
        id: 'CONST-005',
        identifier: 'CONST-005',
        title: 'Установка медицинского оборудования',
        description: 'Координация установки специализированного медицинского оборудования в реабилитационном центре',
        status: status[3], // Testing
        assignee: users[4],
        priority: priorities[0], // Urgent
        labels: [labels[1], labels[2]], // Feature, Documentation
        createdAt: '2024-06-06T08:20:00Z',
        cycleId: 'construction-cycle',
        project: projects[4],
        rank: '5000',
    },
    {
        id: 'CONST-006',
        identifier: 'CONST-006',
        title: 'Ландшафтный дизайн коттеджной зоны',
        description: 'Разработка и реализация ландшафтного дизайна для коттеджной зоны Достак',
        status: status[1], // In Progress
        assignee: users[5],
        priority: priorities[3], // Low
        labels: [labels[3]], // Enhancement
        createdAt: '2024-06-05T13:10:00Z',
        cycleId: 'construction-cycle',
        project: projects[5],
        rank: '6000',
    },
    {
        id: 'CONST-007',
        identifier: 'CONST-007',
        title: 'Финальная приемка БСК',
        description: 'Провести финальную приемку фундаментных решений БСК и подготовить документацию',
        status: status[5], // Done
        assignee: users[6],
        priority: priorities[2], // Medium
        labels: [labels[2]], // Documentation
        createdAt: '2024-06-04T10:30:00Z',
        cycleId: 'construction-cycle',
        project: projects[6],
        rank: '7000',
    },
];

// Helper function to group construction tasks by status
export function groupConstructionTasksByStatus(tasks: Issue[]): Record<string, Issue[]> {
    return tasks.reduce((acc, task) => {
        const statusId = task.status.id;
        if (!acc[statusId]) {
            acc[statusId] = [];
        }
        acc[statusId].push(task);
        return acc;
    }, {} as Record<string, Issue[]>);
} 