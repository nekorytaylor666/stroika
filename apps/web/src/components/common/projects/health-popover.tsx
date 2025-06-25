"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Project } from "@/mock-data/projects";
import {
	AlertCircle,
	Bell,
	CircleCheck,
	CircleX,
	HelpCircle,
} from "lucide-react";

interface HealthPopoverProps {
	project: Project;
}

export function HealthPopover({ project }: HealthPopoverProps) {
	const getHealthIcon = (healthId: string) => {
		switch (healthId) {
			case "on-track":
				return <CircleCheck className="size-4 text-green-500" />;
			case "off-track":
				return <CircleX className="size-4 text-red-500" />;
			case "at-risk":
				return <AlertCircle className="size-4 text-amber-500" />;
			case "no-update":
			default:
				return <HelpCircle className="size-4 text-muted-foreground" />;
		}
	};

	const isMobile = useIsMobile();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className="flex h-7 items-center justify-center gap-1 px-2"
					size="sm"
					variant="ghost"
				>
					{getHealthIcon(project.health.id)}
					<span className="mt-[1px] ml-0.5 hidden text-xs xl:inline">
						{project.health.name}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side={isMobile ? "bottom" : "left"}
				className={cn("w-[480px] p-0", isMobile ? "w-full" : "")}
			>
				<div className="flex items-center justify-between border-b p-3">
					<div className="flex items-center gap-2">
						{project.icon && (
							<project.icon className="size-4 shrink-0 text-muted-foreground" />
						)}
						<h4 className="font-medium text-sm">{project.name}</h4>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
							Subscribe
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="flex h-7 items-center gap-1 px-2 text-xs"
						>
							<Bell className="size-3" />
							New update
						</Button>
					</div>
				</div>
				<div className="space-y-3 p-3">
					<div className="flex items-center justify-start gap-3">
						<div className="flex items-center gap-2">
							{getHealthIcon(project.health.id)}
							<span className="text-sm">{project.health.name}</span>
						</div>
						<div className="flex items-center gap-2">
							<Avatar className="size-5">
								<AvatarImage
									src={project.lead.avatarUrl}
									alt={project.lead.name}
								/>
								<AvatarFallback>{project.lead.name.charAt(0)}</AvatarFallback>
							</Avatar>
							<span className="text-muted-foreground text-xs">
								{project.lead.name}
							</span>
							<span className="text-muted-foreground text-xs">·</span>
							<span className="text-muted-foreground text-xs">
								{new Date(project.startDate).toLocaleDateString()}
							</span>
						</div>
					</div>

					<div>
						<p className="text-muted-foreground text-sm">
							{project.health.description}
						</p>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
