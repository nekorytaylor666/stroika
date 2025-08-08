import { v } from "convex/values";
import { query } from "./_generated/server";

export const search = query({
	args: {
		query: v.string(),
		category: v.optional(
			v.union(
				v.literal("all"),
				v.literal("tasks"),
				v.literal("projects"),
				v.literal("members"),
				v.literal("teams"),
			),
		),
		organizationId: v.optional(v.id("organizations")),
	},
	handler: async (ctx, args) => {
		const searchTerm = args.query.toLowerCase().trim();
		const category = args.category || "all";

		console.log(
			`Search query: "${args.query}" -> searchTerm: "${searchTerm}", category: "${category}"`,
		);
		console.log(`Search term length: ${searchTerm.length}`);

		if (searchTerm === "") {
			return {
				tasks: [],
				constructionTasks: [],
				projects: [],
				constructionProjects: [],
				members: [],
				teams: [],
				constructionTeams: [],
			};
		}

		const results = {
			tasks: [] as any[],
			constructionTasks: [] as any[],
			projects: [] as any[],
			constructionProjects: [] as any[],
			members: [] as any[],
			teams: [] as any[],
			constructionTeams: [] as any[],
		};

		// Search regular tasks
		if (category === "all" || category === "tasks") {
			const allIssues = await ctx.db.query("issues").collect();
			const allStatuses = await ctx.db.query("status").collect();
			const allPriorities = await ctx.db.query("priorities").collect();
			const allUsers = await ctx.db.query("users").collect();

			// Filter regular tasks (non-construction)
			const regularTasks = allIssues.filter(
				(issue) => !issue.isConstructionTask,
			);

			console.log(
				`Found ${allIssues.length} total issues, ${regularTasks.length} regular tasks`,
			);

			// Log sample data for debugging
			if (regularTasks.length > 0) {
				console.log("Sample regular task:", {
					title: regularTasks[0].title,
					identifier: regularTasks[0].identifier,
					description: regularTasks[0].description?.substring(0, 50),
				});
			}

			const filteredTasks = regularTasks.filter((task: any) => {
				// More robust search
				const normalizeForSearch = (str: string) =>
					str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

				const taskTitle = normalizeForSearch(task.title || "");
				const taskDesc = normalizeForSearch(task.description || "");
				const taskIdent = normalizeForSearch(task.identifier || "");
				const searchStr = normalizeForSearch(searchTerm);

				const titleMatch = taskTitle.includes(searchStr);
				const descMatch = taskDesc.includes(searchStr);
				const identMatch = taskIdent.includes(searchStr);
				const match = titleMatch || descMatch || identMatch;

				if (match) {
					console.log(
						`Task match found: "${task.title}" (titleMatch: ${titleMatch}, descMatch: ${descMatch}, identMatch: ${identMatch})`,
					);
				}

				return match;
			});

			console.log(
				`Filtered tasks: ${filteredTasks.length}/${regularTasks.length}`,
			);

			results.tasks = filteredTasks.slice(0, 10).map((task: any) => {
				const status = allStatuses.find((s: any) => s._id === task.statusId);
				const priority = allPriorities.find(
					(p: any) => p._id === task.priorityId,
				);
				const assignee = allUsers.find((u: any) => u._id === task.assigneeId);

				return {
					...task,
					status: status || null,
					priority: priority || null,
					assignee: assignee || null,
					type: "task",
				};
			});

			// Filter construction tasks
			const constructionTasks = allIssues.filter(
				(issue) => issue.isConstructionTask,
			);

			console.log(`Found ${constructionTasks.length} construction tasks`);
			if (constructionTasks.length > 0) {
				console.log("Sample construction task:", {
					title: constructionTasks[0].title,
					identifier: constructionTasks[0].identifier,
					description: constructionTasks[0].description?.substring(0, 50),
				});
			}

			let debugCount = 0;
			const filteredConstructionTasks = constructionTasks.filter(
				(task: any) => {
					// More robust search
					const normalizeForSearch = (str: string) =>
						str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

					const taskTitle = normalizeForSearch(task.title || "");
					const taskDesc = normalizeForSearch(task.description || "");
					const taskIdent = normalizeForSearch(task.identifier || "");
					const searchStr = normalizeForSearch(searchTerm);

					const titleMatch = taskTitle.includes(searchStr);
					const descMatch = taskDesc.includes(searchStr);
					const identMatch = taskIdent.includes(searchStr);
					const match = titleMatch || descMatch || identMatch;

					// Debug first few construction tasks
					if (debugCount < 2) {
						debugCount++;
						console.log(`Testing construction task: "${task.title}"`, {
							taskTitle,
							taskDesc: taskDesc.substring(0, 30),
							taskIdent,
							searchStr,
							titleMatch,
							descMatch,
							identMatch,
						});
					}

					if (match) {
						console.log(
							`Construction task match found: "${task.title}" (titleMatch: ${titleMatch}, descMatch: ${descMatch}, identMatch: ${identMatch})`,
						);
					}

					return match;
				},
			);

			console.log(
				`Filtered construction tasks: ${filteredConstructionTasks.length}/${constructionTasks.length}`,
			);

			// Process construction tasks synchronously to avoid timing issues
			const processedConstructionTasks = filteredConstructionTasks
				.slice(0, 10)
				.map((task: any) => {
					const status = allStatuses.find((s: any) => s._id === task.statusId);
					const priority = allPriorities.find(
						(p: any) => p._id === task.priorityId,
					);
					const assignee = allUsers.find((u: any) => u._id === task.assigneeId);

					return {
						...task,
						status: status || null,
						priority: priority || null,
						assignee: assignee || null,
						type: "constructionTask",
					};
				});

			console.log(
				`Processed ${processedConstructionTasks.length} construction tasks`,
			);

			// Put construction tasks in BOTH results.constructionTasks AND results.tasks
			// since in this system, "tasks" means construction tasks
			results.constructionTasks = processedConstructionTasks;

			// If there are no regular tasks, also put construction tasks in the tasks array
			// This ensures the frontend can find them regardless of which array it checks
			if (regularTasks.length === 0 && processedConstructionTasks.length > 0) {
				results.tasks = processedConstructionTasks;
				console.log(
					`Also putting ${processedConstructionTasks.length} construction tasks in results.tasks`,
				);
			}
		}

		// Search construction projects
		if (category === "all" || category === "projects") {
			const allConstructionProjects = await ctx.db
				.query("constructionProjects")
				.collect();
			const allStatuses = await ctx.db.query("status").collect();
			const allUsers = await ctx.db.query("users").collect();

			results.constructionProjects = allConstructionProjects
				.filter(
					(project: any) =>
						project.name?.toLowerCase().includes(searchTerm) ||
						(project.notes && project.notes.toLowerCase().includes(searchTerm)),
				)
				.slice(0, 10)
				.map((project: any) => {
					const status = allStatuses.find(
						(s: any) => s._id === project.statusId,
					);
					const lead = allUsers.find((u: any) => u._id === project.leadId);

					return {
						...project,
						identifier: project.name, // Use name as identifier for display
						status: status || null,
						lead: lead || null,
						type: "constructionProject",
					};
				});
		}

		// Search members (users)
		if (category === "all" || category === "members") {
			const allUsers = await ctx.db.query("users").collect();
			const allRoles = await ctx.db.query("roles").collect();

			console.log(`Found ${allUsers.length} total users`);
			if (allUsers.length > 0) {
				console.log("Sample user:", {
					name: allUsers[0].name,
					email: allUsers[0].email,
					position: allUsers[0].position,
				});
			}

			let userDebugCount = 0;
			const filteredUsers = allUsers.filter((user: any) => {
				// More robust search that handles partial matches and encoding issues
				const normalizeForSearch = (str: string) =>
					str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

				const userName = normalizeForSearch(user.name || "");
				const userEmail = normalizeForSearch(user.email || "");
				const userPosition = normalizeForSearch(user.position || "");
				const searchStr = normalizeForSearch(searchTerm);

				// Check if search term is contained in any field
				const nameMatch = userName.includes(searchStr);
				const emailMatch = userEmail.includes(searchStr);
				const positionMatch = userPosition.includes(searchStr);
				const match = nameMatch || emailMatch || positionMatch;

				// Debug first few users to understand the data
				if (userDebugCount < 2) {
					userDebugCount++;
					console.log(`Testing user: "${user.name}"`, {
						userName,
						userEmail,
						searchStr,
						nameMatch,
						emailMatch,
						positionMatch,
					});
				}

				if (match) {
					console.log(
						`User match found: "${user.name}" (nameMatch: ${nameMatch}, emailMatch: ${emailMatch}, positionMatch: ${positionMatch})`,
					);
				}

				return match;
			});

			console.log(`Filtered users: ${filteredUsers.length}/${allUsers.length}`);

			results.members = filteredUsers.slice(0, 10).map((user: any) => {
				const role = allRoles.find((r: any) => r._id === user.roleId);
				return {
					...user,
					role,
					type: "member",
				};
			});
		}

		// Search regular teams
		if (category === "all" || category === "teams") {
			const allTeams = await ctx.db.query("teams").collect();

			results.teams = allTeams
				.filter(
					(team: any) =>
						team.name?.toLowerCase().includes(searchTerm) ||
						(team.description &&
							team.description.toLowerCase().includes(searchTerm)),
				)
				.slice(0, 10)
				.map((team: any) => ({
					...team,
					type: "team",
				}));
		}

		// Search construction teams
		if (category === "all" || category === "teams") {
			const allConstructionTeams = await ctx.db
				.query("constructionTeams")
				.collect();

			results.constructionTeams = allConstructionTeams
				.filter((team: any) => team.name?.toLowerCase().includes(searchTerm))
				.slice(0, 10)
				.map((team: any) => ({
					...team,
					type: "constructionTeam",
				}));
		}

		console.log("Final search results:", {
			tasks: results.tasks.length,
			constructionTasks: results.constructionTasks.length,
			projects: results.projects.length,
			constructionProjects: results.constructionProjects.length,
			members: results.members.length,
			teams: results.teams.length,
			constructionTeams: results.constructionTeams.length,
		});

		return results;
	},
});
