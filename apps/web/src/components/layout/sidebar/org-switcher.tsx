"use client";

import { Building, ChevronsUpDown, LogOut, Plus, Settings } from "lucide-react";
import * as React from "react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { api } from "@stroika/backend";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ThemeToggle } from "../theme-toggle";
import { CreateNewIssue } from "./create-new-issue";

export function OrgSwitcher() {
	const params = useParams({ from: "/construction/$orgId" });
	const navigate = useNavigate();
	const [createOrgOpen, setCreateOrgOpen] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [newOrgDescription, setNewOrgDescription] = useState("");

	// Get user's organizations
	const { data: organizations } = authClient.useListOrganizations();

	// Get current organization based on URL
	const currentOrg =
		organizations?.find((org) => org.slug === params.orgId) ||
		organizations?.[0];

	const handleCreateOrg = async () => {
		if (!newOrgName.trim()) return;

		try {
			const result = await authClient.organization.create({
				name: newOrgName,
				slug: newOrgName
					.toLowerCase()
					.replace(/\s+/g, "-")
					.replace(/[^a-z0-9-]/g, ""),
				metadata: {
					description: newOrgDescription || undefined,
				},
			});

			// Navigate to the new organization
			navigate({ to: `/construction/${result.data?.id}/inbox` });
			setCreateOrgOpen(false);
			setNewOrgName("");
			setNewOrgDescription("");
		} catch (error) {
			console.error("Failed to create organization:", error);
		}
	};

	const handleSwitchOrg = async (orgId: string, slug: string) => {
		try {
			await authClient.organization.setActive({ organizationId: orgId });
			navigate({ to: `/construction/${orgId}/inbox` });
		} catch (error) {
			console.error("Failed to switch organization:", error);
		}
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<div className="flex w-full items-center gap-1 pt-2">
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="h-8 p-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									{currentOrg?.logo ? (
										<Avatar className="size-6">
											<AvatarImage
												src={currentOrg.logo || undefined}
												alt={currentOrg.name}
											/>
											<AvatarFallback className="text-xs">
												{currentOrg.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									) : (
										<div className="flex aspect-square size-6 items-center justify-center rounded bg-primary text-sidebar-primary-foreground">
											{currentOrg?.name.charAt(0).toUpperCase() || "O"}
										</div>
									)}
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{currentOrg?.name || "Select Organization"}
										</span>
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
									<Link to={`/construction/${params.orgId}/settings`}>
										<Settings className="mr-2 h-4 w-4" />
										Settings
										<DropdownMenuShortcut>G then S</DropdownMenuShortcut>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to={`/construction/${params.orgId}/members`}>
										Invite and manage members
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>
									Switch Organization
								</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
										{organizations?.map((org) => (
											<DropdownMenuItem
												key={org.id}
												onClick={() => handleSwitchOrg(org.id, org.slug)}
											>
												{org.logo ? (
													<Avatar className="mr-2 size-5">
														<AvatarImage
															src={org.logo || undefined}
															alt={org.name}
														/>
														<AvatarFallback className="text-xs">
															{org.name.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
												) : (
													<div className="mr-2 flex aspect-square size-5 items-center justify-center rounded bg-primary text-[10px] text-white">
														{org.name.charAt(0).toUpperCase()}
													</div>
												)}
												{org.name}
												{currentOrg?.id === org.id && (
													<span className="ml-auto text-muted-foreground text-xs">
														Current
													</span>
												)}
											</DropdownMenuItem>
										))}
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => setCreateOrgOpen(true)}>
											<Plus className="mr-2 h-4 w-4" />
											Create organization
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => void authClient.signOut()}>
								<LogOut className="mr-2 h-4 w-4" />
								Log out
								<DropdownMenuShortcut>⌥⇧Q</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			{/* Create Organization Dialog */}
			<Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Organization</DialogTitle>
						<DialogDescription>
							Create a new organization to collaborate with your team
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="org-name">Organization Name</Label>
							<Input
								id="org-name"
								placeholder="Компания ООО"
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor="org-description">Description (optional)</Label>
							<Input
								id="org-description"
								placeholder="Чем занимается ваша организация?"
								value={newOrgDescription}
								onChange={(e) => setNewOrgDescription(e.target.value)}
								className="mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCreateOrgOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleCreateOrg} disabled={!newOrgName.trim()}>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
