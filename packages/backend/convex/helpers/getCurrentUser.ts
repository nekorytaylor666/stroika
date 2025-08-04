import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { auth } from "../auth";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	// First try to get user by auth ID
	const authUserId = await auth.getUserId(ctx);
	if (authUserId) {
		const user = await ctx.db.get(authUserId);
		if (user) {
			return user;
		}
	}

	// Fallback to identity-based lookup
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_email", (q) => q.eq("email", identity.email!))
		.first();

	if (!user) {
		throw new Error("User not found");
	}

	return user;
}

export async function getCurrentUserWithOrganization(
	ctx: QueryCtx | MutationCtx,
) {
	const user = await getCurrentUser(ctx);

	if (!user.currentOrganizationId) {
		throw new Error("User has no current organization");
	}

	const organization = await ctx.db.get(user.currentOrganizationId);
	if (!organization) {
		throw new Error("Organization not found");
	}

	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q
				.eq("organizationId", user.currentOrganizationId!)
				.eq("userId", user._id),
		)
		.first();

	if (!membership || !membership.isActive) {
		throw new Error("Not an active member of the organization");
	}

	const role = await ctx.db.get(membership.roleId);

	return {
		user,
		organization,
		membership,
		role,
	};
}

export async function requireOrganizationAccess(
	ctx: QueryCtx | MutationCtx,
	organizationId: Id<"organizations">,
) {
	const user = await getCurrentUser(ctx);

	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", organizationId).eq("userId", user._id),
		)
		.first();

	if (!membership || !membership.isActive) {
		throw new Error("Not a member of this organization");
	}

	return { user, membership };
}
