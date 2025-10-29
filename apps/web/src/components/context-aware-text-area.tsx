"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
	ChevronRight,
	Folder,
	File,
	Building,
	CheckSquare,
	FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface FileNode {
	name: string;
	path: string;
	type: "file" | "folder";
	entityType?: "project" | "task" | "document";
	entityId?: string;
	children?: FileNode[];
}

interface MentionContext {
	id: string;
	path: string;
	start: number;
	end: number;
	entityType?: "project" | "task" | "document";
	entityId?: string;
}

interface ContextTextareaProps {
	placeholder?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	onContextChange?: (contexts: MentionContext[]) => void;
	className?: string;
	fileSystem?: FileNode[];
	projects?: Array<{ _id: string; name: string; client: string }>;
	tasks?: Array<{ _id: string; identifier: string; title: string }>;
	documents?: Array<{ _id: string; title: string; status: string }>;
	onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

// Mock file system - replace with actual file system data
const mockFileSystem: FileNode[] = [
	// Root level files
	{ name: "README.md", path: "README.md", type: "file" },
	{ name: "package.json", path: "package.json", type: "file" },
	{ name: "tsconfig.json", path: "tsconfig.json", type: "file" },
	{ name: "TODO.md", path: "TODO.md", type: "file" },
	{ name: ".env.example", path: ".env.example", type: "file" },
	{
		name: "documents",
		path: "documents",
		type: "folder",
		children: [
			{ name: "readme.md", path: "documents/readme.md", type: "file" },
			{ name: "guide.pdf", path: "documents/guide.pdf", type: "file" },
			{ name: "notes.txt", path: "documents/notes.txt", type: "file" },
		],
	},
	{
		name: "projects",
		path: "projects",
		type: "folder",
		children: [
			{ name: "app.tsx", path: "projects/app.tsx", type: "file" },
			{ name: "config.json", path: "projects/config.json", type: "file" },
			{
				name: "components",
				path: "projects/components",
				type: "folder",
				children: [
					{
						name: "button.tsx",
						path: "projects/components/button.tsx",
						type: "file",
					},
					{
						name: "input.tsx",
						path: "projects/components/input.tsx",
						type: "file",
					},
				],
			},
		],
	},
	{
		name: "tasks",
		path: "tasks",
		type: "folder",
		children: [
			{ name: "todo.md", path: "tasks/todo.md", type: "file" },
			{ name: "backlog.md", path: "tasks/backlog.md", type: "file" },
			{ name: "completed.md", path: "tasks/completed.md", type: "file" },
		],
	},
];

export function ContextTextarea({
	placeholder = "Type @ to mention files...",
	value: controlledValue,
	onValueChange,
	onContextChange,
	className,
	fileSystem,
	projects = [],
	tasks = [],
	documents = [],
	onKeyDown,
}: ContextTextareaProps) {
	const [internalValue, setInternalValue] = useState("");
	const value = controlledValue ?? internalValue;
	const [showMentions, setShowMentions] = useState(false);
	const [mentionSearch, setMentionSearch] = useState("");
	const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
	const [currentPath, setCurrentPath] = useState<string[]>([]);
	const [contexts, setContexts] = useState<MentionContext[]>([]);
	const [cursorPosition, setCursorPosition] = useState(0);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const mentionStartRef = useRef<number>(-1);
	const preventAtDetectionRef = useRef(false);

	// Build file system from provided data
	const buildFileSystem = (): FileNode[] => {
		if (fileSystem) return fileSystem;

		const rootNodes: FileNode[] = [];

		// Add projects folder
		if (projects && projects.length > 0) {
			rootNodes.push({
				name: "projects",
				path: "projects",
				type: "folder",
				children: projects.map((p) => ({
					name: `${p.name} (${p.client})`,
					path: `projects/${p._id}`,
					type: "file" as const,
					entityType: "project" as const,
					entityId: p._id,
				})),
			});
		}

		// Add tasks folder
		if (tasks && tasks.length > 0) {
			rootNodes.push({
				name: "tasks",
				path: "tasks",
				type: "folder",
				children: tasks.map((t) => ({
					name: `${t.identifier} - ${t.title}`,
					path: `tasks/${t._id}`,
					type: "file" as const,
					entityType: "task" as const,
					entityId: t._id,
				})),
			});
		}

		// Add documents folder
		if (documents && documents.length > 0) {
			rootNodes.push({
				name: "documents",
				path: "documents",
				type: "folder",
				children: documents.map((d) => ({
					name: d.title,
					path: `documents/${d._id}`,
					type: "file" as const,
					entityType: "document" as const,
					entityId: d._id,
				})),
			});
		}

		return rootNodes.length > 0 ? rootNodes : mockFileSystem;
	};

	const fileSystemData = buildFileSystem();

	const getCurrentFolder = (): FileNode[] => {
		if (currentPath.length === 0) return fileSystemData;

		let current = fileSystemData;
		for (const pathPart of currentPath) {
			const folder = current.find(
				(node) => node.name === pathPart && node.type === "folder",
			);
			if (folder?.children) {
				current = folder.children;
			} else {
				return [];
			}
		}
		return current;
	};

	const getAllFilesRecursive = (nodes: FileNode[]): FileNode[] => {
		const files: FileNode[] = [];

		for (const node of nodes) {
			files.push(node);
			if (node.type === "folder" && node.children) {
				files.push(...getAllFilesRecursive(node.children));
			}
		}

		return files;
	};

	const getFilteredItems = (): FileNode[] => {
		const items = getCurrentFolder();
		if (!mentionSearch) return items;

		// If we're in the root folder, also search in subfolders
		if (currentPath.length === 0) {
			const allItems = getAllFilesRecursive(fileSystemData);
			return allItems.filter(
				(item) =>
					item.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
					item.path.toLowerCase().includes(mentionSearch.toLowerCase()),
			);
		} else {
			// If we're in a specific folder, only search within that folder
			return items.filter(
				(item) =>
					item.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
					item.path.toLowerCase().includes(mentionSearch.toLowerCase()),
			);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Call external onKeyDown first
		onKeyDown?.(e);

		if (e.key === "Backspace") {
			const cursorPos = e.currentTarget.selectionStart || 0;

			if (showMentions && mentionSearch === "") {
				setShowMentions(false);
				setCurrentPath([]);
				mentionStartRef.current = -1;
				preventAtDetectionRef.current = true;

				return;
			}

			const mentionAtCursor = contexts.find((ctx) => ctx.end === cursorPos);

			if (mentionAtCursor && !showMentions) {
				e.preventDefault();
				const beforeMention = value.slice(0, mentionAtCursor.start);
				const afterMention = value.slice(mentionAtCursor.end);
				const newValue = beforeMention + afterMention;

				if (onValueChange) {
					onValueChange(newValue);
				} else {
					setInternalValue(newValue);
				}

				const newContexts = contexts
					.filter((ctx) => ctx.id !== mentionAtCursor.id)
					.map((ctx) => {
						if (ctx.start > mentionAtCursor.end) {
							const offset = mentionAtCursor.end - mentionAtCursor.start;
							return {
								...ctx,
								start: ctx.start - offset,
								end: ctx.end - offset,
							};
						}
						return ctx;
					});

				setContexts(newContexts);
				onContextChange?.(newContexts);

				setTimeout(() => {
					textareaRef.current?.setSelectionRange(
						mentionAtCursor.start,
						mentionAtCursor.start,
					);
				}, 0);
			}
		}
	};

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		const cursorPos = e.target.selectionStart || 0;

		if (onValueChange) {
			onValueChange(newValue);
		} else {
			setInternalValue(newValue);
		}
		setCursorPosition(cursorPos);

		if (preventAtDetectionRef.current) {
			preventAtDetectionRef.current = false;
			return;
		}

		const textBeforeCursor = newValue.slice(0, cursorPos);
		const lastAtIndex = textBeforeCursor.lastIndexOf("@");

		if (lastAtIndex !== -1) {
			const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

			if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
				mentionStartRef.current = lastAtIndex;
				setMentionSearch(textAfterAt);
				setShowMentions(true);
				setCurrentPath([]);
				updateMentionPosition(e.target, lastAtIndex);
			} else {
				setShowMentions(false);
			}
		} else {
			setShowMentions(false);
		}
	};

