"use client";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface AIAgentToggleButtonProps {
	onClick: () => void;
	isOpen: boolean;
}

export function AIAgentToggleButton({
	onClick,
	isOpen,
}: AIAgentToggleButtonProps) {
	if (isOpen) return null;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						className="fixed right-6 bottom-6 z-40"
					>
						<Button
							size="icon"
							onClick={onClick}
							className="group relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
						>
							{/* Animated background pulse */}
							<motion.div
								className="absolute inset-0 bg-white/20"
								animate={{
									scale: [1, 1.5, 1],
									opacity: [0.5, 0, 0.5],
								}}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							/>

							{/* Icon */}
							<motion.div
								animate={{
									rotate: [0, 360],
								}}
								transition={{
									duration: 20,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							>
								<Sparkles className="h-6 w-6 text-white" />
							</motion.div>

							{/* Notification badge (optional - can be activated later) */}
							{/* <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-background" /> */}
						</Button>
					</motion.div>
				</TooltipTrigger>
				<TooltipContent side="left" className="font-medium">
					<p>Открыть AI Агент</p>
					<p className="text-muted-foreground text-xs">
						Помощник для работы с задачами
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
