import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Queries
export const getAll = query({
    handler: async (ctx) => {
        const teams = await ctx.db.query("constructionTeams").collect();

        // Populate related data
        const populatedTeams = await Promise.all(
            teams.map(async (team) => {
                const [members, projects] = await Promise.all([
                    Promise.all(team.memberIds.map(id => ctx.db.get(id))),
                    Promise.all(team.projectIds.map(id => ctx.db.get(id))),
                ]);

                return {
                    ...team,
                    members: members.filter(member => member !== null),
                    projects: projects.filter(project => project !== null),
                };
            })
        );

        return populatedTeams;
    },
});

export const getById = query({
    args: { id: v.id("constructionTeams") },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.id);
        if (!team) return null;

        const [members, projects] = await Promise.all([
            Promise.all(team.memberIds.map(id => ctx.db.get(id))),
            Promise.all(team.projectIds.map(id => ctx.db.get(id))),
        ]);

        return {
            ...team,
            members: members.filter(member => member !== null),
            projects: projects.filter(project => project !== null),
        };
    },
});

export const getByDepartment = query({
    args: {
        department: v.union(
            v.literal("design"),
            v.literal("construction"),
            v.literal("engineering"),
            v.literal("management")
        )
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("constructionTeams")
            .filter((q) => q.eq(q.field("department"), args.department))
            .collect();
    },
});

export const getUserTeams = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const teams = await ctx.db.query("constructionTeams").collect();
        return teams.filter(team => team.memberIds.includes(args.userId));
    },
});

export const getTotalWorkload = query({
    handler: async (ctx) => {
        const teams = await ctx.db.query("constructionTeams").collect();
        return teams.reduce((total, team) => total + team.workload, 0);
    },
});

export const getTeamStats = query({
    handler: async (ctx) => {
        const teams = await ctx.db.query("constructionTeams").collect();

        const stats = {
            totalTeams: teams.length,
            totalMembers: 0,
            totalProjects: 0,
            departmentStats: {
                design: 0,
                construction: 0,
                engineering: 0,
                management: 0,
            },
            averageWorkload: 0,
        };

        teams.forEach(team => {
            stats.totalMembers += team.memberIds.length;
            stats.totalProjects += team.projectIds.length;
            stats.departmentStats[team.department]++;
        });

        stats.averageWorkload = teams.length > 0
            ? teams.reduce((sum, team) => sum + team.workload, 0) / teams.length
            : 0;

        return stats;
    },
});

// Mutations
export const create = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("constructionTeams", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("constructionTeams"),
        name: v.optional(v.string()),
        shortName: v.optional(v.string()),
        icon: v.optional(v.string()),
        joined: v.optional(v.boolean()),
        color: v.optional(v.string()),
        memberIds: v.optional(v.array(v.id("users"))),
        projectIds: v.optional(v.array(v.id("constructionProjects"))),
        department: v.optional(v.union(
            v.literal("design"),
            v.literal("construction"),
            v.literal("engineering"),
            v.literal("management")
        )),
        workload: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return { success: true };
    },
});

export const addMember = mutation({
    args: {
        teamId: v.id("constructionTeams"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        if (!team.memberIds.includes(args.userId)) {
            const updatedMemberIds = [...team.memberIds, args.userId];
            await ctx.db.patch(args.teamId, { memberIds: updatedMemberIds });
        }

        return { success: true };
    },
});

export const removeMember = mutation({
    args: {
        teamId: v.id("constructionTeams"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        const updatedMemberIds = team.memberIds.filter(id => id !== args.userId);
        await ctx.db.patch(args.teamId, { memberIds: updatedMemberIds });

        return { success: true };
    },
});

export const addProject = mutation({
    args: {
        teamId: v.id("constructionTeams"),
        projectId: v.id("constructionProjects"),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        if (!team.projectIds.includes(args.projectId)) {
            const updatedProjectIds = [...team.projectIds, args.projectId];
            await ctx.db.patch(args.teamId, { projectIds: updatedProjectIds });
        }

        return { success: true };
    },
});

export const removeProject = mutation({
    args: {
        teamId: v.id("constructionTeams"),
        projectId: v.id("constructionProjects"),
    },
    handler: async (ctx, args) => {
        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        const updatedProjectIds = team.projectIds.filter(id => id !== args.projectId);
        await ctx.db.patch(args.teamId, { projectIds: updatedProjectIds });

        return { success: true };
    },
});

export const updateWorkload = mutation({
    args: {
        id: v.id("constructionTeams"),
        workload: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { workload: args.workload });
        return { success: true };
    },
});

export const deleteTeam = mutation({
    args: { id: v.id("constructionTeams") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return { success: true };
    },
}); 