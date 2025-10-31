import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation } from "./_generated/server";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

// Utility function to cast Better Auth string IDs to Convex user IDs
// This is needed because Better Auth uses string IDs but Convex expects typed IDs
function asUserId(stringId: string): Id<"user"> {
	return stringId as Id<"user">;
}

function asUserIdArray(stringIds: string[]): Id<"user">[] {
	return stringIds as Id<"user">[];
}

// Helper function to clear all data from the database
async function clearAllData(ctx: MutationCtx) {
	const results = [];

	try {
		// Get all table names from schema (excluding auth tables)
		const tablesToClear = [
			// Main data tables
			"constructionProjects",
			"monthlyRevenue",
			"workCategories",
			"constructionTeams",
			"issues",
			"documents",
			"documentVersions",
			"documentAttachments",
			"documentComments",
			"documentAssignments",
			"documentActivity",
			"documentTemplates",
			"documentMentions",
			"documentTasks",
			"issueAttachments",
			"issueComments",
			"issueMentions",
			"issueActivities",
			"pushSubscriptions",
			"notificationPreferences",
			"notifications",
			"passwordResetTokens",
			"userGeneratedPasswords",

			// Finance tables
			"accounts",
			"journalEntries",
			"journalLines",
			"payments",
			"paymentDocuments",
			"projectBudgets",
			"budgetLines",
			"expenses",
			"expenseDocuments",
			"budgetRevisions",
			"accountBalances",

			// Access control tables (keeping some for now)
			"documentAccess",
			"projectLegalDocuments",

			// Organization and role tables (keeping some for internal structure)
			"userDepartments",
			"departments",
			"organizationalPositions",

			// Base data tables
			"labels",
			"priorities",
			"status",

			// Users table (custom schema)
			"users",
		];

		for (const tableName of tablesToClear) {
			try {
				const docs = await ctx.db.query(tableName as any).collect();
				let deletedCount = 0;

				for (const doc of docs) {
					await ctx.db.delete(doc._id);
					deletedCount++;
				}

				results.push({
					table: tableName,
					deletedCount,
					status: "success" as const,
				});
			} catch (error) {
				results.push({
					table: tableName,
					error: error instanceof Error ? error.message : String(error),
					status: "error" as const,
				});
			}
		}

		// Clear Better Auth tables
		try {
			const authTables = [
				"user",
				"session",
				"account",
				"verification",
				"organization",
				"member",
				"invitation",
				"jwks",
			];

			for (const tableName of authTables) {
				try {
					const docs = await ctx.db.query(tableName as any).collect();
					let deletedCount = 0;

					for (const doc of docs) {
						await ctx.db.delete(doc._id);
						deletedCount++;
					}

					results.push({
						table: `auth.${tableName}`,
						deletedCount,
						status: "success" as const,
					});
				} catch (error) {
					results.push({
						table: `auth.${tableName}`,
						error: error instanceof Error ? error.message : String(error),
						status: "error" as const,
					});
				}
			}
		} catch (error) {
			results.push({
				table: "auth_tables",
				error: error instanceof Error ? error.message : String(error),
				status: "error",
			});
		}

		const totalDeleted = results.reduce(
			(sum, result) => sum + (result.deletedCount || 0),
			0,
		);
		const errors = results.filter((result) => result.status === "error");

		return {
			message: "Database cleared",
			totalDeleted,
			tablesCleared: results.length,
			errors: errors.length,
			results,
		};
	} catch (error) {
		return {
			message: "Failed to clear database",
			error: error instanceof Error ? error.message : String(error),
			results,
		};
	}
}

