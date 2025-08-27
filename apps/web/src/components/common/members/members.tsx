"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Link2, Plus, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../../packages/backend/convex/_generated/api";
import InviteMemberModal from "./invite-member-modal";
import InviteUrlModalSimple from "./invite-url-modal-simple";
import MemberLine from "./member-line";

export default function Members() {
	const params = useParams({ from: "/construction/$orgId/members" });
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
	const [selectedInvite, setSelectedInvite] = useState<{
		code: string | null;
		email: string;
		expiresAt: number;
	}>({ code: null, email: "", expiresAt: 0 });
	const [activeTab, setActiveTab] = useState("members");

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

	const handleCancelInvite = async (inviteId: Id<"organizationInvites">) => {
		try {
			await cancelInvite({ inviteId });
			toast.success("Invite cancelled successfully");
		} catch (error: any) {
			console.error("Failed to cancel invite:", error);
			toast.error(error.message || "Failed to cancel invite");
		}
	};

	const handleShowInviteUrl = (invite: any) => {
		setSelectedInvite({
			code: invite.inviteCode || null,
			email: invite.email,
			expiresAt: invite.expiresAt,
		});
		setIsUrlModalOpen(true);
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
							<div className="w-[70%] md:w-[60%] lg:w-[55%]">Имя</div>
							<div className="w-[30%] md:w-[20%] lg:w-[15%]">Role</div>
							<div className="hidden w-[15%] lg:block">Joined</div>
							<div className="hidden w-[30%] md:block md:w-[20%] lg:w-[15%]">
								Teams
							</div>
						</div>

						<div className="w-full">
							{members?.map(
								(member) =>
									member.user && (
										<MemberLine
											key={member._id}
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
									),
							)}
						</div>
					</TabsContent>

					<TabsContent value="invites" className="mt-4">
						<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
							<div className="w-[40%]">Электронная почта</div>
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
									className="group flex w-full cursor-pointer items-center border-muted-foreground/5 border-b px-6 py-3 text-sm last:border-b-0 hover:bg-sidebar/50"
									onClick={() => handleShowInviteUrl(invite)}
									title="Click to view invite link"
								>
									<div className="flex w-[40%] items-center gap-2 font-medium group-hover:text-primary">
										<Link2 className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
										{invite.email}
									</div>
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
									<div className="w-[5%]">
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

			<InviteUrlModalSimple
				open={isUrlModalOpen}
				onOpenChange={setIsUrlModalOpen}
				inviteCode={selectedInvite.code}
				inviteEmail={selectedInvite.email}
				expiresAt={selectedInvite.expiresAt}
			/>
		</div>
	);
}
