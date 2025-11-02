"use client";

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
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	FolderPlus,
	ListTodo,
	Plus,
	Send,
	Settings,
	Sparkles,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface AIAgentSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

export function AIAgentSidebar({ isOpen, onClose }: AIAgentSidebarProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "welcome",
			role: "assistant",
			content:
				"Привет! Я ваш AI-помощник. Я могу помочь вам создать задачи, проекты, изменить статусы и многое другое. Чем могу помочь?",
			timestamp: new Date(),
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = () => {
		if (!input.trim() || isLoading) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: input,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		// Simulate AI response (will be replaced with actual logic later)
		setTimeout(() => {
			const assistantMessage: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content:
					"Спасибо за ваш запрос! Функциональность AI-агента будет добавлена в следующем обновлении.",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, assistantMessage]);
			setIsLoading(false);
		}, 1000);
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
						className="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-2xl sm:w-[480px]"
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/10 to-purple-500/10 p-4">
							<div className="flex items-center gap-2">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500">
									<Sparkles className="h-5 w-5 text-white" />
								</div>
								<div>
									<h2 className="font-semibold text-lg">AI Агент</h2>
									<p className="text-muted-foreground text-xs">
										Ваш умный помощник
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="rounded-full"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>

						{/* Quick Actions */}
						<div className="border-b bg-muted/30 p-4">
							<p className="mb-3 font-medium text-muted-foreground text-xs">
								Быстрые действия
							</p>
							<div className="grid grid-cols-2 gap-2">
								{quickActions.map((action) => (
									<Button
										key={action.label}
										variant="outline"
										className="h-auto flex-col items-start gap-1 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
										onClick={action.action}
									>
										<div className="flex w-full items-center gap-2">
											<action.icon className="h-4 w-4 text-primary" />
											<span className="font-medium text-sm">
												{action.label}
											</span>
										</div>
										<span className="text-left text-muted-foreground text-xs">
											{action.description}
										</span>
									</Button>
								))}
							</div>
						</div>

						{/* Chat Messages */}
						<div className="flex-1 overflow-hidden">
							<ChatContainerRoot className="h-full p-4">
								<ChatContainerContent>
									<div className="space-y-4">
										{messages.map((message) => (
											<Message
												key={message.id}
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
												<div className="flex-1 space-y-2">
													<MessageContent
														className={cn(
															"max-w-[90%]",
															message.role === "assistant"
																? "border border-primary/20 bg-primary/10"
																: "bg-secondary",
														)}
													>
														{message.content}
													</MessageContent>
													<p className="text-muted-foreground text-xs">
														{message.timestamp.toLocaleTimeString("ru-RU", {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</p>
												</div>
											</Message>
										))}
										{isLoading && (
											<Message className="fade-in animate-in">
												<MessageAvatar
													src="/ai-avatar.png"
													alt="AI Agent"
													fallback="AI"
												/>
												<div className="flex-1">
													<MessageContent className="border border-primary/20 bg-primary/10">
														<Loader variant="typing" />
													</MessageContent>
												</div>
											</Message>
										)}
									</div>
									<ChatContainerScrollAnchor />
								</ChatContainerContent>
							</ChatContainerRoot>
						</div>

						{/* Input Area */}
						<div className="w-full border-t bg-muted/30 p-4">
							<PromptInput
								value={input}
								onValueChange={setInput}
								onSubmit={handleSubmit}
								isLoading={isLoading}
								maxHeight={200}
								className="w-full bg-background"
							>
								<PromptInputTextarea
									placeholder="Напишите что нужно сделать..."
									className="min-h-[44px] w-full"
								/>
								<PromptInputActions>
									<PromptInputAction tooltip="Отправить сообщение" side="top">
										<Button
											size="icon"
											onClick={handleSubmit}
											disabled={!input.trim() || isLoading}
											className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
										>
											<Send className="h-4 w-4" />
										</Button>
									</PromptInputAction>
								</PromptInputActions>
							</PromptInput>
							<p className="mt-2 text-center text-muted-foreground text-xs">
								AI может допускать ошибки. Проверяйте важную информацию.
							</p>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
