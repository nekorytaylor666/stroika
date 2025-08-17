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
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import {
	AlertTriangle,
	Check,
	ChevronDown,
	ChevronUp,
	Minus,
} from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

interface PriorityType {
	_id: string;
	name: string;
	level: number;
	iconName: string;
	color?: string;
}

interface ConstructionPrioritySelectorProps {
	priority: PriorityType;
	issueId: string;
}

// Priority icon mapping
const PriorityIconMap: Record<string, any> = {
	"alert-triangle": AlertTriangle,
	"chevron-up": ChevronUp,
	minus: Minus,
	"chevron-down": ChevronDown,
	// PascalCase versions
	AlertTriangle: AlertTriangle,
	ArrowUp: ChevronUp,
	Minus: Minus,
	ArrowDown: ChevronDown,
};

const PriorityIcon = ({
	iconName,
	color,
}: { iconName: string; color?: string }) => {
	const IconComponent =
		PriorityIconMap[iconName] ||
		PriorityIconMap[iconName.toLowerCase()] ||
		Minus;
	return <IconComponent className="h-3.5 w-3.5" style={{ color }} />;
};

export function ConstructionPrioritySelector({
	priority,
	issueId,
}: ConstructionPrioritySelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const { priorities } = useConstructionData();
	const updatePriority = useMutation(api.constructionTasks.updatePriority);

	const handlePriorityChange = async (priorityId: string) => {
		try {
			await updatePriority({
				id: issueId as Id<"issues">,
				priorityId: priorityId as Id<"priorities">,
			});
			setOpen(false);
		} catch (error) {
			console.error("Failed to update priority:", error);
		}
	};

	return (
		<div className="*:not-first:mt-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className="flex size-7 items-center justify-center"
						size="icon"
						variant="ghost"
						role="combobox"
						aria-expanded={open}
					>
						<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
							<PriorityIcon
								iconName={priority.iconName}
								color={priority.color}
							/>
						</motion.div>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
					align="start"
				>
					<Command>
						<CommandInput placeholder="Выберите приоритет..." />
						<CommandList>
							<CommandEmpty>Приоритет не найден.</CommandEmpty>
							<CommandGroup>
								{priorities?.map((p) => (
									<CommandItem
										key={p._id}
										onSelect={() => handlePriorityChange(p._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<PriorityIcon iconName={p.iconName} color={p.color} />
											<span>{p.name}</span>
										</div>
										{priority._id === p._id && (
											<Check className="h-3.5 w-3.5" />
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
