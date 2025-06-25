'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

interface LabelType {
    _id: string;
    name: string;
    color: string;
}

interface ConstructionLabelBadgeProps {
    labels: LabelType[];
}

export function ConstructionLabelBadge({ labels }: ConstructionLabelBadgeProps) {
    if (!labels || labels.length === 0) return null;

    if (labels.length === 1) {
        const label = labels[0];
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5"
                    style={{
                        borderColor: label.color,
                        color: label.color,
                        backgroundColor: `${label.color}10`,
                    }}
                >
                    {label.name}
                </Badge>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
        >
            <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
                style={{
                    borderColor: labels[0].color,
                    color: labels[0].color,
                    backgroundColor: `${labels[0].color}10`,
                }}
            >
                {labels[0].name}
            </Badge>
            {labels.length > 1 && (
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 ml-1"
                >
                    +{labels.length - 1}
                </Badge>
            )}
        </motion.div>
    );
}