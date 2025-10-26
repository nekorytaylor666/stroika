import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { tables } from "./betterAuth/schema";

export default defineSchema({
	// NOTE: Organizations are now managed by Better Auth - see betterAuth/schema.ts
	...tables,
	// Organization members
	organizationMembers: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		userId: v.string(),
		roleId: v.string(),
		joinedAt: v.number(),
		invitedBy: v.optional(v.string()),
		isActive: v.boolean(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_org_user", ["organizationId", "userId"]),

	// Organization invites
	organizationInvites: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		email: v.string(),
		inviteCode: v.string(), // Unique invite code
		roleId: v.string(), // Role to assign when accepted
		invitedBy: v.string(),
		expiresAt: v.number(),
		acceptedAt: v.optional(v.number()),
		acceptedBy: v.optional(v.string()),
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
		organizationId: v.string(), // Better Auth organization ID
		name: v.string(),
		description: v.optional(v.string()),
		parentTeamId: v.optional(v.string()), // For nested teams
		leaderId: v.optional(v.string()),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_parent", ["parentTeamId"])
		.index("by_leader", ["leaderId"]),

	// Team members
	teamMembers: defineTable({
		teamId: v.string(),
		userId: v.string(),
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
		avatarUrl: v.optional(v.string()),
		phone: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
		),
		roleId: v.optional(v.string()), // Changed from string to reference roles table
		joinedDate: v.optional(v.string()),
		teamIds: v.optional(v.array(v.string())),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		// Organization fields
		currentOrganizationId: v.optional(v.string()), // Current active organization (Better Auth ID)
		// Auth fields
		betterAuthId: v.optional(v.string()), // Better Auth user ID
		authId: v.optional(v.string()), // External auth provider ID (legacy)
		tokenIdentifier: v.optional(v.string()), // Clerk token identifier (legacy)
		isActive: v.optional(v.boolean()), // Account active status
		createdAt: v.optional(v.string()), // Creation timestamp
		lastLogin: v.optional(v.string()), // Last login timestamp
	})
		.index("by_email", ["email"])
		.index("by_auth_id", ["authId"])
		.index("by_token", ["tokenIdentifier"])
		.index("by_role", ["roleId"])
		.index("by_betterAuthId", ["betterAuthId"]),

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
		organizationId: v.string(), // Better Auth organization ID // Link to organization
		name: v.string(),
		client: v.string(),
		statusId: v.string(),
		iconName: v.string(),
		percentComplete: v.number(),
		contractValue: v.number(),
		startDate: v.string(),
		targetDate: v.optional(v.string()),
		leadId: v.string(),
		priorityId: v.string(),
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
		teamMemberIds: v.array(v.string()),
	}).index("by_organization", ["organizationId"]),

	// Monthly Revenue table
	monthlyRevenue: defineTable({
		constructionProjectId: v.string(),
		month: v.string(),
		planned: v.number(),
		actual: v.number(),
	}).index("by_project", ["constructionProjectId"]),

	// Work Categories table
	workCategories: defineTable({
		constructionProjectId: v.string(),
		name: v.string(),
		percentComplete: v.number(),
		responsibleId: v.string(),
		workload: v.number(),
	}).index("by_project", ["constructionProjectId"]),

	// Construction Teams table
	constructionTeams: defineTable({
		organizationId: v.string(), // Better Auth organization ID // Link to organization
		name: v.string(),
		shortName: v.string(),
		icon: v.string(),
		joined: v.boolean(),
		color: v.string(),
		memberIds: v.array(v.string()),
		projectIds: v.array(v.string()),
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
		organizationId: v.string(), // Better Auth organization ID // Link to organization
		identifier: v.string(),
		title: v.string(),
		description: v.string(),
		statusId: v.string(),
		assigneeId: v.optional(v.string()),
		priorityId: v.string(),
		labelIds: v.array(v.string()),
		createdAt: v.string(),
		cycleId: v.string(),
		projectId: v.optional(v.string()),
		rank: v.string(),
		dueDate: v.optional(v.string()),
		isConstructionTask: v.boolean(), // Flag to distinguish construction tasks
		parentTaskId: v.optional(v.string()), // For subtask hierarchy
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
		organizationId: v.optional(v.string()), // null for system roles (Better Auth organization ID)
		name: v.string(), // e.g., "owner", "director", "admin", "project_manager", "team_lead", "member", "viewer"
		displayName: v.string(), // e.g., "Owner", "Director", "Administrator", etc.
		description: v.optional(v.string()),
		isSystem: v.boolean(), // System roles cannot be deleted
		isDirector: v.boolean(), // Directors have full access to all projects
		priority: v.number(), // Higher priority = higher in hierarchy (owner: 100, director: 90, etc.)
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_name", ["name"])
		.index("by_organization", ["organizationId"])
		.index("by_priority", ["priority"]),

	// Role-Permission mapping table
	customRoles: defineTable({
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		scope: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("project"),
			v.literal("team"),
			v.literal("resource"),
		),
		scopeId: v.optional(v.string()),
		//json
		permissions: v.string(),
	}),
	userCustomRoles: defineTable({
		userId: v.string(),
		roleId: v.string(),
		granted: v.boolean(), // true = grant, false = revoke (override role permission)
		createdAt: v.string(),
		expiresAt: v.optional(v.string()), // Optional expiration for temporary permissions
	})
		.index("by_user", ["userId"])
		.index("by_role", ["roleId"]),

	// User custom permissions (for specific overrides)
	userPermissions: defineTable({
		userId: v.string(),
		permissionId: v.string(),
		granted: v.boolean(), // true = grant, false = revoke (override role permission)
		createdAt: v.string(),
		expiresAt: v.optional(v.string()), // Optional expiration for temporary permissions
	})
		.index("by_user", ["userId"])
		.index("by_permission", ["permissionId"])
		.index("by_user_permission", ["userId", "permissionId"]),

	// Audit log for permission changes
	permissionAuditLog: defineTable({
		userId: v.string(), // Who made the change
		targetUserId: v.optional(v.string()), // User affected (if applicable)
		targetRoleId: v.optional(v.string()), // Role affected (if applicable)
		action: v.string(), // e.g., "role_assigned", "permission_granted", "role_created"
		details: v.optional(v.string()), // JSON string with additional details
		createdAt: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_target_user", ["targetUserId"])
		.index("by_created_at", ["createdAt"]),

	// Departments table - hierarchical structure
	departments: defineTable({
		organizationId: v.string(), // Better Auth organization ID // Link to organization
		name: v.string(), // e.g., "Engineering", "Design", "Construction"
		displayName: v.string(), // Display name in Russian
		description: v.optional(v.string()),
		parentId: v.optional(v.string()), // Parent department for hierarchy
		level: v.number(), // Hierarchy level (0 = root, 1 = first level, etc.)
		headUserId: v.optional(v.string()), // Department head
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
		userId: v.string(),
		departmentId: v.string(),
		positionId: v.optional(v.string()), // Organizational position
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
		organizationId: v.string(), // Better Auth organization ID // Link to organization
		title: v.string(),
		content: v.string(),
		projectId: v.optional(v.string()),
		parentId: v.union(v.string(), v.null()), // For hierarchical documents
		authorId: v.string(),
		assignedTo: v.optional(v.string()),
		status: v.union(
			v.literal("draft"),
			v.literal("in_progress"),
			v.literal("review"),
			v.literal("completed"),
		),
		dueDate: v.optional(v.string()),
		tags: v.array(v.string()),
		version: v.number(),
		lastEditedBy: v.string(),
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
		documentId: v.string(),
		version: v.number(),
		content: v.string(),
		editedBy: v.string(),
		editedAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_version", ["documentId", "version"]),

	// Document attachments
	documentAttachments: defineTable({
		documentId: v.string(),
		fileName: v.string(),
		fileUrl: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.string(),
		uploadedAt: v.number(),
	}).index("by_document", ["documentId"]),

	// Document comments
	documentComments: defineTable({
		documentId: v.string(),
		authorId: v.string(),
		content: v.string(),
		parentCommentId: v.optional(v.string()),
		isResolved: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_parent", ["parentCommentId"]),

	// Document assignments (for task management)
	documentAssignments: defineTable({
		documentId: v.string(),
		assigneeId: v.string(),
		assignedBy: v.string(),
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
		documentId: v.string(),
		userId: v.string(),
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
		createdBy: v.string(),
		isPublic: v.boolean(),
		usageCount: v.number(),
		createdAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_creator", ["createdBy"])
		.index("by_public", ["isPublic"]),

	// Document mentions for notifications
	documentMentions: defineTable({
		commentId: v.string(),
		documentId: v.string(),
		mentionedUserId: v.string(),
		mentionedBy: v.string(),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_comment", ["commentId"])
		.index("by_document", ["documentId"])
		.index("by_mentioned_user", ["mentionedUserId"])
		.index("by_unread", ["mentionedUserId", "isRead"]),

	// Document-Task relationships
	documentTasks: defineTable({
		documentId: v.string(),
		taskId: v.string(),
		relationshipType: v.union(
			v.literal("attachment"),
			v.literal("reference"),
			v.literal("deliverable"),
			v.literal("requirement"),
		),
		description: v.optional(v.string()),
		createdBy: v.string(),
		createdAt: v.number(),
	})
		.index("by_document", ["documentId"])
		.index("by_task", ["taskId"])
		.index("by_type", ["relationshipType"]),

	// Issue attachments
	issueAttachments: defineTable({
		issueId: v.optional(v.string()),
		projectId: v.optional(v.string()),
		fileName: v.string(),
		fileUrl: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.string(),
		uploadedAt: v.number(),
	})
		.index("by_issue", ["issueId"])
		.index("by_project", ["projectId"]),

	// Issue comments
	issueComments: defineTable({
		issueId: v.string(),
		authorId: v.string(),
		content: v.string(),
		parentCommentId: v.optional(v.string()),
		isResolved: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_issue", ["issueId"])
		.index("by_parent", ["parentCommentId"]),

	// Issue mentions for notifications
	issueMentions: defineTable({
		commentId: v.string(),
		issueId: v.string(),
		mentionedUserId: v.string(),
		mentionedBy: v.string(),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_comment", ["commentId"])
		.index("by_issue", ["issueId"])
		.index("by_mentioned_user", ["mentionedUserId"])
		.index("by_unread", ["mentionedUserId", "isRead"]),

	// Activity tracking for issues
	issueActivities: defineTable({
		issueId: v.string(),
		userId: v.string(),
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
				oldStatusId: v.optional(v.string()),
				newStatusId: v.optional(v.string()),
				oldAssigneeId: v.optional(v.string()),
				newAssigneeId: v.optional(v.string()),
				oldPriorityId: v.optional(v.string()),
				newPriorityId: v.optional(v.string()),
				commentId: v.optional(v.string()),
				subtaskId: v.optional(v.string()),
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
		userId: v.string(),
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
		userId: v.string(),
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
		userId: v.string(),
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
				issueId: v.optional(v.string()),
				projectId: v.optional(v.string()),
				commentId: v.optional(v.string()),
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
		userId: v.string(),
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
		userId: v.string(),
		temporaryPassword: v.string(),
		mustChangePassword: v.boolean(),
		generatedBy: v.string(),
		generatedAt: v.number(),
		changedAt: v.optional(v.number()),
	}).index("by_user", ["userId"]),

	// ============== FINANCE TRACKING TABLES ==============

	// Chart of Accounts (План счетов)
	accounts: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		code: v.string(), // Account code (e.g., "51" for bank accounts)
		name: v.string(), // Russian name (e.g., "Расчетные счета")
		type: v.union(
			v.literal("asset"), // Активы
			v.literal("liability"), // Пассивы
			v.literal("equity"), // Капитал
			v.literal("revenue"), // Доходы
			v.literal("expense"), // Расходы
		),
		category: v.optional(v.string()), // Sub-category
		parentAccountId: v.optional(v.string()), // For hierarchical accounts
		isActive: v.boolean(),
		description: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_code", ["organizationId", "code"])
		.index("by_type", ["organizationId", "type"])
		.index("by_parent", ["parentAccountId"]),

	// Journal Entries (Журнал проводок)
	journalEntries: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		projectId: v.optional(v.string()),
		entryNumber: v.string(), // Unique entry number
		date: v.string(), // Transaction date
		description: v.string(), // Entry description
		type: v.union(
			v.literal("payment"), // Платеж
			v.literal("expense"), // Расход
			v.literal("revenue"), // Доход
			v.literal("transfer"), // Перевод
			v.literal("adjustment"), // Корректировка
		),
		status: v.union(
			v.literal("draft"), // Черновик
			v.literal("posted"), // Проведено
			v.literal("cancelled"), // Отменено
		),
		relatedPaymentId: v.optional(v.string()),
		createdBy: v.string(),
		approvedBy: v.optional(v.string()),
		createdAt: v.number(),
		postedAt: v.optional(v.number()),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_date", ["date"])
		.index("by_payment", ["relatedPaymentId"])
		.index("by_status", ["status"]),

	// Journal Lines (Строки проводок)
	journalLines: defineTable({
		journalEntryId: v.string(),
		accountId: v.string(),
		debit: v.number(), // Дебет
		credit: v.number(), // Кредит
		description: v.optional(v.string()),
		analyticsCode: v.optional(v.string()), // For analytical accounting
		taxAmount: v.optional(v.number()), // НДС
		createdAt: v.number(),
	})
		.index("by_entry", ["journalEntryId"])
		.index("by_account", ["accountId"]),

	// Payments (Платежи)
	payments: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		projectId: v.string(),
		paymentNumber: v.string(), // Unique payment number
		type: v.union(
			v.literal("incoming"), // Входящий платеж
			v.literal("outgoing"), // Исходящий платеж
		),
		amount: v.number(),
		currency: v.string(), // RUB, USD, etc.
		paymentDate: v.string(),
		dueDate: v.optional(v.string()),
		counterparty: v.string(), // Контрагент
		counterpartyInn: v.optional(v.string()), // ИНН контрагента
		purpose: v.string(), // Назначение платежа
		status: v.union(
			v.literal("pending"), // Ожидается
			v.literal("confirmed"), // Подтверждено
			v.literal("rejected"), // Отклонено
			v.literal("cancelled"), // Отменено
		),
		bankAccount: v.optional(v.string()), // Bank account number
		paymentMethod: v.union(
			v.literal("bank_transfer"), // Банковский перевод
			v.literal("cash"), // Наличные
			v.literal("card"), // Карта
			v.literal("other"), // Другое
		),
		notes: v.optional(v.string()),
		createdBy: v.string(),
		confirmedBy: v.optional(v.string()),
		createdAt: v.number(),
		confirmedAt: v.optional(v.number()),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_date", ["paymentDate"])
		.index("by_status", ["status"])
		.index("by_type", ["type"])
		.index("by_counterparty", ["counterparty"]),

	// Payment Documents (Документы платежей)
	paymentDocuments: defineTable({
		paymentId: v.string(),
		documentType: v.union(
			v.literal("invoice"), // Счет
			v.literal("act"), // Акт
			v.literal("contract"), // Договор
			v.literal("receipt"), // Квитанция
			v.literal("bank_statement"), // Банковская выписка
			v.literal("other"), // Другое
		),
		fileName: v.string(),
		fileUrl: v.string(), // Storage ID
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.string(),
		uploadedAt: v.number(),
	})
		.index("by_payment", ["paymentId"])
		.index("by_type", ["documentType"]),

	// Project Budgets (Бюджеты проектов)
	projectBudgets: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		projectId: v.string(),
		name: v.string(), // Budget name/version
		totalBudget: v.number(), // Total budget amount
		status: v.union(
			v.literal("draft"), // Черновик
			v.literal("approved"), // Утвержден
			v.literal("revised"), // Пересмотрен
		),
		effectiveDate: v.string(),
		notes: v.optional(v.string()),
		createdBy: v.string(),
		approvedBy: v.optional(v.string()),
		createdAt: v.number(),
		approvedAt: v.optional(v.number()),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_status", ["status"])
		.index("by_date", ["effectiveDate"]),

	// Budget Lines (Статьи бюджета)
	budgetLines: defineTable({
		budgetId: v.string(),
		accountId: v.string(), // Link to expense account
		category: v.string(), // Budget category
		description: v.string(),
		plannedAmount: v.number(), // Planned amount
		allocatedAmount: v.number(), // Actually allocated
		spentAmount: v.number(), // Actually spent (calculated)
		notes: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_budget", ["budgetId"])
		.index("by_account", ["accountId"]),

	// Expenses (Расходы)
	expenses: defineTable({
		organizationId: v.string(), // Better Auth organization ID
		projectId: v.string(),
		expenseNumber: v.string(), // Unique expense number
		category: v.union(
			v.literal("materials"), // Материалы
			v.literal("labor"), // Работа
			v.literal("equipment"), // Оборудование
			v.literal("transport"), // Транспорт
			v.literal("utilities"), // Коммунальные услуги
			v.literal("permits"), // Разрешения
			v.literal("insurance"), // Страхование
			v.literal("taxes"), // Налоги
			v.literal("other"), // Другое
		),
		description: v.string(),
		amount: v.number(),
		currency: v.string(), // RUB, USD, etc.
		expenseDate: v.string(),
		vendor: v.string(), // Поставщик
		vendorInn: v.optional(v.string()), // ИНН поставщика
		invoiceNumber: v.optional(v.string()),
		status: v.union(
			v.literal("pending"), // Ожидается
			v.literal("approved"), // Одобрено
			v.literal("paid"), // Оплачено
			v.literal("rejected"), // Отклонено
			v.literal("cancelled"), // Отменено
		),
		paymentMethod: v.union(
			v.literal("bank_transfer"), // Банковский перевод
			v.literal("cash"), // Наличные
			v.literal("card"), // Карта
			v.literal("other"), // Другое
		),
		relatedPaymentId: v.optional(v.string()), // Link to payment if paid
		notes: v.optional(v.string()),
		createdBy: v.string(),
		approvedBy: v.optional(v.string()),
		paidBy: v.optional(v.string()),
		createdAt: v.number(),
		approvedAt: v.optional(v.number()),
		paidAt: v.optional(v.number()),
	})
		.index("by_organization", ["organizationId"])
		.index("by_project", ["projectId"])
		.index("by_date", ["expenseDate"])
		.index("by_status", ["status"])
		.index("by_category", ["category"])
		.index("by_vendor", ["vendor"])
		.index("by_payment", ["relatedPaymentId"]),

	// Expense Documents (Документы расходов)
	expenseDocuments: defineTable({
		expenseId: v.string(),
		documentType: v.union(
			v.literal("invoice"), // Счет
			v.literal("receipt"), // Квитанция
			v.literal("contract"), // Договор
			v.literal("delivery_note"), // Накладная
			v.literal("act"), // Акт
			v.literal("other"), // Другое
		),
		fileName: v.string(),
		fileUrl: v.string(), // Storage ID
		fileSize: v.number(),
		mimeType: v.string(),
		uploadedBy: v.string(),
		uploadedAt: v.number(),
	})
		.index("by_expense", ["expenseId"])
		.index("by_type", ["documentType"]),

	// Budget Revisions (Изменения бюджета)
	budgetRevisions: defineTable({
		projectId: v.string(),
		originalBudgetId: v.string(),
		newBudgetId: v.string(),
		reason: v.string(), // Reason for revision
		changeAmount: v.number(), // Positive for increase, negative for decrease
		revisedBy: v.string(),
		approvedBy: v.optional(v.string()),
		createdAt: v.number(),
		approvedAt: v.optional(v.number()),
	})
		.index("by_project", ["projectId"])
		.index("by_original", ["originalBudgetId"])
		.index("by_new", ["newBudgetId"]),

	// Account Balances (for performance - cached balances)
	accountBalances: defineTable({
		accountId: v.string(),
		projectId: v.optional(v.string()),
		period: v.string(), // YYYY-MM format
		openingBalance: v.number(),
		totalDebits: v.number(),
		totalCredits: v.number(),
		closingBalance: v.number(),
		lastUpdated: v.number(),
	})
		.index("by_account", ["accountId"])
		.index("by_project", ["projectId"])
		.index("by_period", ["period"])
		.index("by_account_period", ["accountId", "period"]),
	// Project Access Control - defines who has access to specific projects
	projectAccess: defineTable({
		projectId: v.string(),
		userId: v.optional(v.string()), // Either user or team, not both
		teamId: v.optional(v.string()), // Either team or user, not both
		accessLevel: v.union(
			v.literal("owner"), // Full control
			v.literal("admin"), // Can manage project settings and members
			v.literal("write"), // Can create/edit tasks and documents
			v.literal("read"), // View-only access
		),
		grantedBy: v.string(),
		grantedAt: v.number(),
		expiresAt: v.optional(v.number()), // Optional expiration date
	})
		.index("by_project", ["projectId"])
		.index("by_user", ["userId"])
		.index("by_team", ["teamId"])
		.index("by_project_user", ["projectId", "userId"])
		.index("by_project_team", ["projectId", "teamId"]),

	// Resource-level permissions for fine-grained access control
	resourcePermissions: defineTable({
		resourceType: v.union(
			v.literal("project"),
			v.literal("document"),
			v.literal("issue"),
			v.literal("team"),
		),
		resourceId: v.string(), // ID of the specific resource
		userId: v.optional(v.string()),
		teamId: v.optional(v.string()),
		permissions: v.array(v.string()), // Array of permission strings like "read", "write", "delete"
		grantedBy: v.string(),
		grantedAt: v.number(),
		expiresAt: v.optional(v.number()),
	})
		.index("by_resource", ["resourceType", "resourceId"])
		.index("by_user", ["userId"])
		.index("by_team", ["teamId"])
		.index("by_resource_user", ["resourceType", "resourceId", "userId"]),

	// Permission groups for bundling related permissions
	permissionGroups: defineTable({
		name: v.string(), // e.g., "project_manager_permissions"
		displayName: v.string(),
		description: v.string(),
		permissionIds: v.array(v.string()),
		isSystem: v.boolean(),
		createdAt: v.string(),
		updatedAt: v.string(),
	}).index("by_name", ["name"]),

	// Team project access for bulk team assignments
	teamProjectAccess: defineTable({
		teamId: v.string(),
		projectId: v.string(),
		accessLevel: v.union(
			v.literal("admin"),
			v.literal("write"),
			v.literal("read"),
		),
		inheritToMembers: v.boolean(), // Whether team members inherit this access
		grantedBy: v.string(),
		grantedAt: v.number(),
	})
		.index("by_team", ["teamId"])
		.index("by_project", ["projectId"])
		.index("by_team_project", ["teamId", "projectId"]),

	// Document access control
	documentAccess: defineTable({
		documentId: v.string(),
		userId: v.optional(v.string()),
		teamId: v.optional(v.string()),
		accessLevel: v.union(
			v.literal("owner"),
			v.literal("editor"),
			v.literal("commenter"),
			v.literal("viewer"),
		),
		canShare: v.boolean(), // Can share with others
		grantedBy: v.string(),
		grantedAt: v.number(),
		expiresAt: v.optional(v.number()),
	})
		.index("by_document", ["documentId"])
		.index("by_user", ["userId"])
		.index("by_team", ["teamId"])
		.index("by_document_user", ["documentId", "userId"]),

	// Legal documents for construction projects
	projectLegalDocuments: defineTable({
		constructionProjectId: v.string(),
		organizationId: v.string(), // Better Auth organization ID
		documentType: v.union(
			v.literal("contract"),
			v.literal("invoice"),
			v.literal("receipt"),
			v.literal("permit"),
			v.literal("certificate"),
			v.literal("report"),
			v.literal("protocol"),
			v.literal("other"),
		),
		fileName: v.string(),
		fileUrl: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		description: v.optional(v.string()),
		uploadedBy: v.string(),
		uploadedAt: v.number(),
		status: v.union(
			v.literal("draft"),
			v.literal("pending_review"),
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("expired"),
		),
		expirationDate: v.optional(v.number()),
		isConfidential: v.optional(v.boolean()),
		tags: v.optional(v.array(v.string())),
		relatedPartyName: v.optional(v.string()),
		relatedPartyContact: v.optional(v.string()),
		contractAmount: v.optional(v.number()),
		paymentStatus: v.optional(
			v.union(v.literal("pending"), v.literal("partial"), v.literal("paid")),
		),
		notes: v.optional(v.string()),
		reviewedBy: v.optional(v.string()),
		reviewedAt: v.optional(v.number()),
		approvedBy: v.optional(v.string()),
		approvedAt: v.optional(v.number()),
	})
		.index("by_project", ["constructionProjectId"])
		.index("by_organization", ["organizationId"])
		.index("by_type", ["documentType"])
		.index("by_status", ["status"])
		.index("by_uploader", ["uploadedBy"])
		.index("by_project_type", ["constructionProjectId", "documentType"]),
});
