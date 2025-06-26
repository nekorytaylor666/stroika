"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
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
  User
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

interface ProjectOverviewProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: "In Progress" | "Completed" | "Not Started" | "On Hold";
    priority?: "Low" | "Medium" | "High" | "Urgent";
    lead?: {
      id: string;
      name: string;
      avatar?: string;
    };
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
    startDate: Date;
    targetDate: Date;
    team?: string;
    labels?: string[];
    stats: {
      scope: number; // Total tasks
      inProgress: number; // Tasks being worked on
      completed: number; // Completed tasks
    };
    progressData?: Array<{
      date: string;
      completed: number;
      scope: number;
    }>;
    milestones?: Array<{
      id: string;
      name: string;
      date: Date;
      completed: boolean;
    }>;
  };
}

const statusStyles = {
  "In Progress": {
    icon: CircleDot,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    borderColor: "border-yellow-200"
  },
  "Completed": {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100",
    borderColor: "border-green-200"
  },
  "Not Started": {
    icon: Circle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    borderColor: "border-gray-200"
  },
  "On Hold": {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-100",
    borderColor: "border-blue-200"
  }
};

const priorityStyles = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700"
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { stats } = project;
  const notStarted = stats.scope - stats.inProgress - stats.completed;
  const progressPercentage = stats.scope > 0 ? (stats.completed / stats.scope) * 100 : 0;
  const daysUntilTarget = differenceInDays(project.targetDate, new Date());
  
  const StatusIcon = statusStyles[project.status].icon;

  // Data for pie chart
  const pieData = [
    { name: "Completed", value: stats.completed, color: "hsl(142, 76%, 36%)" },
    { name: "In Progress", value: stats.inProgress, color: "hsl(45, 93%, 47%)" },
    { name: "Not Started", value: notStarted, color: "hsl(var(--muted))" }
  ];

  // Sample progress data if not provided
  const progressChartData = project.progressData || generateSampleProgressData(project.startDate, project.targetDate, stats);

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
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
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
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                statusStyles[project.status].bg,
                statusStyles[project.status].borderColor,
                "border"
              )}>
                <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[project.status].color)} />
                <span className={statusStyles[project.status].color}>{project.status}</span>
              </div>
              
              {project.priority && (
                <Badge className={cn("border-0", priorityStyles[project.priority])}>
                  {project.priority} priority
                </Badge>
              )}

              {project.lead && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Lead</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(project.startDate, "d MMM", { locale: ru })} → {format(project.targetDate, "d MMM yyyy", { locale: ru })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Target date
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
              <h2 className="text-base font-medium mb-4">Progress</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Cards */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 border-muted">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-muted" />
                        <span className="text-xs text-muted-foreground">Scope</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold">{stats.scope}</p>
                        <p className="text-xs text-muted-foreground">Total tasks</p>
                      </div>
                    </Card>

                    <Card className="p-4 border-yellow-200 bg-yellow-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-xs text-muted-foreground">Started</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold">{stats.inProgress}</p>
                          <span className="text-xs text-muted-foreground">• {stats.scope > 0 ? Math.round((stats.inProgress / stats.scope) * 100) : 0}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                      </div>
                    </Card>

                    <Card className="p-4 border-green-200 bg-green-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Completed</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-semibold">{stats.completed}</p>
                          <span className="text-xs text-muted-foreground">• {Math.round(progressPercentage)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                    </Card>
                  </div>

                  {/* Pie Chart */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-4">Task Distribution</h3>
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
                            formatter={(value: number) => `${value} tasks`}
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

                {/* Progress Chart */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Completion Timeline</h3>
                    <span className="text-xs text-muted-foreground">
                      {daysUntilTarget > 0 ? `${daysUntilTarget} days left` : "Overdue"}
                    </span>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progressChartData}>
                        <defs>
                          <linearGradient id="colorScope" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
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
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--background)', 
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="scope"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorScope)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="hsl(142, 76%, 36%)"
                          fillOpacity={1}
                          fill="url(#colorCompleted)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium">Milestones</h2>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add milestone
                  </Button>
                </div>
                
                <Card className="p-4">
                  <div className="space-y-3">
                    {project.milestones.map((milestone) => (
                      <div 
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            milestone.completed ? "bg-green-100" : "bg-gray-100"
                          )}>
                            {milestone.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(milestone.date, "d MMM yyyy", { locale: ru })}
                            </p>
                          </div>
                        </div>
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
          <h3 className="text-sm font-medium mb-4">Properties</h3>
          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
                statusStyles[project.status].bg,
                statusStyles[project.status].borderColor,
                "border"
              )}>
                <StatusIcon className={cn("h-3.5 w-3.5", statusStyles[project.status].color)} />
                <span className={statusStyles[project.status].color}>{project.status}</span>
              </div>
            </div>

            {/* Priority */}
            {project.priority && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Priority</p>
                <Badge className={cn("border-0", priorityStyles[project.priority])}>
                  {project.priority} priority
                </Badge>
              </div>
            )}

            {/* Lead */}
            {project.lead && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Lead</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.lead.avatar} />
                    <AvatarFallback>{project.lead.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{project.lead.name}</span>
                </div>
              </div>
            )}

            {/* Members */}
            {project.members && project.members.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Members</p>
                <div className="flex -space-x-2">
                  {project.members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.members.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      +{project.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Dates</p>
              <div className="flex items-center gap-1 text-sm">
                <span>{format(project.startDate, "d MMM", { locale: ru })}</span>
                <span className="text-muted-foreground">→</span>
                <span>{format(project.targetDate, "d MMM yyyy", { locale: ru })}</span>
              </div>
            </div>

            {/* Team */}
            {project.team && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Team</p>
                <Badge variant="secondary" className="font-normal">
                  {project.team}
                </Badge>
              </div>
            )}

            {/* Labels */}
            {project.labels && project.labels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {project.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate sample progress data
function generateSampleProgressData(startDate: Date, endDate: Date, stats: { scope: number; completed: number }) {
  const data = [];
  const totalDays = differenceInDays(endDate, startDate);
  const today = new Date();
  const daysElapsed = differenceInDays(today, startDate);
  
  for (let i = 0; i <= Math.min(daysElapsed, totalDays); i += Math.ceil(totalDays / 10)) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const progress = (i / daysElapsed) * stats.completed;
    
    data.push({
      date: format(date, "d MMM", { locale: ru }),
      completed: Math.round(progress),
      scope: stats.scope
    });
  }
  
  return data;
}