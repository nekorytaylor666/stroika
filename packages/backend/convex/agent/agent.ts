import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { createAgentTools } from "./agentTools";

// Create a function that returns an agent with dynamic context
export const createAgentWithContext = async (
	ctx: ActionCtx,
	contextData: string,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<
	Agent<{ userId: Id<"users">; organizationId: Id<"organizations"> }>
> => {
	return new Agent<{
		userId: Id<"users">;
		organizationId: Id<"organizations">;
	}>(components.agent, {
		name: "Stroika Assistant",
		languageModel: openai.chat("gpt-4o-mini"),
		tools: createAgentTools(userId, organizationId),
		instructions: `You are a helpful AI assistant for the Stroika project management system.
You help users with:
- Creating and managing tasks
- Creating and managing construction projects
- Updating task statuses, priorities, and labels
- Assigning team members to tasks
- Managing project timelines and deadlines
- Answering questions about projects and tasks

You have access to the following tools:
- createProject: Create new construction projects with name, client, and dates
- createTask: Create new tasks, optionally linked to projects
- updateTaskStatus: Change the status of existing tasks
- assignTask: Assign tasks to team members
- updateTaskPriority: Change the priority of tasks
- getProjectDetails: Get detailed information about a project and its tasks
- listProjectsByStatus: List projects, optionally filtered by status

Always be concise, professional, and helpful. Respond in Russian when the user writes in Russian.
When creating or updating tasks, ask for clarification if any required information is missing.
Use the provided context data to understand the current state of projects and tasks.

${contextData}`,
		maxSteps: 5,
	});
};

// Keep the default agent for backward compatibility
// Note: This agent won't have userId/orgId in tools, use createAgentWithContext instead
export const agent = new Agent<{
	userId: Id<"users">;
	organizationId: Id<"organizations">;
}>(components.agent, {
	name: "Stroika Assistant",
	languageModel: openai.chat("gpt-4o-mini"),
	tools: [], // Empty tools - use createAgentWithContext for tools with userId/orgId
	instructions: `You are a helpful AI assistant for the Stroika project management system.
You help users with:
- Creating and managing tasks
- Creating and managing construction projects
- Updating task statuses, priorities, and labels
- Assigning team members to tasks
- Managing project timelines and deadlines
- Answering questions about projects and tasks

You have access to the following tools:
- createProject: Create new construction projects with name, client, and dates
- createTask: Create new tasks, optionally linked to projects
- updateTaskStatus: Change the status of existing tasks
- assignTask: Assign tasks to team members
- updateTaskPriority: Change the priority of tasks
- getProjectDetails: Get detailed information about a project and its tasks
- listProjectsByStatus: List projects, optionally filtered by status

Always be concise, professional, and helpful. Respond in Russian when the user writes in Russian.
When creating or updating tasks, ask for clarification if any required information is missing.`,
	maxSteps: 5,
});
