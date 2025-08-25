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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Copy, Link, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InviteUrlModalSimpleProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	inviteCode: string | null;
	inviteEmail: string;
	expiresAt: number;
}

export default function InviteUrlModalSimple({
	open,
	onOpenChange,
	inviteCode,
	inviteEmail,
	expiresAt,
}: InviteUrlModalSimpleProps) {
	const [copied, setCopied] = useState(false);
	const [fullUrl, setFullUrl] = useState<string>("");

	// Build full URL when modal opens
	useEffect(() => {
		if (inviteCode && open) {
			const baseUrl = window.location.origin;
			setFullUrl(`${baseUrl}/invite/${inviteCode}`);
		}
	}, [inviteCode, open]);

	const handleCopyLink = async () => {
		if (!fullUrl) return;

		try {
			await navigator.clipboard.writeText(fullUrl);
			setCopied(true);
			toast.success("Invite link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy link");
		}
	};

	const handleSendEmail = () => {
		if (!fullUrl || !inviteEmail) return;

		const subject = encodeURIComponent("Invitation to join our organization");
		const body = encodeURIComponent(
			`You've been invited to join our organization.\n\nPlease click the following link to accept the invitation:\n${fullUrl}\n\nThis invitation will expire on ${format(new Date(expiresAt), "dd MMMM yyyy", { locale: ru })}.`,
		);

		window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
	};

	const handleClose = () => {
		onOpenChange(false);
		// Reset state after closing
		setTimeout(() => {
			setCopied(false);
			setFullUrl("");
		}, 200);
	};

	if (!inviteCode) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link className="h-5 w-5" />
						Invitation Link
					</DialogTitle>
					<DialogDescription>
						Share this link with {inviteEmail} to join your organization
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Invitation Link</Label>
						<div className="flex items-center gap-2">
							<Input
								value={fullUrl}
								readOnly
								className="font-mono text-xs"
								onClick={(e) => e.currentTarget.select()}
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
					</div>

					<div className="space-y-2">
						<Label>Invite Details</Label>
						<div className="rounded-lg border bg-muted/30 p-3 space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Email:</span>
								<span className="font-medium">{inviteEmail}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Expires:</span>
								<span className="font-medium">
									{format(new Date(expiresAt), "dd MMM yyyy", {
										locale: ru,
									})}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Code:</span>
								<span className="font-mono text-xs">{inviteCode}</span>
							</div>
						</div>
					</div>

					<div className="flex justify-between gap-2 pt-2">
						<Button
							variant="outline"
							onClick={handleSendEmail}
							className="gap-2"
						>
							<Mail className="h-4 w-4" />
							Send via Email
						</Button>
						<div className="flex gap-2">
							<Button variant="outline" onClick={handleClose}>
								Close
							</Button>
							<Button onClick={handleCopyLink} className="gap-2">
								{copied ? (
									<>
										<Check className="h-4 w-4" />
										Copied!
									</>
								) : (
									<>
										<Copy className="h-4 w-4" />
										Copy Link
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}