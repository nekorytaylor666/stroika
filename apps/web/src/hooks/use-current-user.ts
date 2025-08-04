import { api } from "@stroika/backend";
import { useQuery } from "convex/react";

export function useCurrentUser() {
	const user = useQuery(api.users.viewer);
	console.log("user", user);
	return user;
}
