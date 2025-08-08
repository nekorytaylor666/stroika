"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { action } from "./_generated/server";

// VAPID keys will be retrieved from Convex environment variables

export const sendPushNotification = action({
	args: {
		subscriptions: v.array(
			v.object({
				_id: v.id("pushSubscriptions"),
				userId: v.id("users"),
				endpoint: v.string(),
				keys: v.object({
					p256dh: v.string(),
					auth: v.string(),
				}),
				userAgent: v.optional(v.string()),
				createdAt: v.number(),
				updatedAt: v.number(),
			}),
		),
		title: v.string(),
		body: v.string(),
		data: v.optional(
			v.object({
				issueId: v.optional(v.id("issues")),
				projectId: v.optional(v.id("constructionProjects")),
				commentId: v.optional(v.id("issueComments")),
				url: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		// Get VAPID keys from environment
		const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
		const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
		const VAPID_SUBJECT =
			process.env.VAPID_SUBJECT || "mailto:admin@stroika.app";

		if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
			console.error("VAPID keys not configured in Convex environment");
			return [];
		}

		// Set VAPID details
		webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

		const notification = {
			title: args.title,
			body: args.body,
			icon: "/favicon.svg",
			badge: "/favicon.svg",
			data: args.data,
			actions: [
				{
					action: "view",
					title: "Просмотреть",
				},
				{
					action: "dismiss",
					title: "Отклонить",
				},
			],
		};

		// Send notification to each subscription
		const results = await Promise.allSettled(
			args.subscriptions.map(async (subscription) => {
				try {
					await webpush.sendNotification(
						{
							endpoint: subscription.endpoint,
							keys: subscription.keys,
						},
						JSON.stringify(notification),
					);
					return { success: true, subscriptionId: subscription._id };
				} catch (error: any) {
					// Handle expired subscriptions
					if (error.statusCode === 410) {
						// Delete expired subscription
						await ctx.runAction(
							api.notificationsAction.removeExpiredSubscription,
							{
								subscriptionId: subscription._id,
							},
						);
					}
					return {
						success: false,
						subscriptionId: subscription._id,
						error: error.message,
					};
				}
			}),
		);

		return results;
	},
});

// Helper action to remove expired subscriptions
export const removeExpiredSubscription = action({
	args: {
		subscriptionId: v.id("pushSubscriptions"),
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(api.notifications.deleteSubscription, {
			subscriptionId: args.subscriptionId,
		});
	},
});
