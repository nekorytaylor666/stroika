"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@stroika/backend";
import { useRouter } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function OrganizationSetup() {
	const { isAuthenticated } = useConvexAuth();
	const router = useRouter();
	const [inviteCode, setInviteCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);

	const organizations = useQuery(api.organizations.getUserOrganizations);
	const acceptInvite = useMutation(api.invites.acceptInvite);
	const joinAsOwner = useMutation(api.quickSetup.joinAsOwner);
	const debugAuth = useQuery(api.debug.checkAuth);

	// If user has organizations, redirect to the first one
	if (organizations && organizations.length > 0) {
		router.navigate({
			to: "/construction/$orgId/construction-tasks",
			params: { orgId: organizations[0].slug },
		});
		return null;
	}

	const handleJoinWithCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteCode.trim()) return;

		setIsJoining(true);
		try {
			const result = await acceptInvite({ inviteCode: inviteCode.trim() });
			if (result.organizationSlug) {
				router.navigate({
					to: "/construction/$orgId/construction-tasks",
					params: { orgId: result.organizationSlug },
				});
			}
		} catch (error) {
			console.error("Failed to join organization:", error);
			alert("Invalid invite code or invite has expired");
		} finally {
			setIsJoining(false);
		}
	};

	const handleQuickSetup = async () => {
		setIsJoining(true);
		try {
			const result = await joinAsOwner();
			console.log("Quick setup result:", result);

			// Force a refresh of organizations query
			window.location.href = `/construction/${result.organizationSlug || "stroycomplex"}/construction-tasks`;
		} catch (error) {
			console.error("Failed to join as owner:", error);
			alert("Failed to setup organization. Please try again.");
		} finally {
			setIsJoining(false);
		}
	};

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Welcome to Stroika</CardTitle>
					<CardDescription>Join an organization to get started</CardDescription>
					{debugAuth && (
						<div className="mt-2 text-gray-500 text-xs">
							Debug: {JSON.stringify(debugAuth, null, 2)}
						</div>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={handleJoinWithCode} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="inviteCode">Invite Code</Label>
							<Input
								id="inviteCode"
								type="text"
								placeholder="Enter your invite code"
								value={inviteCode}
								onChange={(e) => setInviteCode(e.target.value)}
								disabled={isJoining}
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isJoining || !inviteCode.trim()}
						>
							{isJoining ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Joining...
								</>
							) : (
								"Join Organization"
							)}
						</Button>
					</form>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-2 text-muted-foreground">Or</span>
						</div>
					</div>

					<Button
						variant="outline"
						className="w-full"
						onClick={handleQuickSetup}
						disabled={isJoining}
					>
						{isJoining ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Setting up...
							</>
						) : (
							"Quick Setup (Demo Organization)"
						)}
					</Button>

					<p className="text-center text-muted-foreground text-sm">
						Demo invite codes: DEMO1234, DEMO5678
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
