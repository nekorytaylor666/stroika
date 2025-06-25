"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Check, FileText, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionDocumentSelectorProps {
	selectedDocuments: Array<{ _id: Id<"documents">; title: string }>;
	onChange: (documents: Array<{ _id: Id<"documents">; title: string }>) => void;
}

export function ConstructionDocumentSelector({
	selectedDocuments,
	onChange,
}: ConstructionDocumentSelectorProps) {
	const [open, setOpen] = useState(false);
	const documents = useQuery(api.documents.list, {});

	const toggleDocument = (document: {
		_id: Id<"documents">;
		title: string;
	}) => {
		const isSelected = selectedDocuments.some((d) => d._id === document._id);
		if (isSelected) {
			onChange(selectedDocuments.filter((d) => d._id !== document._id));
		} else {
			onChange([...selectedDocuments, document]);
		}
	};

	const removeDocument = (documentId: Id<"documents">) => {
		onChange(selectedDocuments.filter((d) => d._id !== documentId));
	};

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-start text-left"
					>
						<FileText className="mr-2 h-4 w-4" />
						{selectedDocuments.length > 0
							? `${selectedDocuments.length} документ(ов) выбрано`
							: "Выберите документы"}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command>
						<CommandInput placeholder="Поиск документов..." />
						<CommandEmpty>Документы не найдены</CommandEmpty>
						<CommandGroup className="max-h-64 overflow-auto">
							{documents?.map((document) => {
								const isSelected = selectedDocuments.some(
									(d) => d._id === document._id,
								);
								return (
									<CommandItem
										key={document._id}
										onSelect={() => toggleDocument(document)}
										className="cursor-pointer"
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												isSelected ? "opacity-100" : "opacity-0",
											)}
										/>
										<FileText className="mr-2 h-4 w-4 text-muted-foreground" />
										<span className="flex-1 truncate">{document.title}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>

			{selectedDocuments.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedDocuments.map((document) => (
						<Badge
							key={document._id}
							variant="secondary"
							className="py-1 pr-1 pl-2"
						>
							<FileText className="mr-1 h-3 w-3" />
							<span className="max-w-[150px] truncate text-xs">
								{document.title}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="ml-1 h-4 w-4 hover:bg-transparent"
								onClick={() => removeDocument(document._id)}
							>
								<X className="h-3 w-3" />
							</Button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
