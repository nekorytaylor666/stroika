import { LinearActivityFeed } from "@/components/common/activity/linear-activity-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@stroika/backend";
import { api } from "@stroika/backend";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	ArrowLeft,
	Briefcase,
	Calendar,
	Clock,
	Mail,
	Shield,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/member/$memberId")({
	component: MemberDetailsPage,
});

function MemberDetailsPage() {
	const { orgId, memberId } = Route.useParams();

	// Fetch member details
	const member = useQuery(api.organizationMembers.getMemberDetails, {
		organizationId: orgId as Id<"organizations">,
		memberId: memberId as Id<"organizationMembers">,
	});

	if (!member) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
					<p className="text-muted-foreground">Loading member details...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="px-8 py-6">
					<div className="flex items-center gap-4">
						<Link
							to="/construction/$orgId/members"
							params={{ orgId }}
							className="text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="h-5 w-5" />
						</Link>
						<div className="flex items-center gap-4">
							<Avatar className="h-12 w-12">
								<AvatarImage
									src={member.user?.avatarUrl}
									alt={member.user?.name}
								/>
								<AvatarFallback>{member.user?.name?.[0] || "U"}</AvatarFallback>
							</Avatar>
							<div>
								<h1 className="font-semibold text-2xl">
									{member.user?.name || "Unknown User"}
								</h1>
								<p className="text-muted-foreground text-sm">
									{member.role?.displayName || member.role?.name || "Member"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<Tabs defaultValue="overview" className="flex-1">
				<div className="border-b px-8">
					<TabsList className="h-12 w-full justify-start rounded-none border-none bg-transparent p-0">
						<TabsTrigger
							value="overview"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value="activity"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
						>
							Activity
						</TabsTrigger>
						<TabsTrigger
							value="teams"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
						>
							Teams
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 overflow-y-auto">
					<TabsContent value="overview" className="p-8">
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{/* Member Information Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Member Information
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center gap-3">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-sm">Email</p>
											<p className="font-medium text-sm">
												{member.user?.email || "No email"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Shield className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-sm">Role</p>
											<Badge variant="secondary">
												{member.role?.displayName ||
													member.role?.name ||
													"Member"}
											</Badge>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-sm">Joined</p>
											<p className="font-medium text-sm">
												{format(new Date(member.joinedAt), "dd MMMM yyyy", {
													locale: ru,
												})}
											</p>
										</div>
									</div>
									{member.invitedBy && (
										<div className="flex items-center gap-3">
											<Users className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<p className="text-muted-foreground text-sm">
													Invited by
												</p>
												<p className="font-medium text-sm">
													{member.invitedBy.name}
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Status Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Status</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center gap-3">
										<div
											className={`h-3 w-3 rounded-full ${
												member.user?.status === "online"
													? "bg-green-500"
													: member.user?.status === "away"
														? "bg-yellow-500"
														: "bg-gray-300"
											}`}
										/>
										<span className="font-medium text-sm capitalize">
											{member.user?.status || "Offline"}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-sm">
												Last active
											</p>
											<p className="font-medium text-sm">
												{member.user?.lastLogin
													? format(
															new Date(member.user.lastLogin),
															"dd MMM yyyy HH:mm",
															{ locale: ru },
														)
													: "Never"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Activity className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-sm">
												Account status
											</p>
											<Badge
												variant={member.isActive ? "default" : "secondary"}
											>
												{member.isActive ? "Active" : "Inactive"}
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Work Information Card */}
							{member.user?.position && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Work Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center gap-3">
											<Briefcase className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<p className="text-muted-foreground text-sm">
													Position
												</p>
												<p className="font-medium text-sm">
													{member.user.position}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Users className="h-4 w-4 text-muted-foreground" />
											<div className="flex-1">
												<p className="text-muted-foreground text-sm">Teams</p>
												<p className="font-medium text-sm">
													{member.teams.length} teams
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</TabsContent>

					<TabsContent value="activity" className="p-8">
						<LinearActivityFeed
							type="user"
							userId={member.user?._id as Id<"user">}
							className="max-w-4xl"
						/>
					</TabsContent>

					<TabsContent value="teams" className="p-8">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{member.teams.length === 0 ? (
								<Card className="md:col-span-2 lg:col-span-3">
									<CardContent className="flex flex-col items-center justify-center py-12">
										<Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
										<h3 className="font-medium">No teams</h3>
										<p className="mt-1 text-muted-foreground text-sm">
											This member is not part of any teams yet
										</p>
									</CardContent>
								</Card>
							) : (
								member.teams.map((team) => (
									<Card
										key={team._id}
										className="cursor-pointer hover:shadow-sm"
									>
										<CardHeader>
											<div className="flex items-center justify-between">
												<CardTitle className="text-base">{team.name}</CardTitle>
												<Badge variant="outline" className="text-xs">
													{team.role}
												</Badge>
											</div>
										</CardHeader>
										{team.description && (
											<CardContent>
												<p className="text-muted-foreground text-sm">
													{team.description}
												</p>
											</CardContent>
										)}
									</Card>
								))
							)}
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
