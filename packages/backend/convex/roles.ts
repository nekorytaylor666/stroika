import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./helpers/getCurrentUser";

// List all roles
export const list = query({
	args: {},
	handler: async (ctx) => {
		const roles = await ctx.db.query("roles").collect();

		// Sort roles by their typical hierarchy
		const roleOrder = [
			"owner",
			"ceo",
			"chief_engineer",
			"department_head",
			"project_manager",
			"engineer",
			"viewer",
		];

		return roles.sort((a, b) => {
			const aIndex = roleOrder.indexOf(a.name);
			const bIndex = roleOrder.indexOf(b.name);

			// If both are in the order list, sort by that order
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex;
			}

			// If only one is in the order list, it comes first
			if (aIndex !== -1) return -1;
			if (bIndex !== -1) return 1;

			// Otherwise, sort alphabetically by name
			return a.name.localeCompare(b.name);
		});
	},
});

// Get a specific role by ID
export const get = query({
	args: { roleId: v.id("roles") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.roleId);
	},
});

// Get role by name
export const getByName = query({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("roles")
			.filter((q) => q.eq(q.field("name"), args.name))
			.first();
	},
});

// Get roles available for organization members
export const getOrganizationRoles = query({
	args: { organizationId: v.id("organizations") },
	handler: async (ctx, args) => {
		// Check if user is authenticated and has access to the organization
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}

		// Verify user is member of the organization
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// For now, return all roles except system roles
		// In the future, this could be filtered based on organization settings
		const roles = await ctx.db.query("roles").collect();

		// Filter out system-level roles that shouldn't be assignable
		const assignableRoles = roles.filter((role) => {
			// You can customize this logic based on your needs
			// For now, return all roles that are not owner
			return role.name !== "owner";
		});

		// Sort roles by their typical hierarchy
		const roleOrder = [
			"ceo",
			"chief_engineer",
			"admin",
			"manager",
			"department_head",
			"project_manager",
			"engineer",
			"member",
			"viewer",
		];

		return assignableRoles.sort((a, b) => {
			const aIndex = roleOrder.indexOf(a.name);
			const bIndex = roleOrder.indexOf(b.name);

			// If both are in the order list, sort by that order
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex;
			}

			// If only one is in the order list, it comes first
			if (aIndex !== -1) return -1;
			if (bIndex !== -1) return 1;

			// Otherwise, sort alphabetically by name
			return a.name.localeCompare(b.name);
		});
	},
});
