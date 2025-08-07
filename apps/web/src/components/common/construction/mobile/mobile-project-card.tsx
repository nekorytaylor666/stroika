"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Building,
  Calendar,
  ChevronRight,
  DollarSign,
  Users,
} from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import type { FC } from "react";

interface MobileProjectCardProps {
  project: {
    _id: string;
    name: string;
    customer?: string;
    manager?: {
      _id: string;
      name: string;
    };
    completionPercentage?: number;
    revenue?: number;
    priority?: {
      _id: string;
      name: string;
      color: string;
    };
    status?: {
      _id: string;
      name: string;
      color: string;
    };
    startDate?: string;
    endDate?: string;
    teams?: Array<any>;
  };
}

export const MobileProjectCard: FC<MobileProjectCardProps> = ({ project }) => {
  const params = useParams({ from: "/construction/$orgId" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Link
      to={`/construction/${params.orgId}/projects/${project._id}/overview`}
      className="block"
    >
      <div className="border-b bg-background px-4 py-4 active:bg-accent/50 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2 mb-1">
              {project.name}
            </h3>
            {project.customer && (
              <p className="text-sm text-muted-foreground">{project.customer}</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Выполнено</span>
            <span className="text-xs font-medium">
              {project.completionPercentage || 0}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${project.completionPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue */}
          {project.revenue !== undefined && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatCurrency(project.revenue)}
              </span>
            </div>
          )}

          {/* Teams */}
          {project.teams && project.teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.teams.length} команд</span>
            </div>
          )}

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-2 col-span-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {project.startDate &&
                  format(new Date(project.startDate), "d MMM", { locale: ru })}
                {project.startDate && project.endDate && " - "}
                {project.endDate &&
                  format(new Date(project.endDate), "d MMM yyyy", { locale: ru })}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        {project.status && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${project.status.color}15`,
              color: project.status.color,
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: project.status.color }}
            />
            {project.status.name}
          </div>
        )}
      </div>
    </Link>
  );
};