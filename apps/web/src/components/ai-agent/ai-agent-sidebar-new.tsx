"use client";

import { ContextTextarea } from "@/components/context-aware-text-area";
import {
	ChatContainerContent,
	ChatContainerRoot,
	ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import { Loader } from "@/components/prompt-kit/loader";
import {
	Message,
	MessageAvatar,
	MessageContent,
} from "@/components/prompt-kit/message";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAgentMessages } from "@/hooks/use-agent-messages";
import { useAgentThreads } from "@/hooks/use-agent-threads";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	FolderPlus,
	ListTodo,
	MessageSquare,
	Plus,
	Send,
	Settings,
	Sparkles,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Response } from "../ai-elements/response";

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
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
					/>

					{/* Sidebar Panel */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						className="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-2xl sm:w-2xl"
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/10 to-purple-500/10 p-4">
							<div className="flex flex-1 items-center gap-2">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<h2 className="font-semibold text-lg">AI Агент</h2>
									<p className="truncate text-muted-foreground text-xs">
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
							<div className="border-b p-4">
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
													<div className="flex flex-1 items-center gap-2">
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

						{/* Chat Messages */}
						<div className="flex-1 overflow-hidden">
							{!currentThreadId ? (
								<div className="flex h-full items-center justify-center p-8 text-center">
									<div className="space-y-4">
										<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
											<MessageSquare className="h-8 w-8 text-primary" />
										</div>
										<div>
											<h3 className="mb-2 font-semibold">Начните новый чат</h3>
											<p className="mb-4 text-muted-foreground text-sm">
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
								<div className="flex h-full items-center justify-center">
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
													className="fade-in slide-in-from-bottom-2 animate-in"
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
																"max-w-[90%] px-4 py-2 text-sm",
																message.role === "assistant"
																	? "border border-primary/20 bg-primary/10"
																	: "bg-secondary",
															)}
														>
															<Response>{message.text || "..."}</Response>
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
							<div className="border-t bg-muted/30 p-4">
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
												className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>
									</div>
									{contexts.length > 0 && (
										<div className="flex flex-wrap gap-1 text-muted-foreground text-xs">
											<span className="font-medium">Упомянуто:</span>
											{contexts.map((ctx) => (
												<span
													key={ctx.id}
													className="rounded bg-accent/50 px-2 py-0.5"
												>
													{ctx.path}
												</span>
											))}
										</div>
									)}
									<p className="text-center text-muted-foreground text-xs">
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
