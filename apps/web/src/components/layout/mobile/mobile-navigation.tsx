"use client";

import { MobileNavTabs } from "./mobile-nav-tabs";
import { ConstructionCreateTaskDrawer } from "@/components/common/construction/construction-create-task-drawer";

interface MobileNavigationProps {
	children: React.ReactNode;
}

export function MobileNavigation({ children }: MobileNavigationProps) {
	return (
		<>
			<div className="min-h-svh pb-16 lg:pb-0">
				{children}
			</div>
			<MobileNavTabs />
			<ConstructionCreateTaskDrawer />
		</>
	);
}