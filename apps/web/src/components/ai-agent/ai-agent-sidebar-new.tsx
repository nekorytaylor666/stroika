"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
	X,
	Send,
	Sparkles,
	Plus,
	ListTodo,
	FolderPlus,
	Settings,
	MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	ChatContainerRoot,
	ChatContainerContent,
	ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import {
	Message,
	MessageAvatar,
	MessageContent,
} from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";
import { useAgentThreads } from "@/hooks/use-agent-threads";
import { useAgentMessages } from "@/hooks/use-agent-messages";
import type { Id } from "@stroika/backend";
import { ContextTextarea } from "@/components/context-aware-text-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@stroika/backend";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MentionContext {
	id: string;
	path: string;
	start: number;
	end: number;
	entityType?: "project" | "task" | "document";
	entityId?: string;
}

interface AIAgentSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AIAgentSidebar({ isOpen, onClose }: AIAgentSidebarProps) {
	const [input, setInput] = useState("");
	const [currentThreadId, setCurrentThreadId] =
		useState<Id<"_agent_threads"> | null>(null);
	const [contexts, setContexts] = useState<MentionContext[]>([]);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Use the context-aware message sending
	const sendMessageWithContext = useMutation(
		api.projectContext.sendMessageWithContext,
	);

	// Preload all mentionable entities when sidebar opens
	// These load once and are filtered on client side
	const allProjects = useQuery(
		api.projectContext.searchProjectsForMentions,
		isOpen ? { searchQuery: "", limit: 100 } : "skip",
	);

	const allTasks = useQuery(
		api.projectContext.searchTasksForMentions,
		isOpen ? { searchQuery: "", limit: 100 } : "skip",
	);

	const allDocuments = useQuery(
		api.projectContext.searchDocumentsForMentions,
		isOpen ? { searchQuery: "", limit: 100 } : "skip",
	);
	console.log("allProjects", allProjects);
	console.log("allTasks", allTasks);
	console.log("allDocuments", allDocuments);
	const {
		threads,
		isLoading: threadsLoading,
		createThread,
		deleteThread,
		updateThread,
	} = useAgentThreads();

	const {
		messages,
		isLoading: messagesLoading,
		sendMessage,
		hasMore,
		loadMore,
	} = useAgentMessages(currentThreadId);

	// Create initial thread when sidebar opens
	useEffect(() => {
		if (
			isOpen &&
			!currentThreadId &&
			threads &&
			threads.length === 0 &&
			!threadsLoading
		) {
			createThread({ title: "Новый чат" }).then((threadId) => {
				setCurrentThreadId(threadId);
			});
		}
	}, [isOpen, currentThreadId, threads, threadsLoading, createThread]);

