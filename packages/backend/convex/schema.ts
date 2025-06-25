import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
	}),

	// Users table
	users: defineTable({
		name: v.string(),
		email: v.string(),
		avatarUrl: v.string(),
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
		roleId: v.optional(v.id("roles")), // Changed from string to reference roles table
		joinedDate: v.string(),
		teamIds: v.array(v.string()),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		// Auth fields
		authId: v.optional(v.string()), // External auth provider ID
		tokenIdentifier: v.optional(v.string()), // Clerk token identifier
		isActive: v.optional(v.boolean()), // Account active status
		lastLogin: v.optional(v.string()), // Last login timestamp
	})
		.index("by_email", ["email"])
		.index("by_auth_id", ["authId"])
		.index("by_token", ["tokenIdentifier"])
		.index("by_role", ["roleId"]),

	// Labels table
	labels: defineTable({
		name: v.string(),
		color: v.string(),
	}),

	// Priorities table
	priorities: defineTable({
		name: v.string(),
		level: v.number(), // 0 = urgent, 1 = high, 2 = medium, 3 = low
		iconName: v.string(),
	}),

	// Status table
	status: defineTable({
		name: v.string(),
		color: v.string(),
		iconName: v.string(),
	}),

	// Projects table
	projects: defineTable({
		name: v.string(),
		statusId: v.id("status"),
		iconName: v.string(),
		percentComplete: v.number(),
		startDate: v.string(),
		leadId: v.id("users"),
		priorityId: v.id("priorities"),
		healthId: v.string(),
		healthName: v.string(),
		healthColor: v.string(),
		healthDescription: v.string(),
	}),

	// Construction Projects table
	constructionProjects: defineTable({
		name: v.string(),
		client: v.string(),
		statusId: v.id("status"),
		iconName: v.string(),
		percentComplete: v.number(),
		contractValue: v.number(),
		startDate: v.string(),
		targetDate: v.optional(v.string()),
		leadId: v.id("users"),
		priorityId: v.id("priorities"),
		healthId: v.string(),
		healthName: v.string(),
		healthColor: v.string(),
		healthDescription: v.string(),
		location: v.string(),
		projectType: v.union(
			v.literal("residential"),
			v.literal("commercial"),
			v.literal("industrial"),
			v.literal("infrastructure"),
		),
		notes: v.optional(v.string()),
		teamMemberIds: v.array(v.id("users")),
	}),

	// Monthly Revenue table
	monthlyRevenue: defineTable({
		constructionProjectId: v.id("constructionProjects"),
		month: v.string(),
		planned: v.number(),
		actual: v.number(),
	}).index("by_project", ["constructionProjectId"]),

	// Work Categories table
	workCategories: defineTable({
		constructionProjectId: v.id("constructionProjects"),
		name: v.string(),
		percentComplete: v.number(),
		responsibleId: v.id("users"),
		workload: v.number(),
	}).index("by_project", ["constructionProjectId"]),

	// Construction Teams table
	constructionTeams: defineTable({
		name: v.string(),
		shortName: v.string(),
		icon: v.string(),
		joined: v.boolean(),
		color: v.string(),
		memberIds: v.array(v.id("users")),
		projectIds: v.array(v.id("constructionProjects")),
		department: v.union(
			v.literal("design"),
			v.literal("construction"),
			v.literal("engineering"),
			v.literal("management"),
		),
		workload: v.number(),
	}),

	// Teams table
	teams: defineTable({
		name: v.string(),
		icon: v.string(),
		joined: v.boolean(),
		color: v.string(),
		memberIds: v.array(v.id("users")),
		projectIds: v.array(v.id("projects")),
	}),

	// Issues/Tasks table
	issues: defineTable({
		identifier: v.string(),
		title: v.string(),
		description: v.string(),
		statusId: v.id("status"),
		assigneeId: v.optional(v.id("users")),
		priorityId: v.id("priorities"),
		labelIds: v.array(v.id("labels")),
		createdAt: v.string(),
		cycleId: v.string(),
		projectId: v.optional(v.id("projects")),
		rank: v.string(),
		dueDate: v.optional(v.string()),
		isConstructionTask: v.boolean(), // Flag to distinguish construction tasks
	})
		.index("by_status", ["statusId"])
		.index("by_assignee", ["assigneeId"])
		.index("by_project", ["projectId"])
		.index("by_construction", ["isConstructionTask"]),

	// Roles table
	roles: defineTable({
		name: v.string(), // e.g., "admin", "manager", "engineer", "viewer"
		displayName: v.string(), // e.g., "Administrator", "Project Manager", etc.
		description: v.optional(v.string()),
		isSystem: v.boolean(), // System roles cannot be deleted
		createdAt: v.string(),
		updatedAt: v.string(),
	}).index("by_name", ["name"]),

	// Permissions table
	permissions: defineTable({
		resource: v.string(), // e.g., "projects", "users", "teams"
		action: v.string(), // e.g., "create", "read", "update", "delete", "manage"
		description: v.optional(v.string()),
		createdAt: v.string(),
	}).index("by_resource_action", ["resource", "action"]),

	// Role-Permission mapping table
	rolePermissions: defineTable({
		roleId: v.id("roles"),
		permissionId: v.id("permissions"),
		createdAt: v.string(),
	})
		.index("by_role", ["roleId"])
		.index("by_permission", ["permissionId"])
		.index("by_role_permission", ["roleId", "permissionId"]),

	// User custom permissions (for specific overrides)
	userPermissions: defineTable({
		userId: v.id("users"),
		permissionId: v.id("permissions"),
		granted: v.boolean(), // true = grant, false = revoke (override role permission)
		createdAt: v.string(),
		expiresAt: v.optional(v.string()), // Optional expiration for temporary permissions
	})
		.index("by_user", ["userId"])
		.index("by_permission", ["permissionId"])
		.index("by_user_permission", ["userId", "permissionId"]),

	// Audit log for permission changes
	permissionAuditLog: defineTable({
		userId: v.id("users"), // Who made the change
		targetUserId: v.optional(v.id("users")), // User affected (if applicable)
		targetRoleId: v.optional(v.id("roles")), // Role affected (if applicable)
		action: v.string(), // e.g., "role_assigned", "permission_granted", "role_created"
		details: v.optional(v.string()), // JSON string with additional details
		createdAt: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_target_user", ["targetUserId"])
		.index("by_created_at", ["createdAt"]),

	// Departments table - hierarchical structure
	departments: defineTable({
		name: v.string(), // e.g., "Engineering", "Design", "Construction"
		displayName: v.string(), // Display name in Russian
		description: v.optional(v.string()),
		parentId: v.optional(v.id("departments")), // Parent department for hierarchy
		level: v.number(), // Hierarchy level (0 = root, 1 = first level, etc.)
		headUserId: v.optional(v.id("users")), // Department head
		isActive: v.boolean(),
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_parent", ["parentId"])
		.index("by_level", ["level"])
		.index("by_head", ["headUserId"]),

	// Organizational positions - defines hierarchy levels
	organizationalPositions: defineTable({
		name: v.string(), // e.g., "owner", "ceo", "chief_engineer"
		displayName: v.string(), // e.g., "Владелец", "Генеральный директор", "ГИП"
		level: v.number(), // 0 = highest (owner), higher numbers = lower in hierarchy
		canManageLevelsBelow: v.boolean(), // Can manage all positions below
		isUnique: v.boolean(), // Only one person can hold this position
		createdAt: v.string(),
	})
		.index("by_level", ["level"])
		.index("by_name", ["name"]),

	// User department assignments
	userDepartments: defineTable({
		userId: v.id("users"),
		departmentId: v.id("departments"),
		positionId: v.optional(v.id("organizationalPositions")), // Organizational position
		isPrimary: v.boolean(), // Primary department assignment
		startDate: v.string(),
		endDate: v.optional(v.string()), // null = current assignment
		createdAt: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_department", ["departmentId"])
		.index("by_position", ["positionId"])
		.index("by_user_primary", ["userId", "isPrimary"]),

	// Documents table
	documents: defineTable({
		title: v.string(),
		content: v.string(),
		projectId: v.optional(v.id("projects")),
		parentId: v.union(v.id("documents"), v.null()), // For hierarchical documents
		authorId: v.id("users"),
		assignedTo: v.optional(v.id("users")),
		status: v.union(
			v.literal("draft"),
			v.literal("in_progress"),
			v.literal("review"),
			v.literal("completed"),
		),
		dueDate: v.optional(v.string()),
		tags: v.array(v.string()),
		version: v.number(),
		lastEditedBy: v.id("users"),
		lastEditedAt: v.number(),
	})
		.index("by_parent", ["parentId"])
		.index("by_project", ["projectId"])
		.index("by_author", ["authorId"])
		.index("by_assignee", ["assignedTo"])
		.index("by_status", ["status"]),

	// Document versions for history
	documentVersions: defineTable({
		documentId: v.id("documents"),
		version: v.number(),
		content: v.string(),
		editedBy: v.id("users"),
		editedAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_version", ["documentId", "version"]),

	// Document attachments
	documentAttachments: defineTable({
		documentId: v.id("documents"),
		fileName: v.string(),
		fileUrl: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.id("users"),
		uploadedAt: v.number(),
	}).index("by_document", ["documentId"]),

	// Document comments
	documentComments: defineTable({
		documentId: v.id("documents"),
		authorId: v.id("users"),
		content: v.string(),
		parentCommentId: v.optional(v.id("documentComments")),
		isResolved: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_parent", ["parentCommentId"]),

	// Document assignments (for task management)
	documentAssignments: defineTable({
		documentId: v.id("documents"),
		assigneeId: v.id("users"),
		assignedBy: v.id("users"),
		taskDescription: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("in_progress"),
			v.literal("completed"),
			v.literal("blocked"),
		),
		priority: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("urgent"),
		),
		dueDate: v.optional(v.string()),
		completedAt: v.optional(v.number()),
		notes: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_assignee", ["assigneeId"])
		.index("by_status", ["status"]),

	// Document activity log
	documentActivity: defineTable({
		documentId: v.id("documents"),
		userId: v.id("users"),
		action: v.union(
			v.literal("created"),
			v.literal("edited"),
			v.literal("commented"),
			v.literal("assigned"),
			v.literal("status_changed"),
			v.literal("attachment_added"),
			v.literal("attachment_removed"),
			v.literal("version_restored"),
		),
		details: v.optional(v.string()),
		timestamp: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_user", ["userId"])
		.index("by_timestamp", ["timestamp"]),

	// Document templates
	documentTemplates: defineTable({
		name: v.string(),
		description: v.string(),
		content: v.string(),
		category: v.string(),
		tags: v.array(v.string()),
		createdBy: v.id("users"),
		isPublic: v.boolean(),
		usageCount: v.number(),
		createdAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_creator", ["createdBy"])
		.index("by_public", ["isPublic"]),

	// Document mentions for notifications
	documentMentions: defineTable({
		commentId: v.id("documentComments"),
		documentId: v.id("documents"),
		mentionedUserId: v.id("users"),
		mentionedBy: v.id("users"),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_comment", ["commentId"])
		.index("by_document", ["documentId"])
		.index("by_mentioned_user", ["mentionedUserId"])
		.index("by_unread", ["mentionedUserId", "isRead"]),

	// Document-Task relationships
	documentTasks: defineTable({
		documentId: v.id("documents"),
		taskId: v.id("issues"),
		relationshipType: v.union(
			v.literal("attachment"),
			v.literal("reference"),
			v.literal("deliverable"),
			v.literal("requirement"),
		),
		description: v.optional(v.string()),
		createdBy: v.id("users"),
		createdAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_task", ["taskId"])
		.index("by_type", ["relationshipType"]),
});
