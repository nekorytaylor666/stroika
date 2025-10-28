# AI Agent Thread Management Implementation

## Overview

This document describes the complete thread management system for the Stroika AI Agent, including Convex backend integration, React hooks, and UI components.

## Architecture

### Backend (Convex)

#### Agent Configuration (`agent/agent.ts`)

The agent is configured with:
- **Model**: OpenAI GPT-4o-mini
- **Name**: "Stroika Assistant"
- **Instructions**: Specialized for project management tasks
- **Max Steps**: 5 (for complex multi-step operations)
- **Language**: Supports Russian and English

#### Thread Management (`agent/threads.ts`)

**Mutations:**
- `createThread`: Create a new thread for the current user
- `updateThread`: Update thread metadata (title, summary)
- `deleteThread`: Delete a specific thread
- `deleteAllThreads`: Delete all threads for current user

**Queries:**
- `listThreads`: Get all threads for the current user (sorted by creation time)
- `getThreadMessages`: Get messages for a specific thread with pagination support

**Features:**
- User authentication required for all operations
- Thread ownership verification
- Automatic user ID association
- Pagination support for message retrieval

#### Message Management (`agent/messages.ts`)

**Mutations:**
- `sendMessage`: Send a user message and initiate AI response streaming
- `abortStream`: Cancel an active streaming response

**Actions:**
- `streamResponse`: Internal action that handles streaming AI responses

**Queries:**
- `getStreamingStatus`: Check if a thread has active streaming

**Features:**
- Asynchronous streaming using Convex scheduler
- Real-time message updates
- Stream cancellation support
- Status tracking (pending, streaming, completed, failed)

### Frontend (React)

#### Hooks

**`useAgentThreads` Hook:**
```typescript
const {
  threads,           // Array of user's threads
  isLoading,         // Loading state
  createThread,      // Create new thread function
  deleteThread,      // Delete thread function
  deleteAllThreads,  // Delete all threads function
  updateThread,      // Update thread metadata function
} = useAgentThreads();
```

**`useAgentMessages` Hook:**
```typescript
const {
  messages,          // Array of messages in thread
  isLoading,         // Loading state
  isStreaming,       // Is AI currently streaming
  streamingOrder,    // Order of streaming message
  sendMessage,       // Send message function
  abortStream,       // Abort streaming function
  hasMore,           // More messages available
  cursor,            // Pagination cursor
} = useAgentMessages(threadId);
```

#### Components

**AI Agent Sidebar (`ai-agent-sidebar-new.tsx`):**

Features:
1. **Thread Management**
   - Create new threads
   - Switch between threads via dropdown
   - Auto-create first thread on open
   - Thread persistence across sessions

2. **Message Display**
   - Real-time message updates
   - Streaming text animation
   - Optimistic UI updates
   - Auto-scroll to newest messages
   - Status indicators (streaming, pending, completed)

3. **Quick Actions**
   - Pre-defined action buttons
   - Quick prompt insertion
   - Context-aware suggestions

4. **Stream Control**
   - Abort streaming button
   - Disabled input during streaming
   - Visual streaming indicators

5. **Empty States**
   - Helpful prompts when no thread selected
   - Quick thread creation

## Data Flow

### Sending a Message

```
1. User types message and clicks Send
2. useAgentMessages adds optimistic message to UI
3. sendMessage mutation called
4. Backend schedules streamResponse action
5. Action calls agent.streamText()
6. Messages stream back in real-time
7. UI updates automatically via Convex subscription
8. Optimistic message removed after confirmation
```

### Thread Creation

```
1. User clicks "New Chat"
2. createThread mutation called
3. Backend creates thread with user ID
4. Thread ID returned
5. UI switches to new thread
6. Welcome message appears
```

### Stream Abortion

```
1. User clicks "Stop" button
2. abortStream mutation called with message order
3. Backend cancels streaming
4. Message status updated to "failed"
5. UI reflects cancellation
```

## Database Schema

### Threads Table (`_agent_threads`)

```typescript
{
  _id: Id<"_agent_threads">
  userId: string                    // User who owns thread
  title?: string                    // Thread title
  summary?: string                  // Thread summary
  _creationTime: number             // Created timestamp
}
```

**Indexes:**
- `by_userId`: For fetching user's threads

### Messages Table (`_agent_messages`)

```typescript
{
  _id: Id<"_agent_messages">
  threadId: Id<"_agent_threads">    // Parent thread
  role: "user" | "assistant"        // Message author
  content: string                   // Message text
  order: number                     // Message order in thread
  stepOrder: number                 // Step within order
  status: "pending" | "streaming" | "completed" | "failed"
  _creationTime: number             // Created timestamp
}
```

**Indexes:**
- `by_threadId`: For fetching thread messages
- `by_threadId_order`: For pagination

## Configuration Requirements

### Environment Variables

```bash
# OpenAI API Key (required for AI responses)
OPENAI_API_KEY=sk-...

# Convex deployment URL (auto-generated)
CONVEX_URL=https://...convex.cloud
```

### Convex Component

The agent requires the Convex Agent component to be installed:

```bash
npx convex install @convex-dev/agent
```

This creates the `components/agent` configuration in `convex.json`.

### Dependencies

