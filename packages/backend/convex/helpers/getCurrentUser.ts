import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent, createAuth, getUserId } from "../auth";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	try {
		const authUser = await authComponent.getAuthUser(ctx);
		return authUser;
	}
	catch (error) {
		console.error("Error in getCurrentUser:", error);
		return null;
	}
}

export async function getCurrentUserWithOrganization(
	ctx: QueryCtx | MutationCtx,
) {
	const user = await getCurrentUser(ctx);

	// Get Better Auth session to access active organization

	const auth = createAuth(ctx);
	const organizations = await auth.api.listOrganizations({
		headers: await authComponent.getHeaders(ctx),
	});

	return {
		user,
		organization: organizations[0],
	};

}

export async function requireOrganizationAccess(
	ctx: QueryCtx | MutationCtx,
	organizationId: string, // Better Auth uses string IDs for organizations
) {
	const user = await getCurrentUser(ctx);

	// Get Better Auth session
	const authUser = await authComponent.getAuthUser(ctx);
	if (!authUser) {
		throw new Error("Not authenticated");
	}

	// Check membership in Better Auth member table
	const membership = await ctx.db
		.query("member")
		.filter((q) =>
			q.and(
				q.eq(q.field("organizationId"), organizationId),
				q.eq(q.field("userId"), authUser.userId)
			)
		)
		.first();

	if (!membership) {
		throw new Error("Not a member of this organization");
	}

	return { user, membership };
}
