"use client";

import { TemplateCreateForm } from "@/components/common/construction/template-create-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Id } from "@stroika/backend";
import { Settings2 } from "lucide-react";

interface TemplateFormModalSimpleProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template?: any;
}

export function TemplateFormModalSimple({
	open,
	onOpenChange,
	template,
}: TemplateFormModalSimpleProps) {
	const handleSuccess = (_templateId: Id<"taskTemplates">) => {
		onOpenChange(false);
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="top-[30%] w-full max-h-[70vh] overflow-y-auto p-0 shadow-xl sm:max-w-[750px]">
				<DialogHeader>
					<DialogTitle>
						<div className="flex items-center gap-2 px-4 pt-4">
							<Button size="sm" variant="outline" className="gap-1.5">
								<Settings2 className="size-4" />
								<span className="font-medium">ШАБЛОНЫ</span>
							</Button>
							<span className="text-muted-foreground text-sm font-normal">
								{template ? "Редактировать" : "Создать новый"}
							</span>
						</div>
					</DialogTitle>
				</DialogHeader>

				<Separator className="mt-3" />

				<div className="px-4 pb-4">
					<TemplateCreateForm
						template={template}
						onSuccess={handleSuccess}
						onCancel={handleCancel}
						showHeader={false}
						embedded={true}
						className="mt-4"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}