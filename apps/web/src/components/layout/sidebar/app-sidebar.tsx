"use client";

import * as React from "react";

import { BackToApp } from "@/components/layout/sidebar/back-to-app";
import { NavConstructionMain } from "@/components/layout/sidebar/construction/nav-construction-main";
import { NavConstructionProjects } from "@/components/layout/sidebar/construction/nav-construction-projects";
import { NavConstructionTools } from "@/components/layout/sidebar/construction/nav-construction-tools";
import HelpButton from "@/components/layout/sidebar/help-button";
import { NavAccount } from "@/components/layout/sidebar/nav-account";
import { NavInbox } from "@/components/layout/sidebar/nav-inbox";
import { NavResources } from "@/components/layout/sidebar/nav-resources";
import { NavSettings } from "@/components/layout/sidebar/nav-settings";
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
import { Github } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [open, setOpen] = React.useState(true);
	const isSettings = false;
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				{isSettings ? <BackToApp /> : <OrgSwitcher />}
			</SidebarHeader>
			<SidebarContent>
				{isSettings ? (
					<>
						<NavSettings />
						<NavAccount />
						<NavTeamsSettings />
					</>
				) : (
					<>
						<NavInbox />
						<NavConstructionMain />
						<NavConstructionProjects />
						<NavConstructionTools />
						<NavResources />
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
