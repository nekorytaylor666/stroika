import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	...authTables,

	// Organizations table
	organizations: defineTable({
		name: v.string(),
		slug: v.string(), // URL-friendly unique identifier
		description: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		website: v.optional(v.string()),
		ownerId: v.id("users"), // Organization owner
		settings: v.optional(
			v.object({
				allowInvites: v.boolean(),
				requireEmailVerification: v.boolean(),
				defaultRoleId: v.optional(v.id("roles")),
			}),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_owner", ["ownerId"]),

	// Organization members
	organizationMembers: defineTable({
		organizationId: v.id("organizations"),
		userId: v.id("users"),
		roleId: v.id("roles"),
		joinedAt: v.number(),
		invitedBy: v.optional(v.id("users")),
		isActive: v.boolean(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_org_user", ["organizationId", "userId"]),

	// Organization invites
	organizationInvites: defineTable({
		organizationId: v.id("organizations"),
		email: v.string(),
		inviteCode: v.string(), // Unique invite code
		roleId: v.id("roles"), // Role to assign when accepted
		invitedBy: v.id("users"),
		expiresAt: v.number(),
		acceptedAt: v.optional(v.number()),
		acceptedBy: v.optional(v.id("users")),
		status: v.union(
			v.literal("pending"),
			v.literal("accepted"),
			v.literal("expired"),
			v.literal("cancelled"),
		),
		createdAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_code", ["inviteCode"])
		.index("by_email", ["email"])
		.index("by_status", ["status"]),

	// Organization teams
	teams: defineTable({
		organizationId: v.id("organizations"),
		name: v.string(),
		description: v.optional(v.string()),
		parentTeamId: v.optional(v.id("teams")), // For nested teams
		leaderId: v.optional(v.id("users")),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_parent", ["parentTeamId"])
		.index("by_leader", ["leaderId"]),

	// Team members
	teamMembers: defineTable({
		teamId: v.id("teams"),
		userId: v.id("users"),
		joinedAt: v.number(),
		role: v.optional(v.string()), // Role within the team
	})
		.index("by_team", ["teamId"])
		.index("by_user", ["userId"])
		.index("by_team_user", ["teamId", "userId"]),

	// Users table
	users: defineTable({
		name: v.string(),
		email: v.string(),
		avatarUrl: v.string(),
		phone: v.optional(v.string()),
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
		// Organization fields
		currentOrganizationId: v.optional(v.id("organizations")), // Current active organization
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
		color: v.optional(v.string()),
	}),

	// Status table
	status: defineTable({
		name: v.string(),
		color: v.string(),
		iconName: v.string(),
	}),

	// Construction Projects table
	constructionProjects: defineTable({
		organizationId: v.id("organizations"), // Link to organization
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
	}).index("by_organization", ["organizationId"]),

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
		organizationId: v.id("organizations"), // Link to organization
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
	}).index("by_organization", ["organizationId"]),

	// Issues/Tasks table
	issues: defineTable({
		organizationId: v.id("organizations"), // Link to organization
		identifier: v.string(),
		title: v.string(),
		description: v.string(),
		statusId: v.id("status"),
		assigneeId: v.optional(v.id("users")),
		priorityId: v.id("priorities"),
		labelIds: v.array(v.id("labels")),
		createdAt: v.string(),
		cycleId: v.string(),
		projectId: v.optional(v.id("constructionProjects")),
		rank: v.string(),
		dueDate: v.optional(v.string()),
		isConstructionTask: v.boolean(), // Flag to distinguish construction tasks
		parentTaskId: v.optional(v.id("issues")), // For subtask hierarchy
	})
		.index("by_organization", ["organizationId"])
		.index("by_status", ["statusId"])
		.index("by_assignee", ["assigneeId"])
		.index("by_construction", ["isConstructionTask"])
		.index("by_project", ["projectId"])
		.index("by_parent_task", ["parentTaskId"])
		.index("by_identifier", ["identifier"]),

	// Roles table
	roles: defineTable({
		organizationId: v.optional(v.id("organizations")), // null for system roles
		name: v.string(), // e.g., "admin", "manager", "engineer", "viewer"
		displayName: v.string(), // e.g., "Administrator", "Project Manager", etc.
		description: v.optional(v.string()),
		isSystem: v.boolean(), // System roles cannot be deleted
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_name", ["name"])
		.index("by_organization", ["organizationId"]),

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
		organizationId: v.id("organizations"), // Link to organization
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
		.index("by_organization", ["organizationId"])
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
		organizationId: v.id("organizations"), // Link to organization
		title: v.string(),
		content: v.string(),
		projectId: v.optional(v.id("constructionProjects")),
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
		.index("by_organization", ["organizationId"])
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

	// Project Legal Documents table
	projectLegalDocuments: defineTable({
		constructionProjectId: v.id("constructionProjects"),
		organizationId: v.id("organizations"),
		documentType: v.union(
			v.literal("contract"),
			v.literal("invoice"),
			v.literal("permit"),
			v.literal("insurance"),
			v.literal("report"),
			v.literal("legal"),
			v.literal("financial"),
			v.literal("other"),
		),
		title: v.string(),
		description: v.optional(v.string()),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.id("users"),
		uploadedAt: v.number(),
		status: v.union(
			v.literal("draft"),
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("expired"),
			v.literal("archived"),
		),
		validUntil: v.optional(v.string()), // ISO date string for expiration
		metadata: v.optional(v.string()), // JSON string for additional data
		isPrivate: v.boolean(),
		allowedUserIds: v.array(v.id("users")), // Users with special access
		tags: v.array(v.string()),
	})
		.index("by_project", ["constructionProjectId"])
		.index("by_organization", ["organizationId"])
		.index("by_type", ["documentType"])
		.index("by_status", ["status"])
		.index("by_uploader", ["uploadedBy"])
		.index("by_upload_date", ["uploadedAt"]),

	// Issue attachments (can be attached to issues or directly to projects)
	issueAttachments: defineTable({
		issueId: v.optional(v.id("issues")), // Optional - can be null for project-level attachments
		projectId: v.optional(v.id("constructionProjects")), // Project ID for direct project attachments
		fileName: v.string(),
		fileUrl: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.id("users"),
		uploadedAt: v.number(),
	})
		.index("by_issue", ["issueId"])
		.index("by_project", ["projectId"]),

	// Issue comments
	issueComments: defineTable({
		issueId: v.id("issues"),
		authorId: v.id("users"),
		content: v.string(),
		parentCommentId: v.optional(v.id("issueComments")),
		isResolved: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_issue", ["issueId"])
		.index("by_parent", ["parentCommentId"]),

	// Issue mentions for notifications
	issueMentions: defineTable({
		commentId: v.id("issueComments"),
		issueId: v.id("issues"),
		mentionedUserId: v.id("users"),
		mentionedBy: v.id("users"),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_comment", ["commentId"])
		.index("by_issue", ["issueId"])
		.index("by_mentioned_user", ["mentionedUserId"])
		.index("by_unread", ["mentionedUserId", "isRead"]),

	// Activity tracking for issues
	issueActivities: defineTable({
		issueId: v.id("issues"),
		userId: v.id("users"),
		type: v.union(
			v.literal("status_changed"),
			v.literal("assignee_changed"),
			v.literal("priority_changed"),
			v.literal("created"),
			v.literal("completed"),
			v.literal("due_date_changed"),
			v.literal("comment_added"),
			v.literal("subtask_added"),
			v.literal("subtask_removed"),
		),
		oldValue: v.optional(v.string()),
		newValue: v.optional(v.string()),
		metadata: v.optional(
			v.object({
				oldStatusId: v.optional(v.id("status")),
				newStatusId: v.optional(v.id("status")),
				oldAssigneeId: v.optional(v.id("users")),
				newAssigneeId: v.optional(v.id("users")),
				oldPriorityId: v.optional(v.id("priorities")),
				newPriorityId: v.optional(v.id("priorities")),
				commentId: v.optional(v.id("issueComments")),
				subtaskId: v.optional(v.id("issues")),
			}),
		),
		createdAt: v.number(),
	})
		.index("by_issue", ["issueId"])
		.index("by_user", ["userId"])
		.index("by_type", ["type"])
		.index("by_created", ["createdAt"]),

	// Push notification subscriptions
	pushSubscriptions: defineTable({
		userId: v.id("users"),
		endpoint: v.string(),
		keys: v.object({
			p256dh: v.string(),
			auth: v.string(),
		}),
		userAgent: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_endpoint", ["endpoint"]),

	// Notification preferences
	notificationPreferences: defineTable({
		userId: v.id("users"),
		// Notification types
		taskAssigned: v.boolean(),
		taskStatusChanged: v.boolean(),
		taskCommented: v.boolean(),
		taskDueSoon: v.boolean(),
		projectUpdates: v.boolean(),
		// Delivery methods
		pushEnabled: v.boolean(),
		emailEnabled: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// Notifications log
	notifications: defineTable({
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
		read: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_read", ["userId", "read"]),

	// Password reset tokens
	passwordResetTokens: defineTable({
		userId: v.id("users"),
		token: v.string(),
		email: v.string(),
		expiresAt: v.number(),
		usedAt: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_user", ["userId"])
		.index("by_email", ["email"]),

	// User generated passwords (for admin-created accounts)
	userGeneratedPasswords: defineTable({
		userId: v.id("users"),
		temporaryPassword: v.string(),
		mustChangePassword: v.boolean(),
		generatedBy: v.id("users"),
		generatedAt: v.number(),
		changedAt: v.optional(v.number()),
	}).index("by_user", ["userId"]),
});
