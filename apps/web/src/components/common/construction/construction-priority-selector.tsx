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
import {
	AlertTriangle,
	CheckIcon,
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
}

interface ConstructionPrioritySelectorProps {
	priority: PriorityType;
	issueId: string;
}

// Priority icon mapping
const PriorityIconMap = {
	"alert-triangle": AlertTriangle,
	"chevron-up": ChevronUp,
	minus: Minus,
	"chevron-down": ChevronDown,
};

const PriorityIcon = ({ iconName }: { iconName: string }) => {
	const IconComponent =
		PriorityIconMap[iconName as keyof typeof PriorityIconMap] || Minus;
	return <IconComponent className="h-3.5 w-3.5" />;
};

export function ConstructionPrioritySelector({
	priority,
	issueId,
}: ConstructionPrioritySelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);

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
							<PriorityIcon iconName={priority.iconName} />
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
								<CommandItem className="text-muted-foreground">
									Изменение приоритета в разработке
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
