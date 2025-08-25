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
import { useIssuesStore } from "@/store/issues-store";
import { CheckIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface StatusSelectorProps {
	status: Status;
	issueId: string;
}

export function StatusSelector({ status, issueId }: StatusSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string>(status.id);

	const { updateIssueStatus, filterByStatus } = useIssuesStore();

	useEffect(() => {
		setValue(status.id);
	}, [status.id]);

	const handleStatusChange = (statusId: string) => {
		setValue(statusId);
		setOpen(false);

		if (issueId) {
			const newStatus = statuses.find((s) => s.id === statusId);
			if (newStatus) {
				updateIssueStatus(issueId, newStatus);
			}
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
						{(() => {
							const selectedItem = statuses.find((item) => item.id === value);
							if (selectedItem) {
								const Icon = selectedItem.icon;
								return <Icon />;
							}
							return null;
						})()}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
					align="start"
				>
					<Command>
						<CommandInput placeholder="Установить статус..." />
						<CommandList>
							<CommandEmpty>Статус не найден.</CommandEmpty>
							<CommandGroup></CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
