import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export const removeDuplicateUsers = mutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		const emailGroups = new Map<string, typeof users>();

		// Group users by email
		for (const user of users) {
			if (!emailGroups.has(user.email)) {
				emailGroups.set(user.email, []);
			}
			emailGroups.get(user.email)!.push(user);
		}

		let deletedCount = 0;
		const deletedUsers: Array<{ email: string; deletedIds: string[] }> = [];

		// Process each group
		for (const [email, userGroup] of emailGroups) {
			if (userGroup.length > 1) {
				// Sort by creation time (keep oldest)
				userGroup.sort((a, b) => a._creationTime - b._creationTime);

				const keepUser = userGroup[0];
				const toDelete = userGroup.slice(1);

				const deletedIds: string[] = [];

				for (const user of toDelete) {
					// Check if user has any related data before deleting
					const hasIssues = await ctx.db
						.query("issues")
						.withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
						.first();

					const hasProjects = await ctx.db
						.query("constructionProjects")
						.filter((q) => q.eq(q.field("leadId"), user._id))
						.first();

					const hasComments = await ctx.db
						.query("issueComments")
						.filter((q) => q.eq(q.field("authorId"), user._id))
						.first();

					// Only delete if user has no related data
					if (!hasIssues && !hasProjects && !hasComments) {
						await ctx.db.delete(user._id);
						deletedCount++;
						deletedIds.push(user._id);
					}
				}

				if (deletedIds.length > 0) {
					deletedUsers.push({ email, deletedIds });
				}
			}
		}

		return {
			message: `Deleted ${deletedCount} duplicate users`,
			deletedUsers,
		};
	},
});

export const removeDuplicateIssues = mutation({
	args: {},
	handler: async (ctx) => {
		const issues = await ctx.db.query("issues").collect();
		const titleGroups = new Map<string, typeof issues>();

		// Group issues by title
		for (const issue of issues) {
			if (!titleGroups.has(issue.title)) {
				titleGroups.set(issue.title, []);
			}
			titleGroups.get(issue.title)!.push(issue);
		}

		let deletedCount = 0;
		const deletedIssues: Array<{ title: string; deletedIds: string[] }> = [];

		// Process each group
		for (const [title, issueGroup] of titleGroups) {
			if (issueGroup.length > 1) {
				// Sort by creation time (keep oldest)
				issueGroup.sort((a, b) => a._creationTime - b._creationTime);

				const keepIssue = issueGroup[0];
				const toDelete = issueGroup.slice(1);

				const deletedIds: string[] = [];

				for (const issue of toDelete) {
					// Check if issue has any related data before deleting
					const hasComments = await ctx.db
						.query("issueComments")
						.withIndex("by_issue", (q) => q.eq("issueId", issue._id))
						.first();

					const hasAttachments = await ctx.db
						.query("issueAttachments")
						.withIndex("by_issue", (q) => q.eq("issueId", issue._id))
						.first();

					const hasActivities = await ctx.db
						.query("issueActivities")
						.withIndex("by_issue", (q) => q.eq("issueId", issue._id))
						.first();

					// Only delete if issue has no related data
					if (!hasComments && !hasAttachments && !hasActivities) {
						await ctx.db.delete(issue._id);
						deletedCount++;
						deletedIds.push(issue._id);
					}
				}

				if (deletedIds.length > 0) {
					deletedIssues.push({ title, deletedIds });
				}
			}
		}

		return {
			message: `Deleted ${deletedCount} duplicate issues`,
			deletedIssues,
		};
	},
});

export const cleanupTestUsers = mutation({
	args: {},
	handler: async (ctx) => {
		// Remove test users (user@example.com)
		const testUsers = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), "user@example.com"))
			.collect();

		let deletedCount = 0;

		for (const user of testUsers) {
			// Check if user has any related data
			const hasIssues = await ctx.db
				.query("issues")
				.withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
				.first();

			const hasProjects = await ctx.db
				.query("constructionProjects")
				.filter((q) => q.eq(q.field("leadId"), user._id))
				.first();

			if (!hasIssues && !hasProjects) {
				await ctx.db.delete(user._id);
				deletedCount++;
			}
		}

		return {
			message: `Deleted ${deletedCount} test users`,
		};
	},
});

export const removeDuplicateStatuses = mutation({
	args: {},
	handler: async (ctx) => {
		const statuses = await ctx.db.query("status").collect();
		const nameGroups = new Map<string, typeof statuses>();

		// Group statuses by name
		for (const status of statuses) {
			if (!nameGroups.has(status.name)) {
				nameGroups.set(status.name, []);
			}
			nameGroups.get(status.name)!.push(status);
		}

		let deletedCount = 0;
		const deletedStatuses: Array<{ name: string; deletedIds: string[] }> = [];
		const statusMapping = new Map<Id<"status">, Id<"status">>(); // old ID -> kept ID

		// Process each group
		for (const [name, statusGroup] of nameGroups) {
			if (statusGroup.length > 1) {
				// Sort by creation time (keep oldest)
				statusGroup.sort((a, b) => a._creationTime - b._creationTime);

				const keepStatus = statusGroup[0];
				const toDelete = statusGroup.slice(1);

				const deletedIds: string[] = [];

				for (const status of toDelete) {
					// Map old ID to kept ID for updating references
					statusMapping.set(status._id, keepStatus._id);
					deletedIds.push(status._id);
				}

				if (deletedIds.length > 0) {
					deletedStatuses.push({ name, deletedIds });
				}
			}
		}

		// Update all issues to use the kept status IDs
		const issues = await ctx.db.query("issues").collect();
		for (const issue of issues) {
			if (statusMapping.has(issue.statusId)) {
				await ctx.db.patch(issue._id, {
					statusId: statusMapping.get(issue.statusId)!,
				});
			}
		}

		// Update all construction projects to use the kept status IDs
		const projects = await ctx.db.query("constructionProjects").collect();
		for (const project of projects) {
			if (statusMapping.has(project.statusId)) {
				await ctx.db.patch(project._id, {
					statusId: statusMapping.get(project.statusId)!,
				});
			}
		}

		// Now delete the duplicate statuses
		for (const [oldId, _] of statusMapping) {
			await ctx.db.delete(oldId as any);
			deletedCount++;
		}

		return {
			message: `Deleted ${deletedCount} duplicate statuses`,
			deletedStatuses,
		};
	},
});

