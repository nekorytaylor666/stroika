import { useCommandPaletteStore } from "@/store/command-palette-store";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Building2,
	ClipboardList,
	Folder,
	Loader2,
	User,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "./ui/command";

export function CommandPalette() {
	const router = useRouter();
	const params = useParams({ strict: false });
	const orgId = params.orgId as string;

	const { isOpen, selectedCategory, closeCommandPalette, openCommandPalette } =
		useCommandPaletteStore();

	const { setSelectedTaskId } = useConstructionTaskDetailsStore();

	// Local state for search value (let cmdk handle it)
	const [searchValue, setSearchValue] = useState("");
	const [loading, setLoading] = useState(false);

	// Fetch data whenever search value changes
	const searchResults = useQuery(
		api.globalSearch.search,
		searchValue.length > 0
			? {
					query: searchValue,
					category: selectedCategory,
					organizationId: orgId ? (orgId as Id<"organizations">) : undefined,
				}
			: "skip",
	);

	// Track loading state
	useEffect(() => {
		if (searchValue.length > 0 && !searchResults) {
			setLoading(true);
		} else {
			setLoading(false);
		}
	}, [searchValue, searchResults]);

	// Keyboard shortcut
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				openCommandPalette();
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [openCommandPalette]);

	// Navigation handlers
	const handleTaskClick = useCallback(
		(taskId: string, type: "task" | "constructionTask") => {
			if (type === "task") {
				router.navigate({ to: `/issues/${orgId}/team/all/all` });
				// Open task modal after navigation
			} else {
				router.navigate({ to: `/construction/${orgId}/tasks/${taskId}` });
			}
			closeCommandPalette();
		},
		[orgId, router.navigate, closeCommandPalette],
	);

	const handleProjectClick = useCallback(
		(projectId: string, type: "project" | "constructionProject") => {
			if (type === "project") {
				router.navigate({ to: `/issues/${orgId}/projects/${projectId}` });
			} else {
				router.navigate({ to: `/construction/${orgId}/projects/${projectId}` });
			}
			closeCommandPalette();
		},
		[orgId, router.navigate, closeCommandPalette],
	);

	const handleMemberClick = useCallback(
		(userId: string) => {
			router.navigate({ to: `/team/${orgId}/members/${userId}` });
			closeCommandPalette();
		},
		[orgId, router.navigate, closeCommandPalette],
	);

	const handleTeamClick = useCallback(
		(teamId: string, type: "team" | "constructionTeam") => {
			if (type === "team") {
				router.navigate({ to: `/team/${orgId}/teams/${teamId}` });
			} else {
				router.navigate({ to: `/construction/${orgId}/teams/${teamId}` });
			}
			closeCommandPalette();
		},
		[orgId, router.navigate, closeCommandPalette],
	);

	// Reset search when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setSearchValue("");
		}
	}, [isOpen]);

	return (
		<CommandDialog open={isOpen} onOpenChange={closeCommandPalette}>
			<CommandInput
				placeholder="Search for tasks, projects, members, or teams..."
				value={searchValue}
				onValueChange={setSearchValue}
			/>
			<CommandList>
				{loading && (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}

				{!loading && searchValue.length === 0 && (
					<CommandEmpty>Start typing to search...</CommandEmpty>
				)}

				{!loading && searchValue.length > 0 && !searchResults && (
					<CommandEmpty>No results found.</CommandEmpty>
				)}

				{!loading && searchResults && (
					<>
						{/* Tasks - let cmdk filter these automatically */}
						{((searchResults.tasks?.length || 0) > 0 ||
							(searchResults.constructionTasks?.length || 0) > 0) && (
							<CommandGroup heading="Tasks">
								{searchResults.tasks?.map((task) => (
									<CommandItem
										key={task._id}
										value={`${task.title} ${task.identifier}`}
										onSelect={() => handleTaskClick(task._id, "task")}
										className="flex items-center gap-2"
									>
										<ClipboardList className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{task.title}</span>
										<Badge variant="outline" className="text-xs">
											{task.identifier}
										</Badge>
										{task.status && (
											<Badge
												variant="secondary"
												className="text-xs"
												style={{
													backgroundColor: task.status.color + "20",
													color: task.status.color,
												}}
											>
												{task.status.name}
											</Badge>
										)}
									</CommandItem>
								))}
								{searchResults.constructionTasks?.map((task) => (
									<CommandItem
										key={task._id}
										value={`${task.title} ${task.identifier} construction`}
										onSelect={() =>
											handleTaskClick(task._id, "constructionTask")
										}
										className="flex items-center gap-2"
									>
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{task.title}</span>
										<Badge variant="outline" className="text-xs">
											{task.identifier}
										</Badge>
										{task.status && (
											<Badge
												variant="secondary"
												className="text-xs"
												style={{
													backgroundColor: task.status.color + "20",
													color: task.status.color,
												}}
											>
												{task.status.name}
											</Badge>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{((searchResults.tasks?.length || 0) > 0 ||
							(searchResults.constructionTasks?.length || 0) > 0) &&
							((searchResults.projects?.length || 0) > 0 ||
								(searchResults.constructionProjects?.length || 0) > 0) && (
								<CommandSeparator />
							)}

						{/* Projects */}
						{((searchResults.projects?.length || 0) > 0 ||
							(searchResults.constructionProjects?.length || 0) > 0) && (
							<CommandGroup heading="Projects">
								{searchResults.projects?.map((project) => (
									<CommandItem
										key={project._id}
										value={`${project.name} ${project.identifier}`}
										onSelect={() => handleProjectClick(project._id, "project")}
										className="flex items-center gap-2"
									>
										<Folder className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{project.name}</span>
										<Badge variant="outline" className="text-xs">
											{project.identifier}
										</Badge>
										{project.status && (
											<Badge
												variant="secondary"
												className="text-xs"
												style={{
													backgroundColor: project.status.color + "20",
													color: project.status.color,
												}}
											>
												{project.status.name}
											</Badge>
										)}
									</CommandItem>
								))}
								{searchResults.constructionProjects?.map((project) => (
									<CommandItem
										key={project._id}
										value={`${project.name} ${project.identifier} construction`}
										onSelect={() =>
											handleProjectClick(project._id, "constructionProject")
										}
										className="flex items-center gap-2"
									>
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{project.name}</span>
										<Badge variant="outline" className="text-xs">
											{project.identifier}
										</Badge>
										{project.status && (
											<Badge
												variant="secondary"
												className="text-xs"
												style={{
													backgroundColor: project.status.color + "20",
													color: project.status.color,
												}}
											>
												{project.status.name}
											</Badge>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{((searchResults.projects?.length || 0) > 0 ||
							(searchResults.constructionProjects?.length || 0) > 0) &&
							(searchResults.members?.length || 0) > 0 && <CommandSeparator />}

						{/* Members */}
						{(searchResults.members?.length || 0) > 0 && (
							<CommandGroup heading="Members">
								{searchResults.members?.map((member) => (
									<CommandItem
										key={member._id}
										value={`${member.name} ${member.position || ""} ${member.role?.displayName || ""}`}
										onSelect={() => handleMemberClick(member._id)}
										className="flex items-center gap-2"
									>
										<User className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{member.name}</span>
										{member.position && (
											<span className="text-muted-foreground text-xs">
												{member.position}
											</span>
										)}
										{member.role && (
											<Badge variant="secondary" className="text-xs">
												{member.role.displayName}
											</Badge>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{(searchResults.members?.length || 0) > 0 &&
							((searchResults.teams?.length || 0) > 0 ||
								(searchResults.constructionTeams?.length || 0) > 0) && (
								<CommandSeparator />
							)}

						{/* Teams */}
						{((searchResults.teams?.length || 0) > 0 ||
							(searchResults.constructionTeams?.length || 0) > 0) && (
							<CommandGroup heading="Teams">
								{searchResults.teams?.map((team) => (
									<CommandItem
										key={team._id}
										value={`${team.name} team`}
										onSelect={() => handleTeamClick(team._id, "team")}
										className="flex items-center gap-2"
									>
										<Users className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{team.name}</span>
										{team.memberCount !== undefined && (
											<span className="text-muted-foreground text-xs">
												{team.memberCount} members
											</span>
										)}
									</CommandItem>
								))}
								{searchResults.constructionTeams?.map((team) => (
									<CommandItem
										key={team._id}
										value={`${team.name} construction team`}
										onSelect={() =>
											handleTeamClick(team._id, "constructionTeam")
										}
										className="flex items-center gap-2"
									>
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<span className="flex-1">{team.name}</span>
										{team.memberIds && (
											<span className="text-muted-foreground text-xs">
												{team.memberIds.length} members
											</span>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
