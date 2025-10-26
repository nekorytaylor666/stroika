import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "../auth";
import { statements } from "./permissions";

export const createCustomOrganizationRole = mutation({
	args: {
		role: v.string(),
		permission: v.record(v.string(), v.array(v.string())),
		organizationId: v.string(),
		additionalFields: v.optional(v.string()),
		resource: v.string(),
		actions: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		try {
			// const { user, organization } = await getCurrentUserWithOrganization(ctx);
			const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
			await auth.api.createOrgRole({
				body: {
					role: args.role,
					permission: args.permission,
					additionalFields: args.additionalFields,
					organizationId: args.organizationId,
				},
				headers: await authComponent.getHeaders(ctx),
			});
		} catch (error) {
			console.error("Error creating organization role", error);
			throw new Error("Error creating organization role");
		}
	},
});