// Action function that orchestrates all seeding by calling individual mutations
async function performSeedingAction(ctx: ActionCtx) {
	const results = [];

	try {
		console.log("🌱 Starting database seeding process...");

		// Skip permissions and roles - using Better Auth built-in roles

		// 1. Create organization with Better Auth
		console.log("🏢 Creating organization...");
		let orgResult: any;
		try {
			// Use a predefined owner user ID
			const ownerId = "j5704yk0nwh8aczceyvz0t6nvh7swn77"; // Replace with actual user ID
			console.log(`✅ Using owner user: ${ownerId}`);

			orgResult = await ctx.runMutation(
				api.seedDatabase.createOrganizationMutation,
				{
					ownerId: ownerId,
				},
			);
			console.log("🏢 Organization creation result:", orgResult);
			results.push({ step: "Organization", ...orgResult });
		} catch (userCreationError) {
			console.error("❌ Failed to create organization:", userCreationError);
			throw new Error(
				`Organization creation failed: ${userCreationError instanceof Error ? userCreationError.message : String(userCreationError)}`,
			);
		}

		// 2. Create organizational positions and departments (keeping these for internal structure)
		console.log("🏗️ Creating organizational positions...");
		const positionsResult = await ctx.runMutation(
			api.seedDatabase.createOrganizationalPositionsMutation,
			{},
		);
		console.log(`✅ Created ${positionsResult.positionsCreated} positions`);
		results.push({ step: "Organizational Positions", ...positionsResult });

		console.log("🏢 Creating departments...");
		const departmentsResult = await ctx.runMutation(
			api.seedDatabase.createDepartmentsMutation,
			{
				organizationId: orgResult.organizationId,
			},
		);
		console.log(
			`✅ Created ${departmentsResult.departmentsCreated} departments`,
		);
		results.push({ step: "Departments", ...departmentsResult });

		// 3. Create base data (statuses, priorities, labels)
		console.log("📊 Creating base data (statuses, priorities, labels)...");
		const baseDataResult = await ctx.runMutation(
			api.seedDatabase.createBaseDataMutation,
			{},
		);
		console.log(
			`✅ Created base data: ${baseDataResult.statusIds.length} statuses, ${baseDataResult.priorityIds.length} priorities, ${baseDataResult.labelIds.length} labels`,
		);
		results.push({ step: "Base Data", ...baseDataResult });

		// 4. Create additional users with Better Auth (simplified roles)
		console.log("👥 Creating additional users...");
		const usersResult = await createUsersWithAction(
			ctx,
			orgResult.organizationId,
		);
		console.log(
			`✅ Created ${usersResult.usersCreated} additional users (total: ${usersResult.userIds.length})`,
		);
		results.push({ step: "Users", ...usersResult });

		// 5. Create teams using Better Auth only
		console.log("🤝 Creating Better Auth teams...");
		const teamsResult = await createTeamsWithBetterAuth(
			ctx,
			orgResult.organizationId,
			usersResult.userIds,
		);
		console.log(`✅ Created ${teamsResult.teamsCreated} teams`);
		results.push({ step: "Teams", ...teamsResult });

		// 6. Create construction projects (simplified without custom permissions)
		console.log("🏗️ Creating construction projects...");
		const projectsResult = await ctx.runMutation(
			api.seedDatabase.createConstructionProjectsMutation,
			{
				organizationId: orgResult.organizationId,
				userIds: usersResult.userIds,
				statusIds: baseDataResult.statusIds,
				priorityIds: baseDataResult.priorityIds,
			},
		);
		console.log(
			`✅ Created ${projectsResult.projectsCreated} construction projects`,
		);
		results.push({ step: "Construction Projects", ...projectsResult });

		// 7. Create sample tasks
		console.log("📋 Creating sample tasks...");
		const tasksResult = await ctx.runMutation(
			api.seedDatabase.createTasksMutation,
			{
				organizationId: orgResult.organizationId,
				userIds: usersResult.userIds,
				projectIds: projectsResult.projectIds,
				statusIds: baseDataResult.statusIds,
				priorityIds: baseDataResult.priorityIds,
				labelIds: baseDataResult.labelIds,
			},
		);
		console.log(`✅ Created ${tasksResult.tasksCreated} tasks`);
		results.push({ step: "Tasks", ...tasksResult });

		// 8. Create sample documents
		console.log("📄 Creating sample documents...");
		const documentsResult = await ctx.runMutation(
			api.seedDatabase.createDocumentsMutation,
			{
				organizationId: orgResult.organizationId,
				userIds: usersResult.userIds,
				projectIds: projectsResult.projectIds,
			},
		);
		console.log(`✅ Created ${documentsResult.documentsCreated} documents`);
		results.push({ step: "Documents", ...documentsResult });

		console.log("🎉 Database seeding completed successfully!");
		console.log(
			`📊 Summary: ${usersResult.userIds.length} users, ${projectsResult.projectIds.length} projects, ${tasksResult.taskIds.length} tasks, ${teamsResult.teamIds.length} teams`,
		);

		return {
			message: "Database seeded successfully",
			organizationId: orgResult.organizationId,
			results,
			summary: {
				users: usersResult.userIds.length,
				projects: projectsResult.projectIds.length,
				tasks: tasksResult.taskIds.length,
				teams: teamsResult.teamIds.length,
			},
		};
	} catch (error) {
		console.error("❌ SEEDING FAILED:", error);
		console.error("📍 Error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			resultsBeforeError: results.map((r) => r.step),
		});

		return {
			message: "Seeding failed",
			error: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			completedSteps: results.map((r) => r.step),
			results,
		};
	}
}

// Clear all data from the database
export const clearDatabase = mutation({
	args: {},
	handler: async (ctx) => {
		return await clearAllData(ctx);
	},
});

