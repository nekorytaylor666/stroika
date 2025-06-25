import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function BackToApp() {
	return (
		<div className="flex w-full items-center justify-between gap-2">
			<Button className="w-fit" size="xs" variant="outline" asChild>
				<Link to="/">
					<ChevronLeft className="size-4" />
					Back to app
				</Link>
			</Button>
			<ThemeToggle />
		</div>
	);
}
