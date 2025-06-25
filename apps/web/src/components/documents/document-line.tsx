"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDocumentsStore } from "@/store/documents-store";
import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	ChevronRight,
	Clock,
	Copy,
	Edit3,
	FileText,
	FolderOpen,
	MoreHorizontal,
	Trash2,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface DocumentLineProps {
	document: any;
}

const statusConfig = {
	draft: {
		label: "Draft",
		color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	in_progress: {
		label: "In Progress",
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
	review: {
		label: "Review",
		color:
			"bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
	},
	completed: {
		label: "Completed",
		color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
};

export function DocumentLine({ document }: DocumentLineProps) {
	const { setSelectedDocumentId, setSelectedParentId } = useDocumentsStore();
	const remove = useMutation(api.documents.remove);
	const duplicate = useMutation(api.documents.duplicate);

	const handleClick = () => {
		if (document.childrenCount > 0) {
			setSelectedParentId(document._id);
		} else {
			setSelectedDocumentId(document._id);
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		await remove({ id: document._id });
	};

	const handleDuplicate = async (e: React.MouseEvent) => {
		e.stopPropagation();
		await duplicate({ id: document._id });
	};

	const status = statusConfig[document.status as keyof typeof statusConfig];

	return (
		<motion.div
			whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
			className="group relative cursor-pointer border-gray-100 border-b dark:border-gray-800"
			onClick={handleClick}
		>
			<div className="flex items-center px-6 py-3">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<motion.div
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
						className="text-gray-400 dark:text-gray-600"
					>
						{document.childrenCount > 0 ? (
							<FolderOpen className="h-4 w-4" />
						) : (
							<FileText className="h-4 w-4" />
						)}
					</motion.div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3 className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
								{document.title}
							</h3>
							{document.childrenCount > 0 && (
								<Badge variant="secondary" className="text-xs">
									{document.childrenCount}
								</Badge>
							)}
						</div>
						{document.tags.length > 0 && (
							<div className="mt-1 flex items-center gap-1">
								{document.tags.map((tag: string) => (
									<Badge
										key={tag}
										variant="outline"
										className="h-5 px-1.5 text-xs"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Badge className={cn("text-xs", status.color)}>{status.label}</Badge>

					{document.assignedTo && (
						<Avatar className="h-6 w-6">
							<AvatarImage src={document.assignedTo.avatarUrl} />
							<AvatarFallback className="text-xs">
								{document.assignedTo.name.charAt(0)}
							</AvatarFallback>
						</Avatar>
					)}

					<div className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
						<Clock className="h-3 w-3" />
						<span>
							{formatDistanceToNow(new Date(document._creationTime), {
								addSuffix: true,
								locale: ru,
							})}
						</span>
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="opacity-0 transition-opacity group-hover:opacity-100"
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									onClick={(e) => e.stopPropagation()}
									className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									<MoreHorizontal className="h-4 w-4 text-gray-500" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										setSelectedDocumentId(document._id);
									}}
								>
									<Edit3 className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDuplicate}>
									<Copy className="mr-2 h-4 w-4" />
									Duplicate
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-red-600"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</motion.div>

					<ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
				</div>
			</div>
		</motion.div>
	);
}
