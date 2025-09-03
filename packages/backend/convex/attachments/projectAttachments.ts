import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

// Get paginated attachments for a construction project
export const getPaginated = query({
	args: {
		projectId: v.id("constructionProjects"),
		search: v.optional(v.string()),
		fileType: v.optional(v.string()),
		uploaderId: v.optional(v.id("users")),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		// First, get all issues (construction tasks) for this project
		const projectTasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.filter((q) => q.eq(q.field("projectId"), args.projectId))
			.collect();

		const taskIds = new Set(projectTasks.map((task) => task._id));

		// If no tasks, return empty results
		if (taskIds.size === 0) {
			return {
				page: [],
				isDone: true,
				continueCursor: null,
			};
		}

		// Get paginated attachments
		// Note: We query all attachments and filter client-side because
		// Convex doesn't support OR queries or filtering by array membership
		const result = await ctx.db
			.query("issueAttachments")
			.order("desc")
			.paginate(args.paginationOpts);

		// Filter to only include attachments from our project's tasks
		let filteredItems = result.page.filter((attachment) =>
			taskIds.has(attachment.issueId),
		);

		// Apply search filter
		if (args.search) {
			const searchLower = args.search.toLowerCase();
			filteredItems = filteredItems.filter((attachment) =>
				attachment.fileName.toLowerCase().includes(searchLower),
			);
		}

		// Apply file type filter
		if (args.fileType && args.fileType !== "all") {
			filteredItems = filteredItems.filter((attachment) => {
				const mimeType = attachment.mimeType.toLowerCase();
				switch (args.fileType) {
					case "image":
						return mimeType.startsWith("image/");
					case "video":
						return mimeType.startsWith("video/");
					case "document":
						return (
							mimeType.includes("pdf") ||
							mimeType.includes("word") ||
							mimeType.includes("document") ||
							mimeType.includes("text")
						);
					default:
						return true;
				}
			});
		}

		// Apply uploader filter
		if (args.uploaderId) {
			filteredItems = filteredItems.filter(
				(attachment) => attachment.uploadedBy === args.uploaderId,
			);
		}

		// Apply date range filter
		if (args.startDate || args.endDate) {
			filteredItems = filteredItems.filter((attachment) => {
				const uploadDate = new Date(attachment.uploadedAt);
				if (args.startDate && uploadDate < new Date(args.startDate)) {
					return false;
				}
				if (args.endDate && uploadDate > new Date(args.endDate)) {
					return false;
				}
				return true;
			});
		}

		// Enrich attachments with related data
		const project = await ctx.db.get(args.projectId);
		const enrichedAttachments = await Promise.all(
			filteredItems.map(async (attachment) => {
				const [issue, uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.issueId),
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);

				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl,
					issue: issue
						? {
								_id: issue._id,
								identifier: issue.identifier,
								title: issue.title,
								isConstructionTask: true,
							}
						: null,
					uploader: uploader
						? {
								_id: uploader._id,
								name: uploader.name,
								email: uploader.email,
								image: uploader.avatarUrl,
							}
						: null,
					constructionProject: project
						? {
								_id: project._id,
								name: project.name,
							}
						: null,
				};
			}),
		);

		// Return in the correct format for usePaginatedQuery
		return {
			page: enrichedAttachments,
			isDone: result.isDone,
			continueCursor: result.continueCursor,
		};
	},
});

// Get all attachments for a project (non-paginated with cursor)
export const getAllForProject = query({
	args: {
		projectId: v.id("constructionProjects"),
		search: v.optional(v.string()),
		fileType: v.optional(v.string()),
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;
		const offset = args.cursor || 0;

		// Get all tasks for this project
		const projectTasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.filter((q) => q.eq(q.field("projectId"), args.projectId))
			.collect();

		const taskIds = new Set(projectTasks.map((task) => task._id));

		if (taskIds.size === 0) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}

		// Get all attachments and filter
		const allAttachments = await ctx.db
			.query("issueAttachments")
			.order("desc")
			.collect();

		let filteredAttachments = allAttachments.filter((att) =>
			taskIds.has(att.issueId),
		);

		// Apply search filter
		if (args.search) {
			const searchLower = args.search.toLowerCase();
			filteredAttachments = filteredAttachments.filter((att) =>
				att.fileName.toLowerCase().includes(searchLower),
			);
		}

		// Apply file type filter
		if (args.fileType && args.fileType !== "all") {
			filteredAttachments = filteredAttachments.filter((att) => {
				const mimeType = att.mimeType.toLowerCase();
				switch (args.fileType) {
					case "image":
						return mimeType.startsWith("image/");
					case "pdf":
						return mimeType.includes("pdf");
					case "document":
						return (
							mimeType.includes("word") ||
							mimeType.includes("document") ||
							mimeType.includes("text")
						);
					case "spreadsheet":
						return (
							mimeType.includes("sheet") ||
							mimeType.includes("excel") ||
							mimeType.includes("csv")
						);
					default:
						return true;
				}
			});
		}

		// Apply pagination
		const paginatedItems = filteredAttachments.slice(offset, offset + limit);
		const hasMore = offset + limit < filteredAttachments.length;

		// Enrich with related data
		const enrichedItems = await Promise.all(
			paginatedItems.map(async (attachment) => {
				const [issue, uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.issueId),
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);

				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					issue: issue
						? {
								_id: issue._id,
								identifier: issue.identifier,
								title: issue.title,
								isConstructionTask: true,
							}
						: null,
					uploader: uploader
						? {
								_id: uploader._id,
								name: uploader.name,
								email: uploader.email,
								image: uploader.avatarUrl,
							}
						: null,
				};
			}),
		);

		return {
			items: enrichedItems,
			nextCursor: hasMore ? offset + limit : null,
			hasMore,
		};
	},
});

// Get stats for project attachments
export const getProjectStats = query({
	args: {
		projectId: v.id("constructionProjects"),
	},
	handler: async (ctx, args) => {
		// Get all tasks for this project
		const projectTasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.filter((q) => q.eq(q.field("projectId"), args.projectId))
			.collect();

		const taskIds = new Set(projectTasks.map((task) => task._id));

		if (taskIds.size === 0) {
			return {
				totalCount: 0,
				totalSize: 0,
				byType: {},
			};
		}

		// Get all attachments for these tasks
		const allAttachments = await ctx.db.query("issueAttachments").collect();

		// Filter to project attachments
		const projectAttachments = allAttachments.filter((att) =>
			taskIds.has(att.issueId),
		);

		// Calculate stats
		const stats = {
			totalCount: projectAttachments.length,
			totalSize: projectAttachments.reduce((sum, att) => sum + att.fileSize, 0),
			byType: {} as Record<string, number>,
		};

		// Count by type
		projectAttachments.forEach((attachment) => {
			const mimeType = attachment.mimeType.toLowerCase();
			let type = "other";

			if (mimeType.startsWith("image/")) {
				type = "image";
			} else if (mimeType.includes("pdf")) {
				type = "pdf";
			} else if (
				mimeType.includes("word") ||
				mimeType.includes("document") ||
				mimeType.includes("text")
			) {
				type = "document";
			} else if (
				mimeType.includes("sheet") ||
				mimeType.includes("excel") ||
				mimeType.includes("csv")
			) {
				type = "spreadsheet";
			}

			stats.byType[type] = (stats.byType[type] || 0) + 1;
		});

		return stats;
	},
});
