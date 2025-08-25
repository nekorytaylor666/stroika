import { v } from "convex/values";
import { api } from "./_generated/api";
import { type Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";

// Subscribe to push notifications
export const subscribeToPush = mutation({
	args: {
		subscription: v.object({
			endpoint: v.string(),
			keys: v.object({
				p256dh: v.string(),
				auth: v.string(),
			}),
		}),
		userAgent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}

		// Check if subscription already exists
		const existingSubscription = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) =>
				q.eq("endpoint", args.subscription.endpoint),
			)
			.unique();

		if (existingSubscription) {
			// Update existing subscription
			await ctx.db.patch(existingSubscription._id, {
				keys: args.subscription.keys,
				userAgent: args.userAgent,
				updatedAt: Date.now(),
			});
			return existingSubscription._id;
		}

		// Create new subscription
		const subscriptionId = await ctx.db.insert("pushSubscriptions", {
			userId: user._id,
			endpoint: args.subscription.endpoint,
			keys: args.subscription.keys,
			userAgent: args.userAgent,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Ensure notification preferences exist
		const preferences = await ctx.db
			.query("notificationPreferences")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!preferences) {
			await ctx.db.insert("notificationPreferences", {
				userId: user._id,
				taskAssigned: true,
				taskStatusChanged: true,
				taskCommented: true,
				taskDueSoon: true,
				projectUpdates: true,
				pushEnabled: true,
				emailEnabled: false,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}

		return subscriptionId;
	},
});

// Unsubscribe from push notifications
export const unsubscribeFromPush = mutation({
	args: {
		endpoint: v.string(),
	},
	handler: async (ctx, args) => {
		// We don't need the full user object for this operation
		// Just verify authentication
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthenticated");
		}

		const subscription = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();

		if (subscription) {
			await ctx.db.delete(subscription._id);
		}
	},
});

// Get notification preferences
export const getNotificationPreferences = query({
	handler: async (ctx) => {
		try {
			const user = await getCurrentUser(ctx);
			if (!user) {
				return null;
			}

			const preferences = await ctx.db
				.query("notificationPreferences")
				.withIndex("by_user", (q) => q.eq("userId", user._id))
				.unique();

			return preferences;
		} catch (error) {
			// Return null if user is not authenticated
			return null;
		}
	},
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
	args: {
		taskAssigned: v.optional(v.boolean()),
		taskStatusChanged: v.optional(v.boolean()),
		taskCommented: v.optional(v.boolean()),
		taskDueSoon: v.optional(v.boolean()),
		projectUpdates: v.optional(v.boolean()),
		pushEnabled: v.optional(v.boolean()),
		emailEnabled: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const preferences = await ctx.db
			.query("notificationPreferences")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (preferences) {
			await ctx.db.patch(preferences._id, {
				...args,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert("notificationPreferences", {
				userId: user._id,
				taskAssigned: args.taskAssigned ?? true,
				taskStatusChanged: args.taskStatusChanged ?? true,
				taskCommented: args.taskCommented ?? true,
				taskDueSoon: args.taskDueSoon ?? true,
				projectUpdates: args.projectUpdates ?? true,
				pushEnabled: args.pushEnabled ?? true,
				emailEnabled: args.emailEnabled ?? false,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}
	},
});

// Get user's notifications
export const getNotifications = query({
	args: {
		limit: v.optional(v.number()),
		unreadOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		try {
			const user = await getCurrentUser(ctx);
			if (!user) {
				return [];
			}

			let query = ctx.db
				.query("notifications")
				.withIndex("by_user", (q) => q.eq("userId", user._id));

			if (args.unreadOnly) {
				query = ctx.db
					.query("notifications")
					.withIndex("by_user_and_read", (q) =>
						q.eq("userId", user._id).eq("read", false),
					);
			}

			const notifications = await query.order("desc").take(args.limit ?? 50);

			return notifications;
		} catch (error) {
			// Return empty array if user is not authenticated
			return [];
		}
	},
});

// Mark notification as read
export const markNotificationAsRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const notification = await ctx.db.get(args.notificationId);
		if (!notification) {
			throw new Error("Notification not found");
		}

		await ctx.db.patch(args.notificationId, {
			read: true,
		});
	},
});

// Mark all notifications as read
export const markAllNotificationsAsRead = mutation({
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) =>
				q.eq("userId", user._id).eq("read", false),
			)
			.collect();

		for (const notification of unreadNotifications) {
			await ctx.db.patch(notification._id, {
				read: true,
			});
		}
	},
});

