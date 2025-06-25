import { useQuery } from "convex/react";
import { api } from "@stroika/backend";

export function useCurrentUser() {
	return useQuery(api.users.viewer);
}
