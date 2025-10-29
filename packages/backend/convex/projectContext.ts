import {
	createThread as createThreadAgent,
	listMessages,
	saveMessage,
} from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import {
	getCurrentUser,
	getCurrentUserWithOrganization,
} from "./helpers/getCurrentUser";

/**
 * Search for mentionable projects
 */
export const searchProjectsForMentions = query({
	args: {
		searchQuery: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { searchQuery, limit = 10 }) => {
		const { organization, user } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			return [];
		}

		// Search projects by name or client
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// If searchQuery is empty, return all projects (up to limit)
		const filtered = searchQuery
			? projects.filter(
					(p) =>
						p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						p.client.toLowerCase().includes(searchQuery.toLowerCase()),
				)
			: projects;

		return filtered.slice(0, limit).map((p) => ({
			_id: p._id,
			name: p.name,
			client: p.client,
		}));
	},
});

/**
 * Search for mentionable tasks
 */
export const searchTasksForMentions = query({
	args: {
		searchQuery: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { searchQuery, limit = 10 }) => {
		const { organization, user } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			return [];
		}

		// Get all construction tasks
		let tasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.collect();

		// Filter by organization
		tasks = tasks.filter((task) => task.organizationId === organization.id);

		// If searchQuery is empty, return all tasks (up to limit)
		const filtered = searchQuery
			? tasks.filter(
					(t) =>
						t.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
						t.title.toLowerCase().includes(searchQuery.toLowerCase()),
				)
			: tasks;

		return filtered.slice(0, limit).map((t) => ({
			_id: t._id,
			identifier: t.identifier,
			title: t.title,
		}));
	},
});

/**
 * Search for mentionable documents
 */
export const searchDocumentsForMentions = query({
	args: {
		searchQuery: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { searchQuery, limit = 10 }) => {
		const { organization, user } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			return [];
		}
		// Search documents by title
		const documents = await ctx.db
			.query("documents")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// If searchQuery is empty, return all documents (up to limit)
		const filtered = searchQuery
			? documents.filter((d) =>
					d.title.toLowerCase().includes(searchQuery.toLowerCase()),
				)
			: documents;

		return filtered.slice(0, limit).map((d) => ({
			_id: d._id,
			title: d.title,
			status: d.status,
		}));
	},
});

/**
 * Get detailed context for a construction project
 */
export const getProjectContext = query({
	args: {
		projectId: v.id("constructionProjects"),
	},
	handler: async (ctx, { projectId }) => {
		const { organization, user } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			return null;
		}
		const project = await ctx.db.get(projectId);
		if (!project) {
			return null;
		}

		// Get related data
		const [status, lead, priority] = await Promise.all([
			ctx.db.get(project.statusId),
			ctx.db.get(project.leadId),
			ctx.db.get(project.priorityId),
		]);

		// Get project tasks
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();

		// Calculate task stats
		const taskStats = {
			total: tasks.length,
			completed: 0,
			inProgress: 0,
			notStarted: 0,
		};

		// Get task statuses for counting
		const taskStatuses = await Promise.all(
			tasks.map(async (task) => await ctx.db.get(task.statusId)),
		);

		for (const status of taskStatuses) {
			if (!status) continue;
			const statusName = status.name;
			if (
				statusName === "завершено" ||
				statusName === "Завершено" ||
				statusName === "Done" ||
				statusName === "Completed" ||
				statusName === "Готово"
			) {
				taskStats.completed++;
			} else if (
				statusName === "В работе" ||
				statusName === "На проверке" ||
				statusName.includes("progress")
			) {
				taskStats.inProgress++;
			} else if (
				statusName === "К выполнению" ||
				statusName === "Todo" ||
				statusName === "Backlog" ||
				statusName === "Новая"
			) {
				taskStats.notStarted++;
			}
		}

		return {
			_id: project._id,
			name: project.name,
			client: project.client,
			status: status?.name,
			lead: lead?.name,
			priority: priority?.name,
			contractValue: project.contractValue,
			percentComplete: project.percentComplete,
			startDate: project.startDate,
			targetDate: project.targetDate,
			location: project.location,
			projectType: project.projectType,
			taskStats,
		};
	},
});

/**
 * Get detailed context for a construction task
 */
export const getTaskContext = query({
	args: {
		taskId: v.id("issues"),
	},
	handler: async (ctx, { taskId }) => {
		const task = await ctx.db.get(taskId);
		if (!task) {
			return null;
		}

		// Get related data
		const [status, assignee, priority, project] = await Promise.all([
			ctx.db.get(task.statusId),
			task.assigneeId ? ctx.db.get(task.assigneeId) : null,
			ctx.db.get(task.priorityId),
			task.projectId ? ctx.db.get(task.projectId) : null,
		]);

		// Get labels
		const labels = await Promise.all(task.labelIds.map((id) => ctx.db.get(id)));

		// Get subtasks
		const subtasks = await ctx.db
			.query("issues")
			.withIndex("by_parent_task", (q) => q.eq("parentTaskId", task._id))
			.collect();

		return {
			_id: task._id,
			identifier: task.identifier,
			title: task.title,
			description: task.description,
			status: status?.name,
			assignee: assignee?.name,
			priority: priority?.name,
			projectName: project?.name,
			dueDate: task.dueDate,
			labels: labels.filter(Boolean).map((l) => l.name),
			subtaskCount: subtasks.length,
			isConstructionTask: task.isConstructionTask,
		};
	},
});

