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
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
    role: v.string(),
    joinedDate: v.string(),
    teamIds: v.array(v.string()),
    position: v.optional(v.string()),
    workload: v.optional(v.number()),
  }).index("by_email", ["email"]),

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
      v.literal("infrastructure")
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
      v.literal("management")
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
  }).index("by_status", ["statusId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_project", ["projectId"])
    .index("by_construction", ["isConstructionTask"]),
});
