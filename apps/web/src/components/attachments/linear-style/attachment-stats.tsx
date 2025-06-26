"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileImage, FileText, FileVideo, Files } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

interface AttachmentStatsProps {
	attachments: any[];
	className?: string;
}

export function AttachmentStats({
	attachments,
	className,
}: AttachmentStatsProps) {
	const stats = useMemo(() => {
		const totalSize = attachments.reduce(
			(sum, att) => sum + (att.fileSize || 0),
			0,
		);

		const byType = attachments.reduce(
			(acc, att) => {
				const type = getFileType(att.fileType);
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			total: attachments.length,
			totalSize,
			images: byType.image || 0,
			videos: byType.video || 0,
			documents: byType.document || 0,
			other: byType.other || 0,
		};
	}, [attachments]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	};

	const statCards = [
		{
			label: "Всего файлов",
			value: stats.total,
			icon: Files,
			color: "text-blue-600",
			bg: "bg-blue-100",
		},
		{
			label: "Изображения",
			value: stats.images,
			icon: FileImage,
			color: "text-green-600",
			bg: "bg-green-100",
		},
		{
			label: "Видео",
			value: stats.videos,
			icon: FileVideo,
			color: "text-purple-600",
			bg: "bg-purple-100",
		},
		{
			label: "Документы",
			value: stats.documents,
			icon: FileText,
			color: "text-orange-600",
			bg: "bg-orange-100",
		},
	];

	return (
		<div
			className={cn("mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4", className)}
		>
			{statCards.map((stat, index) => (
				<motion.div
					key={stat.label}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.05 }}
				>
					<Card className="overflow-hidden border-muted">
						<div className="p-4">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-muted-foreground text-xs">{stat.label}</p>
									<motion.p
										className="font-semibold text-2xl"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{
											type: "spring",
											stiffness: 200,
											damping: 15,
											delay: index * 0.05 + 0.1,
										}}
									>
										{stat.value}
									</motion.p>
								</div>
								<div
									className={cn(
										"flex h-10 w-10 items-center justify-center rounded-lg",
										stat.bg,
									)}
								>
									<stat.icon className={cn("h-5 w-5", stat.color)} />
								</div>
							</div>
						</div>
						<motion.div
							className="h-1 bg-muted"
							initial={{ scaleX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
							style={{ transformOrigin: "left" }}
						>
							<motion.div
								className={cn("h-full", stat.bg)}
								initial={{ scaleX: 0 }}
								animate={{
									scaleX: stats.total > 0 ? stat.value / stats.total : 0,
								}}
								transition={{ delay: index * 0.05 + 0.4, duration: 0.5 }}
								style={{ transformOrigin: "left" }}
							/>
						</motion.div>
					</Card>
				</motion.div>
			))}

			{/* Total Size Card */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.25 }}
				className="col-span-2 lg:col-span-4"
			>
				<Card className="overflow-hidden border-muted">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
								<Files className="h-5 w-5 text-gray-600" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">
									Общий размер файлов
								</p>
								<p className="font-semibold text-lg">
									{formatFileSize(stats.totalSize)}
								</p>
							</div>
						</div>
					</div>
				</Card>
			</motion.div>
		</div>
	);
}

function getFileType(mimeType: string): string {
	if (!mimeType) return "other";
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (
		mimeType.includes("pdf") ||
		mimeType.includes("document") ||
		mimeType.includes("msword") ||
		mimeType.includes("ms-excel") ||
		mimeType.includes("ms-powerpoint") ||
		mimeType.includes("text/")
	) {
		return "document";
	}
	return "other";
}
