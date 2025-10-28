import Loader from "@/components/loader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authClient } from "@/lib/auth-client";
import { api } from "@stroika/backend";
import { Navigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { OrganizationSetup } from "./organization-setup";

interface AuthGuardProps {
	children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const session = authClient.useSession();
	if (session.isPending) {
		return <Loader />;
	}

	// Not authenticated
	if (!session.data?.user) {
		return <Navigate to="/auth" />;
	}

	return <>{children}</>;
}
