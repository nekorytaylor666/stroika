"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDocumentsStore } from "@/store/documents-store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, FileText, MoreHorizontal, User } from "lucide-react";
import { motion } from "motion/react";

interface DocumentBoardCardProps {
	document: any;
}

export function DocumentBoardCard({ document }: DocumentBoardCardProps) {
	const { setSelectedDocumentId } = useDocumentsStore();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: document._id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className="cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800"
			onClick={() => setSelectedDocumentId(document._id)}
		>
			<div className="mb-2 flex items-start justify-between">
				<FileText className="h-4 w-4 text-gray-400" />
				<button
					onClick={(e) => {
						e.stopPropagation();
						// Handle menu
					}}
					className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-700"
				>
					<MoreHorizontal className="h-3 w-3 text-gray-500" />
				</button>
			</div>

			<h4 className="mb-2 line-clamp-2 font-medium text-gray-900 text-sm dark:text-gray-100">
				{document.title}
			</h4>

			{document.tags.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-1">
					{document.tags.slice(0, 2).map((tag: string) => (
						<Badge key={tag} variant="outline" className="h-5 px-1.5 text-xs">
							{tag}
						</Badge>
					))}
					{document.tags.length > 2 && (
						<Badge variant="outline" className="h-5 px-1.5 text-xs">
							+{document.tags.length - 2}
						</Badge>
					)}
				</div>
			)}

			<div className="mt-3 flex items-center justify-between">
				<div className="flex items-center gap-1 text-gray-500 text-xs">
					<Clock className="h-3 w-3" />
					<span>
						{formatDistanceToNow(new Date(document._creationTime), {
							addSuffix: false,
							locale: ru,
						})}
					</span>
				</div>

				{document.assignedTo && (
					<Avatar className="h-5 w-5">
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
