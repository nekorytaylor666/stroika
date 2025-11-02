"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { FileText } from "lucide-react";

interface TemplateSelectorProps {
	onSelect: (template: any) => void;
	selectedTemplateId?: string | null;
}

export function TemplateSelector({
	onSelect,
	selectedTemplateId,
}: TemplateSelectorProps) {
	const templates = useQuery(api.taskTemplates.getAll);

	if (!templates || templates.length === 0) {
		return null;
	}

	// Sort templates by usage count
	const sortedTemplates = [...templates].sort((a: any, b: any) => b.usageCount - a.usageCount);

	return (
		<div className="flex items-center gap-2">
			<FileText className="h-3.5 w-3.5 text-muted-foreground" />

			<Select
				value={selectedTemplateId || "none"}
				onValueChange={(value) => {
					if (value === "none") {
						onSelect(null);
					} else {
						const template = templates.find((t: any) => t._id === value);
						if (template) {
							onSelect(template);
						}
					}
				}}
			>
				<SelectTrigger className="h-7 w-[140px] text-xs">
					<SelectValue placeholder="Шаблон" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none" className="text-xs">
						Без шаблона
					</SelectItem>
					{sortedTemplates.map((template: any) => (
						<SelectItem
							key={template._id}
							value={template._id}
							className="text-xs"
						>
							{template.name}
							{template.subtasksParsed?.length > 0 && (
								<span className="ml-1 text-muted-foreground">
									({template.subtasksParsed.length})
								</span>
							)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}