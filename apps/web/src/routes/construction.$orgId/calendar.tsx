import { ConstructionCalendar } from "@/components/construction/construction-calendar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/calendar")({
	component: ConstructionCalendarPage,
});

function ConstructionCalendarPage() {
	return <ConstructionCalendar />;
}
