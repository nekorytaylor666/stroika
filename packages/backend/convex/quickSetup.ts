import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Quick setup for authenticated user to join the seeded organization
export const joinAsOwner = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// First try to get the user using auth.getUserId
		const authUserId = await auth.getUserId(ctx);
		let user = null;
		let userEmail = null;

		if (authUserId) {
			// Try to get user by auth ID (this is likely in the users table)
			const userById = await ctx.db.get(authUserId);
			if (userById && "email" in userById) {
				user = userById as any;
				userEmail = user.email;
			}
		}

		if (!user) {
			// Fall back to identity-based lookup
			const identityEmail =
				(typeof identity.email === "string" ? identity.email : null) ||
				(typeof identity.preferredUsername === "string"
					? identity.preferredUsername
					: null) ||
				(typeof identity.emailVerified === "string"
					? identity.emailVerified
					: null) ||
				(typeof identity.subject === "string" ? identity.subject : null) ||
				(typeof identity.sub === "string" ? identity.sub : null);

			if (!identityEmail) {
				throw new Error("No email found in identity or user record");
			}

			userEmail = identityEmail;

			// Check if user already exists by email
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", identityEmail))
				.first();
		}

		// Get or create the demo organization
		let organization = await ctx.db
			.query("organizations")
			.filter((q) => q.eq(q.field("slug"), "stroycomplex"))
			.first();

		if (!organization) {
			// Create a temporary user first to be the owner
			const tempUserId = await ctx.db.insert("users", {
				name: "Temp Owner",
				email: "temp-owner@stroycomplex.ru",
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=temp",
				status: "online",
				roleId: undefined as any,
				joinedDate: new Date().toISOString(),
				teamIds: [],
				position: "Temp",
				currentOrganizationId: undefined as any,
				isActive: false,
				lastLogin: new Date().toISOString(),
			});

			// Create the organization
			const organizationId = await ctx.db.insert("organizations", {
				name: "СтройКомплекс",
				slug: "stroycomplex",
				description: "Демо организация для тестирования",
				logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stroycomplex",
				website: "https://stroycomplex.ru",
				ownerId: tempUserId,
				settings: {
					allowInvites: true,
					requireEmailVerification: false,
					defaultRoleId: undefined,
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});

			organization = await ctx.db.get(organizationId);
			if (!organization) {
				throw new Error("Failed to create organization");
			}

			// Create default roles
			const roles = [
				{
					name: "admin",
					displayName: "Администратор",
					description: "Полный доступ",
				},
				{
					name: "manager",
					displayName: "Менеджер",
					description: "Управление проектами",
				},
				{
					name: "member",
					displayName: "Участник",
					description: "Базовый доступ",
				},
			];

			for (const role of roles) {
				await ctx.db.insert("roles", {
					organizationId,
					name: role.name,
					displayName: role.displayName,
					description: role.description,
					isSystem: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
			}

			// Create basic statuses
			const statuses = [
				{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
				{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
				{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
				{ name: "Завершено", color: "#10B981", iconName: "CheckCircle" },
			];

			for (const status of statuses) {
				await ctx.db.insert("status", status);
			}

			// Create basic priorities
			const priorities = [
				{
					name: "Критический",
					level: 0,
					iconName: "AlertTriangle",
					color: "#EF4444",
				},
				{ name: "Высокий", level: 1, iconName: "ArrowUp", color: "#F59E0B" },
				{ name: "Средний", level: 2, iconName: "Minus", color: "#3B82F6" },
				{ name: "Низкий", level: 3, iconName: "ArrowDown", color: "#10B981" },
			];

			for (const priority of priorities) {
				await ctx.db.insert("priorities", priority);
			}

			// Create basic labels
			const labels = [
				{ name: "Срочно", color: "#FF4444" },
				{ name: "Документация", color: "#4169E1" },
				{ name: "Безопасность", color: "#FFA500" },
			];

			for (const label of labels) {
				await ctx.db.insert("labels", label);
			}
		}

		// Get admin role
		const adminRole = await ctx.db
			.query("roles")
			.filter((q) =>
				q.and(
					q.eq(q.field("name"), "admin"),
					q.eq(q.field("organizationId"), organization._id),
				),
			)
			.first();

		if (!adminRole) {
			throw new Error("Admin role not found");
		}

		if (!user && userEmail) {
			// Create the user
			const identityName =
				(typeof identity.name === "string" ? identity.name : null) ||
				(typeof identity.givenName === "string" ? identity.givenName : null);
			const name = identityName || userEmail.split("@")[0] || "User";

			const avatarUrl =
				(typeof identity.pictureUrl === "string"
					? identity.pictureUrl
					: null) ||
				`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`;

			const userId = await ctx.db.insert("users", {
				name: name,
				email: userEmail,
				avatarUrl: avatarUrl,
				status: "online",
				roleId: adminRole._id,
				joinedDate: new Date().toISOString(),
				teamIds: [],
				position: "Administrator",
				currentOrganizationId: organization._id,
				isActive: true,
				lastLogin: new Date().toISOString(),
			});
			user = await ctx.db.get(userId);
		} else if (user) {
			// Update existing user
			await ctx.db.patch(user._id, {
				currentOrganizationId: organization._id,
				roleId: adminRole._id,
				isActive: true,
				lastLogin: new Date().toISOString(),
			});
		}

		if (!user) {
			throw new Error("Failed to find or create user");
		}

		// Check if user is already a member
		const existingMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", organization._id).eq("userId", user!._id),
			)
			.first();

		if (!existingMembership) {
			// Add user as organization member
			await ctx.db.insert("organizationMembers", {
				organizationId: organization._id,
				userId: user!._id,
				roleId: adminRole._id,
				joinedAt: Date.now(),
				invitedBy: undefined,
				isActive: true,
			});
		} else {
			// Update existing membership
			await ctx.db.patch(existingMembership._id, {
				roleId: adminRole._id,
				isActive: true,
			});
		}

		// Update organization owner to the current user
		await ctx.db.patch(organization._id, {
			ownerId: user!._id,
		});

		// Clean up temp owner if it exists
		const tempOwners = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), "temp-owner@stroycomplex.ru"))
			.collect();

		for (const tempOwner of tempOwners) {
			// Remove temp owner from organization members first
			const tempMembership = await ctx.db
				.query("organizationMembers")
				.withIndex("by_org_user", (q) =>
					q.eq("organizationId", organization._id).eq("userId", tempOwner._id),
				)
				.first();

			if (tempMembership) {
				await ctx.db.delete(tempMembership._id);
			}

			// Delete temp owner user
			await ctx.db.delete(tempOwner._id);
		}

		return {
			message: "Successfully joined organization",
			organizationId: organization._id,
			organizationSlug: organization.slug,
			userId: user!._id,
			role: "admin",
		};
	},
});
