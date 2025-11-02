import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

// Subtask template interface
interface SubtaskTemplate {
	id: string;
	title: string;
	description?: string;
	order: number;
	defaultStatusId?: string;
	defaultPriorityId?: string;
}

// Get all templates for organization
export const getAll = query({
	handler: async (ctx) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization) return [];

		const templates = await ctx.db
			.query("taskTemplates")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.order("desc")
			.collect();

		// Include creator information
		const populatedTemplates = await Promise.all(
			templates.map(async (template) => {
				const creator = await ctx.db.get(template.createdBy as Id<"users">);
				return {
					...template,
					creator,
					subtasksParsed: JSON.parse(template.subtasks) as SubtaskTemplate[],
				};
			}),
		);

		return populatedTemplates;
	},
});

// Get templates by category
export const getByCategory = query({
	args: { category: v.string() },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization) return [];

		const templates = await ctx.db
			.query("taskTemplates")
			.withIndex("by_category", (q) =>
				q.eq("organizationId", organization.id).eq("category", args.category),
			)
			.collect();

		// Include creator information and parse subtasks
		const populatedTemplates = await Promise.all(
			templates.map(async (template) => {
				const creator = await ctx.db.get(template.createdBy as Id<"users">);
				return {
					...template,
					creator,
					subtasksParsed: JSON.parse(template.subtasks) as SubtaskTemplate[],
				};
			}),
		);

		return populatedTemplates;
	},
});

// Get single template by ID
export const getById = query({
	args: { id: v.id("taskTemplates") },
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.id);
		if (!template) return null;

		const creator = await ctx.db.get(template.createdBy as Id<"users">);
		return {
			...template,
			creator,
			subtasksParsed: JSON.parse(template.subtasks) as SubtaskTemplate[],
		};
	},
});

// Create new template
export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		defaultTitle: v.string(),
		defaultDescription: v.optional(v.string()),
		defaultStatusId: v.optional(v.string()),
		defaultPriorityId: v.optional(v.string()),
		defaultLabelIds: v.array(v.string()),
		defaultAssigneeId: v.optional(v.string()),
		defaultProjectId: v.optional(v.string()),
		subtasks: v.array(
			v.object({
				id: v.string(),
				title: v.string(),
				description: v.optional(v.string()),
				order: v.number(),
				defaultStatusId: v.optional(v.string()),
				defaultPriorityId: v.optional(v.string()),
			}),
		),
		isPublic: v.boolean(),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization)
			throw new Error("User or organization not found");

		const templateId = await ctx.db.insert("taskTemplates", {
			organizationId: organization.id,
			name: args.name,
			description: args.description,
			category: args.category,
			defaultTitle: args.defaultTitle,
			defaultDescription: args.defaultDescription,
			defaultStatusId: args.defaultStatusId,
			defaultPriorityId: args.defaultPriorityId,
			defaultLabelIds: args.defaultLabelIds,
			defaultAssigneeId: args.defaultAssigneeId,
			defaultProjectId: args.defaultProjectId,
			subtasks: JSON.stringify(args.subtasks),
			createdBy: user._id,
			isPublic: args.isPublic,
			usageCount: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return templateId;
	},
});