// Delete subscription (internal use)
export const deleteSubscription = mutation({
	args: {
		subscriptionId: v.id("pushSubscriptions"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.subscriptionId);
	},
});

// Internal function to create and send notification
export const sendNotification = mutation({
	args: {
		userId: v.id("users"),
		title: v.string(),
		body: v.string(),
		type: v.union(
			v.literal("task_assigned"),
			v.literal("task_status_changed"),
			v.literal("task_commented"),
			v.literal("task_due_soon"),
			v.literal("task_priority_changed"),
			v.literal("project_update"),
		),
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
		// Check user preferences
		const preferences = await ctx.db
			.query("notificationPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		if (!preferences?.pushEnabled) {
			return;
		}

		// Check if this notification type is enabled
		const typeToPreferenceMap: Record<
			string,
			keyof Doc<"notificationPreferences">
		> = {
			task_assigned: "taskAssigned",
			task_status_changed: "taskStatusChanged",
			task_commented: "taskCommented",
			task_due_soon: "taskDueSoon",
			task_priority_changed: "taskStatusChanged", // Use same preference as status change
			project_update: "projectUpdates",
		};

		const preferenceKey = typeToPreferenceMap[args.type];
		if (
			preferenceKey &&
			!preferences[preferenceKey as keyof typeof preferences]
		) {
			return;
		}

		// Store notification in database
		await ctx.db.insert("notifications", {
			userId: args.userId,
			title: args.title,
			body: args.body,
			type: args.type,
			data: args.data,
			read: false,
			createdAt: Date.now(),
		});

		// Get user's push subscriptions
		const subscriptions = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		// Send push notification to all user's devices
		// This will be handled by the action that calls the Push API
		if (subscriptions.length > 0) {
			// Clean subscriptions to remove _creationTime field
			const cleanedSubscriptions = subscriptions.map((sub) => ({
				_id: sub._id,
				userId: sub.userId,
				endpoint: sub.endpoint,
				keys: sub.keys,
				userAgent: sub.userAgent,
				createdAt: sub.createdAt,
				updatedAt: sub.updatedAt,
			}));

			await ctx.scheduler.runAfter(
				0,
				api.notificationsAction.sendPushNotification,
				{
					subscriptions: cleanedSubscriptions,
					title: args.title,
					body: args.body,
					data: args.data,
				},
			);
		}
	},
});

// Send test notification to current user
export const sendTestNotification = mutation({
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		// Check if user has push notifications enabled
		const preferences = await ctx.db
			.query("notificationPreferences")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!preferences?.pushEnabled) {
			throw new Error(
				"Push notifications are disabled. Please enable them in settings.",
			);
		}

		// Check if user has any push subscriptions
		const subscriptions = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		if (subscriptions.length === 0) {
			throw new Error(
				"No push subscription found. Please enable notifications in your browser.",
			);
		}

		console.log(
			`Found ${subscriptions.length} subscription(s) for user ${user._id}`,
		);
		subscriptions.forEach((sub) => {
			console.log("Subscription endpoint:", sub.endpoint);
		});

		// Send test notification
		await ctx.runMutation(api.notifications.sendNotification, {
			userId: user._id,
			title: "Test Notification 🔔",
			body: `This is a test notification sent at ${new Date().toLocaleTimeString("ru-RU")}`,
			type: "project_update",
			data: {
				url: "/settings/notifications",
			},
		});

		return {
			success: true,
			message: "Test notification sent successfully!",
			subscriptionCount: subscriptions.length,
		};
	},
});
