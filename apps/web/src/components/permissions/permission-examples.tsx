import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	usePermission,
	usePermissions,
	useProjectPermissions,
} from "@/hooks/use-permissions";
import { FileText, Plus, Settings, Trash2, Users } from "lucide-react";

interface PermissionExamplesProps {
	projectId?: string;
}

/**
 * Example component showing different ways to use colon notation permissions
 */
export function PermissionExamples({ projectId }: PermissionExamplesProps) {
	const permissions = usePermissions();
	const projectPermissions = projectId
		? useProjectPermissions(projectId)
		: null;

	// Example of checking a specific permission with a hook
	const { hasPermission: canDeleteRoles } = usePermission("roles", "delete");

	if (permissions.isLoading) {
		return <div>Loading permissions...</div>;
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Permission Examples - Colon Notation</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Method 1: Using the hasPermission function directly */}
					<div>
						<h3 className="mb-2 font-semibold">
							Method 1: Direct Permission Check
						</h3>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									disabled={!permissions.hasPermission("members:invite")}
								>
									<Users className="mr-2 h-4 w-4" />
									Invite Members
								</Button>
								<Badge
									variant={
										permissions.hasPermission("members:invite")
											? "default"
											: "secondary"
									}
								>
									members:invite
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<Button
									size="sm"
									disabled={!permissions.hasPermission("documents:create")}
								>
									<FileText className="mr-2 h-4 w-4" />
									Create Document
								</Button>
								<Badge
									variant={
										permissions.hasPermission("documents:create")
											? "default"
											: "secondary"
									}
								>
									documents:create
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<Button
									size="sm"
									disabled={!permissions.hasPermission("teams:manage")}
								>
									<Settings className="mr-2 h-4 w-4" />
									Manage Teams
								</Button>
								<Badge
									variant={
										permissions.hasPermission("teams:manage")
											? "default"
											: "secondary"
									}
								>
									teams:manage
								</Badge>
							</div>
						</div>
					</div>

					{/* Method 2: Using the can() helper function */}
					<div>
						<h3 className="mb-2 font-semibold">
							Method 2: Can() Helper Function
						</h3>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									disabled={!permissions.can("projects", "create")}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create Project
								</Button>
								<Badge
									variant={
										permissions.can("projects", "create")
											? "default"
											: "secondary"
									}
								>
									projects:create
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="destructive"
									disabled={!permissions.can("roles", "delete")}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Roles
								</Button>
								<Badge
									variant={
										permissions.can("roles", "delete")
											? "destructive"
											: "secondary"
									}
								>
									roles:delete
								</Badge>
							</div>
						</div>
					</div>

					{/* Method 3: Using convenience properties */}
					<div>
						<h3 className="mb-2 font-semibold">
							Method 3: Convenience Properties
						</h3>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Button size="sm" disabled={!permissions.canManageMembers}>
									<Users className="mr-2 h-4 w-4" />
									Manage Members
								</Button>
								<Badge
									variant={
										permissions.canManageMembers ? "default" : "secondary"
									}
								>
									Convenience: canManageMembers
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<Button size="sm" disabled={!permissions.canCreateDocuments}>
									<FileText className="mr-2 h-4 w-4" />
									Upload Documents
								</Button>
								<Badge
									variant={
										permissions.canCreateDocuments ? "default" : "secondary"
									}
								>
									Convenience: canCreateDocuments
								</Badge>
							</div>
						</div>
					</div>

					{/* Method 4: Using separate permission hook */}
					<div>
						<h3 className="mb-2 font-semibold">
							Method 4: Separate Permission Hook
						</h3>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="destructive"
								disabled={!canDeleteRoles}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Roles (Hook)
							</Button>
							<Badge variant={canDeleteRoles ? "destructive" : "secondary"}>
								usePermission("roles", "delete")
							</Badge>
						</div>
					</div>

					{/* Method 5: Project-specific permissions */}
					{projectId && projectPermissions && (
						<div>
							<h3 className="mb-2 font-semibold">
								Method 5: Project Permissions
							</h3>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Button size="sm" disabled={!projectPermissions.canView}>
										View Project
									</Button>
									<Badge
										variant={
											projectPermissions.canView ? "default" : "secondary"
										}
									>
										Project: view
									</Badge>
								</div>

								<div className="flex items-center gap-2">
									<Button size="sm" disabled={!projectPermissions.canEdit}>
										Edit Project
									</Button>
									<Badge
										variant={
											projectPermissions.canEdit ? "default" : "secondary"
										}
									>
										Project: edit
									</Badge>
								</div>

								<div className="flex items-center gap-2">
									<Button size="sm" disabled={!projectPermissions.canAdmin}>
										Admin Project
									</Button>
									<Badge
										variant={
											projectPermissions.canAdmin ? "default" : "secondary"
										}
									>
										Project: admin
									</Badge>
								</div>
							</div>
						</div>
					)}

					{/* Raw permissions display */}
					<div>
						<h3 className="mb-2 font-semibold">Raw Permissions</h3>
						<div className="flex flex-wrap gap-1">
							{permissions.permissions.map((permission) => (
								<Badge key={permission} variant="outline" className="text-xs">
									{permission}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