// Update existing template
export const update = mutation({
	args: {
		id: v.id("taskTemplates"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		defaultTitle: v.optional(v.string()),
		defaultDescription: v.optional(v.string()),
		defaultStatusId: v.optional(v.string()),
		defaultPriorityId: v.optional(v.string()),
		defaultLabelIds: v.optional(v.array(v.string())),
		defaultAssigneeId: v.optional(v.string()),
		defaultProjectId: v.optional(v.string()),
		subtasks: v.optional(
			v.array(
				v.object({
					id: v.string(),
					title: v.string(),
					description: v.optional(v.string()),
					order: v.number(),
					defaultStatusId: v.optional(v.string()),
					defaultPriorityId: v.optional(v.string()),
				}),
			),
		),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");

		const template = await ctx.db.get(args.id);
		if (!template) throw new Error("Template not found");

		// Check if user has permission to edit
		if (template.createdBy !== user._id && !template.isPublic) {
			throw new Error("You don't have permission to edit this template");
		}

		const { id, subtasks, ...updates } = args;

		// If subtasks are provided, stringify them
		const updateData: any = {
			...updates,
			updatedAt: Date.now(),
		};

		if (subtasks !== undefined) {
			updateData.subtasks = JSON.stringify(subtasks);
		}

		await ctx.db.patch(id, updateData);
		return { success: true };
	},
});

// Delete template
export const deleteTemplate = mutation({
	args: { id: v.id("taskTemplates") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");

		const template = await ctx.db.get(args.id);
		if (!template) throw new Error("Template not found");

		// Check if user has permission to delete
		if (template.createdBy !== user._id) {
			throw new Error("You can only delete templates you created");
		}

		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// Duplicate template
export const duplicateTemplate = mutation({
	args: { id: v.id("taskTemplates") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization)
			throw new Error("User or organization not found");

		const template = await ctx.db.get(args.id);
		if (!template) throw new Error("Template not found");

		// Check if user has access to template
		if (
			template.organizationId !== organization.id ||
			(!template.isPublic && template.createdBy !== user._id)
		) {
			throw new Error("You don't have access to this template");
		}

		// Create a copy with modified name
		const duplicatedTemplateId = await ctx.db.insert("taskTemplates", {
			organizationId: organization.id,
			name: `${template.name} (копия)`,
			description: template.description,
			category: template.category,
			defaultTitle: template.defaultTitle,
			defaultDescription: template.defaultDescription,
			defaultStatusId: template.defaultStatusId,
			defaultPriorityId: template.defaultPriorityId,
			defaultLabelIds: template.defaultLabelIds,
			defaultAssigneeId: template.defaultAssigneeId,
			defaultProjectId: template.defaultProjectId,
			subtasks: template.subtasks, // JSON string is copied as-is
			createdBy: user._id,
			isPublic: false, // Duplicated templates start as private
			usageCount: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return duplicatedTemplateId;
	},
});

// Apply template to create a new task with subtasks
export const applyTemplate = mutation({
	args: {
		templateId: v.id("taskTemplates"),
		// Override values
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		statusId: v.optional(v.string()),
		assigneeId: v.optional(v.string()),
		priorityId: v.optional(v.string()),
		labelIds: v.optional(v.array(v.string())),
		projectId: v.optional(v.string()),
		dueDate: v.optional(v.string()),
		// Whether to create subtasks
		createSubtasks: v.boolean(),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization)
			throw new Error("User or organization not found");

		// Get template
		const template = await ctx.db.get(args.templateId);
		if (!template) throw new Error("Template not found");

		// Check if user has access to template
		if (
			template.organizationId !== organization.id ||
			(!template.isPublic && template.createdBy !== user._id)
		) {
			throw new Error("You don't have access to this template");
		}

		// Create main task
		const taskData = {
			organizationId: organization.id,
			identifier: `СТРФ-${Math.floor(Math.random() * 999)
				.toString()
				.padStart(3, "0")}`,
			title: args.title || template.defaultTitle,
			description: args.description || template.defaultDescription || "",
			statusId: args.statusId || template.defaultStatusId || "",
			assigneeId: args.assigneeId || template.defaultAssigneeId,
			priorityId: args.priorityId || template.defaultPriorityId || "",
			labelIds: args.labelIds || template.defaultLabelIds,
			projectId: args.projectId || template.defaultProjectId,
			dueDate: args.dueDate,
			createdAt: new Date().toISOString(),
			isConstructionTask: true,
			rank: Date.now().toString(),
		};

		const mainTaskId = await ctx.db.insert("issues", taskData);

		// Track activity
		await ctx.runMutation(api.activities.createActivity, {
			issueId: mainTaskId,
			userId: user._id,
			type: "created",
			newValue: taskData.title,
		});

		// Create subtasks if requested
		const createdSubtaskIds: Id<"issues">[] = [];
		if (args.createSubtasks) {
			const subtasks = JSON.parse(template.subtasks) as SubtaskTemplate[];

			for (const subtask of subtasks.sort((a, b) => a.order - b.order)) {
				const subtaskData = {
					organizationId: organization.id,
					identifier: `СТРФ-${Math.floor(Math.random() * 999)
						.toString()
						.padStart(3, "0")}`,
					title: subtask.title,
					description: subtask.description || "",
					statusId:
						subtask.defaultStatusId ||
						args.statusId ||
						template.defaultStatusId ||
						"",
					assigneeId: args.assigneeId || template.defaultAssigneeId,
					priorityId:
						subtask.defaultPriorityId ||
						args.priorityId ||
						template.defaultPriorityId ||
						"",
					labelIds: args.labelIds || template.defaultLabelIds,
					projectId: args.projectId || template.defaultProjectId,
					createdAt: new Date().toISOString(),
					isConstructionTask: true,
					parentTaskId: mainTaskId,
					rank: (Date.now() + subtask.order).toString(),
				};

				const subtaskId = await ctx.db.insert("issues", subtaskData);
				createdSubtaskIds.push(subtaskId);

				// Track subtask creation activity
				await ctx.runMutation(api.activities.createActivity, {
					issueId: mainTaskId,
					userId: user._id,
					type: "subtask_added",
					metadata: {
						subtaskId,
					},
				});
			}
		}

		// Increment template usage count
		await ctx.db.patch(args.templateId, {
			usageCount: template.usageCount + 1,
		});

		return {
			mainTaskId,
			subtaskIds: createdSubtaskIds,
		};
	},
});

// Get available categories
export const getCategories = query({
	handler: async (ctx) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization) return [];

		const templates = await ctx.db
			.query("taskTemplates")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Extract unique categories
		const categories = new Set<string>();
		templates.forEach((template) => {
			if (template.category) {
				categories.add(template.category);
			}
		});

		// Return sorted array with predefined construction categories
		const predefinedCategories = [
			"Фундамент",
			"Кровля",
			"Электрика",
			"Сантехника",
			"Отделка",
			"Фасад",
			"Ландшафт",
			"Общее",
		];

		// Combine predefined and custom categories
		const allCategories = Array.from(categories);
		predefinedCategories.forEach((cat) => {
			if (!allCategories.includes(cat)) {
				allCategories.push(cat);
			}
		});

		return allCategories;
	},
});
