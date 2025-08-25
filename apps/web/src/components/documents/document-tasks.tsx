"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	CheckCircle,
	Circle,
	Clock,
	Hash,
	Link2,
	Plus,
	Search,
	User,
	X,
	Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface DocumentTasksProps {
	documentId: Id<"documents">;
}

const relationshipTypes = [
	{
		value: "attachment",
		label: "Attachment",
		description: "Document is attached to this task",
	},
	{
		value: "reference",
		label: "Reference",
		description: "Document is referenced by this task",
	},
	{
		value: "deliverable",
		label: "Deliverable",
		description: "Document is a deliverable for this task",
	},
	{
		value: "requirement",
		label: "Requirement",
		description: "Document is a requirement for this task",
	},
];

const priorityIcons = {
	urgent: { icon: Zap, color: "text-red-600" },
	high: { icon: AlertCircle, color: "text-orange-600" },
	medium: { icon: Circle, color: "text-yellow-600" },
	low: { icon: Circle, color: "text-gray-400" },
};

const statusIcons = {
	todo: { icon: Circle, color: "text-gray-400" },
	"in-progress": { icon: Clock, color: "text-blue-600" },
	done: { icon: CheckCircle, color: "text-green-600" },
};

export function DocumentTasks({ documentId }: DocumentTasksProps) {
	const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTask, setSelectedTask] = useState<any>(null);
	const [relationshipType, setRelationshipType] =
		useState<string>("attachment");
	const [description, setDescription] = useState("");

	const documentTasks = useQuery(api.documentTasks.getDocumentTasks, {
		documentId,
	});
	const searchResults = useQuery(
		api.documentTasks.searchTasksToLink,
		searchQuery.length > 0
			? { search: searchQuery, excludeDocumentId: documentId }
			: "skip",
	);

	const linkToTask = useMutation(api.documentTasks.linkToTask);
	const unlinkFromTask = useMutation(api.documentTasks.unlinkFromTask);
	const updateRelationship = useMutation(api.documentTasks.updateRelationship);

	const handleLink = async () => {
		if (!selectedTask) return;

		await linkToTask({
			documentId,
			taskId: selectedTask._id,
			relationshipType: relationshipType as any,
			description: description || undefined,
		});

		setIsLinkModalOpen(false);
		setSelectedTask(null);
		setSearchQuery("");
		setRelationshipType("attachment");
		setDescription("");
	};

	const handleUnlink = async (taskId: Id<"issues">) => {
		await unlinkFromTask({ documentId, taskId });
	};

	const getStatusIcon = (status: any) => {
		const config =
			statusIcons[status?.name as keyof typeof statusIcons] || statusIcons.todo;
		const Icon = config.icon;
		return <Icon className={cn("h-4 w-4", config.color)} />;
	};

	const getPriorityIcon = (priority: any) => {
		const config =
			priorityIcons[priority?.name as keyof typeof priorityIcons] ||
			priorityIcons.low;
		const Icon = config.icon;
		return <Icon className={cn("h-4 w-4", config.color)} />;
	};

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Link2 className="h-5 w-5 text-gray-500" />
						<h3 className="font-medium">Linked Tasks</h3>
						{documentTasks && documentTasks.length > 0 && (
							<Badge variant="secondary" className="text-xs">
								{documentTasks.length}
							</Badge>
						)}
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsLinkModalOpen(true)}
					>
						<Plus className="mr-1 h-4 w-4" />
						Link Task
					</Button>
				</div>

				{!documentTasks || documentTasks.length === 0 ? (
					<div className="py-8 text-center text-gray-500">
						<Link2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p className="text-sm">Нет связанных задач</p>
						<Button
							size="sm"
							variant="outline"
							className="mt-2"
							onClick={() => setIsLinkModalOpen(true)}
						>
							Link a task
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						<AnimatePresence>
							{documentTasks.map((link) => (
								<motion.div
									key={link._id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									className="group rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
								>
									<div className="flex items-start gap-3">
										<div className="mt-0.5">
											{getStatusIcon(link.task.status)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-center gap-2">
												<h4 className="font-medium text-sm">
													<span className="text-gray-500">
														#{link.task.identifier}
													</span>{" "}
													{link.task.title}
												</h4>
												{getPriorityIcon(link.task.priority)}
											</div>

											<div className="mb-2 flex items-center gap-2">
												<Badge variant="outline" className="text-xs">
													{
														relationshipTypes.find(
															(t) => t.value === link.relationshipType,
														)?.label
													}
												</Badge>
												{link.description && (
													<span className="text-gray-500 text-xs">
														{link.description}
													</span>
												)}
											</div>

											<div className="flex items-center gap-4 text-gray-500 text-xs">
												{link.task.assignee && (
													<div className="flex items-center gap-1">
														<Avatar className="h-4 w-4">
															<AvatarImage src={link.task.assignee.avatarUrl} />
															<AvatarFallback className="text-xs">
																{link.task.assignee.name.charAt(0)}
															</AvatarFallback>
														</Avatar>
														<span>{link.task.assignee.name}</span>
													</div>
												)}
												{link.task.labels.length > 0 && (
													<div className="flex items-center gap-1">
														{link.task.labels.slice(0, 2).map((label: any) => (
															<Badge
																key={label._id}
																variant="outline"
																className="h-5 px-1.5 text-xs"
																style={{
																	borderColor: label.color,
																	color: label.color,
																}}
															>
																{label.name}
															</Badge>
														))}
														{link.task.labels.length > 2 && (
															<span className="text-gray-500">
																+{link.task.labels.length - 2}
															</span>
														)}
													</div>
												)}
											</div>
										</div>

										<button
											onClick={() => handleUnlink(link.taskId)}
											className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-700"
										>
											<X className="h-4 w-4 text-gray-500" />
										</button>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>

			<Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Link Task to Document</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="search" className="mb-2">
								Search for task
							</Label>
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
								<Input
									id="search"
									placeholder="Search by ID or title..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						{searchResults && searchResults.length > 0 && (
							<div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
								{searchResults.map((task) => (
									<button
										key={task._id}
										onClick={() => setSelectedTask(task)}
										className={cn(
											"w-full rounded-lg p-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
											selectedTask?._id === task._id &&
												"bg-blue-50 dark:bg-blue-950",
										)}
									>
										<div className="flex items-center gap-2">
											{getStatusIcon(task.status)}
											<span className="text-sm">
												<span className="text-gray-500">
													#{task.identifier}
												</span>{" "}
												{task.title}
											</span>
										</div>
									</button>
								))}
							</div>
						)}

						{selectedTask && (
							<>
								<div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
									<div className="mb-1 flex items-center gap-2">
										{getStatusIcon(selectedTask.status)}
										<span className="font-medium text-sm">
											#{selectedTask.identifier} {selectedTask.title}
										</span>
									</div>
									{selectedTask.assignee && (
										<div className="flex items-center gap-1 text-gray-600 text-xs">
											<User className="h-3 w-3" />
											<span>{selectedTask.assignee.name}</span>
										</div>
									)}
								</div>

								<div>
									<Label htmlFor="relationship" className="mb-2">
										Relationship Type
									</Label>
									<Select
										value={relationshipType}
										onValueChange={setRelationshipType}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{relationshipTypes.map((type) => (
												<SelectItem key={type.value} value={type.value}>
													<div>
														<div className="font-medium">{type.label}</div>
														<div className="text-gray-500 text-xs">
															{type.description}
														</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="description" className="mb-2">
										Description (optional)
									</Label>
									<Textarea
										id="description"
										placeholder="Add any additional context..."
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={2}
									/>
								</div>
							</>
						)}

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => setIsLinkModalOpen(false)}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={handleLink}
								disabled={!selectedTask}
								className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
							>
								Link Task
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
