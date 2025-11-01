"use client";

import type { MentionContext } from "@/components/context-aware-text-area";
import { ContextTextarea } from "@/components/context-aware-text-area";
import {
	Context,
	ContextCacheUsage,
	ContextContent,
	ContextContentBody,
	ContextContentFooter,
	ContextContentHeader,
	ContextInputUsage,
	ContextOutputUsage,
	ContextTrigger,
} from "@/components/ai-elements/context";
import {
	PromptInput,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments,
	type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
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
	Building,
	CheckSquare,
	FileText,
	FolderPlus,
	ListTodo,
	MessageSquare,
	Paperclip,
	Plus,
	Send,
	Settings,
	Sparkles,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Response } from "../ai-elements/response";

interface AIAgentSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

// Estimate tokens from text (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

// File upload button component that accesses attachments context
function FileUploadButton() {
	const attachments = usePromptInputAttachments();

	return (
		<PromptInputButton
			onClick={(e) => {
				e.preventDefault();
				attachments.openFileDialog();
			}}
			title="Прикрепить файл"
		>
			<Paperclip className="h-4 w-4" />
		</PromptInputButton>
	);
}

// Context mention attachment card component
interface ContextAttachmentCardProps {
	context: MentionContext;
	onRemove: (id: string) => void;
}

function ContextAttachmentCard({ context, onRemove }: ContextAttachmentCardProps) {
	const getIcon = () => {
		switch (context.entityType) {
			case "project":
				return <Building className="h-3 w-3 text-blue-500 shrink-0" />;
			case "task":
				return <CheckSquare className="h-3 w-3 text-orange-500 shrink-0" />;
			case "document":
				return <FileText className="h-3 w-3 text-purple-500 shrink-0" />;
			default:
				return <FileText className="h-3 w-3 text-muted-foreground shrink-0" />;
		}
	};

	// Extract just the name part for cleaner display
	const getDisplayName = () => {
		if (context.displayName) {
			return context.displayName;
		}
		// Fallback to extracting from path if displayName is not available
		const parts = context.path.split('/');
		return parts[parts.length - 1] || context.path;
	};

	return (
		<div
			className="group relative inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-xs hover:bg-accent/50 transition-colors"
			title={context.path} // Show full path on hover
		>
			{getIcon()}
			<span className="max-w-[300px] truncate leading-none">{getDisplayName()}</span>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onRemove(context.id);
				}}
				className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-destructive"
				aria-label="Remove mention"
			>
				<X className="h-2.5 w-2.5" />
			</button>
		</div>
	);
}

