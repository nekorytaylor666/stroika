import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authClient } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";

export function UserProfile() {
	const user = useCurrentUser();

	if (!user) return null;

	const initials = user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="w-full justify-start gap-2 px-2">
					<Avatar className="h-8 w-8">
						<AvatarImage src={user.avatarUrl} alt={user.name} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-start text-sm">
						<span className="font-medium">{user.name}</span>
						<span className="text-muted-foreground text-xs">{user.email}</span>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="font-medium text-sm leading-none">{user.name}</p>
						<p className="text-muted-foreground text-xs leading-none">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/settings">
						<Settings className="mr-2 h-4 w-4" />
						<span>Настройки</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-red-600"
					onSelect={() => void authClient.signOut()}
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Выйти</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
