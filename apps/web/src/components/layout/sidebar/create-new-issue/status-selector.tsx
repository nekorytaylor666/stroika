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
import { CheckIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface StatusSelectorProps {
	status: any | null;
	onChange: (status: any | null) => void;
}

export function StatusSelector({ status, onChange }: StatusSelectorProps) {
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
							<div
								className="size-3 rounded-full border"
								style={{
									backgroundColor: status.color,
									borderColor: status.color,
								}}
							/>
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
											<div
												className="size-3 rounded-full border"
												style={{
													backgroundColor: statusItem.color,
													borderColor: statusItem.color,
												}}
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
