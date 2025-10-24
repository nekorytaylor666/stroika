import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

export const getAllAttachments = query({
	args: {
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
		search: v.optional(v.string()),
		fileType: v.optional(v.string()),
		uploaderId: v.optional(v.id("users")),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;

		// Start with all attachments
		let attachmentsQuery = ctx.db.query("issueAttachments");

		// Apply pagination if cursor is provided
		if (args.cursor !== undefined) {
			attachmentsQuery = attachmentsQuery.filter((q) =>
				q.gte(q.field("uploadedAt"), args.cursor ?? 0),
			);
		}

		// Get attachments
		const attachments = await attachmentsQuery.take(limit + 1);

		// Check if there are more items
		const hasMore = attachments.length > limit;
		const items = hasMore ? attachments.slice(0, limit) : attachments;

		// Filter by search term if provided
		let filteredItems = items;
		if (args.search) {
			const searchLower = args.search.toLowerCase();
			filteredItems = items.filter((attachment) =>
				attachment.fileName.toLowerCase().includes(searchLower),
			);
		}

		// Filter by file type if provided
		if (args.fileType) {
			filteredItems = filteredItems.filter((attachment) => {
				const mimeType = attachment.mimeType.toLowerCase();
				switch (args.fileType) {
					case "image":
						return mimeType.startsWith("image/");
					case "pdf":
						return mimeType === "application/pdf";
					case "document":
						return (
							mimeType.includes("word") ||
							mimeType.includes("document") ||
							mimeType.includes("text")
						);
					case "spreadsheet":
						return (
							mimeType.includes("excel") ||
							mimeType.includes("spreadsheet") ||
							mimeType === "text/csv"
						);
					default:
						return true;
				}
			});
		}

		// Filter by uploader if provided
		if (args.uploaderId) {
			filteredItems = filteredItems.filter(
				(attachment) => attachment.uploadedBy === args.uploaderId,
			);
		}

		// Filter by date range if provided
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

		// Fetch related data for each attachment
		const enrichedAttachments = await Promise.all(
			filteredItems.map(async (attachment) => {
				const [issue, uploader, fileUrl] = await Promise.all([
					attachment.issueId ? ctx.db.get(attachment.issueId) : null,
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);

				// Check if it's a construction task
				const isConstructionTask = issue?.isConstructionTask || false;
				let constructionProject = null;

				// For construction tasks, try to find the related project
				if (isConstructionTask && issue?.projectId) {
					// Construction tasks might have a projectId that references a construction project
					constructionProject = await ctx.db.get(issue.projectId);
				}

				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					issue: issue
						? {
							_id: issue._id,
							identifier: issue.identifier,
							title: issue.title,
							isConstructionTask,
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
					constructionProject: constructionProject
						? {
							_id: constructionProject._id,
							name: constructionProject.name,
						}
						: null,
				};
			}),
		);

		const nextCursor = hasMore ? items[items.length - 1].uploadedAt : null;

		return {
			items: enrichedAttachments,
			nextCursor,
			hasMore,
		};
	},
});

export const getAttachmentStats = query({
	handler: async (ctx) => {
		const attachments = await ctx.db.query("issueAttachments").collect();

		// Calculate stats
		const stats = {
			totalCount: attachments.length,
			totalSize: attachments.reduce((sum, att) => sum + att.fileSize, 0),
			byType: {} as Record<string, number>,
			recentUploads: 0,
		};

		// Count by type
		attachments.forEach((attachment) => {
			const mimeType = attachment.mimeType.toLowerCase();
			let type = "other";

			if (mimeType.startsWith("image/")) {
				type = "image";
			} else if (mimeType === "application/pdf") {
				type = "pdf";
			} else if (
				mimeType.includes("word") ||
				mimeType.includes("document") ||
				mimeType.includes("text")
			) {
				type = "document";
			} else if (
				mimeType.includes("excel") ||
				mimeType.includes("spreadsheet") ||
				mimeType === "text/csv"
			) {
				type = "spreadsheet";
			}

			stats.byType[type] = (stats.byType[type] || 0) + 1;
		});

		// Count recent uploads (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		stats.recentUploads = attachments.filter(
			(att) => new Date(att.uploadedAt) > sevenDaysAgo,
		).length;

		return stats;
	},
});

export const getProjectAttachments = query({
	args: {
		projectId: v.id("constructionProjects"),
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
		search: v.optional(v.string()),
		fileType: v.optional(v.string()),
		uploaderId: v.optional(v.id("users")),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;

		// First, get all issues (construction tasks) for this project
		const projectTasks = await ctx.db
			.query("issues")
			.filter((q) =>
				q.and(
					q.eq(q.field("isConstructionTask"), true),
					q.eq(q.field("projectId"), args.projectId),
				),
			)
			.collect();

		// Get task IDs
		const taskIds = projectTasks.map((task) => task._id);

		// If no tasks, return empty results
		if (taskIds.length === 0) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}

		// Get all attachments for these tasks
		let allAttachments: Doc<"issueAttachments">[] = [];
		for (const taskId of taskIds) {
			const taskAttachments = await ctx.db
				.query("issueAttachments")
				.filter((q) => q.eq(q.field("issueId"), taskId))
				.collect();
			allAttachments = allAttachments.concat(taskAttachments);
		}

		// Sort by upload date (newest first)
		allAttachments.sort((a, b) => b.uploadedAt - a.uploadedAt);

		// Apply cursor-based pagination
		if (args.cursor !== undefined) {
			allAttachments = allAttachments.filter(
				(att) => att.uploadedAt < args.cursor!,
			);
		}

		// Take limit + 1 to check if there are more
		const paginatedAttachments = allAttachments.slice(0, limit + 1);
		const hasMore = paginatedAttachments.length > limit;
		const items = hasMore
			? paginatedAttachments.slice(0, limit)
			: paginatedAttachments;

		// Apply filters
		let filteredItems = items;

		// Filter by search term
		if (args.search) {
			const searchLower = args.search.toLowerCase();
			filteredItems = filteredItems.filter((attachment) =>
				attachment.fileName.toLowerCase().includes(searchLower),
			);
		}

		// Filter by file type
		if (args.fileType) {
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

		// Filter by uploader
		if (args.uploaderId) {
			filteredItems = filteredItems.filter(
				(attachment) => attachment.uploadedBy === args.uploaderId,
			);
		}

		// Filter by date range
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
					constructionProject: project
						? {
							_id: project._id,
							name: project.name,
						}
						: null,
				};
			}),
		);

		const nextCursor =
			hasMore && items.length > 0 ? items[items.length - 1].uploadedAt : null;

		return {
			items: enrichedAttachments,
			nextCursor,
			hasMore,
		};
	},
});

export const getAttachmentById = query({
	args: { id: v.id("issueAttachments") },
	handler: async (ctx, args) => {
		const attachment = await ctx.db.get(args.id);
		if (!attachment) {
			throw new Error("Attachment not found");
		}

		const [issue, uploader, fileUrl] = await Promise.all([
			attachment.issueId ? ctx.db.get(attachment.issueId) : null,
			ctx.db.get(attachment.uploadedBy),
			ctx.storage.getUrl(attachment.fileUrl as any),
		]);

		return {
			...attachment,
			fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
			issue,
			uploader,
		};
	},
});
