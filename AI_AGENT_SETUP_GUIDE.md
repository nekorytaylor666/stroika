# AI Agent Setup Guide

## Quick Start

This guide will help you get the AI Agent with thread management up and running.

## Prerequisites

1. **OpenAI API Key** - Get one from https://platform.openai.com/api-keys
2. **Convex Account** - Sign up at https://convex.dev
3. **Dependencies Installed** - Run `pnpm install` in the project root

## Installation Steps

### 1. Install Convex Agent Component

```bash
cd packages/backend
npx convex install @convex-dev/agent
```

This will:
- Add the agent component to your Convex project
- Update `convex.json` with agent configuration
- Create necessary schema tables

### 2. Set Environment Variables

Create or update `.env.local` in `packages/backend`:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Your Convex deployment URL (should already be set)
CONVEX_URL=https://...convex.cloud
```

### 3. Deploy Convex Functions

```bash
cd packages/backend
npx convex dev  # For development
# OR
npx convex deploy  # For production
```

This will deploy:
- `agent/agent.ts` - Agent configuration
- `agent/threads.ts` - Thread management functions
- `agent/messages.ts` - Message handling functions

### 4. Verify Installation

Check the Convex dashboard (https://dashboard.convex.dev) to ensure:
- Agent component is installed
- Functions are deployed
- No deployment errors

## Usage

### Opening the AI Agent

1. Click the floating sparkles button in the bottom-right corner
2. The AI Agent sidebar will slide in from the right
3. A new thread will be created automatically

### Chatting with the AI

1. Type your message in the input field at the bottom
2. Press Enter or click the Send button
3. Watch the AI response stream in real-time
4. Use the Stop button to cancel a streaming response

### Managing Threads

1. Click the "New Chat" button (speech bubble icon) to start a new conversation
2. Use the dropdown to switch between existing threads
3. Each thread maintains its own conversation history

### Quick Actions

Use the quick action buttons for common tasks:
- **Create Task** - Start a conversation about creating a new task
- **Create Project** - Discuss new project creation
- **Change Status** - Update task or project statuses
- **Settings** - Access settings and configurations

## File Structure

### Backend (Convex)

```
packages/backend/convex/
├── agent/
│   ├── agent.ts           # Agent configuration
│   ├── threads.ts         # Thread management
│   └── messages.ts        # Message handling
└── component.json         # Agent component config (auto-generated)
```

### Frontend (React)

```
apps/web/src/
├── components/
│   ├── ai-agent/
│   │   ├── index.tsx                    # Exports
│   │   ├── ai-agent-sidebar-new.tsx     # Main sidebar (with threads)
│   │   ├── ai-agent-sidebar.tsx         # Old sidebar (deprecated)
│   │   ├── ai-agent-toggle-button.tsx   # FAB button
│   │   └── ai-agent-provider.tsx        # Context provider
│   └── prompt-kit/                      # Chat UI components
└── hooks/
    ├── use-agent-threads.ts             # Thread management hook
    └── use-agent-messages.ts            # Message management hook
