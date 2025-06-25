"use client";

import * as React from "react";

import { BackToApp } from "@/components/layout/sidebar/back-to-app";
import { NavConstructionMain } from "@/components/layout/sidebar/construction/nav-construction-main";
import { NavConstructionTeams } from "@/components/layout/sidebar/construction/nav-construction-teams";
import { NavConstructionTools } from "@/components/layout/sidebar/construction/nav-construction-tools";
import HelpButton from "@/components/layout/sidebar/help-button";
import { NavAccount } from "@/components/layout/sidebar/nav-account";
import { NavFeatures } from "@/components/layout/sidebar/nav-features";
import { NavInbox } from "@/components/layout/sidebar/nav-inbox";
import { NavTeamsSettings } from "@/components/layout/sidebar/nav-teams-settings";
import { OrgSwitcher } from "@/components/layout/sidebar/org-switcher";
import { UserProfile } from "@/components/layout/sidebar/user-profile";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useRouterState } from "@tanstack/react-router";
import { Github, X } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [open, setOpen] = React.useState(true);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isSettings = pathname.includes("/settings");
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				{isSettings ? <BackToApp /> : <OrgSwitcher />}
			</SidebarHeader>
			<SidebarContent>
				{isSettings ? (
					<>
						<NavAccount />
						<NavFeatures />
						<NavTeamsSettings />
					</>
				) : (
					<>
						<NavInbox />
						<NavConstructionMain />
						<NavConstructionTeams />
						<NavConstructionTools />
					</>
				)}
			</SidebarContent>
			<SidebarFooter>
				<div className="flex w-full flex-col gap-2">
					<UserProfile />
					<div className="flex w-full items-center justify-between">
						<HelpButton />
						<Button size="icon" variant="secondary" asChild>
							<a
								href="https://github.com/ln-dev7/circle"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Github className="size-4" />
							</a>
						</Button>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
