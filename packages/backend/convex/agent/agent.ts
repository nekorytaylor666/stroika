import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// Create a function that returns an agent with dynamic context
export const createAgentWithContext = async (
	ctx: ActionCtx,
	contextData: string,
): Promise<Agent> => {
	return new Agent(components.agent, {
		name: "Stroika Assistant",
		languageModel: openai.chat("gpt-4o-mini"),
		instructions: `You are a helpful AI assistant for the Stroika project management system.
You help users with:
- Creating and managing tasks
- Creating and managing construction projects
- Updating task statuses, priorities, and labels
- Assigning team members to tasks
- Managing project timelines and deadlines
- Answering questions about projects and tasks

Always be concise, professional, and helpful. Respond in Russian when the user writes in Russian.
When creating or updating tasks, ask for clarification if any required information is missing.

${contextData}`,
		maxSteps: 5,
	});
};

// Keep the default agent for backward compatibility
export const agent = new Agent(components.agent, {
	name: "Stroika Assistant",
	languageModel: openai.chat("gpt-4o-mini"),
	instructions: `You are a helpful AI assistant for the Stroika project management system.
You help users with:
- Creating and managing tasks
- Creating and managing construction projects
- Updating task statuses, priorities, and labels
- Assigning team members to tasks
- Managing project timelines and deadlines
- Answering questions about projects and tasks

Always be concise, professional, and helpful. Respond in Russian when the user writes in Russian.
When creating or updating tasks, ask for clarification if any required information is missing.`,
	maxSteps: 5,
});
