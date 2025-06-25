import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthActions } from "@convex-dev/auth/react";
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
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function UserProfile() {
	const user = useCurrentUser();
	const { signOut } = useAuthActions();

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
						<span className="text-xs text-muted-foreground">{user.email}</span>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.name}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/lndev-ui/settings/account">
						<User className="mr-2 h-4 w-4" />
						<span>Профиль</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link to="/lndev-ui/settings/general">
						<Settings className="mr-2 h-4 w-4" />
						<span>Настройки</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-red-600"
					onSelect={() => void signOut()}
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Выйти</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}