import Loader from "@/components/loader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@stroika/backend";
import { Navigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { OrganizationSetup } from "./organization-setup";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
	children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const session = authClient.useSession();
	console.log("session:", JSON.stringify(session, null, 2));
	if (session.isPending) {
		return <Loader />;
	}

	// Not authenticated
	if (!session.data?.user) {
		return <Navigate to="/auth" />;
	}

	return <>{children}</>;
}
