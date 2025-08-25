"use client";

import { ConstructionCreateTaskDrawer } from "@/components/common/construction/construction-create-task-drawer";
import { MobileNavTabs } from "./mobile-nav-tabs";

interface MobileNavigationProps {
	children: React.ReactNode;
}

export function MobileNavigation({ children }: MobileNavigationProps) {
	return (
		<>
			<div
				className="min-h-svh lg:pb-0"
				style={{
					paddingTop: "env(safe-area-inset-top, 0px)",
					paddingBottom: "env(safe-area-inset-bottom, 0px)",
				}}
			>
				{children}
			</div>
			<MobileNavTabs />
			<ConstructionCreateTaskDrawer />
		</>
	);
}
