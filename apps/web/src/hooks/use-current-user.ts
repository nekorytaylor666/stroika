import { authClient } from "@/lib/auth-client";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";

export function useCurrentUser() {
	const { data: session } = authClient.useSession();
	return session?.user;
}
