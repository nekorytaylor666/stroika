"use client";

import { ConstructionAssigneeUser } from "@/components/common/construction/construction-assignee-user";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, File, ListTree, Plus, User, X } from "lucide-react";
import { useState } from "react";
import { AttachmentUpload, type UploadedAttachment } from "./attachment-upload";

export interface SubtaskData {
	title: string;
	assigneeId?: Id<"user"> | null;
	dueDate?: string | null;
	attachments?: UploadedAttachment[];
}

interface SubtasksInputProps {
	subtasks: SubtaskData[];
	onChange: (subtasks: SubtaskData[]) => void;
}

export function SubtasksInput({ subtasks, onChange }: SubtasksInputProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [newSubtask, setNewSubtask] = useState("");
	const [selectedAssigneeId, setSelectedAssigneeId] =
		useState<Id<"user"> | null>(null);
	const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>();
	const [selectedAttachments, setSelectedAttachments] = useState<
		UploadedAttachment[]
	>([]);
	const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const { users } = useConstructionData();

	const handleAddSubtask = () => {
		if (newSubtask.trim()) {
			onChange([
				...subtasks,
				{
					title: newSubtask.trim(),
					assigneeId: selectedAssigneeId,
					dueDate: selectedDueDate?.toISOString().split("T")[0],
					attachments: selectedAttachments,
				},
			]);
			setNewSubtask("");
			setSelectedAssigneeId(null);
			setSelectedDueDate(undefined);
			setSelectedAttachments([]);
			setIsAdding(false);
		}
	};

	const handleRemoveSubtask = (index: number) => {
		onChange(subtasks.filter((_, i) => i !== index));
	};

	const getAssigneeName = (assigneeId: Id<"user"> | null | undefined) => {
		if (!assigneeId) return null;
		return users?.find((u) => u._id === assigneeId)?.name || null;
	};

	return (
		<div className="space-y-2 px-1">
			<div className="flex items-center gap-2">
				<ListTree className="h-4 w-4 text-muted-foreground" />
				<span className="text-muted-foreground text-sm">Подзадачи</span>
				{subtasks.length > 0 && (
					<span className="text-muted-foreground text-xs">
						({subtasks.length})
					</span>
				)}
			</div>

			{/* Existing subtasks */}
			{subtasks.length > 0 && (
				<div className="space-y-1 pl-6">
					{subtasks.map((subtask, index) => {
						const assignee = subtask.assigneeId
							? users?.find((u) => u._id === subtask.assigneeId)
							: null;
						return (
							<div
								key={index}
								className="group flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
							>
								<span className="flex-1 text-sm">{subtask.title}</span>
								<div className="flex items-center gap-2 text-muted-foreground text-xs">
									{assignee && (
										<div className="flex items-center gap-1">
											<ConstructionAssigneeUser user={assignee} />
											<span>{assignee.name}</span>
										</div>
									)}
									{subtask.dueDate && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>
												{format(new Date(subtask.dueDate), "d MMM", {
													locale: ru,
												})}
											</span>
										</div>
									)}
									{subtask.attachments && subtask.attachments.length > 0 && (
										<div className="flex items-center gap-1">
											<File className="h-3 w-3" />
											<span>{subtask.attachments.length}</span>
										</div>
									)}
								</div>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleRemoveSubtask(index)}
									className="h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						);
					})}
				</div>
			)}

			{/* Add new subtask */}
			{isAdding ? (
				<div className="space-y-2 pl-6">
					<Input
						value={newSubtask}
						onChange={(e) => setNewSubtask(e.target.value)}
						placeholder="Название подзадачи..."
						className="h-8"
						autoFocus
						onKeyDown={(e) => {
							if (e.key === "Enter" && newSubtask.trim()) {
								e.preventDefault();
								handleAddSubtask();
							} else if (e.key === "Escape") {
								setIsAdding(false);
								setNewSubtask("");
								setSelectedAssigneeId(null);
								setSelectedDueDate(undefined);
								setSelectedAttachments([]);
							}
						}}
					/>
					<div className="flex flex-wrap gap-2">
						<div className="flex flex-1 flex-wrap gap-2">
							{/* Assignee selector */}
							<Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 justify-start"
									>
										{selectedAssigneeId ? (
											<>
												<User className="mr-2 h-3 w-3" />
												{getAssigneeName(selectedAssigneeId) || "Не назначен"}
											</>
										) : (
											<>
												<User className="mr-2 h-3 w-3" />
												Назначить
											</>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-56 p-0" align="start">
									<div className="max-h-64 overflow-y-auto">
										{users?.map((user) => (
											<button
												key={user.id}
												className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
												onClick={() => {
													setSelectedAssigneeId(user.id as Id<"user">);
													setIsAssigneeOpen(false);
												}}
											>
												<ConstructionAssigneeUser user={user} />
												<span className="truncate">{user.name}</span>
											</button>
										))}
									</div>
								</PopoverContent>
							</Popover>

							{/* Date picker */}
							<Popover
								open={isDatePickerOpen}
								onOpenChange={setIsDatePickerOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 justify-start"
									>
										<Calendar className="mr-2 h-3 w-3" />
										{selectedDueDate
											? format(selectedDueDate, "d MMM", { locale: ru })
											: "Срок"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<CalendarComponent
										mode="single"
										selected={selectedDueDate}
										onSelect={setSelectedDueDate}
										locale={ru}
									/>
								</PopoverContent>
							</Popover>

							{/* File upload */}
							<AttachmentUpload
								onAttachmentsChange={setSelectedAttachments}
								className=""
							/>
						</div>

						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={handleAddSubtask}
								disabled={!newSubtask.trim()}
								className="h-8"
							>
								Добавить
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setIsAdding(false);
									setNewSubtask("");
									setSelectedAssigneeId(null);
									setSelectedDueDate(undefined);
									setSelectedAttachments([]);
								}}
								className="h-8"
							>
								Отмена
							</Button>
						</div>
					</div>

					{/* Show selected attachments */}
					{selectedAttachments.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{selectedAttachments.map((attachment, index) => (
								<div
									key={index}
									className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
								>
									<File className="h-3 w-3" />
									<span className="max-w-[150px] truncate">
										{attachment.fileName}
									</span>
									<button
										type="button"
										onClick={() => {
											setSelectedAttachments((prev) =>
												prev.filter((_, i) => i !== index),
											);
										}}
										className="ml-1 hover:text-destructive"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<div className="pl-6">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setIsAdding(true)}
						className="h-6 px-2"
					>
						<Plus className="mr-1 h-3 w-3" />
						Добавить подзадачу
					</Button>
				</div>
			)}
		</div>
	);
}
