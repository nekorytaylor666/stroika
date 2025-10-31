# Stroika AI Agent Tools

This directory contains the AI agent implementation and tools for the Stroika project management system.

## Available Tools

The agent has access to the following tools for managing projects and tasks:

### Project Management

#### `createProject`
Creates a new construction project.

**Required Parameters:**
- `name` - Project name
- `client` - Client name
- `startDate` - Project start date (ISO format or YYYY-MM-DD)

**Optional Parameters:**
- `targetDate` - Target completion date
- `contractValue` - Contract value in currency
- `location` - Project location
- `projectType` - Type of project (residential, commercial, industrial, infrastructure)
- `leadName` - Project lead's name
- `statusName` - Initial status name (defaults to "Planned" or "Not Started")
- `priorityName` - Priority level name (defaults to "Medium")

#### `getProjectDetails`
Gets detailed information about a project including its tasks.

**Parameters:**
- `projectName` - Name of the project

#### `listProjectsByStatus`
Lists all projects, optionally filtered by status.

**Optional Parameters:**
- `statusName` - Status name to filter by

### Task Management

#### `createTask`
Creates a new task, optionally linked to a project.

**Required Parameters:**
- `title` - Task title

**Optional Parameters:**
- `description` - Task description
- `projectName` - Project name to link task to
- `assigneeName` - Name of person to assign task to
- `statusName` - Status name (defaults to "Todo" or "To Do")
- `priorityName` - Priority level name (defaults to "Medium")
- `dueDate` - Due date (ISO format or YYYY-MM-DD)
- `labels` - Array of label names
- `parentTaskIdentifier` - Parent task identifier for subtasks

#### `updateTaskStatus`
Updates the status of an existing task.

**Parameters:**
- `taskIdentifier` - Task identifier (e.g., TASK-001)
- `statusName` - New status name

#### `assignTask`
Assigns a task to a team member.

**Parameters:**
- `taskIdentifier` - Task identifier (e.g., TASK-001)
- `assigneeName` - Name of person to assign task to

#### `updateTaskPriority`
Updates the priority of an existing task.

**Parameters:**
- `taskIdentifier` - Task identifier (e.g., TASK-001)
- `priorityName` - New priority name

## Usage Examples

The agent can understand natural language commands like:

**Creating Projects:**
- "Create a new project called 'Office Building' for client 'ABC Corp' starting January 1st"
- "Create project 'Shopping Mall' for XYZ Company starting 2024-03-15 with target date 2025-06-30"

**Creating Tasks:**
- "Create a task 'Review blueprints' for the Office Building project"
- "Create task 'Site inspection' and assign it to John Doe with high priority"
- "Add a subtask 'Order materials' to task TASK-001"

**Updating Tasks:**
- "Update task TASK-001 status to In Progress"
- "Assign TASK-002 to Jane Smith"
- "Change priority of TASK-003 to High"

**Querying:**
- "Show me details of the Office Building project"
- "List all active projects"
- "What projects are in planning stage?"

## Implementation Details

### File Structure

- `agent.ts` - Main agent configuration and initialization
- `agentTools.ts` - Tool definitions using Convex's createTool
- `tools.ts` - Mutation and query handlers for tool operations
- `threads.ts` - Thread management for conversations
- `messages.ts` - Message streaming and response handling

### Technology Stack

- **Language Model**: OpenAI GPT-4o-mini
- **Framework**: Convex Agent SDK
- **Schema Validation**: Zod
- **Database**: Convex

### Key Features

1. **Name-based Operations**: All tools work with human-readable names instead of IDs
2. **Smart Defaults**: Automatically selects reasonable defaults for optional parameters
3. **Flexible Date Formats**: Accepts both ISO format and YYYY-MM-DD dates
4. **Hierarchical Tasks**: Support for subtasks via parent task identifiers
5. **Organization-aware**: All operations are scoped to the Stroika organization
6. **Error Handling**: Comprehensive validation and error messages

### Context Integration

The agent receives CSV-formatted context data about:
- Current projects and their status
- Existing tasks and assignments
- Team members and their roles
- Available statuses, priorities, and labels

This context helps the agent make informed decisions when creating or updating entities.

## Development

To modify or add new tools:

1. Add the mutation/query handler in `tools.ts`
2. Create the tool definition in `agentTools.ts` using `createTool`
3. The tool will be automatically registered with the agent

Tools follow this pattern:
```typescript
export const toolName = createTool({
  description: "What the tool does",
  args: z.object({
    param: z.string().describe("Parameter description"),
  }),
  handler: async (ctx, args): Promise<ReturnType> => {
    return await ctx.runMutation(api.agent.tools.toolName, args);
  },
});
```