# AI Agent Sidebar Implementation

## Overview

This document describes the implementation of the AI Agent sidebar feature for the Stroika application. The AI agent provides a chat-like interface for users to interact with an intelligent assistant that can help with creating tasks, managing projects, changing statuses, and other grunt work.

## Features Implemented

### 1. AI Agent Sidebar Component (`ai-agent-sidebar.tsx`)

A full-screen sliding sidebar with the following features:

- **Chat Interface**: Real-time chat experience using prompt-kit components
- **Quick Actions**: Pre-defined action buttons for common tasks:
  - Create Task
  - Create Project
  - Change Status
  - Settings
- **Message History**: Displays conversation history between user and AI agent
- **Smart Input**: Auto-resizing textarea with send button
- **Loading States**: Typing indicator while AI processes responses
- **Responsive Design**: Works on mobile and desktop

### 2. Toggle Button (`ai-agent-toggle-button.tsx`)

A floating action button (FAB) that:

- Positioned in bottom-right corner
- Animated gradient background (primary to purple)
- Pulsing animation effect
- Sparkles icon with rotating animation
- Tooltip with helpful description
- Hides when sidebar is open

### 3. Provider Component (`ai-agent-provider.tsx`)

Global state management for the AI agent:

- Context-based state management
- `useAIAgent()` hook for programmatic control
- Wraps entire application for global access
- Controls sidebar open/close state

## Technology Stack

### Prompt-Kit Components

The implementation uses the following prompt-kit components:

1. **PromptInput**: Advanced input field with auto-sizing
   - `PromptInputTextarea`: Auto-expanding textarea
   - `PromptInputActions`: Action buttons container
   - `PromptInputAction`: Individual action with tooltip

2. **Message Components**: Chat message display
   - `Message`: Message container
   - `MessageAvatar`: User/AI avatar
   - `MessageContent`: Message content with styling

3. **ChatContainer**: Scrollable chat area
   - `ChatContainerRoot`: Main scrollable container
   - `ChatContainerContent`: Content wrapper
   - `ChatContainerScrollAnchor`: Auto-scroll anchor

4. **Loader**: Loading indicators (typing variant used)

### Dependencies Added

- `use-stick-to-bottom`: Auto-scroll chat container
- `react-markdown`: Markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `remark-breaks`: Line break support
- `marked`: Markdown parser
- `shiki`: Syntax highlighting for code blocks

## File Structure

```
apps/web/src/components/
├── ai-agent/
│   ├── index.tsx                      # Exports barrel
│   ├── ai-agent-sidebar.tsx           # Main sidebar component
│   ├── ai-agent-toggle-button.tsx     # FAB toggle button
│   └── ai-agent-provider.tsx          # Context provider
└── prompt-kit/
    ├── prompt-input.tsx               # Input components
    ├── message.tsx                    # Message components
    ├── chat-container.tsx             # Container components
    ├── loader.tsx                     # Loading indicators
    ├── markdown.tsx                   # Markdown renderer
    └── code-block.tsx                 # Code block display
```

## Integration

The AI agent is integrated at the root level in `apps/web/src/routes/__root.tsx`:

```tsx
<ThemeProvider>
  <AIAgentProvider>
    <Outlet />
    <CommandPalette />
    <Toaster richColors />
  </AIAgentProvider>
</ThemeProvider>
```

This ensures the AI agent is available on every page of the application.

## Usage

### For End Users

1. Click the floating sparkles button in the bottom-right corner
2. Use quick action buttons for common tasks
3. Type custom requests in the input field
4. Press Enter or click Send to submit
5. View AI responses in real-time

### For Developers

```tsx
import { useAIAgent } from '@/components/ai-agent';

function MyComponent() {
  const { open, close, toggle, isOpen } = useAIAgent();

  // Programmatically open the AI agent
  const handleClick = () => {
    open();
  };

  return <button onClick={handleClick}>Ask AI</button>;
}
```

## UI/UX Design

### Visual Design

- **Gradient Header**: Primary to purple gradient for premium feel
- **Quick Actions Grid**: 2-column grid with icon + description
- **Message Bubbles**: Distinct styling for user vs AI messages
- **Animations**: Smooth slide-in/out transitions using Framer Motion
- **Backdrop**: Semi-transparent blur backdrop when open

### Accessibility

- Keyboard navigation support (Enter to send, Shift+Enter for new line)
- ARIA labels and roles
- Tooltip descriptions for actions
- Screen reader support for loading states

### Localization

Currently implemented in Russian (ru-RU):
- All UI text in Russian
- Time formatting in Russian locale
- Can be easily extended for multi-language support

## Future Enhancements

The current implementation is UI-only. Future enhancements will include:

1. **AI Integration**: Connect to actual AI backend (GPT, Claude, etc.)
2. **Task Management**: Direct integration with Convex database
   - Create tasks, projects
   - Update statuses, priorities, labels
   - Assign users, set deadlines
3. **Context Awareness**: Understand current page context
4. **Voice Input**: Speech-to-text for hands-free operation
5. **Suggested Actions**: AI suggests actions based on context
6. **Conversation Memory**: Persist chat history across sessions
7. **Shortcuts**: Keyboard shortcuts to open/close (e.g., Cmd+K)
8. **Notification Badge**: Show unread messages count

## Testing

The implementation has been tested with:

- ✅ Build process (`pnpm build`)
- ✅ TypeScript compilation
- ✅ Component rendering
- ✅ Animation performance
- ✅ Responsive layout

## Performance Considerations

- Lazy loading of chat history
- Virtualized message list (for future when history grows)
- Debounced input handling
- Code splitting for prompt-kit components
- Optimized animations using Framer Motion

## Known Limitations

1. **UI Only**: No backend integration yet
2. **Mock Responses**: AI responses are currently simulated
3. **No Persistence**: Messages clear on page refresh
4. **Single Language**: Currently Russian only
5. **Large Bundle**: Shiki adds significant size (can be optimized)

## Conclusion

The AI Agent sidebar provides a solid foundation for intelligent task management. The UI is complete, polished, and ready for backend integration. The use of prompt-kit ensures a professional, modern chat experience that users will find familiar and easy to use.
