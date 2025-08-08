import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

// Send notification when task is assigned
export const notifyTaskAssigned = internalMutation({
	args: {
		issueId: v.id("issues"),
		assigneeId: v.id("users"),
		assignedBy: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get issue details
		const issue = await ctx.db.get(args.issueId);
		if (!issue) return;

		// Get assigner details
		const assigner = await ctx.db.get(args.assignedBy);
		if (!assigner) return;

		// Don't notify if user assigned task to themselves
		if (args.assigneeId === args.assignedBy) return;

		// Send notification
		await ctx.runMutation(api.notifications.sendNotification, {
			userId: args.assigneeId,
			title: "Новая задача",
			body: `${assigner.name} назначил вам задачу: ${issue.title}`,
			type: "task_assigned",
			data: {
				issueId: args.issueId,
				url: `/issues/${issue.identifier}`,
			},
		});
	},
});

// Send notification when task status changes
export const notifyTaskStatusChanged = internalMutation({
	args: {
		issueId: v.id("issues"),
		oldStatusId: v.id("status"),
		newStatusId: v.id("status"),
		changedBy: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get issue details
		const issue = await ctx.db.get(args.issueId);
		if (!issue || !issue.assigneeId) return;

		// Don't notify if user changed their own task
		if (issue.assigneeId === args.changedBy) return;

		// Get status details
		const oldStatus = await ctx.db.get(args.oldStatusId);
		const newStatus = await ctx.db.get(args.newStatusId);
		const changer = await ctx.db.get(args.changedBy);

		if (!oldStatus || !newStatus || !changer) return;

		// Send notification
		await ctx.runMutation(api.notifications.sendNotification, {
			userId: issue.assigneeId,
			title: "Статус задачи изменен",
			body: `${changer.name} изменил статус задачи "${issue.title}" с "${oldStatus.name}" на "${newStatus.name}"`,
			type: "task_status_changed",
			data: {
				issueId: args.issueId,
				url: `/issues/${issue.identifier}`,
			},
		});
	},
});

// Send notification when task is commented
export const notifyTaskCommented = internalMutation({
	args: {
		issueId: v.id("issues"),
		commentId: v.id("issueComments"),
		commentAuthorId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get issue details
		const issue = await ctx.db.get(args.issueId);
		if (!issue) return;

		// Get comment and author details
		const comment = await ctx.db.get(args.commentId);
		const author = await ctx.db.get(args.commentAuthorId);
		if (!comment || !author) return;

		// Collect users to notify
		const usersToNotify = new Set<Id<"users">>();

		// Notify assignee
		if (issue.assigneeId && issue.assigneeId !== args.commentAuthorId) {
			usersToNotify.add(issue.assigneeId);
		}

		// Notify other commenters
		const otherComments = await ctx.db
			.query("issueComments")
			.withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
			.collect();

		for (const otherComment of otherComments) {
			if (otherComment.authorId !== args.commentAuthorId) {
				usersToNotify.add(otherComment.authorId);
			}
		}

		// Send notifications
		for (const userId of usersToNotify) {
			await ctx.runMutation(api.notifications.sendNotification, {
				userId,
				title: "Новый комментарий",
				body: `${author.name} прокомментировал задачу "${issue.title}"`,
				type: "task_commented",
				data: {
					issueId: args.issueId,
					commentId: args.commentId,
					url: `/issues/${issue.identifier}`,
				},
			});
		}
	},
});

// Send notification when task is due soon
export const notifyTaskDueSoon = internalMutation({
	args: {
		issueId: v.id("issues"),
		hoursUntilDue: v.number(),
	},
	handler: async (ctx, args) => {
		// Get issue details
		const issue = await ctx.db.get(args.issueId);
		if (!issue || !issue.assigneeId || !issue.dueDate) return;

		const dueDate = new Date(issue.dueDate);
		const formattedDate = dueDate.toLocaleDateString("ru-RU");

		let message = "";
		if (args.hoursUntilDue <= 0) {
			message = `Задача "${issue.title}" просрочена!`;
		} else if (args.hoursUntilDue < 24) {
			message = `Задача "${issue.title}" должна быть выполнена через ${args.hoursUntilDue} ч.`;
		} else {
			const days = Math.floor(args.hoursUntilDue / 24);
			message = `Задача "${issue.title}" должна быть выполнена через ${days} дн. (${formattedDate})`;
		}

		// Send notification
		await ctx.runMutation(api.notifications.sendNotification, {
			userId: issue.assigneeId,
			title: "Приближается дедлайн",
			body: message,
			type: "task_due_soon",
			data: {
				issueId: args.issueId,
				url: `/issues/${issue.identifier}`,
			},
		});
	},
});
