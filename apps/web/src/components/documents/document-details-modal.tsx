"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useDocumentsStore } from "@/store/documents-store";
import { useMutation, useQuery } from "convex/react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	ChevronDown,
	Clock,
	FileText,
	History,
	MessageSquare,
	Paperclip,
	Save,
	User,
	X,
	Upload,
	Hash,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DocumentUpload } from "./document-upload";
import { DocumentViewer } from "./document-viewer";
import { DocumentComments } from "./document-comments";
import { DocumentTasks } from "./document-tasks";

const statusOptions = [
	{ value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
	{
		value: "in_progress",
		label: "In Progress",
		color: "bg-blue-100 text-blue-700",
	},
	{ value: "review", label: "Review", color: "bg-yellow-100 text-yellow-700" },
	{
		value: "completed",
		label: "Completed",
		color: "bg-green-100 text-green-700",
	},
];

export function DocumentDetailsModal() {
	const { selectedDocumentId, setSelectedDocumentId } = useDocumentsStore();
	const document = useQuery(
		api.documents.get,
		selectedDocumentId ? { id: selectedDocumentId as any } : "skip",
	);
	const update = useMutation(api.documents.update);
	const versions = useQuery(
		api.documents.getVersionHistory,
		selectedDocumentId ? { documentId: selectedDocumentId as any } : "skip",
	);


	const handleStatusChange = async (status: string) => {
		if (!selectedDocumentId) return;

		await update({
			id: selectedDocumentId as any,
			status: status as any,
		});
	};

	if (!document || !selectedDocumentId) return null;

	return (
		<Dialog
			open={!!selectedDocumentId}
			onOpenChange={() => setSelectedDocumentId(null)}
		>
			<DialogContent className="h-[90vh] max-w-4xl p-0" hideCloseButton>
				<div className="flex h-full">
					{/* Main content area */}
					<div className="flex flex-1 flex-col">
						{/* Header */}
						<div className="border-gray-200 border-b p-6 dark:border-gray-800">
							<div className="mb-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<FileText className="h-5 w-5 text-gray-500" />
									<h2 className="font-semibold text-xl">{document.title}</h2>
								</div>
								<button
									onClick={() => setSelectedDocumentId(null)}
									className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									<X className="h-5 w-5 text-gray-500" />
								</button>
							</div>

							{/* Status and metadata */}
							<div className="flex items-center gap-4">
								<div className="relative">
									<select
										value={document.status}
										onChange={(e) => handleStatusChange(e.target.value)}
										className={cn(
											"cursor-pointer appearance-none rounded-md px-3 py-1 pr-8 font-medium text-sm",
											statusOptions.find((s) => s.value === document.status)
												?.color,
										)}
									>
										{statusOptions.map((status) => (
											<option key={status.value} value={status.value}>
												{status.label}
											</option>
										))}
									</select>
									<ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 h-3 w-3" />
								</div>

								{document.assignedTo && (
									<div className="flex items-center gap-2">
										<Avatar className="h-6 w-6">
											<AvatarImage src={document.assignedTo.avatarUrl} />
											<AvatarFallback>
												{document.assignedTo.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<span className="text-gray-600 text-sm">
											{document.assignedTo.name}
										</span>
									</div>
								)}

								<div className="flex items-center gap-1 text-gray-500 text-sm">
									<Clock className="h-4 w-4" />
									<span>
										Updated{" "}
										{formatDistanceToNow(new Date(document.lastEditedAt), {
											addSuffix: true,
											locale: ru,
										})}
									</span>
								</div>
							</div>
						</div>

						{/* Content area */}
						<div className="flex-1 overflow-y-auto p-6">
							<div className="h-full flex items-center justify-center text-gray-500">
								<div className="text-center">
									<FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-medium mb-2">Document Management</p>
									<p className="text-sm">Upload files and collaborate with comments</p>
								</div>
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="w-80 border-gray-200 border-l bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
						<Tabs defaultValue="comments" className="flex h-full flex-col">
							<TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
								<TabsTrigger
									value="comments"
									className="rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600"
								>
									<MessageSquare className="mr-2 h-4 w-4" />
									Comments
								</TabsTrigger>
								<TabsTrigger
									value="activity"
									className="rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600"
								>
									<Clock className="mr-2 h-4 w-4" />
									Activity
								</TabsTrigger>
								<TabsTrigger
									value="versions"
									className="rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600"
								>
									<History className="mr-2 h-4 w-4" />
									Versions
								</TabsTrigger>
								<TabsTrigger
									value="tasks"
									className="rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600"
								>
									<Hash className="mr-2 h-4 w-4" />
									Tasks
								</TabsTrigger>
								<TabsTrigger
									value="files"
									className="rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600"
								>
									<Paperclip className="mr-2 h-4 w-4" />
									Files
								</TabsTrigger>
							</TabsList>

							<TabsContent value="comments" className="flex-1 overflow-y-auto p-4">
								<DocumentComments documentId={selectedDocumentId as any} />
							</TabsContent>

							<TabsContent
								value="activity"
								className="flex-1 overflow-y-auto p-4"
							>
								<div className="space-y-4">
									<div className="text-gray-500 text-sm">
										<div className="mb-2 flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={document.author?.avatarUrl} />
												<AvatarFallback>
													{document.author?.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<span className="font-medium text-gray-900 dark:text-gray-100">
												{document.author?.name}
											</span>
										</div>
										<p>Created this document</p>
										<p className="mt-1 text-xs">
											{format(new Date(document._creationTime), "PPP", {
												locale: ru,
											})}
										</p>
									</div>
								</div>
							</TabsContent>

							<TabsContent
								value="versions"
								className="flex-1 overflow-y-auto p-4"
							>
								<div className="space-y-2">
									{versions?.map((version) => (
										<motion.div
											key={version._id}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
										>
											<div className="mb-1 flex items-center justify-between">
												<span className="font-medium text-sm">
													Version {version.version}
												</span>
												<Button variant="ghost" size="sm" className="text-xs">
													Restore
												</Button>
											</div>
											<div className="flex items-center gap-2 text-gray-500 text-xs">
												<Avatar className="h-4 w-4">
													<AvatarImage src={version.editor?.avatarUrl} />
													<AvatarFallback>
														{version.editor?.name.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<span>{version.editor?.name}</span>
												<span>•</span>
												<span>
													{formatDistanceToNow(new Date(version.editedAt), {
														addSuffix: true,
														locale: ru,
													})}
												</span>
											</div>
										</motion.div>
									))}
								</div>
							</TabsContent>

							<TabsContent value="tasks" className="flex-1 overflow-y-auto p-4">
								<DocumentTasks documentId={selectedDocumentId as any} />
							</TabsContent>

							<TabsContent value="files" className="flex-1 overflow-y-auto p-4">
								<div className="space-y-4">
									<DocumentUpload documentId={selectedDocumentId as any} />
									<DocumentViewer documentId={selectedDocumentId as any} />
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
