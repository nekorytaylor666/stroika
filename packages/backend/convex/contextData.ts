import { api, components } from "./_generated/api";
import { type Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

/**
 * Format data as CSV string
 */
function formatAsCSV(headers: string[], rows: any[][]): string {
	const csvHeaders = headers.join(",");
	const csvRows = rows.map((row) =>
		row
			.map((cell) => {
				// Escape commas and quotes in cell values
				const cellStr = String(cell ?? "");
				if (
					cellStr.includes(",") ||
					cellStr.includes('"') ||
					cellStr.includes("\n")
				) {
					return `"${cellStr.replace(/"/g, '""')}"`;
				}
				return cellStr;
			})
			.join(","),
	);
	return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Get all organization data in CSV format for agent context
 */
export const getOrganizationContextCSV = query({
	handler: async (ctx) => {
		const { organization, user } = await getCurrentUserWithOrganization(ctx);
		console.log("organization", organization);
		console.log("user", user);

		if (!user || !organization) {
			return null;
		}
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		const users = await auth.api.listUsers({
			query: { limit: 1000, offset: 0 },
			headers,
		});

		const members = await ctx.runQuery(
			components.betterAuth.members.listMembersByOrg,
			{
				organizationId: organization.id,
			},
		);
		// Get all projects
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Get project-related data
		const projectRows: any[][] = [];
		for (const project of projects) {
			const [status, priority] = await Promise.all([
				ctx.db.get(project.statusId as Id<"status">),
				ctx.db.get(project.priorityId as Id<"priorities">),
			]);
			const lead = users.users.find((user) => user.id === project.leadId);

			projectRows.push([
				project._id,
				project.name,
				project.client,
				status?.name || "",
				lead?.name || "",
				priority?.name || "",
				project.contractValue,
				project.percentComplete,
				project.startDate,
				project.targetDate || "",
				project.location || "",
				project.projectType || "",
			]);
		}

		const projectCSV = formatAsCSV(
			[
				"project_id",
				"name",
				"client",
				"status",
				"lead",
				"priority",
				"contract_value",
				"percent_complete",
				"start_date",
				"target_date",
				"location",
				"project_type",
			],
			projectRows,
		);

		// Get all tasks (construction tasks)
		let tasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.collect();

		// Filter by organization
		tasks = tasks.filter((task) => task.organizationId === organization.id);

		// Get task-related data
		const taskRows: any[][] = [];
		for (const task of tasks) {
			const [status, assignee, priority, project] = await Promise.all([
				ctx.db.get(task.statusId as Id<"status">),
				task.assigneeId
					? users.users.find((user) => user.id === task.assigneeId)
					: null,
				ctx.db.get(task.priorityId as Id<"priorities">),
				task.projectId
					? ctx.db.get(task.projectId as Id<"constructionProjects">)
					: null,
			]);

			// Get labels
			const labels = await Promise.all(
				task.labelIds.map((id) => ctx.db.get(id as Id<"labels">)),
			);
			const labelNames = labels
				.filter(Boolean)
				.map((l) => l!.name)
				.join(";");

			taskRows.push([
				task._id,
				task.identifier,
				task.title,
				task.description,
				status?.name || "",
				assignee?.name || "",
				assignee?._id || "",
				priority?.name || "",
				project?.name || "",
				project?._id || "",
				task.dueDate || "",
				labelNames,
				task.parentTaskId || "",
			]);
		}

		const taskCSV = formatAsCSV(
			[
				"task_id",
				"identifier",
				"title",
				"description",
				"status",
				"assignee_name",
				"assignee_id",
				"priority",
				"project_name",
				"project_id",
				"due_date",
				"labels",
				"parent_task_id",
			],
			taskRows,
		);

		// Get all organization members

		// Get member-related data
		const memberRows: string[][] = [];
		for (const member of members) {
			// Get department and position

			memberRows.push([
				member.userId,
				member.user.name,
				member.user.email,
				member.role,
			]);
		}

		const memberCSV = formatAsCSV(
			["user_id", "name", "email", "role"],
			memberRows,
		);

		// Get all statuses
		const statuses = await ctx.db.query("status").collect();

		const statusRows = statuses.map((status) => [
			status._id,
			status.name,
			status.color,
			status.iconName,
		]);

		const statusCSV = formatAsCSV(
			["status_id", "name", "color", "icon_name"],
			statusRows,
		);

		// Get all priorities
		const priorities = await ctx.db.query("priorities").collect();

		const priorityRows = priorities.map((priority) => [
			priority._id,
			priority.name,
			priority.color,
			priority.iconName,
		]);

		const priorityCSV = formatAsCSV(
			["priority_id", "name", "color", "icon_name"],
			priorityRows,
		);

		// Get all labels
		const labels = await ctx.db.query("labels").collect();

		const labelRows = labels.map((label) => [
			label._id,
			label.name,
			label.color,
		]);

		const labelCSV = formatAsCSV(["label_id", "name", "color"], labelRows);

		return {
			projects: projectCSV,
			tasks: taskCSV,
			members: memberCSV,
			statuses: statusCSV,
			priorities: priorityCSV,
			labels: labelCSV,
			summary: {
				projectCount: projects.length,
				taskCount: tasks.length,
				memberCount: members.length,
				statusCount: statuses.length,
				priorityCount: priorities.length,
				labelCount: labels.length,
			},
		};
	},
});

/**
 * Build comprehensive agent context with CSV data
 */
export const buildAgentContext = query({
	handler: async (ctx) => {
		let csvData;
		try {
			csvData = await ctx.runQuery(api.contextData.getOrganizationContextCSV);
		} catch (error) {
			console.error("Error building agent context", error);
			return "";
		}

		if (!csvData) {
			return "";
		}

		const context = `
=== ORGANIZATION DATA CONTEXT ===

This context provides all the IDs and information needed to work with projects, tasks, and team members.

## Summary
- Total Projects: ${csvData.summary.projectCount}
- Total Tasks: ${csvData.summary.taskCount}
- Total Members: ${csvData.summary.memberCount}
- Total Statuses: ${csvData.summary.statusCount}
- Total Priorities: ${csvData.summary.priorityCount}
- Total Labels: ${csvData.summary.labelCount}

## Available Projects (CSV)
${csvData.projects}

## Available Tasks (CSV)
${csvData.tasks}

## Team Members (CSV)
${csvData.members}

## Available Statuses (CSV)
${csvData.statuses}

## Available Priorities (CSV)
${csvData.priorities}

## Available Labels (CSV)
${csvData.labels}

=== INSTRUCTIONS FOR USING THIS DATA ===

When creating or updating entities, use the IDs from the CSV data above:
- To assign a task to a user, use the user_id from the Team Members CSV
- To set a project for a task, use the project_id from the Projects CSV
- To set status, use the status_id from the Statuses CSV
- To set priority, use the priority_id from the Priorities CSV
- To add labels, use the label_id from the Labels CSV

Example: "Assign task to user with ID 'j97...' and set status to 'k17...'"

=== END OF CONTEXT ===
`;

		return context;
	},
});
