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
import InviteUrlModal from "./invite-url-modal";
import MemberLine from "./member-line";

export default function Members() {
	const params = useParams({ from: "/construction/$orgId/members" });
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
	const [selectedInviteId, setSelectedInviteId] =
		useState<Id<"organizationInvites"> | null>(null);
	const [selectedInviteEmail, setSelectedInviteEmail] = useState<string>("");
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
			toast.success("Приглашение успешно отменено");
		} catch (error: unknown) {
			console.error("Failed to cancel invite:", error);
			toast.error(error.message || "Не удалось отменить приглашение");
		}
	};

	const handleShowInviteUrl = (
		inviteId: Id<"organizationInvites">,
		email: string,
	) => {
		setSelectedInviteId(inviteId);
		setSelectedInviteEmail(email);
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
								Участники {members && `(${members.length})`}
							</TabsTrigger>
							<TabsTrigger value="invites" className="gap-2">
								<Clock className="h-4 w-4" />
								Ожидающие приглашения{" "}
								{invites && invites.length > 0 && `(${invites.length})`}
							</TabsTrigger>
						</TabsList>

						<Button
							onClick={() => setIsInviteModalOpen(true)}
							size="sm"
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							Пригласить участника
						</Button>
					</div>

					<TabsContent value="members" className="mt-4">
						<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
							<div className="w-[70%] md:w-[60%] lg:w-[55%]">Имя</div>
							<div className="w-[30%] md:w-[20%] lg:w-[15%]">Роль</div>
							<div className="hidden w-[15%] lg:block">Присоединился</div>
							<div className="hidden w-[30%] md:block md:w-[20%] lg:w-[15%]">
								Команды
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
												roleId: member.role?._id || "",
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
							<div className="w-[20%]">Роль</div>
							<div className="w-[20%]">Пригласил</div>
							<div className="w-[15%]">Истекает</div>
							<div className="w-[5%]" />
						</div>

						<div className="w-full">
							{invites && invites.length === 0 && (
								<div className="px-6 py-8 text-center text-muted-foreground">
									<UserCheck className="mx-auto mb-2 h-8 w-8" />
									<p className="text-sm">Нет ожидающих приглашений</p>
								</div>
							)}
							{invites?.map((invite) => (
								<button
									key={invite._id}
									type="button"
									className="group flex w-full cursor-pointer items-center border-muted-foreground/5 border-b px-6 py-3 text-sm last:border-b-0 hover:bg-sidebar/50"
									onClick={() => handleShowInviteUrl(invite._id, invite.email)}
									title="Нажмите, чтобы посмотреть ссылку для приглашения"
								>
									<div className="flex w-[40%] items-center gap-2 font-medium group-hover:text-primary">
										<Link2 className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
										{invite.email}
									</div>
									<div className="w-[20%] text-muted-foreground">
										{invite.role?.displayName ||
											invite.role?.name ||
											"Участник"}
									</div>
									<div className="w-[20%] text-muted-foreground">
										{invite.invitedByUser?.name || "Неизвестно"}
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
											Отменить
										</Button>
									</div>
								</button>
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

			<InviteUrlModal
				open={isUrlModalOpen}
				onOpenChange={setIsUrlModalOpen}
				inviteId={selectedInviteId}
				inviteEmail={selectedInviteEmail}
			/>
		</div>
	);
}
