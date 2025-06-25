import {
    Building,
    BarChart3,
    Users,
    DollarSign,
    FileText,
    Settings,
    TrendingUp,
    AlertTriangle,
    Calendar,
    Calculator,
    MapPin,
    Truck,
    CheckSquare,
    Shield,
} from 'lucide-react';

export const constructionMainItems = [
    {
        name: 'Панель управления',
        url: '/construction/lndev-ui/construction-dashboard',
        icon: BarChart3,
        description: 'Общий обзор показателей компании'
    },
    {
        name: 'Проекты',
        url: '/construction/lndev-ui/construction-projects',
        icon: Building,
        description: 'Управление строительными проектами'
    },
    {
        name: 'Команды',
        url: '/construction/lndev-ui/construction-teams',
        icon: Users,
        description: 'Отделы и специалисты'
    },
    {
        name: 'Задачи',
        url: '/construction/lndev-ui/construction-tasks',
        icon: CheckSquare,
        description: 'Управление задачами и поручениями'
    },
];

export const constructionAnalyticsItems = [
    {
        name: 'Финансовая отчетность',
        url: '/construction/lndev-ui/construction-analytics/financial',
        icon: DollarSign,
        description: 'Выручка и контрактная стоимость'
    },
    {
        name: 'Загруженность ресурсов',
        url: '/construction/lndev-ui/construction-analytics/workload',
        icon: TrendingUp,
        description: 'Анализ загруженности команд'
    },
    {
        name: 'Риски проектов',
        url: '/construction/lndev-ui/construction-analytics/risks',
        icon: AlertTriangle,
        description: 'Мониторинг проектных рисков'
    },
];

export const constructionManagementItems = [
    {
        name: 'Календарь проектов',
        url: '/construction/lndev-ui/construction-planning/calendar',
        icon: Calendar,
        description: 'Планирование и сроки'
    },
    {
        name: 'Смета и расчеты',
        url: '/construction/lndev-ui/construction-planning/estimates',
        icon: Calculator,
        description: 'Бюджеты и расчеты'
    },
    {
        name: 'Объекты и локации',
        url: '/construction/lndev-ui/construction-planning/locations',
        icon: MapPin,
        description: 'География строительства'
    },
    {
        name: 'Логистика',
        url: '/construction/lndev-ui/construction-planning/logistics',
        icon: Truck,
        description: 'Снабжение и материалы'
    },
];

export const constructionSettingsItems = [
    {
        name: 'Настройки ССП',
        url: '/construction/lndev-ui/settings/construction',
        icon: Settings,
        description: 'Конфигурация системы'
    },
    {
        name: 'Отчеты',
        url: '/construction/lndev-ui/settings/reports',
        icon: FileText,
        description: 'Настройка отчетности'
    },
    {
        name: 'Администрирование',
        url: '/lndev-ui/settings/admin',
        icon: Shield,
        description: 'Роли и разрешения'
    },
]; 