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
import { type FC, useEffect, useId, useState } from "react";

// Map database icon names to components
const IconNameToComponent = {
	circle: Circle,
	timer: Clock,
	"alert-circle": AlertCircle,
	"check-circle": CheckCircle,
	"x-circle": XCircle,
	// Construction-specific icons
	BacklogIcon: BacklogIcon,
	PausedIcon: PausedIcon,
	ToDoIcon: ToDoIcon,
	InProgressIcon: InProgressIcon,
	TechnicalReviewIcon: TechnicalReviewIcon,
	CompletedIcon: CompletedIcon,
};

const StatusIcon: FC<{ iconName: string; color?: string }> = ({
	iconName,
	color,
}) => {
	const IconComponent =
		IconNameToComponent[iconName as keyof typeof IconNameToComponent] || Circle;
	return (
		<IconComponent
			style={color ? { color } : undefined}
			className="h-3.5 w-3.5"
		/>
	);
};

interface ConstructionStatusSelectorProps {
	status: any | null;
	onChange: (status: any | null) => void;
}

export function ConstructionStatusSelector({
	status,
	onChange,
}: ConstructionStatusSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string | null>(status?._id || null);

	const { statuses } = useConstructionData();

	useEffect(() => {
		setValue(status?._id || null);
	}, [status]);

	const handleStatusChange = (statusId: string) => {
		setValue(statusId);
		const newStatus = statuses?.find((s) => s._id === statusId);
		if (newStatus) {
			onChange(newStatus);
		}
		setOpen(false);
	};

	return (
		<div className="*:not-first:mt-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className="flex items-center gap-2"
						size="xs"
						variant="secondary"
						role="combobox"
						aria-expanded={open}
					>
						{status && (
							<StatusIcon iconName={status.iconName} color={status.color} />
						)}
						<span>{status?.name || "Выберите статус"}</span>
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
								{statuses?.map((statusItem) => (
									<CommandItem
										key={statusItem._id}
										value={statusItem._id}
										onSelect={() => handleStatusChange(statusItem._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<StatusIcon
												iconName={statusItem.iconName}
												color={statusItem.color}
											/>
											{statusItem.name}
										</div>
										{value === statusItem._id && (
											<CheckIcon size={16} className="ml-auto" />
										)}
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
