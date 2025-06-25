"use client";

import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "../theme-toggle";
import { CreateNewIssue } from "./create-new-issue";

export function OrgSwitcher() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<div className="flex w-full items-center gap-1 pt-2">
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="h-8 p-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<div className="flex aspect-square size-6 items-center justify-center rounded bg-orange-500 text-sidebar-primary-foreground">
									LN
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">lndev-ui</span>
								</div>
								<ChevronsUpDown className="ml-auto" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>

						<ThemeToggle />

						<CreateNewIssue />
					</div>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
						side="bottom"
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link to="/todos">
									Settings
									<DropdownMenuShortcut>G then S</DropdownMenuShortcut>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem>Invite and manage members</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>Download desktop app</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>Switch Workspace</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuLabel>leonelngoya@gmail.com</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<div className="flex aspect-square size-6 items-center justify-center rounded bg-orange-500 text-sidebar-primary-foreground">
											LN
										</div>
										lndev-ui
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>Create or join workspace</DropdownMenuItem>
									<DropdownMenuItem>Add an account</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
						<DropdownMenuItem>
							Log out
							<DropdownMenuShortcut>⌥⇧Q</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