	const updateMentionPosition = (
		textarea: HTMLTextAreaElement,
		atIndex: number,
	) => {
		const textBeforeAt = textarea.value.slice(0, atIndex);
		const lines = textBeforeAt.split("\n");
		const currentLine = lines.length;
		const currentColumn = lines[lines.length - 1].length;

		const top = currentLine * 24;
		const left = currentColumn * 8;

		setMentionPosition({ top, left });
	};

	const insertMention = (
		path: string,
		entityType?: "project" | "task" | "document",
		entityId?: string,
	) => {
		if (mentionStartRef.current === -1) return;

		const isDuplicate = contexts.some((ctx) => ctx.path === path);
		if (isDuplicate) {
			setShowMentions(false);
			setCurrentPath([]);
			setMentionSearch("");
			mentionStartRef.current = -1;
			textareaRef.current?.focus();
			return;
		}

		const beforeMention = value.slice(0, mentionStartRef.current);
		const afterMention = value.slice(cursorPosition);
		const newValue = `${beforeMention}@${path} ${afterMention}`;

		if (onValueChange) {
			onValueChange(newValue);
		} else {
			setInternalValue(newValue);
		}

		const newContext: MentionContext = {
			id: Math.random().toString(36).substr(2, 9),
			path,
			start: mentionStartRef.current,
			end: mentionStartRef.current + path.length + 1,
			entityType,
			entityId,
		};

		const newContexts = [...contexts, newContext];
		setContexts(newContexts);
		onContextChange?.(newContexts);

		setShowMentions(false);
		setCurrentPath([]);
		setMentionSearch("");
		mentionStartRef.current = -1;

		setTimeout(() => {
			textareaRef.current?.focus();
			const newCursorPos = beforeMention.length + path.length + 2;
			textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	const navigateIntoFolder = (folderName: string) => {
		setCurrentPath([...currentPath, folderName]);
		setMentionSearch("");
	};

	const navigateBack = () => {
		if (currentPath.length > 0) {
			setCurrentPath(currentPath.slice(0, -1));
			setMentionSearch("");
		}
	};

	const renderHighlightedText = () => {
		if (contexts.length === 0) return null;

		const parts: { text: string; isMention: boolean; path?: string }[] = [];
		let lastIndex = 0;

		const sortedContexts = [...contexts].sort((a, b) => a.start - b.start);

		for (const context of sortedContexts) {
			if (context.start > lastIndex) {
				parts.push({
					text: value.slice(lastIndex, context.start),
					isMention: false,
				});
			}

			parts.push({
				text: value.slice(context.start, context.end),
				isMention: true,
				path: context.path,
			});

			lastIndex = context.end;
		}

		if (lastIndex < value.length) {
			parts.push({ text: value.slice(lastIndex), isMention: false });
		}

		return (
			<div className="pointer-events-none absolute inset-0 whitespace-pre-wrap p-3 text-sm text-transparent wrap-break-word">
				{parts.map((part, index) => {
					const key = part.isMention
						? `mention-${part.path}-${index}`
						: `text-${index}-${part.text.slice(0, 10)}`;
					return part.isMention ? (
						<span
							key={key}
							className="rounded bg-accent/50 px-1 text-accent-foreground"
						>
							{part.text}
						</span>
					) : (
						<span key={key}>{part.text}</span>
					);
				})}
			</div>
		);
	};

	return (
		<div className="relative">
			<div className="relative">
				{renderHighlightedText()}
				<textarea
					ref={textareaRef}
					value={value}
					onChange={handleTextChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={cn(
						"relative z-10 min-h-[44px] w-full resize-none bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					style={{ caretColor: "currentColor" }}
				/>
			</div>

			<Popover open={showMentions} onOpenChange={setShowMentions}>
				<PopoverTrigger asChild>
					<div
						className="absolute"
						style={{ top: mentionPosition.top, left: mentionPosition.left }}
					/>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0" align="start">
					<Command>
						<CommandInput
							placeholder="Search files..."
							value={mentionSearch}
							onValueChange={setMentionSearch}
						/>
						<CommandList>
							<CommandEmpty>No files found.</CommandEmpty>
							<CommandGroup>
								{currentPath.length > 0 && (
									<CommandItem
										onSelect={navigateBack}
										className="cursor-pointer"
									>
										<ChevronRight className="mr-2 size-4 rotate-180" />
										<span className="font-medium">.. (back)</span>
									</CommandItem>
								)}
								{getFilteredItems().map((item) => {
									const isAlreadyMentioned =
										item.type === "file" &&
										contexts.some((ctx) => ctx.path === item.path);

									return (
										<CommandItem
											key={item.path}
											onSelect={() => {
												if (item.type === "folder") {
													navigateIntoFolder(item.name);
												} else {
													insertMention(
														item.path,
														item.entityType,
														item.entityId,
													);
												}
											}}
											className="cursor-pointer"
											disabled={isAlreadyMentioned}
										>
											{item.type === "folder" ? (
												<Folder className="mr-2 size-4 text-muted-foreground" />
											) : item.entityType === "project" ? (
												<Building className="mr-2 size-4 text-blue-500" />
											) : item.entityType === "task" ? (
												<CheckSquare className="mr-2 size-4 text-orange-500" />
											) : item.entityType === "document" ? (
												<FileText className="mr-2 size-4 text-purple-500" />
											) : (
												<File className="mr-2 size-4 text-muted-foreground" />
											)}
											<span
												className={cn(
													isAlreadyMentioned && "text-muted-foreground",
												)}
											>
												{item.name}
												{isAlreadyMentioned && " (already mentioned)"}
											</span>
											{item.type === "folder" && (
												<ChevronRight className="ml-auto size-4 text-muted-foreground" />
											)}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{contexts.length > 0 && (
				<div className="mt-2 text-xs text-muted-foreground">
					<span className="font-medium">Selected contexts:</span>{" "}
					{contexts.map((c) => c.path).join(", ")}
				</div>
			)}
		</div>
	);
}
