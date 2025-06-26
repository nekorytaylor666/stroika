"use client";

import { useQuery } from "convex/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
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
  DollarSign,
  Loader2
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
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
  "Критический": "bg-red-100 text-red-700"
};

const projectTypeLabels = {
  residential: "Жилое",
  commercial: "Коммерческое",
  industrial: "Промышленное",
  infrastructure: "Инфраструктура"
};

export function ConstructionProjectOverview({ projectId }: ConstructionProjectOverviewProps) {
  const project = useQuery(api.constructionProjects.getProjectWithTasks, { id: projectId });

  if (!project) {
    return <ProjectSkeleton />;
  }

  const { taskStats } = project;
  const progressPercentage = project.percentComplete;
  const daysUntilTarget = project.targetDate
    ? differenceInDays(parseISO(project.targetDate), new Date())
    : null;

  const StatusIcon = project.status?.name ? statusStyles[project.status.name as keyof typeof statusStyles]?.icon || Circle : Circle;

  // Data for pie chart
  const pieData = [
    { name: "Завершено", value: taskStats.completed, color: "hsl(142, 76%, 36%)" },
    { name: "В работе", value: taskStats.inProgress, color: "hsl(45, 93%, 47%)" },
    { name: "Не начато", value: taskStats.notStarted, color: "hsl(var(--muted))" }
  ];

  // Monthly revenue data for chart
  const revenueChartData = project.monthlyRevenue
    ?.sort((a, b) => a.month.localeCompare(b.month))
    .map(rev => ({
      month: format(parseISO(rev.month + "-01"), "MMM", { locale: ru }),
      planned: rev.planned,
      actual: rev.actual
    })) || [];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <p className="text-muted-foreground">Клиент: {project.client}</p>
                {project.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{project.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-4 text-sm">
              {project.status && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md",
                  statusStyles[project.status.name as keyof typeof statusStyles]?.bg || "bg-gray-100",
                  statusStyles[project.status.name as keyof typeof statusStyles]?.borderColor || "border-gray-200",
                  "border"
                )}>
                  <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[project.status.name as keyof typeof statusStyles]?.color || "text-gray-600")} />
                  <span className={statusStyles[project.status.name as keyof typeof statusStyles]?.color || "text-gray-600"}>
                    {project.status.name}
                  </span>
                </div>
              )}

              {project.priority && (
                <Badge className={cn("border-0", priorityStyles[project.priority.name as keyof typeof priorityStyles] || "bg-gray-100")}>
                  {project.priority.name} приоритет
                </Badge>
              )}

              {project.lead && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{project.lead.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(parseISO(project.startDate), "d MMM", { locale: ru })} → {
                    project.targetDate
                      ? format(parseISO(project.targetDate), "d MMM yyyy", { locale: ru })
                      : "Не определено"
                  }
                </span>
              </div>

              {daysUntilTarget !== null && (
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {daysUntilTarget > 0 ? `${daysUntilTarget} дней до завершения` : "Просрочено"}
                  </span>
                </div>
              )}
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
              <h2 className="text-base font-medium mb-4">Прогресс проекта</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Cards */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 border-muted">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-muted" />
                        <span className="text-xs text-muted-foreground">Всего задач</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold">{taskStats.total}</p>
                        <p className="text-xs text-muted-foreground">В проекте</p>
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
                          <span className="text-xs text-muted-foreground">
                            • {taskStats.total > 0 ? Math.round((taskStats.inProgress / taskStats.total) * 100) : 0}%
                          </span>
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
                          <span className="text-xs text-muted-foreground">
                            • {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Готово</p>
                      </div>
                    </Card>
                  </div>

                  {/* Overall Progress */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Общий прогресс</h3>
                      <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </Card>

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
                {revenueChartData.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Выручка по месяцам</h3>
                      <span className="text-xs text-muted-foreground">
                        План vs Факт
                      </span>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                          <Bar dataKey="planned" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            {project.tasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium">Последние задачи</h2>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Добавить задачу
                  </Button>
                </div>

                <Card className="divide-y">
                  {project.tasks.slice(0, 5).map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          task.status?.name.includes("Завершено") ? "bg-green-100" : "bg-gray-100"
                        )}>
                          {task.status?.name.includes("Завершено") ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.identifier} • {task.assignee?.name || "Не назначено"}
                          </p>
                        </div>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(task.dueDate), "d MMM", { locale: ru })}
                        </span>
                      )}
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-muted/10 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">Свойства проекта</h3>
          <div className="space-y-4">
            {/* Contract Value */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Стоимость контракта</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatCurrency(project.contractValue)}</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Местоположение</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{project.location}</span>
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Тип проекта</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-normal">
                  {projectTypeLabels[project.projectType]}
                </Badge>
              </div>
            </div>

            {/* Status */}
            {project.status && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Статус</p>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
                  statusStyles[project.status.name as keyof typeof statusStyles]?.bg || "bg-gray-100",
                  statusStyles[project.status.name as keyof typeof statusStyles]?.borderColor || "border-gray-200",
                  "border"
                )}>
                  <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[project.status.name as keyof typeof statusStyles]?.color || "text-gray-600")} />
                  <span className={statusStyles[project.status.name as keyof typeof statusStyles]?.color || "text-gray-600"}>
                    {project.status.name}
                  </span>
                </div>
              </div>
            )}

            {/* Priority */}
            {project.priority && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Приоритет</p>
                <Badge className={cn("border-0", priorityStyles[project.priority.name as keyof typeof priorityStyles] || "bg-gray-100")}>
                  {project.priority.name}
                </Badge>
              </div>
            )}

            {/* Lead */}
            {project.lead && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Руководитель</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.lead.avatarUrl} />
                    <AvatarFallback>{project.lead.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{project.lead.name}</span>
                </div>
              </div>
            )}

            {/* Team Members */}
            {project.teamMembers && project.teamMembers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Команда</p>
                <div className="flex -space-x-2">
                  {project.teamMembers.slice(0, 5).map((member) => (
                    <Avatar key={member._id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.teamMembers.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{project.teamMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Сроки</p>
              <div className="flex items-center gap-1 text-sm">
                <span>{format(parseISO(project.startDate), "d MMM yyyy", { locale: ru })}</span>
                <span className="text-muted-foreground">→</span>
                <span>
                  {project.targetDate
                    ? format(parseISO(project.targetDate), "d MMM yyyy", { locale: ru })
                    : "Не определено"
                  }
                </span>
              </div>
            </div>

            {/* Health Status */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Состояние проекта</p>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.healthColor }}
                />
                <span className="text-sm">{project.healthName}</span>
              </div>
              {project.healthDescription && (
                <p className="text-xs text-muted-foreground mt-1">
                  {project.healthDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
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