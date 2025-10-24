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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConstructionData } from "@/hooks/use-construction-data";
import { CheckIcon, FolderIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface ProjectSelectorProps {
	project: any | undefined;
	onChange: (project: any | undefined) => void;
}

export function ProjectSelector({ project, onChange }: ProjectSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string | null>(project?._id || null);

	const { projects } = useConstructionData();

	useEffect(() => {
		setValue(project?._id || null);
	}, [project]);

	const handleProjectChange = (projectId: string) => {
		if (projectId === "none") {
			setValue(null);
			onChange(undefined);
		} else {
			setValue(projectId);
			const newProject = projects?.find((p) => p._id === projectId);
			if (newProject) {
				onChange(newProject);
			}
		}
		setOpen(false);
	};

	return (
		<div className="*:not-first:mt-2">
			<Popover modal={true} open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className="flex items-center gap-2"
						size="sm"
						variant="secondary"
						role="combobox"
						aria-expanded={open}
					>
						<FolderIcon className="size-4" />
						<span className="truncate">
							{project?.name || "Выберите проект"}
						</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-full min-w-[var(--radix-popper-anchor-width)] max-w-[300px] border-input p-0"
					align="start"
				>
					<Command>
						<CommandInput autoFocus={false} placeholder="Выберите проект..." />
						<CommandList className="max-h-[200px] overflow-y-auto">
							<CommandEmpty>Проект не найден.</CommandEmpty>
							<CommandGroup>
								<CommandItem
									value="none"
									onSelect={() => handleProjectChange("none")}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<FolderIcon className="size-4" />
										Без проекта
									</div>
									{value === null && (
										<CheckIcon size={16} className="ml-auto" />
									)}
								</CommandItem>
								{projects?.map((projectItem) => (
									<CommandItem
										key={projectItem._id}
										value={projectItem._id}
										onSelect={() => handleProjectChange(projectItem._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<FolderIcon className="size-4" />
											<div className="flex flex-col">
												<span>{projectItem.name}</span>
												<span className="text-muted-foreground text-xs">
													{projectItem.client}
												</span>
											</div>
										</div>
										{value === projectItem._id && (
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