**Backend (Convex):**
- `@convex-dev/agent`: Agent framework
- `@ai-sdk/openai`: OpenAI integration
- `convex`: Convex backend

**Frontend (React):**
- `@convex-dev/agent/react`: React hooks for agents
- `convex/react`: Convex React integration
- `motion/react`: Animations
- `lucide-react`: Icons
- Prompt-kit components (chat UI)

## Usage Examples

### Creating a New Thread

```typescript
const { createThread } = useAgentThreads();

// Simple creation
const threadId = await createThread();

// With metadata
const threadId = await createThread({
  title: "Project Planning",
  summary: "Discussion about new project features"
});
```

### Sending Messages

```typescript
const { sendMessage, isStreaming } = useAgentMessages(threadId);

// Send a message
await sendMessage("Create a new task for implementing login");

// Check if streaming
if (isStreaming) {
  console.log("AI is responding...");
}
```

### Aborting Stream

```typescript
const { abortStream, streamingOrder } = useAgentMessages(threadId);

if (streamingOrder) {
  await abortStream(streamingOrder);
}
```

### Deleting Threads

```typescript
const { deleteThread, deleteAllThreads } = useAgentThreads();

// Delete specific thread
await deleteThread(threadId);

// Delete all threads
await deleteAllThreads();
```

## Security Considerations

### Authentication

All thread and message operations require user authentication:
- Uses Convex `ctx.auth.getUserIdentity()`
- Throws error if not authenticated
- No anonymous thread access

### Authorization

Thread ownership is verified before any operation:
- Threads can only be accessed by their owner
- Owner verification before read/write operations
- Prevents cross-user data access

### Input Validation

- Message content is required (non-empty)
- Thread IDs are validated as proper Convex IDs
- Metadata fields are optional and type-checked

## Error Handling

### Backend Errors

```typescript
try {
  await sendMessage("Hello");
} catch (error) {
  // Handle authentication errors
  if (error.message === "Not authenticated") {
    // Redirect to login
  }

  // Handle authorization errors
  if (error.message === "Thread not found or unauthorized") {
    // Show error message
  }
}
```

### Frontend Errors

- Optimistic UI updates are rolled back on error
- Error messages shown to user
- Loading states reset properly
- Stream failures handled gracefully

## Performance Optimization

### Pagination

Messages support cursor-based pagination:
```typescript
const { messages, hasMore, cursor } = useAgentMessages(threadId);

// Load more messages
if (hasMore) {
  const { messages: moreMessages } = useAgentMessages(threadId, {
    cursor,
    numItems: 50
  });
}
```

### Real-time Updates

- Convex subscriptions provide automatic updates
- No polling required
- Minimal bandwidth usage
- Instant sync across devices

### Optimistic Updates

- Messages appear instantly in UI
- Backend confirmation happens asynchronously
- Rollback on error
- Smooth user experience

## Testing Checklist

- [ ] Create new thread
- [ ] Send message and receive response
- [ ] Stream response displays properly
- [ ] Abort streaming works
- [ ] Switch between threads
- [ ] Delete thread
- [ ] Delete all threads
- [ ] Message history persists
- [ ] Pagination works for long conversations
- [ ] Auth errors handled
- [ ] Unauthorized access blocked
- [ ] Optimistic updates work
- [ ] Loading states display
- [ ] Empty states display
- [ ] Quick actions work

## Future Enhancements

1. **Tool Calling**: Allow AI to call Convex functions directly
   - Create tasks
   - Update statuses
   - Assign users
   - Query project data

2. **Conversation Context**: Share project/task context with AI
   - Current page context
   - Selected items
   - User workspace

3. **Message Attachments**: Support file uploads
   - Images
   - Documents
   - Screenshots

4. **Thread Organization**:
   - Folders/categories
   - Search threads
   - Archive threads
   - Pin important threads

5. **Collaboration**:
   - Share threads with team
   - Multi-user conversations
   - Thread permissions

6. **Analytics**:
   - Track AI usage
   - Popular queries
   - Success rates
   - Performance metrics

## Troubleshooting

### Messages not streaming

**Symptoms**: Messages appear all at once instead of streaming

**Solutions**:
- Check OpenAI API key is set
- Verify `useUIMessages` is configured with `stream: true`
- Check network connectivity
- Verify Convex deployment is live

### Thread not created

**Symptoms**: Error when creating thread

**Solutions**:
- Verify user is authenticated
- Check Convex agent component is installed
- Ensure database schema is up to date
- Check Convex dashboard for errors

### Cannot see threads from other devices

**Symptoms**: Threads don't sync across devices

**Solutions**:
- Verify user is logged in with same account
- Check Convex subscription is active
- Clear browser cache
- Check network connectivity

### AI not responding

**Symptoms**: Message sent but no AI response

**Solutions**:
- Check OpenAI API key and credits
- Verify agent configuration
- Check Convex logs for errors
- Ensure streamResponse action is scheduled
- Check for rate limiting

## Conclusion

The AI Agent thread management system provides a complete, production-ready solution for conversational AI in the Stroika application. It handles thread persistence, real-time streaming, user authentication, and provides an excellent user experience with optimistic updates and smooth animations.

The implementation follows Convex best practices and is ready for backend integration with actual AI capabilities like task creation and project management.
