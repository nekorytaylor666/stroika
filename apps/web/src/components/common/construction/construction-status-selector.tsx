"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
	BacklogIcon,
	CompletedIcon,
	InProgressIcon,
	PausedIcon,
	TechnicalReviewIcon,
	ToDoIcon,
} from "@/lib/status";
import {
	AlertCircle,
	CheckCircle,
	CheckIcon,
	Circle,
	Clock,
	XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { type FC, useEffect, useId, useState } from "react";
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

// Status icon mapping
const StatusIconMap: Record<string, any> = {
	BacklogIcon: BacklogIcon,
	PausedIcon: PausedIcon,
	ToDoIcon: ToDoIcon,
	InProgressIcon: InProgressIcon,
	TechnicalReviewIcon: TechnicalReviewIcon,
	CompletedIcon: CompletedIcon,
	// Database icon names
	Circle: Circle,
	Clock: Clock,
	AlertCircle: AlertCircle,
	CheckCircle: CheckCircle,
	XCircle: XCircle,
};

const StatusIcon: FC<{ iconName: string; color?: string }> = ({
	iconName,
	color,
}) => {
	const IconComponent =
		StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
	return (
		<IconComponent
			style={color ? { color } : undefined}
			className="h-3.5 w-3.5"
		/>
	);
};

interface ConstructionStatusSelectorProps {
	statusId?: string;
	issueId?: string;
	showLabel?: boolean;
	status?: any; // Alternative prop for direct status object
	onChange?: (status: any) => void | Promise<void>; // Alternative change handler
	size?: "default" | "xs"; // Size variant
}

export function ConstructionStatusSelector({
	statusId,
	issueId,
	showLabel = false,
	status,
	onChange,
	size = "default",
}: ConstructionStatusSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string>(statusId || status?._id || "");
	const { statuses, updateTaskStatus, tasks } = useConstructionData();
	const currentUser = useCurrentUser();

	useEffect(() => {
		setValue(statusId || status?._id || "");
	}, [statusId, status]);

	const handleStatusChange = async (newStatusId: string) => {
		setValue(newStatusId);
		setOpen(false);

		// Use custom onChange handler if provided
		if (onChange) {
			const newStatus = statuses?.find((s) => s._id === newStatusId);
			if (newStatus) {
				await onChange(newStatus);
			}
		} else if (issueId && newStatusId !== statusId && currentUser) {
			try {
				await updateTaskStatus({
					id: issueId as Id<"issues">,
					statusId: newStatusId as Id<"status">,
					userId: currentUser._id as Id<"users">,
				});
			} catch (error) {
				console.error("Failed to update status:", error);
				// Revert on error
				setValue(statusId || "");
			}
		}
	};

	const currentStatus = statuses?.find((s) => s._id === value);

	// Count tasks by status
	const getStatusCount = (statusId: string) => {
		return tasks?.filter((task) => task.statusId === statusId).length || 0;
	};

	return (
		<div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className={
							size === "xs"
								? "flex h-6 w-6 items-center justify-center p-0"
								: showLabel
									? "h-8 w-full justify-start px-2"
									: "flex size-7 items-center justify-center"
						}
						size={size === "xs" ? "icon" : showLabel ? "sm" : "icon"}
						variant="ghost"
						role="combobox"
						aria-expanded={open}
					>
						<motion.div
							key={value}
							initial={{ scale: 0.8, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ duration: 0.2 }}
							className={showLabel ? "" : ""}
						>
							{currentStatus && (
								<StatusIcon
									iconName={currentStatus.iconName}
									color={currentStatus.color}
								/>
							)}
						</motion.div>
						{showLabel && currentStatus && (
							<span className="ml-2 text-sm">{currentStatus.name}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
					align="start"
				>
					<Command>
						<CommandInput placeholder="Выберите статус..." />
						<CommandList>
							<CommandEmpty>Статус не найден.</CommandEmpty>
							<CommandGroup>
								{statuses?.map((item) => (
									<CommandItem
										key={item._id}
										value={item._id}
										onSelect={handleStatusChange}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<StatusIcon iconName={item.iconName} color={item.color} />
											{item.name}
										</div>
										{value === item._id && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getStatusCount(item._id)}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
