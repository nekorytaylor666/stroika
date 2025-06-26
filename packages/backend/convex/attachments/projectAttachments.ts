import { v } from "convex/values";
import { query } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";

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
			taskIds.has(attachment.issueId)
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
				const [issue, uploader] = await Promise.all([
					ctx.db.get(attachment.issueId),
					ctx.db.get(attachment.uploadedBy),
				]);

				return {
					...attachment,
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

// Get stats for project attachments
export const getStats = query({
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
				recentUploads: 0,
			};
		}

		// Get all attachments for these tasks
		const allAttachments = await ctx.db
			.query("issueAttachments")
			.collect();

		// Filter to project attachments
		const projectAttachments = allAttachments.filter(att => 
			taskIds.has(att.issueId)
		);

		// Calculate stats
		const stats = {
			totalCount: projectAttachments.length,
			totalSize: projectAttachments.reduce((sum, att) => sum + att.fileSize, 0),
			byType: {} as Record<string, number>,
			recentUploads: 0,
		};

		// Count by type
		projectAttachments.forEach((attachment) => {
			const mimeType = attachment.mimeType.toLowerCase();
			let type = "other";

			if (mimeType.startsWith("image/")) {
				type = "image";
			} else if (mimeType.startsWith("video/")) {
				type = "video";
			} else if (
				mimeType.includes("pdf") ||
				mimeType.includes("word") ||
				mimeType.includes("document") ||
				mimeType.includes("text")
			) {
				type = "document";
			}

			stats.byType[type] = (stats.byType[type] || 0) + 1;
		});

		// Count recent uploads (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		stats.recentUploads = projectAttachments.filter(
			(att) => new Date(att.uploadedAt) > sevenDaysAgo,
		).length;

		return stats;
	},
});