"use client";

import { ProjectOverview } from "./project-overview";
import { addDays, subDays } from "date-fns";

export function ProjectOverviewExample() {
  const exampleProject = {
    id: "1",
    name: "Ringbook",
    description: "A comprehensive project management system for construction teams",
    status: "In Progress" as const,
    priority: "High" as const,
    lead: {
      id: "1",
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John"
    },
    members: [
      { id: "2", name: "Jane Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
      { id: "3", name: "Mike Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
      { id: "4", name: "Sarah Williams", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
      { id: "5", name: "Tom Brown", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom" },
      { id: "6", name: "Lisa Garcia", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" },
    ],
    startDate: subDays(new Date(), 30),
    targetDate: addDays(new Date(), 60),
    team: "Ringbook_AI",
    labels: ["Frontend", "Backend", "Design"],
    stats: {
      scope: 120,      // Total tasks
      inProgress: 45,  // Tasks being worked on
      completed: 38    // Completed tasks
    },
    progressData: [
      { date: "1 дек", completed: 0, scope: 120 },
      { date: "5 дек", completed: 5, scope: 120 },
      { date: "10 дек", completed: 12, scope: 120 },
      { date: "15 дек", completed: 18, scope: 120 },
      { date: "20 дек", completed: 25, scope: 120 },
      { date: "25 дек", completed: 32, scope: 120 },
      { date: "30 дек", completed: 38, scope: 120 }
    ],
    milestones: [
      { 
        id: "m1", 
        name: "MVP Release", 
        date: subDays(new Date(), 10), 
        completed: true 
      },
      { 
        id: "m2", 
        name: "Beta Testing", 
        date: addDays(new Date(), 15), 
        completed: false 
      },
      { 
        id: "m3", 
        name: "Production Launch", 
        date: addDays(new Date(), 45), 
        completed: false 
      }
    ]
  };

  return (
    <div className="h-screen">
      <ProjectOverview project={exampleProject} />
    </div>
  );
}