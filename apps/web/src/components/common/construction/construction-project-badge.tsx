'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Building } from 'lucide-react';

interface ProjectType {
    _id: string;
    name: string;
}

interface ConstructionProjectBadgeProps {
    project: ProjectType;
}

export function ConstructionProjectBadge({ project }: ConstructionProjectBadgeProps) {
    if (!project) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
        >
            <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-1"
            >
                <Building className="w-3 h-3" />
                {project.name}
            </Badge>
        </motion.div>
    );
}