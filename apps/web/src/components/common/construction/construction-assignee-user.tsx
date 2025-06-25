"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface UserType {
	_id: string;
	name: string;
	email: string;
	avatarUrl: string;
}

interface ConstructionAssigneeUserProps {
	user: UserType | null;
}

export function ConstructionAssigneeUser({
	user,
}: ConstructionAssigneeUserProps) {
	const [open, setOpen] = useState(false);

	if (!user) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						className="size-6 rounded-full text-muted-foreground"
						variant="ghost"
						size="icon"
					>
						<UserIcon className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-0" align="end">
					<Command>
						<CommandInput placeholder="Назначить исполнителя..." />
						<CommandList>
							<CommandEmpty>Пользователи не найдены.</CommandEmpty>
							<CommandGroup>
								<CommandItem className="text-muted-foreground">
									Назначение исполнителя в разработке
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.1 }}>
			<Avatar className="size-6">
				<AvatarImage src={user.avatarUrl} alt={user.name} />
				<AvatarFallback className="text-[10px]">
					{user.name
						.split(" ")
						.map((name) => name[0])
						.join("")
						.toUpperCase()}
				</AvatarFallback>
			</Avatar>
		</motion.div>
	);
}
