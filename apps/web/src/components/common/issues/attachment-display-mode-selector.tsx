"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useViewStore } from "@/store/view-store";
import { Grid3X3, LayoutGrid, List } from "lucide-react";

const displayModes = [
	{ value: "grid", label: "Сетка", icon: Grid3X3 },
	{ value: "list", label: "Список", icon: List },
] as const;

export default function AttachmentDisplayModeSelector() {
	const { attachmentDisplayMode, setAttachmentDisplayMode } = useViewStore();

	const currentMode = displayModes.find(
		(mode) => mode.value === attachmentDisplayMode,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="h-9 px-3">
					{currentMode ? (
						<currentMode.icon className="h-4 w-4" />
					) : (
						<LayoutGrid className="h-4 w-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				{displayModes.map((mode) => (
					<DropdownMenuItem
						key={mode.value}
						onClick={() => setAttachmentDisplayMode(mode.value)}
						className={cn(
							"cursor-pointer",
							attachmentDisplayMode === mode.value && "bg-muted",
						)}
					>
						<mode.icon className="mr-2 h-4 w-4" />
						{mode.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
