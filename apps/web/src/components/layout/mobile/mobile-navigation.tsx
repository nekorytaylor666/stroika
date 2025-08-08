"use client";

import { ConstructionCreateTaskDrawer } from "@/components/common/construction/construction-create-task-drawer";
import { MobileNavTabs } from "./mobile-nav-tabs";

interface MobileNavigationProps {
	children: React.ReactNode;
}

export function MobileNavigation({ children }: MobileNavigationProps) {
	return (
		<>
			<div className="min-h-svh pb-16 lg:pb-0">{children}</div>
			<MobileNavTabs />
			<ConstructionCreateTaskDrawer />
		</>
	);
}