/**
 * Get detailed context for a document
 */
export const getDocumentContext = query({
	args: {
		documentId: v.id("documents"),
	},
	handler: async (ctx, { documentId }) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return null;
		}

		const document = await ctx.db.get(documentId);
		if (!document) {
			return null;
		}

		// Get author info
		const author = document.authorId
			? await ctx.db.get(document.authorId)
			: null;

		return {
			_id: document._id,
			title: document.title,
			status: document.status,
			type: document.type,
			author: author?.name,
			createdAt: document.createdAt,
			updatedAt: document.updatedAt,
			content: document.content?.substring(0, 500), // First 500 chars for context
		};
	},
});

/**
 * Send message with context
 */
export const sendMessageWithContext = mutation({
	args: {
		prompt: v.string(),
		threadId: v.string(),
		contexts: v.optional(
			v.array(
				v.object({
					id: v.string(),
					path: v.string(),
					entityType: v.optional(
						v.union(
							v.literal("project"),
							v.literal("task"),
							v.literal("document"),
						),
					),
					entityId: v.optional(v.string()),
				}),
			),
		),
	},
	handler: async (ctx, { prompt, threadId, contexts }) => {
		// Fetch detailed context for each mentioned entity
		let enrichedPrompt = prompt;
		const contextData = [];

		if (contexts && contexts.length > 0) {
			for (const context of contexts) {
				if (context.entityType && context.entityId) {
					let entityContext = null;

					if (context.entityType === "project") {
						entityContext = await ctx.runQuery(
							internal.projectContext.getProjectContext,
							{ projectId: context.entityId },
						);
					} else if (context.entityType === "task") {
						entityContext = await ctx.runQuery(
							internal.projectContext.getTaskContext,
							{ taskId: context.entityId },
						);
					} else if (context.entityType === "document") {
						entityContext = await ctx.runQuery(
							internal.projectContext.getDocumentContext,
							{ documentId: context.entityId },
						);
					}

					if (entityContext) {
						contextData.push({
							type: context.entityType,
							path: context.path,
							data: entityContext,
						});
					}
				}
			}

			// Add context information to the prompt
			if (contextData.length > 0) {
				enrichedPrompt += "\n\n--- КОНТЕКСТ ---\n";
				for (const ctx of contextData) {
					if (ctx.type === "project") {
						enrichedPrompt += `\nПроект: ${ctx.data.name}\n`;
						enrichedPrompt += `- Клиент: ${ctx.data.client}\n`;
						enrichedPrompt += `- Статус: ${ctx.data.status}\n`;
						enrichedPrompt += `- Руководитель: ${ctx.data.lead}\n`;
						enrichedPrompt += `- Прогресс: ${ctx.data.percentComplete}%\n`;
						enrichedPrompt += `- Контракт: ${ctx.data.contractValue} руб.\n`;
						enrichedPrompt += `- Даты: ${ctx.data.startDate} - ${ctx.data.targetDate}\n`;
						enrichedPrompt += `- Задачи: всего ${ctx.data.taskStats.total}, завершено ${ctx.data.taskStats.completed}, в работе ${ctx.data.taskStats.inProgress}\n`;
					} else if (ctx.type === "task") {
						enrichedPrompt += `\nЗадача: ${ctx.data.identifier} - ${ctx.data.title}\n`;
						enrichedPrompt += `- Статус: ${ctx.data.status}\n`;
						enrichedPrompt += `- Исполнитель: ${ctx.data.assignee || "Не назначен"}\n`;
						enrichedPrompt += `- Приоритет: ${ctx.data.priority}\n`;
						if (ctx.data.projectName) {
							enrichedPrompt += `- Проект: ${ctx.data.projectName}\n`;
						}
						if (ctx.data.dueDate) {
							enrichedPrompt += `- Срок: ${ctx.data.dueDate}\n`;
						}
						if (ctx.data.description) {
							enrichedPrompt += `- Описание: ${ctx.data.description}\n`;
						}
					} else if (ctx.type === "document") {
						enrichedPrompt += `\nДокумент: ${ctx.data.title}\n`;
						enrichedPrompt += `- Статус: ${ctx.data.status}\n`;
						enrichedPrompt += `- Тип: ${ctx.data.type}\n`;
						enrichedPrompt += `- Автор: ${ctx.data.author || "Неизвестен"}\n`;
						if (ctx.data.content) {
							enrichedPrompt += `- Содержимое (превью): ${ctx.data.content}\n`;
						}
					}
				}
				enrichedPrompt += "\n--- КОНЕЦ КОНТЕКСТА ---\n";
			}
		}

		// Save the message with enriched prompt
		const { messageId } = await saveMessage(ctx, components.agent, {
			threadId,
			prompt: enrichedPrompt,
		});

		// Schedule response generation (the agent will include CSV context)
		await ctx.scheduler.runAfter(0, internal.agent.threads.generateResponse, {
			threadId,
			promptMessageId: messageId,
		});
	},
});
