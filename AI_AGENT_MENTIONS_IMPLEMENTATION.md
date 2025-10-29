# AI Agent Mentions Implementation Guide

## Overview

This guide explains how to implement a mention system in the AI Agent sidebar that allows users to mention and link to different entity types (Projects, Tasks, Documents) similar to Slack, Notion, or GitHub.

## Table of Contents

1. [Available React Libraries](#available-react-libraries)
2. [Data Structure](#data-structure)
3. [Implementation Approach](#implementation-approach)
4. [Backend Queries](#backend-queries)
5. [Frontend Components](#frontend-components)
6. [Example Code](#example-code)

## Available React Libraries

### Recommended Libraries

1. **react-mentions** (https://github.com/signavio/react-mentions)

   - Most popular and well-maintained
   - ~4k GitHub stars
   - Supports customizable markup and display
   - Example:
     ```bash
     npm install react-mentions
     ```

2. **@uiw/react-md-editor** (https://github.com/uiwjs/react-md-editor)

   - Full markdown editor with mentions
   - Includes autocomplete
   - Good for rich text editing

3. **draft-js-mention-plugin** (for Draft.js)

   - If you're already using Draft.js
   - Integrates with Draft.js editor

4. **Custom Implementation**
   - Build your own using contentEditable or contentEditable div
   - Most control, more work

## Data Structure

Based on your schema, you have three main entity types to mention:

### 1. Projects (`constructionProjects`)

```typescript
{
  _id: Id<"constructionProjects">;
  name: string;
  organizationId: string;
  client: string;
  statusId: string;
  // ... other fields
}
```

### 2. Tasks (`issues` with `isConstructionTask: true`)

```typescript
{
  _id: Id<"issues">;
  identifier: string; // e.g., "TASK-123"
  title: string;
  description: string;
  statusId: string;
  projectId?: string;
  isConstructionTask: true;
  // ... other fields
}
```

### 3. Documents (`documents`)

```typescript
{
  _id: Id<"documents">;
  title: string;
  content: string;
  projectId?: string;
  status: "draft" | "in_progress" | "review" | "completed";
  // ... other fields
}
```

## Implementation Approach

### Recommended: Custom Implementation with react-mentions

This approach provides:

- Full control over UI/UX
- Easy integration with your existing PromptInput component
- Support for multiple entity types with categories
- Rich autocomplete with search

## Backend Queries

You need to create queries to search for mentionable entities:

### 1. Search Projects (`packages/backend/convex/constructionProjects.ts`)

```typescript
export const searchForMentions = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchQuery, limit = 10 }) => {
    const { user, organization } = await getCurrentUserWithOrganization(ctx);

    // Search by name
    const projects = await ctx.db
      .query("constructionProjects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization.id)
      )
      .collect();

    // Filter by search query
    const filtered = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.client.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, limit);

    return filtered;
  },
});
```

### 2. Search Tasks (`packages/backend/convex/constructionTasks.ts`)

```typescript
export const searchTasksForMentions = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchQuery, limit = 10 }) => {
    const { organization } = await getCurrentUserWithOrganization(ctx);

    let tasks = await ctx.db
      .query("issues")
      .withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
      .collect();

    // Filter by organization
    if (organization.id) {
      tasks = tasks.filter((task) => task.organizationId === organization.id);
    }

    // Filter by search query
    const filtered = tasks
      .filter(
        (t) =>
          t.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, limit);

    return filtered;
  },
});
```

### 3. Search Documents (`packages/backend/convex/documents.ts`)

```typescript
export const searchDocumentsForMentions = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchQuery, limit = 10 }) => {
    const { user, organization } = await getCurrentUserWithOrganization(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization._id)
      )
      .collect();

    // Filter by search query
    const filtered = documents
      .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, limit);

    return filtered;
  },
});
```

## Frontend Components

### 1. Create a Mention Wrapper Component

`apps/web/src/components/mention-input.tsx`:

```typescript
"use client";

import { Mention, MentionsInput } from "react-mentions";
import { useQuery } from "convex/react";
import { api } from "@stroika/backend";
import { useState } from "react";

interface MentionData {
  id: string;
  display: string;
  type: "project" | "task" | "document";
  title: string;
}

export function MentionInput({ value, onChange, onSubmit }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch mentionable entities
  const projects = useQuery(
    api.constructionProjects.searchForMentions,
    searchQuery ? { searchQuery, limit: 5 } : "skip"
  );

  const tasks = useQuery(
    api.constructionTasks.searchTasksForMentions,
    searchQuery ? { searchQuery, limit: 5 } : "skip"
  );

  const documents = useQuery(
    api.documents.searchDocumentsForMentions,
    searchQuery ? { searchQuery, limit: 5 } : "skip"
  );

  // Transform data for react-mentions
  const projectMentions: Mention[] = (projects || []).map((p) => ({
    id: `project:${p._id}`,
    display: p.name,
  }));

  const taskMentions: Mention[] = (tasks || []).map((t) => ({
    id: `task:${t._id}`,
    display: `${t.identifier} - ${t.title}`,
  }));

  const documentMentions: Mention[] = (documents || []).map((d) => ({
    id: `document:${d._id}`,
    display: d.title,
  }));

  // Custom display component for mentions
  const MentionEntry = ({ item }) => (
    <div className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer">
      {item.type === "project" && <Building className="h-4 w-4" />}
      {item.type === "task" && <CheckSquare className="h-4 w-4" />}
      {item.type === "document" && <FileText className="h-4 w-4" />}
      <span>{item.display}</span>
    </div>
  );

  return (
    <div className="mention-input-container">
      <MentionsInput
        value={value}
        onChange={onChange}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder="Type @ to mention..."
        style={mentionStyles}
      >
        <Mention
          trigger="@project"
          data={projectMentions}
          displayTransform={(id, display) => `@${display}`}
          style={{
            backgroundColor: "#E3F2FD",
            color: "#1976D2",
            borderRadius: "4px",
            padding: "0 4px",
          }}
          renderSuggestion={(entry, search, highlightedDisplay) => (
            <div className="flex items-center gap-2 p-2">
              <Building className="h-4 w-4 text-primary" />
              <span>{highlightedDisplay}</span>
            </div>
          )}
        />

        <Mention
          trigger="@task"
          data={taskMentions}
          displayTransform={(id, display) => `@${display}`}
          style={{
            backgroundColor: "#FFF3E0",
            color: "#F57C00",
            borderRadius: "4px",
            padding: "0 4px",
          }}
          renderSuggestion={(entry, search, highlightedDisplay) => (
            <div className="flex items-center gap-2 p-2">
              <CheckSquare className="h-4 w-4 text-orange-600" />
              <span>{highlightedDisplay}</span>
            </div>
          )}
        />

        <Mention
          trigger="@document"
          data={documentMentions}
          displayTransform={(id, display) => `@${display}`}
          style={{
            backgroundColor: "#F3E5F5",
            color: "#7B1FA2",
            borderRadius: "4px",
            padding: "0 4px",
          }}
          renderSuggestion={(entry, search, highlightedDisplay) => (
            <div className="flex items-center gap-2 p-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span>{highlightedDisplay}</span>
            </div>
          )}
        />
      </MentionsInput>
    </div>
  );
}

// Styling for the mentions input
const mentionStyles = {
  control: {
    fontSize: 14,
    lineHeight: "1.5",
  },
  highlighter: {
    padding: "9px",
    border: "1px solid transparent",
  },
  input: {
    padding: "9px",
    border: "1px solid transparent",
    borderRadius: "12px",
    minHeight: "44px",
    outline: "none",
  },
  "&singleLine": {
    control: {
      display: "inline-block",
      width: 130,
    },
    highlighter: {
      padding: 1,
      border: "2px inset",
    },
    input: {
      padding: 1,
      border: "2px inset",
    },
  },
  suggestions: {
    list: {
      backgroundColor: "white",
      border: "1px solid rgba(0,0,0,0.15)",
      fontSize: 14,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      maxHeight: 200,
      overflowY: "auto",
    },
    item: {
      padding: "8px 12px",
      borderBottom: "1px solid rgba(0,0,0,0.15)",
      "&focused": {
        backgroundColor: "#f0f0f0",
      },
    },
  },
};
```

### 2. Integration with AI Agent Sidebar

Update `apps/web/src/components/ai-agent/ai-agent-sidebar-new.tsx`:

```typescript
import { MentionInput } from "@/components/mention-input";

// In your component:
const handleSubmit = async () => {
  if (!input.trim() || !currentThreadId) return;

  const messageText = input;
  setInput("");

  try {
    // Parse mentions and send with metadata
    await sendMessage(messageText);
  } catch (error) {
    console.error("Failed to send message:", error);
    setInput(messageText);
  }
};

// Replace PromptInputTextarea with:
<MentionInput
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  className="min-h-[44px]"
/>;
```

## Message Parsing and Display

### 1. Parse Mentions from Message Text

```typescript
// apps/web/src/utils/parse-mentions.ts

export interface ParsedMention {
  id: string;
  type: "project" | "task" | "document";
  entityId: string;
  displayName: string;
  position: number;
}

export function parseMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];

  // Match @project:ID, @task:ID, @document:ID
  const regex = /@(project|task|document):([a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      id: match[2],
      type: match[1] as "project" | "task" | "document",
      entityId: match[2],
      displayName: "", // Will be fetched
      position: match.index,
    });
  }

  return mentions;
}
```

### 2. Render Mentions in Messages

```typescript
// apps/web/src/components/mention-chip.tsx

export function MentionChip({ id, type, displayName }) {
  const icons = {
    project: Building,
    task: CheckSquare,
    document: FileText,
  };

  const colors = {
    project: "bg-blue-100 text-blue-700",
    task: "bg-orange-100 text-orange-700",
    document: "bg-purple-100 text-purple-700",
  };

  const Icon = icons[type];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${colors[type]}`}
    >
      <Icon className="h-3 w-3" />
      {displayName}
    </span>
  );
}
```

## Complete Flow

1. **User types in input**: `@task TASK-123`
2. **Autocomplete shows**: Matching tasks
3. **User selects**: Task is mentioned
4. **Message sent**: With mention metadata
5. **Message displayed**: With clickable mention chips
6. **Click mention**: Navigate to entity page

## Next Steps

1. Install react-mentions:

   ```bash
   cd apps/web
   npm install react-mentions
   ```

2. Create backend queries for searching entities

3. Create frontend MentionInput component

4. Integrate with AI Agent sidebar

5. Add message parsing and display logic

6. Add navigation from mentions to entity pages

## References

- react-mentions: https://github.com/signavio/react-mentions
- Slack-like mentions: https://api.slack.com/messaging/composing/formatting#mentioning-people
- Notion mentions: https://www.notion.so/help/working-with-blocks#mentions
