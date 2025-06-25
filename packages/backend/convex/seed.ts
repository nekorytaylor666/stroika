import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_DESCRIPTIONS, ROLE_DISPLAY_NAMES, SYSTEM_ROLES, ORGANIZATIONAL_POSITIONS } from "./permissions/constants";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    const now = new Date().toISOString();
    
    // 1. Seed roles and permissions first
    try {
      // Check if roles already exist
      const existingRoles = await ctx.db.query("roles").collect();
      if (existingRoles.length > 0) {
        results.push({ step: "Roles and Permissions", message: "Already seeded" });
      } else {
        // Create all permissions
        const permissionMap = new Map<string, Id<"permissions">>();
        
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
        for (const [, roleName] of Object.entries(SYSTEM_ROLES)) {
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
        
        results.push({ 
          step: "Roles and Permissions",
          message: "Successfully seeded",
          rolesCreated: Object.keys(SYSTEM_ROLES).length,
          permissionsCreated: ALL_PERMISSIONS.length,
        });
      }
    } catch (error) {
      results.push({ step: "Roles and Permissions", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 2. Seed departments and organizational positions
    try {
      // Check if departments already exist
      const existingDepts = await ctx.db.query("departments").collect();
      if (existingDepts.length > 0) {
        results.push({ step: "Departments", message: "Already seeded" });
      } else {
        // Create organizational positions first
        const positions: Record<string, Id<"organizationalPositions">> = {};
        for (const [, position] of Object.entries(ORGANIZATIONAL_POSITIONS)) {
          const positionId = await ctx.db.insert("organizationalPositions", {
            name: position.name,
            displayName: position.displayName,
            level: position.level,
            canManageLevelsBelow: position.level <= 3,
            isUnique: position.level <= 2,
            createdAt: now,
          });
          positions[position.name] = positionId;
        }

        // Create root company
        const companyId = await ctx.db.insert("departments", {
          name: "company",
          displayName: "Строительная компания",
          description: "Главная организация",
          parentId: undefined,
          level: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        // Create main departments
        const departments = [
          { name: "management", displayName: "Управление", description: "Административное управление" },
          { name: "engineering", displayName: "Инженерный отдел", description: "Проектирование и инженерные решения" },
          { name: "construction", displayName: "Строительный отдел", description: "Выполнение строительных работ" },
          { name: "design", displayName: "Отдел проектирования", description: "Архитектурное проектирование" },
          { name: "finance", displayName: "Финансовый отдел", description: "Финансовое планирование и контроль" },
          { name: "hr", displayName: "Отдел кадров", description: "Управление персоналом" },
        ];

        const departmentIds: Record<string, Id<"departments">> = {};
        
        for (const dept of departments) {
          const deptId = await ctx.db.insert("departments", {
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
        
        results.push({
          step: "Departments",
          message: "Successfully seeded",
          positionsCreated: Object.keys(ORGANIZATIONAL_POSITIONS).length,
          departmentsCreated: departments.length + 1,
        });
      }
    } catch (error) {
      results.push({ step: "Departments", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 3. Create sample users with hierarchy
    try {
      const sampleUsersResult = await createSampleUsers(ctx);
      results.push({ step: "Sample Users", ...sampleUsersResult });
    } catch (error) {
      results.push({ step: "Sample Users", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 4. Create status, priorities, and labels
    try {
      const baseDataResult = await createBaseData(ctx);
      results.push({ step: "Base Data", ...baseDataResult });
    } catch (error) {
      results.push({ step: "Base Data", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 5. Create construction teams
    try {
      const teamsResult = await createConstructionTeams(ctx);
      results.push({ step: "Construction Teams", ...teamsResult });
    } catch (error) {
      results.push({ step: "Construction Teams", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 6. Create regular projects
    try {
      const regularProjectsResult = await createRegularProjects(ctx);
      results.push({ step: "Regular Projects", ...regularProjectsResult });
    } catch (error) {
      results.push({ step: "Regular Projects", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 7. Create construction projects
    try {
      const projectsResult = await createConstructionProjects(ctx);
      results.push({ step: "Construction Projects", ...projectsResult });
    } catch (error) {
      results.push({ step: "Construction Projects", error: error instanceof Error ? error.message : String(error) });
    }
    
    // 8. Create tasks/issues
    try {
      const tasksResult = await createTasks(ctx);
      results.push({ step: "Tasks", ...tasksResult });
    } catch (error) {
      results.push({ step: "Tasks", error: error instanceof Error ? error.message : String(error) });
    }
    
    return {
      message: "Seeding completed",
      results,
    };
  },
});

async function createSampleUsers(ctx: MutationCtx) {
  const now = new Date().toISOString();
  
  // Get roles
  const ownerRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "owner"))
    .first();
  const ceoRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "ceo"))
    .first();
  const chiefEngineerRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "chief_engineer"))
    .first();
  const deptHeadRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "department_head"))
    .first();
  const pmRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "project_manager"))
    .first();
  const engineerRole = await ctx.db.query("roles")
    .filter((q) => q.eq(q.field("name"), "engineer"))
    .first();
    
  // Get organizational positions
  const ownerPosition = await ctx.db.query("organizationalPositions")
    .filter((q) => q.eq(q.field("name"), "owner"))
    .first();
  const ceoPosition = await ctx.db.query("organizationalPositions")
    .filter((q) => q.eq(q.field("name"), "ceo"))
    .first();
  const chiefEngineerPosition = await ctx.db.query("organizationalPositions")
    .filter((q) => q.eq(q.field("name"), "chief_engineer"))
    .first();
  const deptHeadPosition = await ctx.db.query("organizationalPositions")
    .filter((q) => q.eq(q.field("name"), "department_head"))
    .first();
    
  // Get departments
  const companyDept = await ctx.db.query("departments")
    .filter((q) => q.eq(q.field("name"), "company"))
    .first();
  const managementDept = await ctx.db.query("departments")
    .filter((q) => q.eq(q.field("name"), "management"))
    .first();
  const engineeringDept = await ctx.db.query("departments")
    .filter((q) => q.eq(q.field("name"), "engineering"))
    .first();
  const constructionDept = await ctx.db.query("departments")
    .filter((q) => q.eq(q.field("name"), "construction"))
    .first();
    
  const users = [];
  
  // Create Owner
  if (ownerRole && companyDept && ownerPosition) {
    const ownerId = await ctx.db.insert("users", {
      name: "Александр Петров",
      email: "owner@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=owner",
      status: "online",
      roleId: ownerRole._id,
      joinedDate: "2020-01-15",
      teamIds: [],
      position: "Владелец компании",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: ownerId,
      departmentId: companyDept._id,
      positionId: ownerPosition._id,
      isPrimary: true,
      startDate: "2020-01-15",
      createdAt: now,
    });
    
    users.push({ name: "Owner", id: ownerId });
  }
  
  // Create CEO
  if (ceoRole && managementDept && ceoPosition) {
    const ceoId = await ctx.db.insert("users", {
      name: "Михаил Иванов",
      email: "ceo@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ceo",
      status: "online",
      roleId: ceoRole._id,
      joinedDate: "2020-03-01",
      teamIds: [],
      position: "Генеральный директор",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: ceoId,
      departmentId: managementDept._id,
      positionId: ceoPosition._id,
      isPrimary: true,
      startDate: "2020-03-01",
      createdAt: now,
    });
    
    users.push({ name: "CEO", id: ceoId });
  }
  
  // Create Chief Engineer
  if (chiefEngineerRole && engineeringDept && chiefEngineerPosition) {
    const chiefEngId = await ctx.db.insert("users", {
      name: "Елена Соколова",
      email: "chief.engineer@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=chief",
      status: "online",
      roleId: chiefEngineerRole._id,
      joinedDate: "2020-06-15",
      teamIds: [],
      position: "Главный инженер проекта",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: chiefEngId,
      departmentId: engineeringDept._id,
      positionId: chiefEngineerPosition._id,
      isPrimary: true,
      startDate: "2020-06-15",
      createdAt: now,
    });
    
    // Update engineering department head
    await ctx.db.patch(engineeringDept._id, {
      headUserId: chiefEngId,
    });
    
    users.push({ name: "Chief Engineer", id: chiefEngId });
  }
  
  // Create Department Heads
  if (deptHeadRole && constructionDept && deptHeadPosition) {
    const constHeadId = await ctx.db.insert("users", {
      name: "Андрей Козлов",
      email: "construction.head@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=const-head",
      status: "online",
      roleId: deptHeadRole._id,
      joinedDate: "2021-02-01",
      teamIds: [],
      position: "Руководитель строительного отдела",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: constHeadId,
      departmentId: constructionDept._id,
      positionId: deptHeadPosition._id,
      isPrimary: true,
      startDate: "2021-02-01",
      createdAt: now,
    });
    
    // Update construction department head
    await ctx.db.patch(constructionDept._id, {
      headUserId: constHeadId,
    });
    
    users.push({ name: "Construction Head", id: constHeadId });
  }
  
  // Create regular employees
  if (pmRole && engineeringDept) {
    const pmId = await ctx.db.insert("users", {
      name: "Ольга Новикова",
      email: "pm@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=pm",
      status: "online",
      roleId: pmRole._id,
      joinedDate: "2021-08-15",
      teamIds: [],
      position: "Руководитель проекта",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: pmId,
      departmentId: engineeringDept._id,
      isPrimary: true,
      startDate: "2021-08-15",
      createdAt: now,
    });
    
    users.push({ name: "Project Manager", id: pmId });
  }
  
  if (engineerRole && engineeringDept) {
    const engineerId = await ctx.db.insert("users", {
      name: "Дмитрий Волков",
      email: "engineer@stroika.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=engineer",
      status: "away",
      roleId: engineerRole._id,
      joinedDate: "2022-03-20",
      teamIds: [],
      position: "Инженер-конструктор",
      isActive: true,
      lastLogin: now,
    });
    
    await ctx.db.insert("userDepartments", {
      userId: engineerId,
      departmentId: engineeringDept._id,
      isPrimary: true,
      startDate: "2022-03-20",
      createdAt: now,
    });
    
    users.push({ name: "Engineer", id: engineerId });
  }
  
  return {
    message: "Sample users created",
    usersCreated: users.length,
    users,
  };
}

async function createBaseData(ctx: MutationCtx) {
  const now = new Date().toISOString();
  const created = { statuses: 0, priorities: 0, labels: 0 };

  // Create statuses
  const statuses = [
    { name: "Новая", color: "gray", iconName: "circle" },
    { name: "В работе", color: "blue", iconName: "timer" },
    { name: "На проверке", color: "yellow", iconName: "alert-circle" },
    { name: "Завершена", color: "green", iconName: "check-circle" },
    { name: "Отменена", color: "red", iconName: "x-circle" },
  ];

  for (const status of statuses) {
    await ctx.db.insert("status", status);
    created.statuses++;
  }

  // Create priorities
  const priorities = [
    { name: "Критическая", level: 0, iconName: "alert-triangle" },
    { name: "Высокая", level: 1, iconName: "chevron-up" },
    { name: "Средняя", level: 2, iconName: "minus" },
    { name: "Низкая", level: 3, iconName: "chevron-down" },
  ];

  for (const priority of priorities) {
    await ctx.db.insert("priorities", priority);
    created.priorities++;
  }

  // Create labels
  const labels = [
    { name: "Проектирование", color: "blue" },
    { name: "Строительство", color: "orange" },
    { name: "Документация", color: "purple" },
    { name: "Согласование", color: "yellow" },
    { name: "Безопасность", color: "red" },
    { name: "Качество", color: "green" },
  ];

  for (const label of labels) {
    await ctx.db.insert("labels", label);
    created.labels++;
  }

  return {
    message: "Base data created",
    ...created,
  };
}

async function createConstructionTeams(ctx: MutationCtx) {
  const now = new Date().toISOString();
  
  // Get users
  const users = await ctx.db.query("users").collect();
  const userIds = users.map(u => u._id);
  
  // Get projects that will be created
  const projectIds: Id<"constructionProjects">[] = [];
  
  const teams = [
    {
      name: "Команда проектирования",
      shortName: "КП",
      icon: "📐",
      joined: true,
      color: "blue",
      memberIds: userIds.slice(0, 3),
      projectIds: [],
      department: "design" as const,
      workload: 75,
    },
    {
      name: "Строительная бригада №1",
      shortName: "СБ1",
      icon: "🏗️",
      joined: true,
      color: "orange",
      memberIds: userIds.slice(2, 5),
      projectIds: [],
      department: "construction" as const,
      workload: 85,
    },
    {
      name: "Инженерная группа",
      shortName: "ИГ",
      icon: "⚙️",
      joined: true,
      color: "green",
      memberIds: userIds.slice(1, 4),
      projectIds: [],
      department: "engineering" as const,
      workload: 70,
    },
    {
      name: "Управление проектами",
      shortName: "УП",
      icon: "📊",
      joined: true,
      color: "purple",
      memberIds: userIds.slice(0, 2),
      projectIds: [],
      department: "management" as const,
      workload: 60,
    },
  ];

  const teamIds: Id<"constructionTeams">[] = [];
  for (const team of teams) {
    const teamId = await ctx.db.insert("constructionTeams", team);
    teamIds.push(teamId);
  }

  return {
    message: "Construction teams created",
    teamsCreated: teams.length,
    teamIds,
  };
}

async function createRegularProjects(ctx: MutationCtx) {
  const now = new Date().toISOString();
  
  // Get necessary IDs
  const users = await ctx.db.query("users").collect();
  const statuses = await ctx.db.query("status").collect();
  const priorities = await ctx.db.query("priorities").collect();
  
  const statusInProgress = statuses.find(s => s.name === "В работе");
  const statusPlanning = statuses.find(s => s.name === "Новая");
  const priorityHigh = priorities.find(p => p.name === "Высокая");
  const priorityMedium = priorities.find(p => p.name === "Средняя");
  
  if (!statusInProgress || !statusPlanning || !priorityHigh || !priorityMedium) {
    throw new Error("Required status or priority not found");
  }
  
  const projects = [
    {
      name: "Разработка BIM модели",
      statusId: statusInProgress._id,
      iconName: "cube",
      percentComplete: 45,
      startDate: "2024-02-01",
      leadId: users[0]._id,
      priorityId: priorityHigh._id,
      healthId: "on-track",
      healthName: "В графике",
      healthColor: "green",
      healthDescription: "Моделирование идет по плану",
    },
    {
      name: "Подготовка тендерной документации",
      statusId: statusPlanning._id,
      iconName: "file-text",
      percentComplete: 20,
      startDate: "2024-03-15",
      leadId: users[1]._id,
      priorityId: priorityMedium._id,
      healthId: "on-track",
      healthName: "В графике",
      healthColor: "green",
      healthDescription: "Сбор требований",
    },
  ];
  
  const projectIds: Id<"projects">[] = [];
  for (const project of projects) {
    const projectId = await ctx.db.insert("projects", project);
    projectIds.push(projectId);
  }
  
  return {
    message: "Regular projects created",
    projectsCreated: projects.length,
    projectIds,
  };
}

async function createConstructionProjects(ctx: MutationCtx) {
  const now = new Date().toISOString();
  
  // Get necessary IDs
  const users = await ctx.db.query("users").collect();
  const statuses = await ctx.db.query("status").collect();
  const priorities = await ctx.db.query("priorities").collect();
  const teams = await ctx.db.query("constructionTeams").collect();
  
  const statusInProgress = statuses.find(s => s.name === "В работе");
  const statusPlanning = statuses.find(s => s.name === "Новая");
  const priorityHigh = priorities.find(p => p.name === "Высокая");
  const priorityMedium = priorities.find(p => p.name === "Средняя");
  
  if (!statusInProgress || !statusPlanning || !priorityHigh || !priorityMedium) {
    throw new Error("Required status or priority not found");
  }
  
  const projects = [
    {
      name: "ЖК Северная Звезда",
      client: "ООО СтройИнвест",
      statusId: statusInProgress._id,
      iconName: "building",
      percentComplete: 35,
      contractValue: 150000000,
      startDate: "2024-01-15",
      targetDate: "2025-06-30",
      leadId: users[0]._id,
      priorityId: priorityHigh._id,
      healthId: "on-track",
      healthName: "В графике",
      healthColor: "green",
      healthDescription: "Проект идет по плану",
      location: "г. Москва, ул. Северная, 25",
      projectType: "residential" as const,
      notes: "25-этажный жилой комплекс с подземной парковкой",
      teamMemberIds: users.map(u => u._id).slice(0, 5),
    },
    {
      name: "Бизнес-центр Прогресс",
      client: "АО КоммерцНедвижимость",
      statusId: statusInProgress._id,
      iconName: "briefcase",
      percentComplete: 60,
      contractValue: 200000000,
      startDate: "2023-09-01",
      targetDate: "2024-12-31",
      leadId: users[1]._id,
      priorityId: priorityHigh._id,
      healthId: "at-risk",
      healthName: "Под угрозой",
      healthColor: "yellow",
      healthDescription: "Задержка поставки материалов",
      location: "г. Москва, Пресненская наб., 10",
      projectType: "commercial" as const,
      notes: "Офисное здание класса А, 15 этажей",
      teamMemberIds: users.map(u => u._id).slice(1, 6),
    },
    {
      name: "Реконструкция ТЦ Радуга",
      client: "ООО РитейлГрупп",
      statusId: statusPlanning._id,
      iconName: "shopping-cart",
      percentComplete: 10,
      contractValue: 80000000,
      startDate: "2024-03-01",
      targetDate: "2024-11-30",
      leadId: users[2]._id,
      priorityId: priorityMedium._id,
      healthId: "on-track",
      healthName: "В графике",
      healthColor: "green",
      healthDescription: "Проект на стадии планирования",
      location: "г. Санкт-Петербург, пр. Невский, 114",
      projectType: "commercial" as const,
      notes: "Модернизация торгового центра",
      teamMemberIds: users.map(u => u._id).slice(2, 5),
    },
  ];
  
  const projectIds: Id<"constructionProjects">[] = [];
  for (const project of projects) {
    const projectId = await ctx.db.insert("constructionProjects", project);
    projectIds.push(projectId);
    
    // Create monthly revenue data
    const months = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];
    for (const month of months) {
      await ctx.db.insert("monthlyRevenue", {
        constructionProjectId: projectId,
        month,
        planned: Math.round(project.contractValue / 12),
        actual: Math.round((project.contractValue / 12) * (0.8 + Math.random() * 0.4)),
      });
    }
    
    // Create work categories
    const categories = [
      { name: "Фундамент", percentComplete: 100, responsibleId: users[0]._id, workload: 30 },
      { name: "Каркас", percentComplete: 70, responsibleId: users[1]._id, workload: 50 },
      { name: "Фасад", percentComplete: 20, responsibleId: users[2]._id, workload: 40 },
      { name: "Инженерные системы", percentComplete: 30, responsibleId: users[3]._id, workload: 60 },
    ];
    
    for (const category of categories) {
      await ctx.db.insert("workCategories", {
        constructionProjectId: projectId,
        ...category,
      });
    }
  }
  
  // Update teams with project assignments
  for (let i = 0; i < teams.length && i < projectIds.length; i++) {
    await ctx.db.patch(teams[i]._id, {
      projectIds: [projectIds[i]],
    });
  }
  
  return {
    message: "Construction projects created",
    projectsCreated: projects.length,
    projectIds,
  };
}

async function createTasks(ctx: MutationCtx) {
  const now = new Date().toISOString();
  
  // Get necessary IDs
  const users = await ctx.db.query("users").collect();
  const statuses = await ctx.db.query("status").collect();
  const priorities = await ctx.db.query("priorities").collect();
  const labels = await ctx.db.query("labels").collect();
  const projects = await ctx.db.query("projects").collect();
  
  const tasks = [
    {
      identifier: "TASK-001",
      title: "Разработать план фундамента для ЖК Северная Звезда",
      description: "Необходимо разработать детальный план фундамента с учетом геологических изысканий",
      statusId: statuses[0]._id,
      assigneeId: users[0]._id,
      priorityId: priorities[0]._id,
      labelIds: [labels[0]._id, labels[3]._id],
      createdAt: now,
      cycleId: "2024-Q1",
      projectId: projects[0]?._id,
      rank: "0001",
      dueDate: "2024-04-15",
      isConstructionTask: true,
    },
    {
      identifier: "TASK-002",
      title: "Согласовать изменения в проекте с заказчиком",
      description: "Провести встречу с представителями заказчика для согласования изменений в планировке",
      statusId: statuses[1]._id,
      assigneeId: users[1]._id,
      priorityId: priorities[1]._id,
      labelIds: [labels[3]._id],
      createdAt: now,
      cycleId: "2024-Q1",
      projectId: projects[0]?._id,
      rank: "0002",
      dueDate: "2024-03-20",
      isConstructionTask: true,
    },
    {
      identifier: "TASK-003",
      title: "Проверка качества бетонных работ",
      description: "Провести контроль качества залитого фундамента",
      statusId: statuses[2]._id,
      assigneeId: users[2]._id,
      priorityId: priorities[0]._id,
      labelIds: [labels[5]._id, labels[4]._id],
      createdAt: now,
      cycleId: "2024-Q1",
      projectId: projects[1]?._id,
      rank: "0003",
      dueDate: "2024-03-25",
      isConstructionTask: true,
    },
    {
      identifier: "TASK-004",
      title: "Заказать материалы для фасадных работ",
      description: "Составить спецификацию и заказать материалы для облицовки фасада",
      statusId: statuses[0]._id,
      assigneeId: users[3]._id,
      priorityId: priorities[2]._id,
      labelIds: [labels[1]._id],
      createdAt: now,
      cycleId: "2024-Q1",
      projectId: projects[1]?._id,
      rank: "0004",
      dueDate: "2024-04-01",
      isConstructionTask: true,
    },
    {
      identifier: "TASK-005",
      title: "Обновить документацию по проекту",
      description: "Внести изменения в проектную документацию согласно последним корректировкам",
      statusId: statuses[1]._id,
      assigneeId: users[4]._id,
      priorityId: priorities[3]._id,
      labelIds: [labels[2]._id],
      createdAt: now,
      cycleId: "2024-Q1",
      projectId: projects[0]?._id,
      rank: "0005",
      isConstructionTask: true,
    },
  ];
  
  const taskIds: Id<"issues">[] = [];
  for (const task of tasks) {
    const taskId = await ctx.db.insert("issues", task);
    taskIds.push(taskId);
  }
  
  return {
    message: "Tasks created",
    tasksCreated: tasks.length,
    taskIds,
  };
}