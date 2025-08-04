import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ORGANIZATIONAL_POSITIONS } from "../permissions/constants";

export const seedDepartments = mutation({
	args: {
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();

		// Check if departments already exist
		const existingDepts = await ctx.db.query("departments").collect();
		if (existingDepts.length > 0) {
			return { message: "Departments already seeded" };
		}

		// Create organizational positions first
		const positions: Record<string, any> = {};
		for (const [key, position] of Object.entries(ORGANIZATIONAL_POSITIONS)) {
			const positionId = await ctx.db.insert("organizationalPositions", {
				name: position.name,
				displayName: position.displayName,
				level: position.level,
				canManageLevelsBelow: position.level <= 3, // Owner, CEO, Chief Engineer, Dept Head can manage below
				isUnique: position.level <= 2, // Owner, CEO, Chief Engineer are unique positions
				createdAt: now,
			});
			positions[position.name] = positionId;
		}

		// Create root company (level 0)
		const companyId = await ctx.db.insert("departments", {
			organizationId: args.organizationId,
			name: "company",
			displayName: "Строительная компания",
			description: "Главная организация",
			parentId: undefined,
			level: 0,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// Create main departments (level 1)
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
			{
				name: "finance",
				displayName: "Финансовый отдел",
				description: "Финансовое планирование и контроль",
			},
			{
				name: "hr",
				displayName: "Отдел кадров",
				description: "Управление персоналом",
			},
		];

		const departmentIds: Record<string, any> = {};

		for (const dept of departments) {
			const deptId = await ctx.db.insert("departments", {
				organizationId: args.organizationId,
				name: dept.name,
				displayName: dept.displayName,
				description: dept.description,
				parentId: companyId,
				level: 1,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			});
			departmentIds[dept.name] = deptId;
		}

		// Create sub-departments for Engineering (level 2)
		const engineeringSubDepts = [
			{
				name: "structural",
				displayName: "Конструкторский отдел",
				description: "Расчет и проектирование конструкций",
			},
			{
				name: "mep",
				displayName: "Отдел инженерных систем",
				description: "Проектирование инженерных сетей",
			},
			{
				name: "surveying",
				displayName: "Геодезический отдел",
				description: "Геодезические работы и изыскания",
			},
		];

		for (const subDept of engineeringSubDepts) {
			await ctx.db.insert("departments", {
				organizationId: args.organizationId,
				name: subDept.name,
				displayName: subDept.displayName,
				description: subDept.description,
				parentId: departmentIds.engineering,
				level: 2,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			});
		}

		// Create sub-departments for Construction (level 2)
		const constructionSubDepts = [
			{
				name: "site_management",
				displayName: "Управление объектами",
				description: "Управление строительными площадками",
			},
			{
				name: "quality_control",
				displayName: "Контроль качества",
				description: "Контроль качества строительных работ",
			},
			{
				name: "safety",
				displayName: "Отдел безопасности",
				description: "Охрана труда и промышленная безопасность",
			},
		];

		for (const subDept of constructionSubDepts) {
			await ctx.db.insert("departments", {
				organizationId: args.organizationId,
				name: subDept.name,
				displayName: subDept.displayName,
				description: subDept.description,
				parentId: departmentIds.construction,
				level: 2,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			});
		}

		return {
			message: "Successfully seeded departments and positions",
			positionsCreated: Object.keys(ORGANIZATIONAL_POSITIONS).length,
			departmentsCreated:
				departments.length +
				engineeringSubDepts.length +
				constructionSubDepts.length +
				1,
		};
	},
});
