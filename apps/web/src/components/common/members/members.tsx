"use client";

import MemberLine from "./member-line";

export default function Members() {
	return (
		<div className="w-full">
			<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
				<div className="w-[70%] md:w-[60%] lg:w-[55%]">Name</div>
				<div className="w-[30%] md:w-[20%] lg:w-[15%]">Status</div>
				<div className="hidden w-[15%] lg:block">Joined</div>
				<div className="hidden w-[30%] md:block md:w-[20%] lg:w-[15%]">
					Teams
				</div>
			</div>

			<div className="w-full">
				{/* {users.map((user) => (
					<MemberLine key={user.id} user={user} />
				))} */}
			</div>
		</div>
	);
}