export function AIAgentSidebar({ isOpen, onClose }: AIAgentSidebarProps) {
	const [currentThreadId, setCurrentThreadId] =
		useState<Id<"_agent_threads"> | null>(null);
	const [contexts, setContexts] = useState<MentionContext[]>([]);
	const [inputText, setInputText] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	// Use the context-aware message sending
	const sendMessageWithContext = useMutation(
		api.projectContext.sendMessageWithContext,
	);

	// File upload mutations
	const generateUploadUrl = useMutation(api.agent.threads.generateUploadUrl);
	const uploadFile = useMutation(api.agent.threads.uploadFile);

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

	const handleSubmit = async (message: PromptInputMessage) => {
		if (!currentThreadId) return;
		if (!message.text?.trim() && !message.files?.length) return;

		try {
			// Upload files to Convex storage and get fileIds
			const fileIds: string[] = [];
			if (message.files && message.files.length > 0) {
				for (const file of message.files) {
					// Convert data URL back to file if needed
					if (file.url) {
						// Generate upload URL
						const uploadUrl = await generateUploadUrl();

						// Fetch the file data
						const response = await fetch(file.url);
						const blob = await response.blob();

						// Upload to Convex storage
						const uploadResponse = await fetch(uploadUrl, {
							method: "POST",
							headers: {
								"Content-Type": file.mediaType || "application/octet-stream",
							},
							body: blob,
						});

						if (!uploadResponse.ok) {
							throw new Error(`Failed to upload ${file.filename}`);
						}

						const { storageId } = await uploadResponse.json();

						// Store file in agent component
						const fileId = await uploadFile({
							storageId,
							contentType: file.mediaType || "application/octet-stream",
							filename: file.filename || "file",
						});

						fileIds.push(fileId);
					}
				}
			}

			// If we have contexts, use the context-aware sending
			if (contexts.length > 0) {
				await sendMessageWithContext({
					prompt: message.text || "",
					threadId: currentThreadId,
					contexts: contexts.map((ctx) => ({
						id: ctx.id,
						path: ctx.path,
						entityType: ctx.entityType,
						entityId: ctx.entityId,
					})),
				});
			} else {
				// Send regular message with file attachments
				await sendMessage(
					message.text || "",
					fileIds.length > 0 ? fileIds : undefined,
				);
			}

			// Clear contexts after successful send
			setContexts([]);
			setInputText("");
		} catch (error) {
			console.error("Failed to send message:", error);
			throw error; // PromptInput will handle the error
		}
	};

	const handleNewChat = async () => {
		const threadId = await createThread({ title: "Новый чат" });
		setCurrentThreadId(threadId);
	};

	const handleDeleteThread = async (threadId: Id<"_agent_threads">) => {
		await deleteThread(threadId);
		if (currentThreadId === threadId) {
			setCurrentThreadId(null);
		}
	};

	const handleRemoveContext = (contextId: string) => {
		setContexts(prev => prev.filter(ctx => ctx.id !== contextId));
	};

	const currentThread = threads?.find(
		(t: { id: string; title: string; _id: string }) => t.id === currentThreadId,
	);

	// Calculate estimated token usage for the current thread
	const tokenUsage = useMemo(() => {
		if (!messages || messages.length === 0) {
			return {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0,
			};
		}

		let inputTokens = 0;
		let outputTokens = 0;

		for (const message of messages) {
			const tokens = estimateTokens(message.text || "");
			if (message.role === "user") {
				inputTokens += tokens;
			} else if (message.role === "assistant") {
				outputTokens += tokens;
			}
		}

		return {
			inputTokens,
			outputTokens,
			totalTokens: inputTokens + outputTokens,
		};
	}, [messages]);

	// GPT-4o-mini has 128k token context window
	const MAX_TOKENS = 128000;

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
								{/* Context Window Indicator */}
								<Context
									maxTokens={MAX_TOKENS}
									usedTokens={tokenUsage.totalTokens}
									usage={{
										inputTokens: tokenUsage.inputTokens,
										outputTokens: tokenUsage.outputTokens,
										totalTokens: tokenUsage.totalTokens,
									}}
									modelId="openai:gpt-4o-mini"
								>
									<ContextTrigger />
									<ContextContent>
										<ContextContentHeader />
										<ContextContentBody>
											<div className="space-y-2">
												<ContextInputUsage />
												<ContextOutputUsage />
												<ContextCacheUsage />
											</div>
										</ContextContentBody>
										<ContextContentFooter />
									</ContextContent>
								</Context>
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
									<PromptInput
										accept="image/*,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain,.csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
										multiple
										onSubmit={(message) => {
											// Combine inputText with file attachments
											handleSubmit({ ...message, text: inputText });
										}}
									>
										{/* Combined attachments header: file attachments + context mentions */}
										<PromptInputHeader>
											{/* File attachments */}
											<PromptInputAttachments>
												{(attachment) => (
													<PromptInputAttachment
														key={attachment.id}
														data={attachment}
													/>
												)}
											</PromptInputAttachments>

											{/* Context mentions displayed as attachment cards */}
											{contexts.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{contexts.map((ctx) => (
														<ContextAttachmentCard
															key={ctx.id}
															context={ctx}
															onRemove={handleRemoveContext}
														/>
													))}
												</div>
											)}
										</PromptInputHeader>

										{/* Context-aware textarea integrated into PromptInput */}
										<div className="relative w-full">
											<ContextTextarea
												value={inputText}
												onValueChange={setInputText}
												contexts={contexts}
												onContextChange={setContexts}
												placeholder="Напишите что нужно сделать... (Type @ to mention)"
												projects={allProjects || []}
												tasks={allTasks || []}
												documents={allDocuments || []}
												className="min-h-[100px] w-full resize-none bg-transparent px-3 py-2"
												onKeyDown={(e) => {
													// Allow form submission with Cmd/Ctrl + Enter
													if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
														e.preventDefault();
														const form = e.currentTarget.closest("form");
														if (form) {
															form.requestSubmit();
														}
													}
												}}
											/>
										</div>

										{/* Footer with buttons */}
										<PromptInputFooter className="border-t pt-2">
											<div className="flex items-center justify-between w-full">
												<PromptInputTools>
													<FileUploadButton />
												</PromptInputTools>
												<Button
													type="submit"
													size="sm"
													disabled={!inputText.trim()}
												>
													<Send className="h-4 w-4" />
												</Button>
											</div>
										</PromptInputFooter>
									</PromptInput>

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
