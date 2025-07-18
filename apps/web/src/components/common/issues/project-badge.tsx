import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function ProjectBadge({ project }: { project: any }) {
	return (
		<Link
			to={`/construction/$orgId/projects`}
			className="flex items-center justify-center gap-.5"
		>
			<Badge
				variant="outline"
				className="gap-1.5 rounded-full bg-background text-muted-foreground"
			>
				<project.icon size={16} />
				{project.name}
			</Badge>
		</Link>
	);
}