export const removeDuplicatePriorities = mutation({
	args: {},
	handler: async (ctx) => {
		const priorities = await ctx.db.query("priorities").collect();
		const nameGroups = new Map<string, typeof priorities>();

		// Group priorities by name
		for (const priority of priorities) {
			if (!nameGroups.has(priority.name)) {
				nameGroups.set(priority.name, []);
			}
			nameGroups.get(priority.name)!.push(priority);
		}

		let deletedCount = 0;
		const deletedPriorities: Array<{ name: string; deletedIds: string[] }> = [];
		const priorityMapping = new Map<Id<"priorities">, Id<"priorities">>(); // old ID -> kept ID

		// Process each group
		for (const [name, priorityGroup] of nameGroups) {
			if (priorityGroup.length > 1) {
				// Sort by creation time (keep oldest)
				priorityGroup.sort((a, b) => a._creationTime - b._creationTime);

				const keepPriority = priorityGroup[0];
				const toDelete = priorityGroup.slice(1);

				const deletedIds: string[] = [];

				for (const priority of toDelete) {
					// Map old ID to kept ID for updating references
					priorityMapping.set(priority._id, keepPriority._id);
					deletedIds.push(priority._id);
				}

				if (deletedIds.length > 0) {
					deletedPriorities.push({ name, deletedIds });
				}
			}
		}

		// Update all issues to use the kept priority IDs
		const issues = await ctx.db.query("issues").collect();
		for (const issue of issues) {
			if (priorityMapping.has(issue.priorityId)) {
				await ctx.db.patch(issue._id, {
					priorityId: priorityMapping.get(issue.priorityId)!,
				});
			}
		}

		// Update all construction projects to use the kept priority IDs
		const projects = await ctx.db.query("constructionProjects").collect();
		for (const project of projects) {
			if (priorityMapping.has(project.priorityId)) {
				await ctx.db.patch(project._id, {
					priorityId: priorityMapping.get(project.priorityId)!,
				});
			}
		}

		// Now delete the duplicate priorities
		for (const [oldId, _] of priorityMapping) {
			await ctx.db.delete(oldId as any);
			deletedCount++;
		}

		return {
			message: `Deleted ${deletedCount} duplicate priorities`,
			deletedPriorities,
		};
	},
});

export const removeDuplicateLabels = mutation({
	args: {},
	handler: async (ctx) => {
		const labels = await ctx.db.query("labels").collect();
		const nameGroups = new Map<string, typeof labels>();

		// Group labels by name
		for (const label of labels) {
			if (!nameGroups.has(label.name)) {
				nameGroups.set(label.name, []);
			}
			nameGroups.get(label.name)!.push(label);
		}

		let deletedCount = 0;
		const deletedLabels: Array<{ name: string; deletedIds: string[] }> = [];
		const labelMapping = new Map<Id<"labels">, Id<"labels">>(); // old ID -> kept ID

		// Process each group
		for (const [name, labelGroup] of nameGroups) {
			if (labelGroup.length > 1) {
				// Sort by creation time (keep oldest)
				labelGroup.sort((a, b) => a._creationTime - b._creationTime);

				const keepLabel = labelGroup[0];
				const toDelete = labelGroup.slice(1);

				const deletedIds: string[] = [];

				for (const label of toDelete) {
					// Map old ID to kept ID for updating references
					labelMapping.set(label._id, keepLabel._id);
					deletedIds.push(label._id);
				}

				if (deletedIds.length > 0) {
					deletedLabels.push({ name, deletedIds });
				}
			}
		}

		// Update all issues to use the kept label IDs
		const issues = await ctx.db.query("issues").collect();
		for (const issue of issues) {
			const updatedLabelIds = issue.labelIds.map(
				(labelId) => labelMapping.get(labelId) || labelId,
			);

			// Remove duplicates from the array
			const uniqueLabelIds = Array.from(
				new Set(updatedLabelIds),
			) as Id<"labels">[];

			if (JSON.stringify(uniqueLabelIds) !== JSON.stringify(issue.labelIds)) {
				await ctx.db.patch(issue._id, {
					labelIds: uniqueLabelIds,
				});
			}
		}

		// Now delete the duplicate labels
		for (const [oldId, _] of labelMapping) {
			await ctx.db.delete(oldId as any);
			deletedCount++;
		}

		return {
			message: `Deleted ${deletedCount} duplicate labels`,
			deletedLabels,
		};
	},
});

export const addColorsToPriorities = mutation({
	args: {},
	handler: async (ctx) => {
		const priorities = await ctx.db.query("priorities").collect();

		const colorMap: Record<string, string> = {
			Критический: "#EF4444", // Red
			Высокий: "#F59E0B", // Orange
			Средний: "#3B82F6", // Blue
			Низкий: "#10B981", // Green
		};

		let updatedCount = 0;

		for (const priority of priorities) {
			const color = colorMap[priority.name];
			if (color) {
				await ctx.db.patch(priority._id, { color });
				updatedCount++;
			}
		}

		return {
			message: `Updated colors for ${updatedCount} priorities`,
		};
	},
});
