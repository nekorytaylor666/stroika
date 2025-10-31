# Stroika Codebase Knowledge

## Project Structure

This is a monorepo using pnpm workspaces with the following structure:

```
/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── store/          # Zustand state management
│       │   └── lib/            # Utilities
│       └── public/
└── packages/
    └── backend/
        └── convex/            # Convex backend (real-time database)
```

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Backend**: Convex (real-time database)
- **State Management**: Zustand
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion (imported as 'motion/react')
- **Drag & Drop**: React DnD
- **Icons**: Lucide React
- **Date handling**: date-fns with Russian locale

## Key Patterns & Conventions

### Component Structure

- Components are organized by feature (e.g., `/components/common/issues/`, `/components/common/construction/`)
- Each feature has its own set of components with consistent naming:
  - `[feature]-tasks.tsx` - Main list/board view
  - `[feature]-issue-line.tsx` - List item view
  - `[feature]-issue-grid.tsx` - Grid/board item view
  - `[feature]-task-details.tsx` - Detail modal view
  - `[feature]-status-selector.tsx`, `[feature]-priority-selector.tsx`, etc. - Reusable selectors

### Database Schema (Convex)

- Uses Convex's type-safe schema with relations
- Key tables: users, issues, statuses, priorities, labels, projects, constructionProjects
- Hierarchical permission system: roles, permissions, departments, organizationalPositions
- All IDs are Convex ID types (e.g., `Id<"user">`)

### State Management

- Zustand stores are feature-specific (e.g., `construction-task-details-store.ts`)
- Common stores: `search-store`, `view-store`, `filter-store`

### UI Components

- Based on shadcn/ui with custom modifications
- Dialog component supports `hideCloseButton` prop to prevent duplicate close buttons
- Consistent use of motion animations for status changes and interactions

### Data Fetching

- Uses custom hooks like `useConstructionData()` to fetch Convex data
- Real-time updates via Convex subscriptions

### Styling

- Tailwind CSS with custom theme
- Consistent spacing and sizing patterns
- Dark mode support via CSS variables

## Important Notes

### Construction Module

The construction module mirrors the issues module structure but with construction-specific data:

- Construction projects have revenue tracking
- Tasks are linked to construction projects
- Uses the same UI patterns as issues for consistency

### Permissions & Hierarchy

- Hierarchical structure: Owner → CEO → Chief Engineer → Departments → Tasks
- Permission inheritance through organizational hierarchy
- Role-based access control (RBAC) implementation

### Common Gotchas

1. **Convex IDs**: Always use `Id<"tableName">` types, not strings
2. **Animations**: Import Framer Motion as `'motion/react'`, not `'framer-motion'`
3. **Icons**: Icon names from database need to be mapped to React components using IconMap
4. **Drag & Drop**: Custom drag layers needed for proper preview positioning
5. **Dialogs**: Use `hideCloseButton` prop to avoid duplicate close buttons

## Development Commands

When making changes, always run:

- `npm run lint` - Check for linting errors
- `npm run typecheck` - Check for TypeScript errors

## File Naming Conventions

- React components: PascalCase (e.g., `ConstructionTaskDetails.tsx`)
- Utilities/hooks: camelCase (e.g., `useConstructionData.ts`)
- Convex files: lowercase with hyphens (e.g., `construction-projects.ts`)
