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
	Clock,
	Copy,
	Edit3,
	FileText,
	FolderOpen,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";

interface DocumentGridProps {
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

export function DocumentGrid({ document }: DocumentGridProps) {
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
			whileHover={{ scale: 1.02, y: -2 }}
			whileTap={{ scale: 0.98 }}
			className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
			onClick={handleClick}
		>
			<div className="mb-3 flex items-start justify-between">
				<div className="flex items-center gap-2">
					<div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
						{document.childrenCount > 0 ? (
							<FolderOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
						) : (
							<FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
						)}
					</div>
					{document.childrenCount > 0 && (
						<Badge variant="secondary" className="text-xs">
							{document.childrenCount}
						</Badge>
					)}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							onClick={(e) => e.stopPropagation()}
							className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-800"
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
						<DropdownMenuItem onClick={handleDelete} className="text-red-600">
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<h3 className="mb-2 line-clamp-2 font-medium text-gray-900 text-sm dark:text-gray-100">
				{document.title}
			</h3>

			<Badge className={cn("mb-3 text-xs", status.color)}>{status.label}</Badge>

			{document.tags.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-1">
					{document.tags.slice(0, 3).map((tag: string) => (
						<Badge key={tag} variant="outline" className="h-5 px-1.5 text-xs">
							{tag}
						</Badge>
					))}
					{document.tags.length > 3 && (
						<Badge variant="outline" className="h-5 px-1.5 text-xs">
							+{document.tags.length - 3}
						</Badge>
					)}
				</div>
			)}

			<div className="mt-auto flex items-center justify-between">
				<div className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
					<Clock className="h-3 w-3" />
					<span>
						{formatDistanceToNow(new Date(document._creationTime), {
							addSuffix: true,
							locale: ru,
						})}
					</span>
				</div>

				{document.assignedTo && (
					<Avatar className="h-6 w-6">
						<AvatarImage src={document.assignedTo.avatarUrl} />
						<AvatarFallback className="text-xs">
							{document.assignedTo.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
				)}
			</div>
		</motion.div>
	);
}
