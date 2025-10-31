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
		// Get all issues (construction tasks) for this project
		const projectTasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.filter((q) => q.eq(q.field("projectId"), args.projectId))
			.collect();

		const taskIds = new Set(projectTasks.map((task) => task._id));

		// Get all attachments and filter to include:
		// 1. Attachments directly linked to project via projectId (issueId is optional)
		// 2. Attachments linked to project tasks via issueId
		const allAttachments = await ctx.db
			.query("issueAttachments")
			.order("desc")
			.collect();

		// Filter to only include attachments from our project's tasks
		let filteredItems = result.page.filter(
			(attachment) =>
				attachment.projectId && attachment.projectId === args.projectId,
		);

		console.log(filteredItems);

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

		// Manually paginate after applying filters
		const pageSize = args.paginationOpts.numItems;
		const startIndex = 0; // Cursor handling would go here if needed
		const page = filteredItems.slice(startIndex, startIndex + pageSize);
		const isDone = startIndex + pageSize >= filteredItems.length;

		// Enrich attachments with related data
		const project = await ctx.db.get(args.projectId);
		const enrichedAttachments = await Promise.all(
			page.map(async (attachment) => {
				const [issue, uploader, fileUrl] = await Promise.all([
					attachment.issueId ? ctx.db.get(attachment.issueId as any) : null,
					ctx.db.get(attachment.uploadedBy as any),
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
		// Since we're manually paginating, use the last item's _id as cursor
		const continueCursor = isDone
			? null
			: enrichedAttachments.length > 0
				? enrichedAttachments[enrichedAttachments.length - 1]?._id
				: null;

		return {
			page: enrichedAttachments,
			isDone,
			continueCursor,
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

		// Get all attachments and filter to include:
		// 1. Attachments directly linked to project via projectId (issueId is optional)
		// 2. Attachments linked to project tasks via issueId
		const allAttachments = await ctx.db
			.query("issueAttachments")
			.order("desc")
			.collect();

		let filteredAttachments = allAttachments.filter(
			(att) => att.projectId && att.projectId === args.projectId,
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
					attachment.issueId ? ctx.db.get(attachment.issueId) : null,
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

		// Get all attachments and filter to include:
		// 1. Attachments directly linked to project via projectId (issueId is optional)
		// 2. Attachments linked to project tasks via issueId
		const allAttachments = await ctx.db.query("issueAttachments").collect();

		// Filter to project attachments
		const projectAttachments = allAttachments.filter((att) => {
			// Directly linked to project
			if (att.projectId === args.projectId) {
				return true;
			}
			// Linked to a project task (issueId must exist for this to match)
			if (att.issueId && taskIds.has(att.issueId as any)) {
				return true;
			}
			return false;
		});

		// Calculate stats
		const stats = {
			totalCount: projectAttachments.length,
			totalSize: projectAttachments.reduce((sum, att) => sum + att.fileSize, 0),
			byType: {} as Record<string, number>,
		};

		// Count by type
		for (const attachment of projectAttachments) {
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
		}

		return stats;
	},
});
