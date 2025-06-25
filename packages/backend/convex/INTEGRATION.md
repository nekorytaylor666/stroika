# Construction Project Management - Convex Integration

This document explains how to use the new Convex backend for construction project management instead of mock data.

## Overview

The Convex backend provides real-time database functionality for:

- Construction projects
- Construction teams
- Construction tasks/issues
- Users management
- Labels, priorities, and status tracking
- Real-time updates across all connected clients

## Database Schema

### Core Tables

1. **users** - Team members and stakeholders
2. **labels** - Task categorization labels
3. **priorities** - Task priority levels
4. **status** - Project and task status options
5. **constructionProjects** - Main construction projects
6. **constructionTeams** - Construction teams and departments
7. **issues** - Tasks and issues (with `isConstructionTask` flag)
8. **monthlyRevenue** - Financial tracking per project
9. **workCategories** - Work breakdown by category

## API Functions

### Construction Projects (`constructionProjects.ts`)

- `getAll()` - Get all projects with populated relationships
- `getById(id)` - Get specific project
- `create(projectData)` - Create new project
- `update(id, updates)` - Update project
- `updateStatus(id, statusId)` - Update project status
- `updateProgress(id, percentComplete)` - Update completion percentage
- `deleteProject(id)` - Delete project and related data

### Construction Teams (`constructionTeams.ts`)

- `getAll()` - Get all teams with members and projects
- `getById(id)` - Get specific team
- `create(teamData)` - Create new team
- `update(id, updates)` - Update team
- `addMember(teamId, userId)` - Add team member
- `removeMember(teamId, userId)` - Remove team member
- `deleteTeam(id)` - Delete team

### Construction Tasks (`constructionTasks.ts`)

- `getAll()` - Get all construction tasks
- `getById(id)` - Get specific task
- `create(taskData)` - Create new task
- `update(id, updates)` - Update task
- `updateStatus(id, statusId)` - Change task status
- `updateAssignee(id, assigneeId)` - Assign task
- `moveTask(id, newStatusId, newRank)` - Move task (drag & drop)
- `deleteTask(id)` - Delete task

### Metadata (`metadata.ts`)

- `getAllLabels()` - Get all labels
- `getAllPriorities()` - Get all priorities
- `getAllStatus()` - Get all status options
- Create, update, delete functions for each

### Users (`users.ts`)

- `getAll()` - Get all users
- `getByEmail(email)` - Find user by email
- `create(userData)` - Create new user
- `update(id, updates)` - Update user
- `updateStatus(id, status)` - Update online status

## Frontend Integration

### 1. Convex Store (`construction-convex-store.ts`)

New Zustand store that manages Convex data:

```typescript
import { useConstructionConvexStore } from "@/store/construction/construction-convex-store";

const {
  projects,
  teams,
  tasks,
  isLoading,
  error,
  addTask,
  updateTask,
  deleteTask,
  // ... other methods
} = useConstructionConvexStore();
```

### 2. Construction Data Hook (`use-construction-data.ts`)

Integrated hook that combines Convex queries with store management:

```typescript
import { useConstructionData } from "@/hooks/use-construction-data";

const {
  projects,
  teams,
  tasks,
  isLoading,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  seedData, // Initialize with sample data
} = useConstructionData();
```

### 3. Usage in Components

Replace mock data usage with the new hook:

```typescript
// Before (with mock data)
import { useConstructionStore } from "@/store/construction/construction-store";

// After (with Convex)
import { useConstructionData } from "@/hooks/use-construction-data";

function ConstructionTasks() {
  const { tasks, tasksByStatus, isLoading, createTask, updateTask, moveTask } =
    useConstructionData();

  // Component logic...
}
```

## Data Seeding

To populate the database with initial data:

```typescript
const { seedData } = useConstructionData();

// Call once to initialize
await seedData();
```

This creates:

- 4 sample users (construction workers, architects, engineers, managers)
- 6 labels (urgent, documentation, safety, etc.)
- 4 priority levels
- 4 status options
- 2 construction projects
- 3 construction teams
- 7 construction tasks

## Real-time Updates

All data updates are automatically synchronized across all connected clients. When one user:

- Creates a new task
- Updates project status
- Moves tasks between columns
- Assigns team members

All other users see the changes immediately without page refresh.

## Migration from Mock Data

1. **Install Convex dependencies** (already done)
2. **Start Convex dev server**: `cd packages/backend && npm run dev`
3. **Update components** to use `useConstructionData()` instead of mock data stores
4. **Run data seeding** on first load
5. **Test real-time functionality** with multiple browser tabs

## Key Benefits

1. **Real-time collaboration** - Multiple users can work simultaneously
2. **Data persistence** - No data loss on page refresh
3. **Automatic synchronization** - Changes propagate instantly
4. **Type safety** - Full TypeScript support with generated types
5. **Scalability** - Convex handles optimization and caching
6. **Offline support** - Built-in optimistic updates

## File Structure

```
packages/backend/convex/
├── _generated/          # Auto-generated types and API
├── schema.ts           # Database schema definition
├── constructionProjects.ts  # Project queries/mutations
├── constructionTeams.ts     # Team queries/mutations
├── constructionTasks.ts     # Task queries/mutations
├── users.ts            # User management
├── metadata.ts         # Labels, priorities, status
├── seedData.ts         # Initial data population
└── INTEGRATION.md      # This file

apps/web/src/
├── store/construction/
│   └── construction-convex-store.ts  # New Convex store
├── hooks/
│   └── use-construction-data.ts      # Integration hook
└── components/         # Update to use new hook
```

## Next Steps

1. Replace mock data imports with `useConstructionData` hook
2. Test all CRUD operations
3. Verify real-time updates work correctly
4. Add error handling and loading states
5. Consider adding more advanced features like file uploads, comments, etc.
