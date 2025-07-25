"use client";

import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useConstructionData } from "@/hooks/use-construction-data";

export function NavTeamsSettings() {
	const { teams } = useConstructionData();
	const joinedTeams = teams?.filter((t) => t.joined) || [];

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Your teams</SidebarGroupLabel>
			<SidebarMenu>
				{joinedTeams.map((team) => (
					<SidebarMenuItem key={team._id}>
						<SidebarMenuButton asChild>
							<Link to={`/settings/teams/${team._id}`}>
								<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
									<div className="text-sm">{team.shortName.charAt(0)}</div>
								</div>
								<span>{team.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Button
							variant="ghost"
							className="w-full justify-start gap-2 px-2"
							asChild
						>
							<Link href="/settings/teams/new">
								<PlusIcon className="size-4" />
								<span>Join or create a team</span>
							</Link>
						</Button>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
