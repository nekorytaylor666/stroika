"use client";

import { LinearActivityFeed } from "@/components/common/activity/linear-activity-feed";
import { useMobile } from "@/hooks/use-mobile";

interface MobileActivityFeedProps {
  type?: "organization" | "project" | "user" | "team";
  projectId?: string;
  userId?: string;
  teamId?: string;
}

export function MobileActivityFeed({ 
  type = "organization",
  projectId,
  userId,
  teamId 
}: MobileActivityFeedProps) {
  const isMobile = useMobile();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Content with mobile-optimized padding */}
      <div className={isMobile ? "px-4 py-4" : "px-8 py-6"}>
        <LinearActivityFeed 
          type={type}
          projectId={projectId}
          userId={userId}
          teamId={teamId}
        />
      </div>
    </div>
  );
}