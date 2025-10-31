"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AtSign,
	Check,
	Edit2,
	MessageSquare,
	MoreHorizontal,
	Reply,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ConstructionTaskCommentsProps {
	issueId: Id<"issues">;
}

interface Comment {
	_id: Id<"issueComments">;
	content: string;
	authorId: Id<"user">;
	author: any;
	parentCommentId?: Id<"issueComments">;
	isResolved: boolean;
	createdAt: number;
	updatedAt: number;
	childrenCount: number;
	mentionedUsers: any[];
	replies?: Comment[];
}

export function ConstructionTaskComments({
	issueId,
}: ConstructionTaskCommentsProps) {
	const [newComment, setNewComment] = useState("");
	const [replyingTo, setReplyingTo] = useState<Id<"issueComments"> | null>(
		null,
	);
	const [editingComment, setEditingComment] =
		useState<Id<"issueComments"> | null>(null);
	const [editContent, setEditContent] = useState("");
	const [showResolved, setShowResolved] = useState(false);
	const [mentioning, setMentioning] = useState(false);
	const [mentionSearch, setMentionSearch] = useState("");
	const [cursorPosition, setCursorPosition] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const editTextareaRef = useRef<HTMLTextAreaElement>(null);

	const comments = useQuery(api.issueComments.list, {
		issueId,
		includeResolved: showResolved,
	});
	const users = useQuery(api.users.getAll);
	const currentUser = useCurrentUser();

	const createComment = useMutation(api.issueComments.create);
	const updateComment = useMutation(api.issueComments.update);
	const resolveComment = useMutation(api.issueComments.resolve);
	const removeComment = useMutation(api.issueComments.remove);

	const filteredUsers = users?.filter((user) => {
		if (!mentionSearch) return true;
		return user.name.toLowerCase().includes(mentionSearch.toLowerCase());
	});

	const handleSubmit = async () => {
		if (!newComment.trim() || !currentUser) return;

		// Extract mentioned users from content
		const mentionedUsernames =
			newComment.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
		const mentionedUserIds =
			users
				?.filter((u) =>
					mentionedUsernames.includes(u.name.toLowerCase().replace(/\s+/g, "")),
				)
				.map((u) => u._id) || [];

		await createComment({
			issueId,
			authorId: currentUser.id as Id<"user">,
			content: newComment,
			parentCommentId: replyingTo || undefined,
			mentionedUserIds:
				mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
		});

		setNewComment("");
		setReplyingTo(null);
	};

	const handleUpdate = async () => {
		if (!editingComment || !editContent.trim() || !currentUser) return;

		// Extract mentioned users from content
		const mentionedUsernames =
			editContent.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
		const mentionedUserIds =
			users
				?.filter((u) =>
					mentionedUsernames.includes(u.name.toLowerCase().replace(/\s+/g, "")),
				)
				.map((u) => u.id) || [];

		await updateComment({
			id: editingComment,
			userId: currentUser.id as Id<"user">,
			content: editContent,
			mentionedUserIds,
		});

		setEditingComment(null);
		setEditContent("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "@") {
			setMentioning(true);
			setMentionSearch("");
			setCursorPosition(e.currentTarget.selectionStart);
		} else if (mentioning && e.key === " ") {
			setMentioning(false);
		} else if (mentioning && e.key === "Escape") {
			setMentioning(false);
			setMentionSearch("");
		}
	};

	const handleInputChange = (value: string) => {
		if (editingComment) {
			setEditContent(value);
		} else {
			setNewComment(value);
		}

		// Update mention search
		if (mentioning) {
			const textarea = editingComment
				? editTextareaRef.current
				: textareaRef.current;
			if (!textarea) return;

			const cursorPos = textarea.selectionStart;
			const textBefore = value.slice(0, cursorPos);
			const lastAtIndex = textBefore.lastIndexOf("@");

			if (lastAtIndex !== -1) {
				const searchText = textBefore.slice(lastAtIndex + 1);
				setMentionSearch(searchText);
			}
		}
	};

	const handleMentionSelect = (user: any) => {
		const textarea = editingComment
			? editTextareaRef.current
			: textareaRef.current;
		if (!textarea) return;

		const currentValue = editingComment ? editContent : newComment;
		const cursorPos = textarea.selectionStart;
		const textBefore = currentValue.slice(0, cursorPos);
		const lastAtIndex = textBefore.lastIndexOf("@");
		const textAfter = currentValue.slice(cursorPos);

		const newText =
			textBefore.slice(0, lastAtIndex) +
			`@${user.name.toLowerCase().replace(/\s+/g, "")} ` +
			textAfter;

		if (editingComment) {
			setEditContent(newText);
		} else {
			setNewComment(newText);
		}

		setMentioning(false);
		setMentionSearch("");

		// Focus back to textarea
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = lastAtIndex + user.name.length + 2;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	const renderComment = (comment: Comment, isReply = false) => (
		<motion.div
			key={comment._id}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn("group", isReply && "mt-3 ml-12")}
		>
			<div
				className={cn(
					"rounded-lg p-4",
					comment.isResolved
						? "bg-gray-50 opacity-60 dark:bg-gray-900"
						: "bg-gray-50/50 dark:bg-gray-900/50",
				)}
			>
				<div className="flex items-start gap-3">
					<Avatar className="h-8 w-8">
						<AvatarImage src={comment.author?.avatarUrl} />
						<AvatarFallback className="text-xs">
							{comment.author?.name.charAt(0)}
						</AvatarFallback>
					</Avatar>

					<div className="min-w-0 flex-1">
						<div className="mb-1 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="font-medium text-sm">
									{comment.author?.name}
								</span>
								<span className="text-gray-500 text-xs">
									{formatDistanceToNow(new Date(comment.createdAt), {
										addSuffix: true,
										locale: ru,
									})}
								</span>
								{comment.isResolved && (
									<Badge variant="secondary" className="text-xs">
										Решено
									</Badge>
								)}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 opacity-0 group-hover:opacity-100"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{!comment.isResolved && (
										<>
											<DropdownMenuItem
												onClick={() => {
													setEditingComment(comment._id);
													setEditContent(comment.content);
												}}
											>
												<Edit2 className="mr-2 h-4 w-4" />
												Редактировать
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													resolveComment({ id: comment._id, isResolved: true })
												}
											>
												<Check className="mr-2 h-4 w-4" />
												Пометить как решенное
											</DropdownMenuItem>
										</>
									)}
									{comment.isResolved && (
										<DropdownMenuItem
											onClick={() =>
												resolveComment({ id: comment._id, isResolved: false })
											}
										>
											<X className="mr-2 h-4 w-4" />
											Открыть снова
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											currentUser &&
											removeComment({
												id: comment._id,
												userId: currentUser.id as Id<"user">,
											})
										}
										className="text-red-600"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Удалить
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{editingComment === comment._id ? (
							<div className="space-y-2">
								<div className="relative">
									<Textarea
										ref={editTextareaRef}
										value={editContent}
										onChange={(e) => handleInputChange(e.target.value)}
										onKeyDown={handleKeyDown}
										className="min-h-[60px] resize-none"
										placeholder="Редактировать комментарий..."
									/>
									{mentioning && filteredUsers && filteredUsers.length > 0 && (
										<div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
											{filteredUsers.slice(0, 5).map((user) => (
												<button
													key={user.id}
													className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
													onClick={() => handleMentionSelect(user)}
												>
													<Avatar className="h-6 w-6">
														<AvatarImage src={user.avatarUrl} />
														<AvatarFallback className="text-xs">
															{user.name.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<span className="text-sm">{user.name}</span>
												</button>
											))}
										</div>
									)}
								</div>
								<div className="flex gap-2">
									<Button size="sm" onClick={handleUpdate}>
										Сохранить
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setEditingComment(null);
											setEditContent("");
										}}
									>
										Отмена
									</Button>
								</div>
							</div>
						) : (
							<>
								<p className="whitespace-pre-wrap text-sm">
									{comment.content.split(/(@\w+)/).map((part, index) => {
										if (part.startsWith("@")) {
											const username = part.slice(1);
											const user = comment.mentionedUsers.find(
												(u) =>
													u.name.toLowerCase().replace(/\s+/g, "") === username,
											);
											return (
												<span
													key={index}
													className="font-medium text-blue-600 dark:text-blue-400"
												>
													@{user?.name || username}
												</span>
											);
										}
										return part;
									})}
								</p>

								{comment.childrenCount > 0 && !isReply && (
									<button
										className="mt-2 flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700 dark:hover:text-gray-300"
										onClick={() => {}}
									>
										<MessageSquare className="h-3 w-3" />
										{comment.childrenCount}{" "}
										{comment.childrenCount === 1 ? "ответ" : "ответов"}
									</button>
								)}

								{!isReply && (
									<Button
										size="sm"
										variant="ghost"
										className="mt-2 h-7 text-xs"
										onClick={() => setReplyingTo(comment._id)}
									>
										<Reply className="mr-1 h-3 w-3" />
										Ответить
									</Button>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{comment.replies && comment.replies.length > 0 && (
				<div className="mt-2">
					{comment.replies.map((reply) => renderComment(reply, true))}
				</div>
			)}
		</motion.div>
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">Комментарии</h3>
				{comments && comments.length > 0 && (
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setShowResolved(!showResolved)}
						className="text-xs"
					>
						{showResolved ? "Скрыть решенные" : "Показать решенные"}
					</Button>
				)}
			</div>

			<div className="space-y-3">
				{replyingTo && (
					<div className="rounded-md bg-blue-50 p-2 text-sm dark:bg-blue-900/20">
						<div className="flex items-center justify-between">
							<span>Ответ на комментарий</span>
							<Button
								size="icon"
								variant="ghost"
								className="h-6 w-6"
								onClick={() => setReplyingTo(null)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</div>
				)}

				<div className="relative">
					<Textarea
						ref={textareaRef}
						value={newComment}
						onChange={(e) => handleInputChange(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Добавить комментарий... Используйте @ для упоминания"
						className="min-h-[80px] resize-none pr-12"
					/>
					<Button
						size="icon"
						className="absolute right-2 bottom-2 h-8 w-8"
						onClick={handleSubmit}
						disabled={!newComment.trim()}
					>
						<Send className="h-4 w-4" />
					</Button>

					{mentioning && filteredUsers && filteredUsers.length > 0 && (
						<div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
							<div className="p-2 text-gray-500 text-xs">
								Упомянуть пользователя
							</div>
							{filteredUsers.slice(0, 5).map((user) => (
								<button
									key={user.id}
									className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									onClick={() => handleMentionSelect(user)}
								>
									<Avatar className="h-6 w-6">
										<AvatarImage src={user.image} />
										<AvatarFallback className="text-xs">
											{user.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm">{user.name}</span>
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<AnimatePresence>
				{comments && comments.length > 0 ? (
					<div className="space-y-3">
						{comments.map((comment) => renderComment(comment))}
					</div>
				) : (
					<div className="py-8 text-center text-gray-500 text-sm">
						Пока нет комментариев
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