	// Auto-select first thread if none selected
	useEffect(() => {
		if (!currentThreadId && threads && threads.length > 0 && !threadsLoading) {
			setCurrentThreadId(threads[0]._id as Id<"_agent_threads">);
		}
	}, [threads, currentThreadId, threadsLoading]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleSubmit = async () => {
		if (!input.trim() || !currentThreadId) return;

		const messageText = input;
		const currentContexts = contexts;
		setInput("");
		setContexts([]); // Clear contexts after sending

		try {
			// If we have contexts, use the context-aware sending
			if (currentContexts.length > 0) {
				await sendMessageWithContext({
					prompt: messageText,
					threadId: currentThreadId,
					contexts: currentContexts.map((ctx) => ({
						id: ctx.id,
						path: ctx.path,
						entityType: ctx.entityType,
						entityId: ctx.entityId,
					})),
				});
			} else {
				// Use regular message sending
				await sendMessage(messageText);
			}
		} catch (error) {
			console.error("Failed to send message:", error);
			// Restore input and contexts on error
			setInput(messageText);
			setContexts(currentContexts);
		}
	};

	const handleNewChat = async () => {
		const threadId = await createThread({ title: "Новый чат" });
		setCurrentThreadId(threadId);
		setInput("");
	};

	const handleDeleteThread = async (threadId: Id<"_agent_threads">) => {
		await deleteThread(threadId);
		if (currentThreadId === threadId) {
			setCurrentThreadId(null);
		}
	};

	const quickActions = [
		{
			icon: Plus,
			label: "Создать задачу",
			description: "Быстро создать новую задачу",
			action: () => setInput("Создай новую задачу"),
		},
		{
			icon: FolderPlus,
			label: "Создать проект",
			description: "Начать новый проект",
			action: () => setInput("Создай новый проект"),
		},
		{
			icon: ListTodo,
			label: "Изменить статус",
			description: "Обновить статус задачи",
			action: () => setInput("Измени статус задачи"),
		},
		{
			icon: Settings,
			label: "Настройки",
			description: "Управление настройками",
			action: () => setInput("Открой настройки"),
		},
	];

	const currentThread = threads?.find(
		(t: { id: string; title: string; _id: string }) => t.id === currentThreadId,
	);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
					/>

					{/* Sidebar Panel */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-background border-l shadow-2xl z-50 flex flex-col"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
							<div className="flex items-center gap-2 flex-1">
								<div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-lg font-semibold">AI Агент</h2>
									<p className="text-xs text-muted-foreground truncate">
										{currentThread?.title || "Выберите или создайте чат"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={handleNewChat}
									className="rounded-full"
									title="Новый чат"
								>
									<MessageSquare className="h-5 w-5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={onClose}
									className="rounded-full"
								>
									<X className="h-5 w-5" />
								</Button>
							</div>
						</div>

						{/* Thread Selector */}
						{threads && threads.length > 0 && (
							<div className="p-4 border-b">
								<Select
									value={currentThreadId || undefined}
									onValueChange={(value) =>
										setCurrentThreadId(value as Id<"_agent_threads">)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Выберите чат" />
									</SelectTrigger>
									<SelectContent>
										{threads.map(
											(thread: { _id: string; title: string; id: string }) => (
												<SelectItem
													key={thread._id}
													value={thread._id}
													className="flex items-center justify-between"
												>
													<div className="flex items-center gap-2 flex-1">
														<MessageSquare className="h-4 w-4" />
														<span className="truncate">{thread.title}</span>
													</div>
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Quick Actions */}
						{currentThreadId && (
							<div className="p-4 border-b bg-muted/30">
								<p className="text-xs font-medium text-muted-foreground mb-3">
									Быстрые действия
								</p>
								<div className="grid grid-cols-2 gap-2">
									{quickActions.map((action) => (
										<Button
											key={action.label}
											variant="outline"
											className="h-auto flex-col items-start gap-1 p-3 hover:bg-primary/5 hover:border-primary/50 transition-colors"
											onClick={action.action}
										>
											<div className="flex items-center gap-2 w-full">
												<action.icon className="h-4 w-4 text-primary" />
												<span className="text-sm font-medium">
													{action.label}
												</span>
											</div>
											<span className="text-xs text-muted-foreground text-left">
												{action.description}
											</span>
										</Button>
									))}
								</div>
							</div>
						)}

						{/* Chat Messages */}
						<div className="flex-1 overflow-hidden">
							{!currentThreadId ? (
								<div className="h-full flex items-center justify-center p-8 text-center">
									<div className="space-y-4">
										<div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
											<MessageSquare className="h-8 w-8 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold mb-2">Начните новый чат</h3>
											<p className="text-sm text-muted-foreground mb-4">
												Создайте новый чат, чтобы начать общение с AI-помощником
											</p>
											<Button onClick={handleNewChat} className="gap-2">
												<Plus className="h-4 w-4" />
												Новый чат
											</Button>
										</div>
									</div>
								</div>
							) : messagesLoading ? (
								<div className="h-full flex items-center justify-center">
									<Loader variant="circular" />
								</div>
							) : (
								<ChatContainerRoot className="h-full p-4">
									<ChatContainerContent>
										<div className="space-y-4">
											{hasMore && (
												<div className="flex justify-center pt-4">
													<Button
														variant="outline"
														onClick={loadMore}
														className="text-sm"
													>
														Загрузить больше
													</Button>
												</div>
											)}
											{messages.map((message, index) => (
												<Message
													key={message.key || `message-${index}`}
													className="animate-in fade-in slide-in-from-bottom-2"
												>
													<MessageAvatar
														src={
															message.role === "assistant"
																? "/ai-avatar.png"
																: "/user-avatar.png"
														}
														alt={
															message.role === "assistant" ? "AI Agent" : "User"
														}
														fallback={message.role === "assistant" ? "AI" : "U"}
													/>
													<div className="flex-1">
														<MessageContent
															className={cn(
																"max-w-[90%]",
																message.role === "assistant"
																	? "bg-primary/10 border border-primary/20"
																	: "bg-secondary",
															)}
														>
															{message.text || "..."}
														</MessageContent>
													</div>
												</Message>
											))}
											<div ref={scrollRef} />
										</div>
										<ChatContainerScrollAnchor />
									</ChatContainerContent>
								</ChatContainerRoot>
							)}
						</div>

						{/* Input Area */}
						{currentThreadId && (
							<div className="p-4 border-t bg-muted/30">
								<div className="space-y-2">
									<div className="relative">
										<ContextTextarea
											value={input}
											onValueChange={setInput}
											onContextChange={setContexts}
											placeholder="Напишите что нужно сделать... (Type @ to mention)"
											projects={allProjects || []}
											tasks={allTasks || []}
											documents={allDocuments || []}
											className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2"
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleSubmit();
												}
											}}
										/>
										<div className="absolute right-2 bottom-2">
											<Button
												size="icon"
												onClick={handleSubmit}
												disabled={!input.trim()}
												className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>
									</div>
									{contexts.length > 0 && (
										<div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
											<span className="font-medium">Упомянуто:</span>
											{contexts.map((ctx) => (
												<span
													key={ctx.id}
													className="bg-accent/50 px-2 py-0.5 rounded"
												>
													{ctx.path}
												</span>
											))}
										</div>
									)}
									<p className="text-xs text-muted-foreground text-center">
										AI может допускать ошибки. Проверяйте важную информацию.
									</p>
								</div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
