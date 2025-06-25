import Loader from "@/components/loader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Navigate } from "@tanstack/react-router";

interface AuthGuardProps {
	children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const user = useCurrentUser();

	// Still loading
	if (user === undefined) {
		return <Loader />;
	}

	// Not authenticated
	if (user === null) {
		return <Navigate to="/auth" />;
	}

	// Authenticated
	return <>{children}</>;
}
