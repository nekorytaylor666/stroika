"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentsStore } from "@/store/documents-store";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Hash, X } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../../../../packages/backend/convex/_generated/api";

export function CreateDocumentModal() {
	const { isCreateModalOpen, setIsCreateModalOpen, selectedParentId } =
		useDocumentsStore();
	const create = useMutation(api.documents.create);
	const users = useQuery(api.users.list);

	const [title, setTitle] = useState("");
	const [assignedTo, setAssignedTo] = useState<string>("");
	const [dueDate, setDueDate] = useState<Date>();
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!title.trim()) return;

		setIsSubmitting(true);
		try {
			await create({
				title,
				parentId: selectedParentId as any,
				assignedTo: assignedTo as any,
				dueDate: dueDate?.toISOString(),
				tags,
			});

			setIsCreateModalOpen(false);
			resetForm();
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setTitle("");
		setAssignedTo("");
		setDueDate(undefined);
		setTags([]);
		setTagInput("");
	};

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput("");
		}
	};

	const handleRemoveTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	return (
		<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
			<DialogContent className="max-w-lg" hideCloseButton>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="p-6"
				>
					<div className="mb-6 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
								<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-semibold text-xl">New Document</h2>
						</div>
						<button
							onClick={() => setIsCreateModalOpen(false)}
							className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<X className="h-5 w-5 text-gray-500" />
						</button>
					</div>

					<div className="space-y-4">
						<div>
							<Label htmlFor="title" className="mb-2">
								Title
							</Label>
							<Input
								id="title"
								placeholder="Document title..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								autoFocus
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="assignee" className="mb-2">
									Assign to
								</Label>
								<Select value={assignedTo} onValueChange={setAssignedTo}>
									<SelectTrigger>
										<SelectValue placeholder="Select assignee" />
									</SelectTrigger>
									<SelectContent>
										{users?.map((user) => (
											<SelectItem key={user._id} value={user._id}>
												{user.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="dueDate" className="mb-2">
									Due date
								</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dueDate
												? format(dueDate, "PPP", { locale: ru })
												: "Select date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={setDueDate}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<div>
							<Label htmlFor="tags" className="mb-2">
								Tags
							</Label>
							<div className="mb-2 flex gap-2">
								<Input
									id="tags"
									placeholder="Add a tag..."
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddTag();
										}
									}}
								/>
								<Button type="button" variant="outline" onClick={handleAddTag}>
									<Hash className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								<AnimatePresence>
									{tags.map((tag) => (
										<motion.div
											key={tag}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
										>
											<Badge variant="secondary" className="py-1 pr-1 pl-2">
												{tag}
												<button
													onClick={() => handleRemoveTag(tag)}
													className="ml-1 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</div>
					</div>

					<div className="mt-6 flex gap-3">
						<Button
							variant="outline"
							onClick={() => setIsCreateModalOpen(false)}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!title.trim() || isSubmitting}
							className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
						>
							Create Document
						</Button>
					</div>
				</motion.div>
			</DialogContent>
		</Dialog>
	);
}
