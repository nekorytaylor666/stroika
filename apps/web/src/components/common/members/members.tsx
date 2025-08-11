"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Clock, Copy, Link, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../../packages/backend/convex/_generated/api";
import InviteMemberModal from "./invite-member-modal";
import MemberLine from "./member-line";

export default function Members() {
	const params = useParams({ from: "/construction/$orgId/members" });
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("members");
	const [selectedInvite, setSelectedInvite] = useState<typeof invites extends (infer T)[] | null | undefined ? T : never | null>(null);
	const [copied, setCopied] = useState(false);
	const [memberToDelete, setMemberToDelete] = useState<{ id: Id<"users">; name: string } | null>(null);

	// Fetch organization members
	const members = useQuery(api.organizationMembers.list, {
		organizationId: params.orgId as Id<"organizations">,
	});

	// Fetch pending invites
	const invites = useQuery(api.invites.listInvites, {
		organizationId: params.orgId as Id<"organizations">,
		status: "pending",
	});

	// Cancel invite mutation
	const cancelInvite = useMutation(api.invites.cancelInvite);
	
	// Remove member mutation
	const removeMember = useMutation(api.organizationMembers.removeMember);

	const handleCancelInvite = async (inviteId: Id<"organizationInvites">) => {
		try {
			await cancelInvite({ inviteId });
		} catch (error) {
			console.error("Failed to cancel invite:", error);
		}
	};

	const handleCopyInviteUrl = () => {
		if (selectedInvite) {
			const inviteUrl = `${window.location.origin}/invite/${selectedInvite.inviteCode}`;
			navigator.clipboard.writeText(inviteUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleDeleteMember = async () => {
		if (!memberToDelete) return;
		
		try {
			await removeMember({
				organizationId: params.orgId as Id<"organizations">,
				userId: memberToDelete.id,
			});
			toast.success(`${memberToDelete.name} has been removed from the organization`);
			setMemberToDelete(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to remove member");
		}
	};

	return (
		<div className="w-full">
			<div className="mb-4 flex items-center justify-between px-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<div className="flex items-center justify-between">
						<TabsList>
							<TabsTrigger value="members" className="gap-2">
								<Users className="h-4 w-4" />
								Members {members && `(${members.length})`}
							</TabsTrigger>
							<TabsTrigger value="invites" className="gap-2">
								<Clock className="h-4 w-4" />
								Pending Invites{" "}
								{invites && invites.length > 0 && `(${invites.length})`}
							</TabsTrigger>
						</TabsList>

						<Button
							onClick={() => setIsInviteModalOpen(true)}
							size="sm"
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							Invite Member
						</Button>
					</div>

					<TabsContent value="members" className="mt-4">
						<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
							<div className="w-[65%] md:w-[55%] lg:w-[50%]">Name</div>
							<div className="w-[25%] md:w-[20%] lg:w-[15%]">Role</div>
							<div className="hidden w-[15%] lg:block">Joined</div>
							<div className="hidden w-[25%] md:block md:w-[20%] lg:w-[15%]">
								Teams
							</div>
							<div className="w-[10%] md:w-[5%] lg:w-[5%]"></div>
						</div>

						<div className="w-full">
							{members?.map(
								(member) =>
									member.user && (
										<div key={member._id} className="group flex w-full items-center border-muted-foreground/5 border-b text-sm last:border-b-0 hover:bg-sidebar/50">
											<MemberLine
												memberId={member._id}
												user={{
													id: member.user._id,
													name: member.user.name,
													email: member.user.email,
													avatarUrl: member.user.avatarUrl,
													status: member.user.status,
													role:
														member.role?.displayName ||
														member.role?.name ||
														"Member",
													joinedDate: new Date(member.joinedAt).toISOString(),
													teamIds: member.teams.map((t) => t._id),
												}}
											/>
											<div className="w-[10%] px-2 md:w-[5%] lg:w-[5%]">
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														setMemberToDelete({ id: member.user._id, name: member.user.name });
													}}
													className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									),
							)}
						</div>
					</TabsContent>

					<TabsContent value="invites" className="mt-4">
						<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
							<div className="w-[40%]">Email</div>
							<div className="w-[20%]">Role</div>
							<div className="w-[20%]">Invited By</div>
							<div className="w-[15%]">Expires</div>
							<div className="w-[5%]"></div>
						</div>

						<div className="w-full">
							{invites && invites.length === 0 && (
								<div className="px-6 py-8 text-center text-muted-foreground">
									<UserCheck className="mx-auto mb-2 h-8 w-8" />
									<p className="text-sm">No pending invites</p>
								</div>
							)}
							{invites?.map((invite) => (
								<div
									key={invite._id}
									className="flex w-full cursor-pointer items-center border-muted-foreground/5 border-b px-6 py-3 text-sm last:border-b-0 hover:bg-sidebar/50"
									onClick={() => setSelectedInvite(invite)}
								>
									<div className="w-[40%] font-medium">{invite.email}</div>
									<div className="w-[20%] text-muted-foreground">
										{invite.role?.displayName || invite.role?.name || "Member"}
									</div>
									<div className="w-[20%] text-muted-foreground">
										{invite.invitedByUser?.name || "Unknown"}
									</div>
									<div className="w-[15%] text-muted-foreground">
										{format(new Date(invite.expiresAt), "dd MMM", {
											locale: ru,
										})}
									</div>
									<div className="flex w-[5%] items-center gap-1">
										<Link className="h-3 w-3 text-muted-foreground" />
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleCancelInvite(invite._id);
											}}
											className="text-muted-foreground hover:text-destructive"
										>
											Cancel
										</Button>
									</div>
								</div>
							))}
						</div>
					</TabsContent>
				</Tabs>
			</div>

			<InviteMemberModal
				open={isInviteModalOpen}
				onOpenChange={setIsInviteModalOpen}
				organizationId={params.orgId as Id<"organizations">}
			/>

			<Dialog open={!!selectedInvite} onOpenChange={(open) => !open && setSelectedInvite(null)}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Invite Details</DialogTitle>
					</DialogHeader>
					{selectedInvite && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Email</Label>
								<div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
									{selectedInvite.email}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Role</Label>
								<div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
									{selectedInvite.role?.displayName || selectedInvite.role?.name || "Member"}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Expires</Label>
								<div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
									{format(new Date(selectedInvite.expiresAt), "dd MMMM yyyy, HH:mm", {
										locale: ru,
									})}
								</div>
							</div>

							<div className="space-y-2">
								<Label>Invite Link</Label>
								<div className="flex gap-2">
									<Input
										readOnly
										value={`${window.location.origin}/invite/${selectedInvite.inviteCode}`}
										className="font-mono text-xs"
									/>
									<Button
										size="sm"
										variant="outline"
										onClick={handleCopyInviteUrl}
										className="gap-2"
									>
										{copied ? (
											<>
												<Check className="h-3 w-3" />
												Copied
											</>
										) : (
											<>
												<Copy className="h-3 w-3" />
												Copy
											</>
										)}
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									Share this link with the user to accept the invitation
								</p>
							</div>

							<div className="flex justify-end gap-2 pt-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedInvite(null)}
								>
									Close
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										handleCancelInvite(selectedInvite._id);
										setSelectedInvite(null);
									}}
								>
									Cancel Invite
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove <strong>{memberToDelete?.name}</strong> from the organization?
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteMember}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
