"use client";

import type { Id } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { LinearActivityFeed } from "./linear-activity-feed";

interface ActivityFeedWidgetProps {
	type: "organization" | "project" | "team" | "user";
	projectId?: Id<"constructionProjects">;
	userId?: Id<"users">;
	departmentId?: Id<"departments">;
	title?: string;
	showViewAll?: boolean;
	viewAllUrl?: string;
	limit?: number;
	className?: string;
}

export function ActivityFeedWidget({
	type,
	projectId,
	userId,
	departmentId,
	title = "Последняя активность",
	showViewAll = true,
	viewAllUrl,
	limit = 10,
	className,
}: ActivityFeedWidgetProps) {
	const navigate = useNavigate();

	const handleViewAll = () => {
		if (viewAllUrl) {
			navigate({ to: viewAllUrl });
		}
	};

	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-2">
					<Activity className="h-5 w-5 text-primary" />
					<CardTitle className="text-lg">{title}</CardTitle>
				</div>
				{showViewAll && viewAllUrl && (
					<Button variant="ghost" size="sm" onClick={handleViewAll}>
						Показать все
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<LinearActivityFeed
					type={type}
					projectId={projectId}
					userId={userId}
					departmentId={departmentId}
					limit={limit}
					showLoadMore={false}
				/>
			</CardContent>
		</Card>
	);
}
