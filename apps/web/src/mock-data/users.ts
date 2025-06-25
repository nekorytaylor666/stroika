export interface User {
   id: string;
   name: string;
   avatarUrl: string;
   email: string;
   status: 'online' | 'offline' | 'away';
   role: 'Инженер' | 'Архитектор' | 'Руководитель проекта' | 'Главный инженер' | 'Генеральный директор';
   joinedDate: string;
   teamIds: string[];
   position?: string; // Должность
   workload?: number; // Загруженность сотрудника в %
}

function avatarUrl(seed: string) {
   return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
}

export const statusUserColors = {
   online: '#10B981',
   offline: '#6B7280',
   away: '#F59E0B',
};

export const users: User[] = [
   {
      id: 'arquibekova',
      name: 'Аркибекова Джамила Рахматуллаевна',
      avatarUrl: avatarUrl('arquibekova'),
      email: 'arquibekova@stroyka.kz',
      status: 'online',
      role: 'Главный инженер',
      joinedDate: '2020-01-15',
      teamIds: ['AVK', 'EL', 'PM'],
      position: 'Главный инженер проекта',
      workload: 90,
   },
   {
      id: 'akhmet',
      name: 'Ахмет Ерғазыұлы Құрманбергенұлы',
      avatarUrl: avatarUrl('akhmet'),
      email: 'akhmet.kurman@stroyka.kz',
      status: 'online',
      role: 'Инженер',
      joinedDate: '2021-03-10',
      teamIds: ['AVK', 'GEO'],
      position: 'Ведущий инженер АВК',
      workload: 85,
   },
   {
      id: 'akhmetova',
      name: 'Ахметова Алмагүл Нұрғалымқызы',
      avatarUrl: avatarUrl('akhmetova'),
      email: 'akhmetova.almagul@stroyka.kz',
      status: 'away',
      role: 'Инженер',
      joinedDate: '2021-08-22',
      teamIds: ['AVK', 'EL'],
      position: 'Инженер по водоснабжению',
      workload: 75,
   },
   {
      id: 'bondarchuk',
      name: 'Бондарчук Александр Сергеевич',
      avatarUrl: avatarUrl('bondarchuk'),
      email: 'bondarchuk.alex@stroyka.kz',
      status: 'online',
      role: 'Инженер',
      joinedDate: '2020-11-05',
      teamIds: ['KJ', 'GEO'],
      position: 'Инженер-конструктор',
      workload: 88,
   },
   {
      id: 'muratbayeva',
      name: 'Муратбаева Гүлзипа Уайзетжанқызы',
      avatarUrl: avatarUrl('muratbayeva'),
      email: 'muratbayeva.gulzipa@stroyka.kz',
      status: 'online',
      role: 'Архитектор',
      joinedDate: '2019-05-18',
      teamIds: ['KJ', 'EL'],
      position: 'Ведущий архитектор',
      workload: 92,
   },
   {
      id: 'salambayev',
      name: 'Саламбаев Асан Останович',
      avatarUrl: avatarUrl('salambayev'),
      email: 'salambayev.asan@stroyka.kz',
      status: 'offline',
      role: 'Инженер',
      joinedDate: '2020-07-12',
      teamIds: ['KJ', 'PM'],
      position: 'Инженер ПГС',
      workload: 80,
   },
   {
      id: 'sabatov',
      name: 'Сабатов Божайбек Томалбекович',
      avatarUrl: avatarUrl('sabatov'),
      email: 'sabatov.bozhayibek@stroyka.kz',
      status: 'away',
      role: 'Архитектор',
      joinedDate: '2021-02-14',
      teamIds: ['AP', 'QC'],
      position: 'Архитектор проекта',
      workload: 78,
   },
   {
      id: 'salimzhanov',
      name: 'Салимжанов Арий Шакимжанович',
      avatarUrl: avatarUrl('salimzhanov'),
      email: 'salimzhanov.ariy@stroyka.kz',
      status: 'online',
      role: 'Руководитель проекта',
      joinedDate: '2018-09-25',
      teamIds: ['AP', 'PM'],
      position: 'Главный архитектор проекта',
      workload: 95,
   },
   {
      id: 'salimzhanov_ruslan',
      name: 'Салимжанов Руслан Баурзханович',
      avatarUrl: avatarUrl('salimzhanov_ruslan'),
      email: 'salimzhanov.ruslan@stroyka.kz',
      status: 'online',
      role: 'Инженер',
      joinedDate: '2022-01-10',
      teamIds: ['AP', 'KM'],
      position: 'Инженер-проектировщик',
      workload: 70,
   },
   {
      id: 'tulebayev',
      name: 'Тулебаев Лосбай',
      avatarUrl: avatarUrl('tulebayev'),
      email: 'tulebayev.losbay@stroyka.kz',
      status: 'offline',
      role: 'Инженер',
      joinedDate: '2020-04-08',
      teamIds: ['KM', 'PM'],
      position: 'Инженер по металлоконструкциям',
      workload: 82,
   },
   {
      id: 'irmatov',
      name: 'Ирматов Галиб Ерматович',
      avatarUrl: avatarUrl('irmatov'),
      email: 'irmatov.galib@stroyka.kz',
      status: 'away',
      role: 'Инженер',
      joinedDate: '2021-06-20',
      teamIds: ['KM', 'TH'],
      position: 'Инженер-теплотехник',
      workload: 65,
   },
   {
      id: 'kazarboev',
      name: 'Казарбоев Жақсылық Сапаргалиұлы',
      avatarUrl: avatarUrl('kazarboev'),
      email: 'kazarboev.zhaksylyk@stroyka.kz',
      status: 'online',
      role: 'Генеральный директор',
      joinedDate: '2018-01-01',
      teamIds: ['TH', 'LOG'],
      position: 'Генеральный директор',
      workload: 100,
   },
];

// Helper functions for filtering users
export function getUsersByTeam(teamId: string): User[] {
   return users.filter(user => user.teamIds.includes(teamId));
}

export function getUsersByRole(role: User['role']): User[] {
   return users.filter(user => user.role === role);
}

export function getUsersByStatus(status: User['status']): User[] {
   return users.filter(user => user.status === status);
}

export function calculateAverageWorkload(): number {
   const totalWorkload = users.reduce((sum, user) => sum + (user.workload || 0), 0);
   return totalWorkload / users.length;
}

export function getHighWorkloadUsers(threshold: number = 85): User[] {
   return users.filter(user => (user.workload || 0) >= threshold);
}
