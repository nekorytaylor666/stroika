import { authClient } from "@/lib/auth-client";
import { useMemo } from "react";

// Hook to get the current Better Auth session
export function useSession() {
	return authClient.useSession();
}

// Hook to get the active organization from Better Auth
export function useActiveOrganization() {
	return authClient.useActiveOrganization();
}

// Hook to list all user's organizations
export function useListOrganizations() {
	return authClient.useListOrganizations();
}

// Hook to set active organization
export function useSetActiveOrganization() {
	const setActive = async (organizationId: string) => {
		try {
			await authClient.organization.setActive({
				organizationId,
			});
			return { success: true };
		} catch (error) {
			console.error("Failed to set active organization:", error);
			return { success: false, error };
		}
	};

	return { setActive };
}

// Hook to create a new organization
export function useCreateOrganization() {
	const create = async (data: {
		name: string;
		slug?: string;
		metadata?: any;
	}) => {
		try {
			const result = await authClient.organization.create({
				name: data.name,
				slug: data.slug,
				metadata: data.metadata,
			});
			return { success: true, organization: result };
		} catch (error) {
			console.error("Failed to create organization:", error);
			return { success: false, error };
		}
	};

	return { create };
}

// Combined hook for all organization features
export function useOrganization() {
	const session = useSession();
	const activeOrg = useActiveOrganization();
	const orgs = useListOrganizations();
	const { setActive } = useSetActiveOrganization();
	const { create } = useCreateOrganization();

	const isLoading = session.isPending || activeOrg.isPending || orgs.isPending;

	return useMemo(
		() => ({
			session: session.data,
			activeOrganization: activeOrg.data,
			organizations: orgs.data || [],
			isLoading,
			setActiveOrganization: setActive,
			createOrganization: create,
		}),
		[session.data, activeOrg.data, orgs.data, isLoading, setActive, create],
	);
}
