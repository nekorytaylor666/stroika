import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

// Update all construction issues, project owners, and organization owners to a specific user
export const updateRecordsToUser = mutation({
	args: {},
	handler: async (ctx) => {
		// Find the user by email
		const targetUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", "akmt.me23@gmail.com"))
			.first();

		if (!targetUser) {
			throw new Error("User with email akmt.me23@gmail.com not found");
		}

		const results = {
			userId: targetUser._id,
			userName: targetUser.name,
			userEmail: targetUser.email,
			updates: {
				constructionIssues: 0,
				constructionProjects: 0,
				organizations: 0,
			},
		};

		// Update all construction issues
		const allIssues = await ctx.db.query("issues").collect();
		for (const issue of allIssues) {
			if (issue.assigneeId !== targetUser._id) {
				await ctx.db.patch(issue._id, {
					assigneeId: targetUser._id,
				});
				results.updates.constructionIssues++;
			}
		}

		// Update all construction project owners
		const allProjects = await ctx.db.query("constructionProjects").collect();
		for (const project of allProjects) {
			if (project.ownerId !== targetUser._id) {
				await ctx.db.patch(project._id, {
					ownerId: targetUser._id,
				});
				results.updates.constructionProjects++;
			}
		}

		// Update all organization owners
		const allOrganizations = await ctx.db.query("organizations").collect();
		for (const org of allOrganizations) {
			if (org.ownerId !== targetUser._id) {
				await ctx.db.patch(org._id, {
					ownerId: targetUser._id,
				});
				results.updates.organizations++;
			}
		}

		return results;
	},
});

// Create or update the user with Better Auth integration
export const ensureUserExists = mutation({
	args: {},
	handler: async (ctx) => {
		const email = "akmt.me23@gmail.com";

		// Check if user already exists
		let user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.first();

		if (!user) {
			// Get the owner role
			const ownerRole = await ctx.db
				.query("roles")
				.filter((q) => q.eq(q.field("name"), "Owner"))
				.first();

			if (!ownerRole) {
				throw new Error("Owner role not found. Please run seedDatabase first.");
			}

			// Get any organization to assign
			const org = await ctx.db.query("organizations").first();

			// Create the user
			const userId = await ctx.db.insert("users", {
				name: "Akmt Owner",
				email: email,
				avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=akmt",
				status: "online",
				roleId: ownerRole._id,
				joinedDate: new Date().toISOString(),
				teamIds: [],
				position: "Генеральный директор",
				currentOrganizationId: org?._id,
				isActive: true,
				lastLogin: new Date().toISOString(),
			});

			user = await ctx.db.get(userId);

			// If organization exists, add user as member
			if (org) {
				await ctx.db.insert("organizationMembers", {
					organizationId: org._id,
					userId,
					roleId: ownerRole._id,
					joinedAt: Date.now(),
					invitedBy: undefined,
					isActive: true,
				});
			}

			return {
				message: "User created",
				user,
				created: true,
			};
		}

		return {
			message: "User already exists",
			user,
			created: false,
		};
	},
});
