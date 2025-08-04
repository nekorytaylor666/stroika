"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddTeamMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	teamId: Id<"constructionTeams">;
	organizationId: Id<"organizations">;
}

export function AddTeamMemberDialog({
	open,
	onOpenChange,
	teamId,
	organizationId,
}: AddTeamMemberDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(
		new Set(),
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch available users (not already in team)
	const availableUsers = useQuery(api.constructionTeams.getAvailableUsers, {
		teamId,
		organizationId,
	});
	const addMembers = useMutation(api.constructionTeams.addMembers);

	// Filter users
	const filteredUsers = availableUsers?.filter((user) =>
		user.name?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleToggleUser = (userId: Id<"users">) => {
		const newSelected = new Set(selectedUsers);
		if (newSelected.has(userId)) {
			newSelected.delete(userId);
		} else {
			newSelected.add(userId);
		}
		setSelectedUsers(newSelected);
	};

	const handleSubmit = async () => {
		if (selectedUsers.size === 0) {
			toast.error("Выберите хотя бы одного участника");
			return;
		}

		setIsSubmitting(true);

		try {
			await addMembers({
				teamId,
				userIds: Array.from(selectedUsers),
			});

			toast.success(`Добавлено участников: ${selectedUsers.size}`);
			onOpenChange(false);

			// Reset state
			setSelectedUsers(new Set());
			setSearchQuery("");
		} catch (error) {
			console.error("Failed to add members:", error);
			toast.error("Не удалось добавить участников");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Добавить участников</DialogTitle>
					<DialogDescription>
						Выберите участников для добавления в команду
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search */}
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Поиск пользователей..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Users List */}
					<ScrollArea className="h-[300px] pr-4">
						{!availableUsers ? (
							<div className="space-y-2">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="h-16 animate-pulse rounded-md bg-muted"
									/>
								))}
							</div>
						) : filteredUsers?.length === 0 ? (
							<div className="py-8 text-center">
								<UserPlus className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									{searchQuery
										? "Пользователи не найдены"
										: "Нет доступных пользователей"}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredUsers.map((user) => (
									<div
										key={user._id}
										className="flex cursor-pointer items-center gap-3 rounded-md p-3 hover:bg-accent"
										onClick={() => handleToggleUser(user._id)}
									>
										<Checkbox
											checked={selectedUsers.has(user._id)}
											onCheckedChange={() => handleToggleUser(user._id)}
											onClick={(e) => e.stopPropagation()}
										/>
										<Avatar className="h-10 w-10">
											<AvatarImage src={user.profileImageUrl} />
											<AvatarFallback>
												{user.name?.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<p className="font-medium">{user.name}</p>
											<p className="text-muted-foreground text-sm">
												{user.email}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>

					{/* Selected Count */}
					{selectedUsers.size > 0 && (
						<div className="text-muted-foreground text-sm">
							Выбрано: {selectedUsers.size}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Отмена
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || selectedUsers.size === 0}
					>
						{isSubmitting
							? "Добавление..."
							: `Добавить (${selectedUsers.size})`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
