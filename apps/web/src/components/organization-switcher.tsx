"use client";

import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Building, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "./ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { authClient } from "@/lib/auth-client";

export function OrganizationSwitcher() {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [createOrgOpen, setCreateOrgOpen] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [newOrgDescription, setNewOrgDescription] = useState("");

	// Get user's organizations
	const { data: organizations, isPending } = authClient.useListOrganizations();
	const { data: activeOrganization, isPending: isActiveOrganizationPending } =
		authClient.useActiveOrganization();

	console.log(organizations);
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
			navigate({ to: `/construction/${result.data?.id}/inbox` });
			setOpen(false);
			setNewOrgName("");
			setNewOrgDescription("");
		} catch (error) {
			console.error("Failed to create organization:", error);
		}
	};

	const handleSwitchOrg = async (orgId: string, slug: string) => {
		try {
			await authClient.organization.setActive({ organizationId: orgId });
			navigate({ to: "/construction/$orgId/inbox", params: { orgId } });
		} catch (error) {
			console.error("Failed to switch organization:", error);
		}
	};
	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-[200px] justify-between"
					>
						<div className="flex items-center gap-2 truncate">
							{activeOrganization?.logo ? (
								<Avatar className="h-5 w-5">
									<AvatarImage src={activeOrganization.logo} />
									<AvatarFallback>
										{activeOrganization.name.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							) : (
								<Building className="h-4 w-4" />
							)}
							<span className="truncate">{activeOrganization?.name}</span>
						</div>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder="Search organization..." />
						<CommandList>
							<CommandEmpty>No organization found.</CommandEmpty>
							<CommandGroup>
								{organizations?.map((org) => (
									<CommandItem
										key={org.id}
										value={org.name}
										onSelect={() => handleSwitchOrg(org.id, org.slug)}
									>
										<div className="flex flex-1 items-center gap-2">
											{org.logo ? (
												<Avatar className="h-5 w-5">
													<AvatarImage src={org.logo} />
													<AvatarFallback>
														{org.name.charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
											) : (
												<Building className="h-4 w-4" />
											)}
											<span className="truncate">{org.name}</span>
										</div>
										<Check
											className={cn(
												"ml-auto h-4 w-4",
												activeOrganization?.id === org.id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<CommandItem
									onSelect={() => {
										setOpen(false);
										setCreateOrgOpen(true);
									}}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create Organization
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

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
								placeholder="Acme Inc"
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor="org-description">Description (optional)</Label>
							<Input
								id="org-description"
								placeholder="What does your organization do?"
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
