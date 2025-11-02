"use client";

import { ConstructionCreateTaskForm } from "@/components/common/construction/construction-create-task-form";
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface ConstructionCreateTaskPanelProps {
	defaultProjectId?: Id<"constructionProjects">;
	trigger?: React.ReactNode;
}

export function ConstructionCreateTaskPanel({
	defaultProjectId,
	trigger,
}: ConstructionCreateTaskPanelProps) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	const handleSuccess = (taskId: Id<"issues">) => {
		setOpen(false);
		// Optionally navigate to the created task
		// navigate({ to: `/construction/task/${taskId}` });
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
						Создать задачу
					</Button>
				)}
			</SheetTrigger>
			<SheetContent className="w-[600px] sm:max-w-[600px] p-0">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle>Создать новую задачу</SheetTitle>
					<SheetDescription>
						Создайте новую задачу с помощью шаблона или заполните форму вручную
					</SheetDescription>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-120px)] px-6 pb-6">
					<ConstructionCreateTaskForm
						defaultProjectId={defaultProjectId}
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

// Example usage in a sidebar or inline form
export function ConstructionCreateTaskInline({
	defaultProjectId,
	onSuccess,
}: {
	defaultProjectId?: Id<"constructionProjects">;
	onSuccess?: (taskId: Id<"issues">) => void;
}) {
	return (
		<div className="w-full">
			<h2 className="text-lg font-semibold mb-4">Быстрое создание задачи</h2>
			<ConstructionCreateTaskForm
				defaultProjectId={defaultProjectId}
				onSuccess={onSuccess}
				showHeader={false}
				embedded={false}
			/>
		</div>
	);
}