import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@stroika/backend";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { Building, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/invite/$code")({
	component: InvitePage,
});

function InvitePage() {
	const { code } = Route.useParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	const [isAccepting, setIsAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Query invite details
	const invite = useQuery(api.invites.getInviteByCode, { inviteCode: code });
	const acceptInvite = useMutation(api.invites.acceptInvite);

	const handleAcceptInvite = async () => {
		if (!isAuthenticated) {
			// Redirect to auth page with return URL
			navigate({ to: "/auth", search: { returnTo: `/invite/${code}` } });
			return;
		}

		setIsAccepting(true);
		setError(null);

		try {
			const result = await acceptInvite({ inviteCode: code });
			// Redirect to the organization
			navigate({
				to: `/construction/${invite?.organization?.slug || result.organizationId}`,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to accept invite");
			setIsAccepting(false);
		}
	};

	if (!invite) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-muted/30">
				<div className="flex items-center gap-2">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Loading invite...</span>
				</div>
			</div>
		);
	}

	if (invite.isExpired) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-muted/30">
				<Card className="w-full max-w-md p-8">
					<div className="text-center">
						<div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<Building className="h-8 w-8 text-red-600" />
						</div>
						<h2 className="mb-2 font-semibold text-2xl">Invite Expired</h2>
						<p className="text-muted-foreground">
							This invitation link has expired. Please request a new invitation
							from your organization admin.
						</p>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/30">
			<Card className="w-full max-w-md p-8">
				<div className="text-center">
					{invite.organization?.logoUrl ? (
						<img
							src={invite.organization.logoUrl}
							alt={invite.organization.name}
							className="mx-auto mb-6 h-16 w-16 rounded-lg object-cover"
						/>
					) : (
						<div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
							<Building className="h-8 w-8 text-primary" />
						</div>
					)}

					<h2 className="mb-2 font-semibold text-2xl">
						Join {invite.organization?.name}
					</h2>

					<p className="mb-6 text-muted-foreground">
						{invite.invitedByUser?.name} has invited you to join as{" "}
						{invite.role?.displayName}
					</p>

					{error && (
						<div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600 text-sm">
							{error}
						</div>
					)}

					{invite.status === "accepted" ? (
						<div className="rounded-lg bg-green-50 p-4">
							<p className="text-green-600 text-sm">
								This invite has already been accepted
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{!isAuthenticated && (
								<p className="text-muted-foreground text-sm">
									You need to sign in or create an account to accept this
									invitation
								</p>
							)}
							<Button
								onClick={handleAcceptInvite}
								disabled={isAccepting}
								className="w-full"
								size="lg"
							>
								{isAccepting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Accepting...
									</>
								) : !isAuthenticated ? (
									"Sign in to Accept"
								) : (
									"Accept Invitation"
								)}
							</Button>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
