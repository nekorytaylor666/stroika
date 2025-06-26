"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Target,
  Users,
  Tag,
  Plus,
  CircleDot,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  User,
  MapPin,
  Building2,
  DollarSign
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";

interface ConstructionProjectOverviewProps {
  projectId: Id<"constructionProjects">;
}

const statusStyles = {
  "В работе": {
    icon: CircleDot,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    borderColor: "border-yellow-200"
  },
  "Завершено": {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100",
    borderColor: "border-green-200"
  },
  "Не начато": {
    icon: Circle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    borderColor: "border-gray-200"
  },
  "Приостановлено": {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-100",
    borderColor: "border-blue-200"
  }
};

const priorityStyles = {
  "Низкий": "bg-gray-100 text-gray-700",
  "Средний": "bg-blue-100 text-blue-700",
  "Высокий": "bg-orange-100 text-orange-700",
  "Срочный": "bg-red-100 text-red-700"
};

const projectTypeTranslations = {
  residential: "Жилое",
  commercial: "Коммерческое",
  industrial: "Промышленное",
  infrastructure: "Инфраструктура"
};

export function ConstructionProjectOverview({ projectId }: ConstructionProjectOverviewProps) {
  const projectData = useQuery(api.constructionProjects.getProjectWithTasks, { id: projectId });

  if (!projectData) {
    return <ProjectOverviewSkeleton />;
  }

  const { taskStats } = projectData;
  const progressPercentage = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;
  const targetDate = projectData.targetDate ? new Date(projectData.targetDate) : new Date();
  const daysUntilTarget = differenceInDays(targetDate, new Date());

  const StatusIcon = statusStyles[projectData.status?.name as keyof typeof statusStyles]?.icon || Circle;

  // Data for pie chart
  const pieData = [
    { name: "Завершено", value: taskStats.completed, color: "hsl(142, 76%, 36%)" },
    { name: "В работе", value: taskStats.inProgress, color: "hsl(45, 93%, 47%)" },
    { name: "Не начато", value: taskStats.notStarted, color: "hsl(var(--muted))" }
  ];

  // Generate progress data from monthly revenue
  const progressChartData = generateProgressDataFromRevenue(projectData.monthlyRevenue || []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{projectData.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{projectData.client}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{projectData.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatCurrency(projectData.contractValue)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-4 text-sm">
              {projectData.status && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md",
                  statusStyles[projectData.status.name as keyof typeof statusStyles]?.bg,
                  statusStyles[projectData.status.name as keyof typeof statusStyles]?.borderColor,
                  "border"
                )}>
                  <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[projectData.status.name as keyof typeof statusStyles]?.color)} />
                  <span className={statusStyles[projectData.status.name as keyof typeof statusStyles]?.color}>{projectData.status.name}</span>
                </div>
              )}

              {projectData.priority && (
                <Badge className={cn("border-0", priorityStyles[projectData.priority.name as keyof typeof priorityStyles])}>
                  {projectData.priority.name} приоритет
                </Badge>
              )}

              {projectData.lead && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Руководитель</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(new Date(projectData.startDate), "d MMM", { locale: ru })} → {projectData.targetDate ? format(new Date(projectData.targetDate), "d MMM yyyy", { locale: ru }) : "Не определено"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Целевая дата
                </span>
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Progress Section */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <h2 className="text-base font-medium mb-4">Прогресс</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Cards */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 border-muted">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-muted" />
                        <span className="text-xs text-muted-foreground">Всего</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold">{taskStats.total}</p>
                        <p className="text-xs text-muted-foreground">Всего задач</p>
                      </div>
                    </Card>

                    <Card className="p-4 border-yellow-200 bg-yellow-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-xs text-muted-foreground">В работе</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold">{taskStats.inProgress}</p>
                          <span className="text-xs text-muted-foreground">• {taskStats.total > 0 ? Math.round((taskStats.inProgress / taskStats.total) * 100) : 0}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Выполняется</p>
                      </div>
                    </Card>

                    <Card className="p-4 border-green-200 bg-green-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Завершено</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold">{taskStats.completed}</p>
                          <span className="text-xs text-muted-foreground">• {Math.round(progressPercentage)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Готово</p>
                      </div>
                    </Card>
                  </div>

                  {/* Pie Chart */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-4">Распределение задач</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `${value} задач`}
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      {pieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.name} ({item.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Revenue Chart */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Финансовый прогресс</h3>
                    <span className="text-xs text-muted-foreground">
                      {daysUntilTarget > 0 ? `${daysUntilTarget} дней осталось` : "Просрочено"}
                    </span>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="month"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="planned" fill="hsl(var(--primary))" opacity={0.5} />
                        <Bar dataKey="actual" fill="hsl(142, 76%, 36%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Recent Tasks */}
            {projectData.tasks && projectData.tasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium">Последние задачи</h2>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Добавить задачу
                  </Button>
                </div>

                <Card className="p-4">
                  <div className="space-y-3">
                    {projectData.tasks.slice(0, 5).map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded flex items-center justify-center text-xs font-medium",
                            task.priority?.name === "Срочный" ? "bg-red-100 text-red-700" :
                              task.priority?.name === "Высокий" ? "bg-orange-100 text-orange-700" :
                                task.priority?.name === "Средний" ? "bg-blue-100 text-blue-700" :
                                  "bg-gray-100 text-gray-700"
                          )}>
                            {task.identifier}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {task.assignee && (
                                <span>{task.assignee.name}</span>
                              )}
                              {task.dueDate && (
                                <span>• {format(new Date(task.dueDate), "d MMM", { locale: ru })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.status?.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-muted/10 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">Свойства</h3>
          <div className="space-y-4">
            {/* Status */}
            {projectData.status && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Статус</p>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
                  statusStyles[projectData.status.name as keyof typeof statusStyles]?.bg,
                  statusStyles[projectData.status.name as keyof typeof statusStyles]?.borderColor,
                  "border"
                )}>
                  <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[projectData.status.name as keyof typeof statusStyles]?.color)} />
                  <span className={statusStyles[projectData.status.name as keyof typeof statusStyles]?.color}>{projectData.status.name}</span>
                </div>
              </div>
            )}

            {/* Priority */}
            {projectData.priority && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Приоритет</p>
                <Badge className={cn("border-0", priorityStyles[projectData.priority.name as keyof typeof priorityStyles])}>
                  {projectData.priority.name} приоритет
                </Badge>
              </div>
            )}

            {/* Lead */}
            {projectData.lead && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Руководитель</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={projectData.lead.avatarUrl} />
                    <AvatarFallback>{projectData.lead.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{projectData.lead.name}</span>
                </div>
              </div>
            )}

            {/* Members */}
            {projectData.teamMembers && projectData.teamMembers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Участники</p>
                <div className="flex -space-x-2">
                  {projectData.teamMembers.slice(0, 5).map((member) => (
                    <Avatar key={member._id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {projectData.teamMembers.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{projectData.teamMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Даты</p>
              <div className="flex items-center gap-1 text-sm">
                <span>{format(new Date(projectData.startDate), "d MMM", { locale: ru })}</span>
                <span className="text-muted-foreground">→</span>
                <span>{projectData.targetDate ? format(new Date(projectData.targetDate), "d MMM yyyy", { locale: ru }) : "Не определено"}</span>
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Тип проекта</p>
              <Badge variant="secondary" className="font-normal">
                {projectTypeTranslations[projectData.projectType]}
              </Badge>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Местоположение</p>
              <p className="text-sm">{projectData.location}</p>
            </div>

            {/* Contract Value */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Стоимость контракта</p>
              <p className="text-sm font-medium">{formatCurrency(projectData.contractValue)}</p>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Прогресс</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Выполнено</span>
                  <span className="font-medium">{projectData.percentComplete}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${projectData.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            {projectData.notes && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Заметки</p>
                <p className="text-sm text-muted-foreground">{projectData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate progress data from monthly revenue
function generateProgressDataFromRevenue(monthlyRevenue: Array<{ month: string; planned: number; actual: number }>) {
  if (!monthlyRevenue || monthlyRevenue.length === 0) {
    // Generate sample data if no revenue data
    return [
      { month: "Янв", planned: 5000000, actual: 4500000 },
      { month: "Фев", planned: 8000000, actual: 7200000 },
      { month: "Мар", planned: 10000000, actual: 9500000 },
      { month: "Апр", planned: 12000000, actual: 0 },
      { month: "Май", planned: 15000000, actual: 0 },
    ];
  }

  return monthlyRevenue.map(item => ({
    month: item.month,
    planned: item.planned,
    actual: item.actual
  }));
}

// Skeleton loader
function ProjectOverviewSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
      <div className="w-80 border-l p-6">
        <Skeleton className="h-full" />
      </div>
    </div>
  );
}