import Header from "@/components/layout/headers/issues/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/construction-tasks")(
	{
		component: ConstructionTasksPage,
	},
);

function ConstructionTasksPage() {
	return <h1>asdf</h1>;
}
