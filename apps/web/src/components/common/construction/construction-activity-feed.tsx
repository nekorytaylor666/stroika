import type { Id } from "@stroika/backend";
import { LinearActivityFeed } from "../activity/linear-activity-feed";

interface ConstructionActivityFeedProps {
	projectId?: Id<"constructionProjects">;
	limit?: number;
}

export function ConstructionActivityFeed({
	projectId,
	limit = 50,
}: ConstructionActivityFeedProps) {
	// Simply use the reusable LinearActivityFeed component
	return (
		<LinearActivityFeed type="project" projectId={projectId} limit={limit} />
	);
}