```

## Configuration

### Customizing the Agent

Edit `packages/backend/convex/agent/agent.ts`:

```typescript
export const agent = new Agent(components.agent, {
  name: "Your Agent Name",
  languageModel: openai.chat("gpt-4o-mini"),  // Or "gpt-4"
  instructions: `Your custom instructions here`,
  maxSteps: 5,  // Max reasoning steps
});
```

### Changing AI Model

Replace `"gpt-4o-mini"` with:
- `"gpt-4o"` - Latest GPT-4 Omni
- `"gpt-4"` - Standard GPT-4
- `"gpt-3.5-turbo"` - Cheaper option

### Adjusting Max Steps

The `maxSteps` parameter controls how many reasoning steps the AI can take:
- Lower (1-3): Faster, simpler responses
- Higher (5-10): More complex reasoning, slower responses

## Troubleshooting

### "Not authenticated" Error

**Problem**: User isn't logged in

**Solution**: Ensure Better Auth is configured and user is authenticated

### Agent Not Responding

**Problem**: OpenAI API key not set or invalid

**Solutions**:
1. Check `.env.local` has `OPENAI_API_KEY`
2. Verify API key is valid
3. Check OpenAI account has credits
4. Restart Convex dev server

### Messages Not Streaming

**Problem**: All text appears at once

**Solutions**:
1. Verify `useUIMessages` has `stream: true`
2. Check network connectivity
3. Try refreshing the page
4. Check browser console for errors

### Threads Not Loading

**Problem**: Empty state persists

**Solutions**:
1. Check user is authenticated
2. Verify Convex functions are deployed
3. Check browser console for errors
4. Try logging out and back in

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
1. Run `pnpm install` to ensure all deps installed
2. Check import paths are correct
3. Verify `_generated` files exist
4. Run `npx convex dev` to regenerate types

## Testing the Integration

### Basic Flow Test

1. Open the AI Agent sidebar
2. Verify a thread is created automatically
3. Send a test message: "Hello"
4. Verify AI responds
5. Create a new thread
6. Verify you can switch between threads
7. Close and reopen sidebar
8. Verify threads persist

### Advanced Flow Test

1. Send a message about creating a task
2. Verify AI responds appropriately
3. Test aborting a streaming response
4. Send multiple messages rapidly
5. Verify all messages appear correctly
6. Test quick action buttons
7. Verify they populate the input field

## Next Steps

### Adding Tool Calling

To allow the AI to actually create tasks and modify data:

1. Define tools in `agent/agent.ts`:
```typescript
import { tool } from "@convex-dev/agent";

const createTaskTool = tool({
  name: "createTask",
  description: "Create a new task",
  parameters: z.object({
    title: z.string(),
    description: z.string(),
  }),
  handler: async (ctx, args) => {
    // Call your Convex mutation to create task
    return await ctx.runMutation(api.issues.create, args);
  },
});

export const agent = new Agent(components.agent, {
  // ... existing config
  tools: [createTaskTool],
});
```

2. The AI will automatically call tools when appropriate
3. Tool results are shown in the chat

### Sharing Project Context

Pass relevant context to the AI:

```typescript
const { sendMessage } = useAgentMessages(threadId);

// Include context in message
const context = `
Current Project: ${currentProject.name}
Current User: ${currentUser.name}
Active Tasks: ${activeTasks.map(t => t.title).join(", ")}
`;

await sendMessage(`${context}\n\n${userMessage}`);
```

### Custom Quick Actions

Add more quick actions in `ai-agent-sidebar-new.tsx`:

```typescript
const quickActions = [
  // ... existing actions
  {
    icon: Users,
    label: "Assign Task",
    description: "Assign a task to team member",
    action: () => setInput("Assign task to [name]"),
  },
];
```

## Performance Tips

1. **Pagination**: For long conversations, implement message pagination
2. **Caching**: Convex automatically caches queries
3. **Debouncing**: Input is already debounced for typing
4. **Lazy Loading**: Messages load on demand

## Security Notes

1. **Authentication**: All operations require user authentication
2. **Authorization**: Users can only access their own threads
3. **Input Validation**: All inputs are validated server-side
4. **API Keys**: Never expose OpenAI API key to frontend

## Cost Optimization

1. Use `gpt-4o-mini` for cheaper responses
2. Set lower `maxSteps` to reduce token usage
3. Keep system instructions concise
4. Implement rate limiting if needed

## Support

For issues or questions:
1. Check Convex logs in dashboard
2. Review browser console errors
3. Consult Convex docs: https://docs.convex.dev
4. Check OpenAI API status: https://status.openai.com

## Resources

- **Convex Agent Docs**: https://docs.convex.dev/agents
- **AI SDK Docs**: https://sdk.vercel.ai
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Prompt Kit**: https://www.prompt-kit.com

## Conclusion

Your AI Agent with thread management is now ready to use! The system handles:
- ✅ Thread creation and management
- ✅ Real-time message streaming
- ✅ User authentication and authorization
- ✅ Persistent conversation history
- ✅ Beautiful UI with animations
- ✅ Mobile responsive design

Next, add tool calling to enable actual task creation and project management!
