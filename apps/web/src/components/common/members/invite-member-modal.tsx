"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../../packages/backend/convex/_generated/api";

interface InviteMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: Id<"organizations">;
}

export default function InviteMemberModal({
	open,
	onOpenChange,
	organizationId,
}: InviteMemberModalProps) {
	const [email, setEmail] = useState("");
	const [roleId, setRoleId] = useState<Id<"roles"> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [inviteLink, setInviteLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// Fetch available roles
	const roles = useQuery(api.roles.list);

	// Create invite mutation
	const createInvite = useMutation(api.invites.createInvite);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || !roleId) {
			toast.error("Please fill in all fields");
			return;
		}

		setIsSubmitting(true);

		try {
			const result = await createInvite({
				organizationId,
				email,
				roleId,
				expiresInDays: 7,
			});

			const baseUrl = window.location.origin;
			const fullInviteLink = `${baseUrl}${result.inviteUrl}`;
			setInviteLink(fullInviteLink);

			toast.success("Invite created successfully!");
		} catch (error: any) {
			console.error("Failed to create invite:", error);
			toast.error(error.message || "Failed to create invite");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCopyLink = async () => {
		if (!inviteLink) return;

		try {
			await navigator.clipboard.writeText(inviteLink);
			setCopied(true);
			toast.success("Invite link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy link");
		}
	};

	const handleClose = () => {
		onOpenChange(false);
		// Reset form
		setTimeout(() => {
			setEmail("");
			setRoleId(null);
			setInviteLink(null);
			setCopied(false);
		}, 200);
	};

	// Filter out owner role from selection
	const availableRoles = roles?.filter((r) => r.name !== "owner") || [];

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlus className="h-5 w-5" />
						Invite Member
					</DialogTitle>
					<DialogDescription>
						Send an invitation to join your organization
					</DialogDescription>
				</DialogHeader>

				{!inviteLink ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email address</Label>
							<div className="relative">
								<Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="colleague@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="pl-10"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select
								value={roleId || ""}
								onValueChange={(value) => setRoleId(value as Id<"roles">)}
							>
								<SelectTrigger id="role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{availableRoles.map((role) => (
										<SelectItem key={role._id} value={role._id}>
											{role.displayName || role.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Creating..." : "Send Invite"}
							</Button>
						</div>
					</form>
				) : (
					<div className="space-y-4">
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="mb-2 font-medium text-sm">
								Invitation sent to {email}
							</p>
							<p className="text-muted-foreground text-xs">
								Share this link with them to join your organization:
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Input
								value={inviteLink}
								readOnly
								className="font-mono text-xs"
							/>
							<Button
								size="icon"
								variant="outline"
								onClick={handleCopyLink}
								className="shrink-0"
							>
								{copied ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button onClick={handleClose}>Done</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
