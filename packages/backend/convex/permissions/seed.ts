import { mutation } from "../_generated/server";
import {
	ALL_PERMISSIONS,
	DEFAULT_ROLE_PERMISSIONS,
	ROLE_DESCRIPTIONS,
	ROLE_DISPLAY_NAMES,
	SYSTEM_ROLES,
} from "./constants";

export const seedRolesAndPermissions = mutation({
	args: {},
	handler: async (ctx) => {
		const now = new Date().toISOString();

		// Check if roles already exist
		const existingRoles = await ctx.db.query("roles").collect();
		if (existingRoles.length > 0) {
			return { message: "Roles and permissions already seeded" };
		}

		// Create all permissions
		const permissionMap = new Map<string, any>();

		for (const perm of ALL_PERMISSIONS) {
			const permissionId = await ctx.db.insert("permissions", {
				resource: perm.resource,
				action: perm.action,
				description: perm.description,
				createdAt: now,
			});

			const key = `${perm.resource}:${perm.action}`;
			permissionMap.set(key, permissionId);
		}

		// Create system roles
		for (const [roleKey, roleName] of Object.entries(SYSTEM_ROLES)) {
			const roleId = await ctx.db.insert("roles", {
				name: roleName,
				displayName: ROLE_DISPLAY_NAMES[roleName],
				description: ROLE_DESCRIPTIONS[roleName],
				isSystem: true,
				createdAt: now,
				updatedAt: now,
			});

			// Assign permissions to role
			const rolePermissions = DEFAULT_ROLE_PERMISSIONS[roleName] || [];

			for (const perm of rolePermissions) {
				const permKey = `${perm.resource}:${perm.action}`;
				const permissionId = permissionMap.get(permKey);

				if (permissionId) {
					await ctx.db.insert("rolePermissions", {
						roleId,
						permissionId,
						createdAt: now,
					});
				}
			}
		}

		return {
			message: "Successfully seeded roles and permissions",
			rolesCreated: Object.keys(SYSTEM_ROLES).length,
			permissionsCreated: ALL_PERMISSIONS.length,
		};
	},
});
