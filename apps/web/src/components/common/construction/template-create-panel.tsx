"use client";

import { TemplateCreateForm } from "@/components/common/construction/template-create-form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { Id } from "@stroika/backend";
import { Plus, FileText } from "lucide-react";
import { useState } from "react";

interface TemplateCreatePanelProps {
	template?: any; // For editing existing template
	trigger?: React.ReactNode;
	onSuccess?: (templateId: Id<"taskTemplates">) => void;
}

export function TemplateCreatePanel({
	template,
	trigger,
	onSuccess,
}: TemplateCreatePanelProps) {
	const [open, setOpen] = useState(false);

	const handleSuccess = (templateId: Id<"taskTemplates">) => {
		setOpen(false);
		if (onSuccess) {
			onSuccess(templateId);
		}
	};

	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						{template ? "Редактировать шаблон" : "Создать шаблон"}
					</Button>
				)}
			</SheetTrigger>
			<SheetContent className="w-[700px] sm:max-w-[700px] p-0">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle>
						{template ? "Редактировать шаблон" : "Создать новый шаблон"}
					</SheetTitle>
					<SheetDescription>
						{template
							? "Внесите изменения в существующий шаблон задачи"
							: "Создайте шаблон для быстрого создания типовых задач с подзадачами"}
					</SheetDescription>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-120px)] px-6 pb-6">
					<TemplateCreateForm
						template={template}
						onSuccess={handleSuccess}
						onCancel={handleCancel}
						showHeader={false}
						embedded={true}
						className="mt-6"
					/>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

// Example usage in a page or component
export function TemplateCreateInline({
	template,
	onSuccess,
}: {
	template?: any;
	onSuccess?: (templateId: Id<"taskTemplates">) => void;
}) {
	return (
		<div className="w-full">
			<div className="flex items-center gap-2 mb-4">
				<FileText className="h-5 w-5" />
				<h2 className="text-lg font-semibold">
					{template ? "Редактировать шаблон" : "Создать шаблон задачи"}
				</h2>
			</div>
			<TemplateCreateForm
				template={template}
				onSuccess={onSuccess}
				showHeader={false}
				embedded={false}
			/>
		</div>
	);
}

// Example usage in a modal replacement
export function TemplateCreatePage({
	template,
	onSuccess,
	onCancel,
}: {
	template?: any;
	onSuccess?: (templateId: Id<"taskTemplates">) => void;
	onCancel?: () => void;
}) {
	return (
		<div className="container max-w-4xl mx-auto py-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">
					{template ? "Редактировать шаблон" : "Новый шаблон задачи"}
				</h1>
				<p className="text-muted-foreground mt-1">
					{template
						? "Обновите информацию о шаблоне и его подзадачах"
						: "Создайте переиспользуемый шаблон для типовых задач"}
				</p>
			</div>
			<TemplateCreateForm
				template={template}
				onSuccess={onSuccess}
				onCancel={onCancel}
				showHeader={false}
				embedded={false}
			/>
		</div>
	);
}