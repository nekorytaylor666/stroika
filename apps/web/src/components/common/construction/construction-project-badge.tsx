"use client";

import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";
import { motion } from "motion/react";

interface ProjectType {
	_id: string;
	name: string;
}

interface ConstructionProjectBadgeProps {
	project: ProjectType;
}

export function ConstructionProjectBadge({
	project,
}: ConstructionProjectBadgeProps) {
	if (!project) return null;

	return (
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.2 }}
		>
			<Badge
				variant="outline"
				className="flex h-5 items-center gap-1 px-1.5 py-0 text-[10px]"
			>
				<Building className="h-3 w-3" />
				{project.name}
			</Badge>
		</motion.div>
	);
}