export const seedAdmin = mutation({
	args: {},

	handler: async (ctx) => {
		try {
			const auth = createAuth(ctx);

			const res = await auth.api.signUpEmail({
				body: {
					email: "akmt.me23@gmail.com",
					password: "nekorytaylor123!",
					name: "Akmt Owner",
					rememberMe: true,
				},
				headers: await authComponent.getHeaders(ctx),
			});

			await auth.api.setRole({
				body: {
					userId: res.user.id,
					role: "admin",
				},
				headers: await authComponent.getHeaders(ctx),
			});

			return {
				message: "Admin user created",
			};
		} catch (error) {
			console.error("❌ SEEDING FAILED:", error);
			throw new Error(
				`User creation failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	},
});

// Clear database and then seed action
export const clearAndSeed = action({
	args: {},
	handler: async (ctx) => {
		const results = [];

		try {
			console.log("🗑️ Starting database clear and seed process...");

			// 1. Clear all data first
			console.log("🧹 Clearing existing data...");
			const clearResult = await ctx.runMutation(
				api.seedDatabase.clearDatabase,
				{},
			);
			console.log(
				`✅ Cleared ${clearResult.totalDeleted} records from ${clearResult.tablesCleared} tables`,
			);
			results.push({ step: "Clear Database", ...clearResult });

			// 2. Run the seeding process
			console.log("🌱 Starting seeding process...");
			const seedResult = await performSeedingAction(ctx);
			results.push({ step: "Seed Database", ...seedResult });

			console.log("🎉 Clear and seed process completed successfully!");
			return {
				message: "Database cleared and seeded successfully",
				results,
			};
		} catch (error) {
			console.error("❌ CLEAR AND SEED FAILED:", error);
			console.error("📍 Error details:", {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				completedSteps: results.map((r) => r.step),
			});

			return {
				message: "Failed to clear and seed database",
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
				completedSteps: results.map((r) => r.step),
				results,
			};
		}
	},
});

// Individual mutation functions for each seeding step

export const createOrganizationMutation = mutation({
	args: {
		ownerId: v.string(),
	},
	handler: async (ctx, args) => {
		return await createOrganization(ctx, args.ownerId);
	},
});

export const createOrganizationalPositionsMutation = mutation({
	args: {},
	handler: async (ctx) => {
		return await createOrganizationalPositions(ctx);
	},
});

export const createDepartmentsMutation = mutation({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		return await createDepartments(ctx, args.organizationId);
	},
});

export const createBaseDataMutation = mutation({
	args: {},
	handler: async (ctx) => {
		return await createBaseData(ctx);
	},
});

export const createUsersAction = action({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		return await createUsersWithAction(ctx, args.organizationId);
	},
});

export const createConstructionProjectsMutation = mutation({
	args: {
		organizationId: v.string(),
		userIds: v.array(v.string()),
		statusIds: v.array(v.id("status")),
		priorityIds: v.array(v.id("priorities")),
	},
	handler: async (ctx, args) => {
		return await createConstructionProjects(
			ctx,
			args.organizationId,
			args.userIds,
			args.statusIds,
			args.priorityIds,
		);
	},
});

export const createTasksMutation = mutation({
	args: {
		organizationId: v.string(),
		userIds: v.array(v.string()),
		projectIds: v.array(v.id("constructionProjects")),
		statusIds: v.array(v.id("status")),
		priorityIds: v.array(v.id("priorities")),
		labelIds: v.array(v.id("labels")),
	},
	handler: async (ctx, args) => {
		return await createTasks(
			ctx,
			args.organizationId,
			args.userIds,
			args.projectIds,
			args.statusIds,
			args.priorityIds,
			args.labelIds,
		);
	},
});

export const createDocumentsMutation = mutation({
	args: {
		organizationId: v.string(),
		userIds: v.array(v.string()),
		projectIds: v.array(v.id("constructionProjects")),
	},
	handler: async (ctx, args) => {
		return await createDocuments(
			ctx,
			args.organizationId,
			args.userIds,
			args.projectIds,
		);
	},
});

// Main seed action that orchestrates all seeding by calling individual mutations
export const seedDatabase = action({
	args: {},
	handler: async (ctx) => {
		return await performSeedingAction(ctx);
	},
});

// Removed permissions system - using Better Auth roles instead

// Removed custom roles system - using Better Auth roles instead

// Create organization using Better Auth organization plugin
async function createOrganization(ctx: MutationCtx, ownerId: string) {
	const auth = createAuth(ctx);

	// Create organization using Better Auth organization plugin
	const orgResponse = await auth.api.createOrganization({
		body: {
			name: "СтройКомплекс",
			slug: "stroycomplex",
			userId: ownerId,
			logo: "https://api.dicebear.com/7.x/shapes/svg?seed=stroycomplex",
		},
		headers: await authComponent.getHeaders(ctx),
	});

	if (!orgResponse?.id) {
		throw new Error("Failed to create organization");
	}

	return {
		message: "Organization created",
		organizationId: orgResponse?.id,
		ownerId: ownerId,
	};
}

// Create organizational positions
async function createOrganizationalPositions(ctx: MutationCtx) {
	const now = new Date().toISOString();
	const positions = [
		{ name: "owner", displayName: "Владелец", level: 0 },
		{ name: "ceo", displayName: "Генеральный директор", level: 1 },
		{
			name: "chief_engineer",
			displayName: "Главный инженер проекта (ГИП)",
			level: 2,
		},
		{ name: "department_head", displayName: "Руководитель отдела", level: 3 },
		{ name: "senior_specialist", displayName: "Старший специалист", level: 4 },
		{ name: "specialist", displayName: "Специалист", level: 5 },
	];

	const positionIds: Record<string, Id<"organizationalPositions">> = {};

	for (const position of positions) {
		const id = await ctx.db.insert("organizationalPositions", {
			...position,
			canManageLevelsBelow: position.level <= 3,
			isUnique: position.level <= 2,
			createdAt: now,
		});
		positionIds[position.name] = id;
	}

	return {
		message: "Organizational positions created",
		positionsCreated: positions.length,
		positionIds,
	};
}

// Create departments
async function createDepartments(
	ctx: MutationCtx,
	organizationId: string, // Better Auth organization ID
) {
	const now = new Date().toISOString();

	// Root company department
	const companyId = await ctx.db.insert("departments", {
		organizationId,
		name: "company",
		displayName: "СтройКомплекс",
		description: "Главная организация",
		parentId: undefined,
		level: 0,
		headUserId: undefined,
		isActive: true,
		createdAt: now,
		updatedAt: now,
	});

	// Main departments
	const departments = [
		{
			name: "management",
			displayName: "Управление",
			description: "Административное управление",
		},
		{
			name: "engineering",
			displayName: "Инженерный отдел",
			description: "Проектирование и инженерные решения",
		},
		{
			name: "construction",
			displayName: "Строительный отдел",
			description: "Выполнение строительных работ",
		},
		{
			name: "design",
			displayName: "Отдел проектирования",
			description: "Архитектурное проектирование",
		},
	];

	const departmentIds: Record<string, Id<"departments">> = {};

	for (const dept of departments) {
		const id = await ctx.db.insert("departments", {
			organizationId,
			...dept,
			parentId: companyId,
			level: 1,
			headUserId: undefined,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		departmentIds[dept.name] = id;
	}

	return {
		message: "Departments created",
		departmentsCreated: departments.length + 1,
		departmentIds,
	};
}

// Create base data
async function createBaseData(ctx: MutationCtx) {
	const statusIds: Id<"status">[] = [];
	const priorityIds: Id<"priorities">[] = [];
	const labelIds: Id<"labels">[] = [];

	// Statuses - indexes: 0=К выполнению, 1=В работе, 2=На проверке, 3=Завершено, 4=Отменено
	const statuses = [
		{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
		{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
		{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
		{ name: "Завершено", color: "#10B981", iconName: "CheckCircle" },
		{ name: "Отменено", color: "#EF4444", iconName: "XCircle" },
	];

	for (const status of statuses) {
		const id = await ctx.db.insert("status", status);
		statusIds.push(id);
	}

	// Priorities - indexes: 0=Критический, 1=Высокий, 2=Средний, 3=Низкий
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
		const id = await ctx.db.insert("priorities", priority);
		priorityIds.push(id);
	}

	// Labels
	const labels = [
		{ name: "Срочно", color: "#FF4444" },
		{ name: "Документация", color: "#4169E1" },
		{ name: "Безопасность", color: "#FFA500" },
		{ name: "Проверка", color: "#32CD32" },
		{ name: "Материалы", color: "#8A2BE2" },
		{ name: "Оборудование", color: "#FF6347" },
	];

	for (const label of labels) {
		const id = await ctx.db.insert("labels", label);
		labelIds.push(id);
	}

	return {
		message: "Base data created",
		statusIds,
		priorityIds,
		labelIds,
	};
}

// Create users using Better Auth admin plugin
async function createUsers(
	ctx: MutationCtx,
	organizationId: string, // Better Auth organization ID
	roleIds: Record<string, Id<"roles">>,
) {
	const userIds: string[] = [];
	const auth = createAuth(ctx);

	// Additional users based on organizational chart
	const users = [
		{
			name: "omirbek.zhanserik@mail.ru",
			email: "omirbek.zhanserik@mail.ru",
			position: "Директор отдела продаж",
			roleId: roleIds.director,
			password: "password123",
		},
		{
			name: "reinaamet@mail.ru",
			email: "reinaamet@mail.ru",
			position: "Технический директор",
			roleId: roleIds.director,
			password: "password123",
		},
		{
			name: "ssako.05@mail.ru",
			email: "ssako.05@mail.ru",
			position: "Специалист отдела продаж",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "yernursss@gmail.com",
			email: "yernursss@gmail.com",
			position: "Специалист отдела продаж",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "amir211194@gmail.com",
			email: "amir211194@gmail.com",
			position: "Специалист отдела продаж",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "bolatbek.sabitov.02@mail.ru",
			email: "bolatbek.sabitov.02@mail.ru",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "alzada-03@bk.ru",
			email: "alzada-03@bk.ru",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "jrisani@mail.ru",
			email: "jrisani@mail.ru",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "ganlormenov1@gmail.com",
			email: "ganlormenov1@gmail.com",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "Zaicev120406@mail.ru",
			email: "Zaicev120406@mail.ru",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "kadyrbayzhuldyz@gmail.com",
			email: "kadyrbayzhuldyz@gmail.com",
			position: "Технический специалист",
			roleId: roleIds.member,
			password: "password123",
		},
		{
			name: "kakenov.talgat@mail.ru",
			email: "kakenov.talgat@mail.ru",
			position: "Главный инженер проекта (ГИП)",
			roleId: roleIds.project_manager,
			password: "password123",
		},
		{
			name: "botakoz_02_04@bk.ru",
			email: "botakoz_02_04@bk.ru",
			position: "Офис менеджер",
			roleId: roleIds.admin,
			password: "password123",
		},
	];

	for (const userData of users) {
		// Create user using Better Auth
		const userResponse = await auth.api.createUser({
			body: {
				email: userData.email,
				name: userData.name,
				password: userData.password,
				role: "user",
				data: {
					position: userData.position,
				},
			},
			headers: await authComponent.getHeaders(ctx),
		});

		if (!userResponse?.user) {
			console.error(`Failed to create user ${userData.email}`);
			continue;
		}
		// Add user to organization using Better Auth organization plugin
		await auth.api.addMember({
			body: {
				organizationId,
				userId: userResponse.user.id,
				role: userData.roleId === roleIds.director ? "admin" : "member",
			},
			headers: await authComponent.getHeaders(ctx),
		});

		userIds.push(userResponse.user.id);
	}

	return {
		message: "Users created",
		usersCreated: userIds.length,
		userIds,
	};
}

// Create users using Better Auth admin plugin - Action version to handle timeouts
async function createUsersWithAction(
	ctx: ActionCtx,
	organizationId: string, // Better Auth organization ID
) {
	const userIds: string[] = [];
	const auth = createAuth(ctx);

	// Additional users based on organizational chart (simplified with Better Auth roles)
	const users = [
		{
			name: "omirbek.zhanserik@mail.ru",
			email: "omirbek.zhanserik@mail.ru",
			position: "Директор отдела продаж",
			betterAuthRole: "admin", // Better Auth role
			password: "password123",
		},
		{
			name: "reinaamet@mail.ru",
			email: "reinaamet@mail.ru",
			position: "Технический директор",
			betterAuthRole: "admin", // Better Auth role
			password: "password123",
		},
		{
			name: "ssako.05@mail.ru",
			email: "ssako.05@mail.ru",
			position: "Специалист отдела продаж",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "yernursss@gmail.com",
			email: "yernursss@gmail.com",
			position: "Специалист отдела продаж",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "amir211194@gmail.com",
			email: "amir211194@gmail.com",
			position: "Специалист отдела продаж",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "bolatbek.sabitov.02@mail.ru",
			email: "bolatbek.sabitov.02@mail.ru",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "alzada-03@bk.ru",
			email: "alzada-03@bk.ru",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "jrisani@mail.ru",
			email: "jrisani@mail.ru",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "ganlormenov1@gmail.com",
			email: "ganlormenov1@gmail.com",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "Zaicev120406@mail.ru",
			email: "Zaicev120406@mail.ru",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "kadyrbayzhuldyz@gmail.com",
			email: "kadyrbayzhuldyz@gmail.com",
			position: "Технический специалист",
			betterAuthRole: "member", // Better Auth role
			password: "password123",
		},
		{
			name: "kakenov.talgat@mail.ru",
			email: "kakenov.talgat@mail.ru",
			position: "Главный инженер проекта (ГИП)",
			betterAuthRole: "admin", // Better Auth role
			password: "password123",
		},
		{
			name: "botakoz_02_04@bk.ru",
			email: "botakoz_02_04@bk.ru",
			position: "Офис менеджер",
			betterAuthRole: "admin", // Better Auth role
			password: "password123",
		},
	];

	// Create users in smaller batches to avoid timeout
	const batchSize = 3; // Process 3 users at a time
	for (let i = 0; i < users.length; i += batchSize) {
		const batch = users.slice(i, i + batchSize);

		for (const userData of batch) {
			try {
				// Create user using Better Auth
				const userResponse = await auth.api.createUser({
					body: {
						email: userData.email,
						name: userData.name,
						password: userData.password,
						role: "user",
						data: {
							position: userData.position,
						},
					},
					headers: await authComponent.getHeaders(ctx),
				});

				if (!userResponse?.user) {
					console.error(`Failed to create user ${userData.email}`);
					continue;
				}

				// Add user to organization using Better Auth organization plugin
				await auth.api.addMember({
					body: {
						organizationId,
						userId: userResponse.user.id,
						role: userData.betterAuthRole,
					},
					headers: await authComponent.getHeaders(ctx),
				});

				userIds.push(userResponse.user.id);
				console.log(`✅ Created user: ${userData.email}`);
			} catch (error) {
				console.error(`Failed to create user ${userData.email}:`, error);
			}
		}

		// Small delay between batches to prevent overwhelming the system
		if (i + batchSize < users.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	console.log(`🔍 Debug - Created users (action):`, userIds);
	return {
		message: "Users created",
		usersCreated: userIds.length,
		userIds,
	};
}

// Create teams using only Better Auth
async function createTeamsWithBetterAuth(
	ctx: ActionCtx,
	organizationId: string, // Better Auth organization ID
	userIds: string[],
) {
	const auth = createAuth(ctx);

	const teams = [
		{
			name: "Отдел продаж",
			memberIds: [userIds[0], userIds[2], userIds[3], userIds[4]], // Sales team
		},
		{
			name: "Технический отдел",
			memberIds: [
				userIds[1],
				userIds[5],
				userIds[6],
				userIds[7],
				userIds[8],
				userIds[9],
				userIds[10],
			], // Technical team
		},
		{
			name: "ГИП группа",
			memberIds: [userIds[11], userIds[5], userIds[6]], // GIP team with some technical specialists
		},
		{
			name: "Офис-менеджмент",
			memberIds: [userIds[12]], // Office management
		},
	];

	const teamIds: string[] = [];

	for (const team of teams) {
		try {
			// Create team using Better Auth
			const teamResponse = await auth.api.createTeam({
				body: {
					organizationId,
					name: team.name,
				},
				headers: await authComponent.getHeaders(ctx),
			});

			if (!teamResponse?.id) {
				console.error(`Failed to create team ${team.name}`);
				continue;
			}

			// Add team members using Better Auth
			for (const userId of team.memberIds) {
				try {
					await auth.api.addTeamMember({
						body: {
							teamId: teamResponse.id,
							userId,
						},
						headers: await authComponent.getHeaders(ctx),
					});
				} catch (error) {
					console.error(
						`Failed to add user ${userId} to team ${team.name}:`,
						error,
					);
				}
			}

			teamIds.push(teamResponse.id);
			console.log(
				`✅ Created team: ${team.name} with ${team.memberIds.length} members`,
			);
		} catch (error) {
			console.error(`Failed to create team ${team.name}:`, error);
		}
	}

	return {
		message: "Teams created",
		teamsCreated: teamIds.length,
		teamIds,
	};
}

// Removed custom teams - using Better Auth teams only

// Removed construction teams - using Better Auth teams only

// Create construction projects
async function createConstructionProjects(
	ctx: MutationCtx,
	organizationId: string, // Better Auth organization ID
	userIds: string[],
	statusIds: Id<"status">[],
	priorityIds: Id<"priorities">[],
) {
	const projects = [
		{
			name: "ЖК Садовый",
			client: "ООО Девелопмент Плюс",
			statusId: statusIds[1], // В работе
			iconName: "Building",
			percentComplete: 45,
			contractValue: 150000000,
			startDate: "2024-01-15",
			targetDate: "2025-06-30",
			leadId: userIds[11], // kakenov.talgat@mail.ru (ГИП)
			priorityId: priorityIds[1], // Высокий
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект идет по плану",
			location: "г. Москва, ул. Садовая, 15",
			projectType: "residential" as const,
			notes: "Строительство 3 корпусов по 12 этажей",
			teamMemberIds: [userIds[11], userIds[1], userIds[5], userIds[6]], // ГИП, Technical Director, Technical specialists
		},
		{
			name: "ТЦ Вертикаль",
			client: "АО Торговые центры",
			statusId: statusIds[1], // В работе
			iconName: "ShoppingCart",
			percentComplete: 30,
			contractValue: 85000000,
			startDate: "2024-03-01",
			targetDate: "2024-12-15",
			leadId: userIds[1], // reinaamet@mail.ru (Technical Director)
			priorityId: priorityIds[1], // Высокий
			healthId: "warning",
			healthName: "Требует внимания",
			healthColor: "#F59E0B",
			healthDescription: "Задержки в поставке материалов",
			location: "г. Москва, Ленинский проспект, 45",
			projectType: "commercial" as const,
			notes: "Современный торговый центр с подземной парковкой",
			teamMemberIds: [userIds[1], userIds[7], userIds[8], userIds[9]], // Technical team
		},
		{
			name: "Бизнес-центр Альфа",
			client: "ООО БизнесСтрой",
			statusId: statusIds[0], // К выполнению
			iconName: "Briefcase",
			percentComplete: 5,
			contractValue: 200000000,
			startDate: "2024-06-01",
			targetDate: "2026-03-31",
			leadId: userIds[11], // kakenov.talgat@mail.ru (ГИП)
			priorityId: priorityIds[2], // Средний
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект на стадии планирования",
			location: "г. Санкт-Петербург, Невский проспект, 100",
			projectType: "commercial" as const,
			notes: "15-этажный бизнес-центр класса А",
			teamMemberIds: [userIds[11], userIds[1], userIds[10], userIds[12]], // ГИП, Technical Director, Technical specialist, Office Manager
		},
		{
			name: "Реконструкция завода",
			client: "ПАО Промышленная группа",
			statusId: statusIds[1], // В работе
			iconName: "Factory",
			percentComplete: 60,
			contractValue: 120000000,
			startDate: "2023-10-01",
			targetDate: "2024-08-31",
			leadId: userIds[1], // reinaamet@mail.ru (Technical Director)
			priorityId: priorityIds[0], // Критический
			healthId: "warning",
			healthName: "Требует внимания",
			healthColor: "#F59E0B",
			healthDescription: "Необходимо ускорить темпы работ",
			location: "г. Екатеринбург, Промышленная зона",
			projectType: "industrial" as const,
			notes: "Модернизация производственных цехов",
			teamMemberIds: [userIds[1], userIds[5], userIds[6], userIds[7]], // Technical team
		},
	];

	const projectIds: Id<"constructionProjects">[] = [];
	const creatorId = asUserId(userIds[0]); // Owner

	for (const project of projects) {
		// Debug: Log the lead ID to see what we're getting
		console.log(
			`🔍 Debug - Project: ${project.name}, leadId: ${project.leadId}, type: ${typeof project.leadId}`,
		);

		// Cast the project data to fix type issues
		const projectData = {
			...project,
			leadId: asUserId(project.leadId),
			teamMemberIds: asUserIdArray(project.teamMemberIds),
		};

		console.log(`🔍 Debug - After casting leadId: ${projectData.leadId}`);

		const projectId = await ctx.db.insert("constructionProjects", {
			organizationId,
			...projectData,
		});
		projectIds.push(projectId);

		// Removed project access logic - using Better Auth permissions instead

		// Create monthly revenue data
		const months = [
			"2024-01",
			"2024-02",
			"2024-03",
			"2024-04",
			"2024-05",
			"2024-06",
		];
		for (const month of months) {
			await ctx.db.insert("monthlyRevenue", {
				constructionProjectId: projectId,
				month,
				planned: Math.round(project.contractValue / 12),
				actual: Math.round(
					(project.contractValue / 12) * (0.8 + Math.random() * 0.4),
				),
			});
		}
	}

	return {
		message: "Construction projects created",
		projectsCreated: projects.length,
		projectIds,
	};
}

// Create tasks
async function createTasks(
	ctx: MutationCtx,
	organizationId: string, // Better Auth organization ID
	userIds: string[],
	projectIds: Id<"constructionProjects">[],
	statusIds: Id<"status">[],
	priorityIds: Id<"priorities">[],
	labelIds: Id<"labels">[],
) {
	const tasks = [
		{
			identifier: "СТРФ-001",
			title: "Проверка фундамента корпуса А",
			description:
				"Необходимо провести инспекцию качества заложенного фундамента корпуса А жилого комплекса",
			statusId: statusIds[1], // В работе
			assigneeId: userIds[5], // bolatbek.sabitov.02@mail.ru (Technical specialist)
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[2], labelIds[3]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-15",
		},
		{
			identifier: "СТРЭ-002",
			title: "Согласование электрической схемы",
			description:
				"Получить одобрение электрической схемы от надзорных органов",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[7], // jrisani@mail.ru (Technical specialist)
			priorityId: priorityIds[0], // Критический
			labelIds: [labelIds[0], labelIds[1]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-10",
		},
		{
			identifier: "СТРМ-003",
			title: "Закупка строительных материалов",
			description:
				"Заказать цемент, арматуру и кирпич для следующего этапа строительства",
			statusId: statusIds[2], // На проверке
			assigneeId: userIds[12], // botakoz_02_04@bk.ru (Office Manager)
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[4]].filter(Boolean),
			projectId: projectIds[1],
			dueDate: "2024-04-20",
		},
		{
			identifier: "СТРБ-004",
			title: "Проверка техники безопасности",
			description:
				"Провести еженедельную проверку соблюдения норм техники безопасности на строительной площадке",
			statusId: statusIds[3], // Завершено
			assigneeId: userIds[1], // reinaamet@mail.ru (Technical Director)
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[2]].filter(Boolean),
			projectId: projectIds[3],
			dueDate: "2024-04-05",
		},
		{
			identifier: "СТРО-005",
			title: "Установка башенного крана",
			description: "Монтаж и ввод в эксплуатацию башенного крана для корпуса Б",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[8], // ganlormenov1@gmail.com (Technical specialist)
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[5], labelIds[2]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-25",
		},
		{
			identifier: "СТРП-006",
			title: "Разработка проектной документации",
			description:
				"Подготовить полный комплект проектной документации для согласования",
			statusId: statusIds[1], // В работе
			assigneeId: userIds[11], // kakenov.talgat@mail.ru (ГИП)
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[1]].filter(Boolean),
			projectId: projectIds[2],
			dueDate: "2024-05-01",
		},
		{
			identifier: "СТРТ-007",
			title: "Тестирование инженерных систем",
			description:
				"Провести комплексное тестирование систем вентиляции и кондиционирования",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[6], // alzada-03@bk.ru (Technical specialist)
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[3]].filter(Boolean),
			projectId: projectIds[1],
			dueDate: "2024-04-30",
		},
		{
			identifier: "СТРФ-008",
			title: "Финансовый отчет за квартал",
			description:
				"Подготовить финансовый отчет по всем проектам за первый квартал",
			statusId: statusIds[2], // На проверке
			assigneeId: userIds[12], // botakoz_02_04@bk.ru (Office Manager)
			priorityId: priorityIds[3], // Низкий
			labelIds: [labelIds[1]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-08",
		},
	];

	const taskIds: Id<"issues">[] = [];

	for (const task of tasks) {
		const taskData = {
			...task,
			assigneeId: task.assigneeId ? asUserId(task.assigneeId) : undefined,
		};

		const taskId = await ctx.db.insert("issues", {
			organizationId,
			...taskData,
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			rank: `a${taskIds.length}`,
			isConstructionTask: true,
			parentTaskId: undefined,
		});
		taskIds.push(taskId);
	}

	return {
		message: "Tasks created",
		tasksCreated: tasks.length,
		taskIds,
	};
}

// Create sample documents
async function createDocuments(
	ctx: MutationCtx,
	organizationId: string, // Better Auth organization ID
	userIds: string[],
	projectIds: Id<"constructionProjects">[],
) {
	const documents = [
		{
			title: "Техническое задание на проектирование",
			content:
				"Подробное техническое задание на разработку проектной документации для ЖК Садовый",
			projectId: projectIds[0],
			authorId: userIds[11], // kakenov.talgat@mail.ru (ГИП)
			assignedTo: userIds[5], // bolatbek.sabitov.02@mail.ru (Technical specialist)
			status: "completed" as const,
		},
		{
			title: "План строительных работ",
			content:
				"График выполнения строительных работ с указанием основных этапов и контрольных точек",
			projectId: projectIds[0],
			authorId: userIds[1], // reinaamet@mail.ru (Technical Director)
			assignedTo: userIds[6], // alzada-03@bk.ru (Technical specialist)
			status: "in_progress" as const,
		},
		{
			title: "Смета на материалы",
			content:
				"Детальная смета на закупку строительных материалов для первого этапа",
			projectId: projectIds[1],
			authorId: userIds[12], // botakoz_02_04@bk.ru (Office Manager)
			assignedTo: userIds[0], // omirbek.zhanserik@mail.ru (Sales Director)
			status: "review" as const,
		},
		{
			title: "Протокол совещания",
			content: "Протокол еженедельного совещания по проекту от 01.04.2024",
			projectId: projectIds[0],
			authorId: userIds[11], // kakenov.talgat@mail.ru (ГИП)
			status: "completed" as const,
		},
		{
			title: "Акт выполненных работ",
			content: "Акт приемки выполненных работ по устройству фундамента",
			projectId: projectIds[3],
			authorId: userIds[1], // reinaamet@mail.ru (Technical Director)
			assignedTo: userIds[7], // jrisani@mail.ru (Technical specialist)
			status: "review" as const,
		},
	];

	const documentIds: Id<"documents">[] = [];

	for (const doc of documents) {
		const documentId = await ctx.db.insert("documents", {
			organizationId,
			title: doc.title,
			content: doc.content,
			projectId: doc.projectId,
			parentId: null,
			authorId: asUserId(doc.authorId),
			assignedTo: doc.assignedTo ? asUserId(doc.assignedTo) : undefined,
			status: doc.status,
			dueDate: undefined,
			tags: [],
			version: 1,
			lastEditedBy: asUserId(doc.authorId),
			lastEditedAt: Date.now(),
		});

		// Removed document access logic - using Better Auth permissions instead

		documentIds.push(documentId);
	}

	return {
		message: "Documents created",
		documentsCreated: documents.length,
		documentIds,
	};
}
