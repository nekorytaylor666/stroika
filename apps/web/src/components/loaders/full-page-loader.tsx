"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface FullPageLoaderProps {
	className?: string;
	text?: string;
}

export default function FullPageLoader({
	className,
	text = "Загрузка...",
}: FullPageLoaderProps) {
	return (
		<div
			className={cn(
				"flex min-h-[400px] flex-col items-center justify-center",
				className,
			)}
		>
			<motion.div
				className="relative h-16 w-16"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				<motion.div
					className="absolute inset-0 rounded-full border-4 border-muted"
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: "reverse",
					}}
				/>
				<motion.div
					className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
					animate={{ rotate: 360 }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						ease: "linear",
					}}
				/>
			</motion.div>
			{text && (
				<motion.p
					className="mt-4 text-muted-foreground text-sm"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					{text}
				</motion.p>
			)}
		</div>
	);
}
