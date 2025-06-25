import {
   Inbox,
   FolderKanban,
   ContactRound,
   Box,
   Settings,
   Bell,
   KeyRound,
   Users,
   Tag,
   Layers,
   FileText,
   MessageSquare,
   Clock,
   Zap,
   UserRound,
   BarChart,
   LifeBuoy,
   Package,
} from 'lucide-react';

export const inboxItems: unknown[] = [];

export const workspaceItems = [
   {
      name: 'Команды',
      url: '/lndev-ui/teams',
      icon: ContactRound,
   },
   {
      name: 'Проекты',
      url: '/lndev-ui/projects',
      icon: Box,
   },
   {
      name: 'Участники',
      url: '/lndev-ui/members',
      icon: UserRound,
   },
];

export const accountItems = [
   {
      name: 'Профиль',
      url: '#',
      icon: Users,
   },
   {
      name: 'Платежи',
      url: '#',
      icon: Settings,
   },
];

export const featuresItems = [
   { name: 'Циклы', url: '#', icon: Package },
   { name: 'Задачи', url: '/', icon: Layers },
   { name: 'Проекты', url: '/projects', icon: BarChart },
   { name: 'Триаж', url: '#', icon: LifeBuoy },
];

export const settingsItems = [
   { name: 'Участники', url: '/members', icon: Users },
   { name: 'Команды', url: '/teams', icon: Users },
   { name: 'Общие', url: '/settings', icon: Settings },
];
