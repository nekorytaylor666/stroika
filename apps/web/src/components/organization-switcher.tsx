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

export function OrganizationSwitcher() {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [createOrgOpen, setCreateOrgOpen] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [newOrgDescription, setNewOrgDescription] = useState("");

	// Get user's organizations
	const organizations = useQuery(api.organizations.getUserOrganizations);
	const createOrganization = useMutation(api.organizations.create);
	const switchOrganization = useMutation(api.organizations.switchOrganization);

	// Get current organization from the first one where user is active
	// In a real app, this would come from user's currentOrganizationId
	const currentOrg = organizations?.[0];

	const handleCreateOrg = async () => {
		if (!newOrgName.trim()) return;

		try {
			const result = await createOrganization({
				name: newOrgName,
				description: newOrgDescription || undefined,
			});

			// Navigate to the new organization
			navigate({ to: `/construction/${result.slug}` });
			setCreateOrgOpen(false);
			setNewOrgName("");
			setNewOrgDescription("");
		} catch (error) {
			console.error("Failed to create organization:", error);
		}
	};

	const handleSwitchOrg = async (orgId: string, slug: string) => {
		try {
			await switchOrganization({ organizationId: orgId as any });
			navigate({ to: `/construction/${slug}` });
			setOpen(false);
		} catch (error) {
			console.error("Failed to switch organization:", error);
		}
	};

	if (!organizations || organizations.length === 0) {
		return (
			<Button
				variant="ghost"
				onClick={() => setCreateOrgOpen(true)}
				className="flex items-center gap-2"
			>
				<Plus className="h-4 w-4" />
				Create Organization
			</Button>
		);
	}

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
							{currentOrg?.logoUrl ? (
								<Avatar className="h-5 w-5">
									<AvatarImage src={currentOrg.logoUrl} />
									<AvatarFallback>
										{currentOrg.name.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							) : (
								<Building className="h-4 w-4" />
							)}
							<span className="truncate">{currentOrg?.name}</span>
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
								{organizations.map((org) => (
									<CommandItem
										key={org._id}
										value={org.name}
										onSelect={() => handleSwitchOrg(org._id, org.slug)}
									>
										<div className="flex flex-1 items-center gap-2">
											{org.logoUrl ? (
												<Avatar className="h-5 w-5">
													<AvatarImage src={org.logoUrl} />
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
												currentOrg?._id === org._id
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
