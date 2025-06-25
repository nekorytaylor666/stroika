"use client";

import { teams } from "@/mock-data/teams";
import TeamLine from "./team-line";

export default function Teams() {
	return (
		<div className="w-full">
			<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
				<div className="w-[70%] sm:w-[50%] md:w-[45%] lg:w-[40%]">Name</div>
				<div className="hidden sm:block sm:w-[20%] md:w-[15%]">Membership</div>
				<div className="hidden sm:block sm:w-[20%] md:w-[15%]">Identifier</div>
				<div className="w-[30%] sm:w-[20%] md:w-[15%]">Members</div>
				<div className="hidden sm:block sm:w-[20%] md:w-[15%]">Projects</div>
			</div>

			<div className="w-full">
				{teams.map((team) => (
					<TeamLine key={team.id} team={team} />
				))}
			</div>
		</div>
	);
}
