import Loader from "@/components/loader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@stroika/backend";
import { Navigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { OrganizationSetup } from "./organization-setup";

interface AuthGuardProps {
	children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
	const user = useCurrentUser();
	const organizations = useQuery(api.organizations.getUserOrganizations);

	// Still loading
	if (authLoading || user === undefined || organizations === undefined) {
		return <Loader />;
	}

	// Not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/auth" />;
	}
	console.log("user", user, isAuthenticated, authLoading, organizations);

	// Authenticated but no user in database or no organizations
	if (!user || organizations.length === 0) {
		return <OrganizationSetup />;
	}

	// Authenticated with user and organizations
	return <>{children}</>;
}
