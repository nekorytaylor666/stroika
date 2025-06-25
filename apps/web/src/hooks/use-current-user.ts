import { api } from "@stroika/backend";
import { useQuery } from "convex/react";

export function useCurrentUser() {
	return useQuery(api.users.viewer);
}
