# Push Notifications Integration Guide

## Setup Instructions

### 1. Generate VAPID Keys

Run the script to generate VAPID keys:

```bash
cd apps/web
node scripts/generate-vapid-keys.js
```

### 2. Configure Environment Variables

#### Frontend (.env in apps/web/)
```
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

#### Convex (in Convex Dashboard > Settings > Environment Variables)
```
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 3. Integration in Your Mutations

When updating issues or tasks, add notification calls:

```typescript
// Example: In your issues.ts mutation when assigning a task
import { api } from "./_generated/api";

export const assignIssue = mutation({
  args: {
    issueId: v.id("issues"),
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    // Update the issue
    await ctx.db.patch(args.issueId, {
      assigneeId: args.assigneeId,
      updatedAt: Date.now(),
    });
    
    // Send notification
    await ctx.scheduler.runAfter(0, api.issueNotifications.notifyTaskAssigned, {
      issueId: args.issueId,
      assigneeId: args.assigneeId,
      assignedBy: user._id,
    });
  },
});
```

### 4. Add UI Components

Add the notification settings to your settings page:

```tsx
import { NotificationSettings } from '@/components/settings/notification-settings';

export function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <NotificationSettings />
    </div>
  );
}
```

### 5. Test Notifications

1. Open your app in a browser that supports push notifications
2. Go to settings and enable push notifications
3. Assign a task to yourself or another user
4. You should receive a push notification!

## Notification Types

The following notification types are supported:

- **task_assigned** - When a task is assigned to a user
- **task_status_changed** - When task status changes
- **task_commented** - When someone comments on a task
- **task_due_soon** - Reminder for approaching deadlines
- **project_update** - Important project updates

## Troubleshooting

### Notifications not working?

1. Check browser console for errors
2. Verify VAPID keys are correctly set in both frontend and Convex
3. Ensure service worker is registered (check Application tab in DevTools)
4. Check if notifications are allowed in browser settings
5. Verify Convex environment variables are set correctly

### Common Issues

- **"No VAPID key"** - Set VITE_VAPID_PUBLIC_KEY in frontend .env
- **"Push subscription failed"** - Check if HTTPS is enabled (localhost is okay)
- **"Notification blocked"** - User needs to allow notifications in browser