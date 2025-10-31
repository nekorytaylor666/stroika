"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/store/filter-store";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Filter, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function AttachmentFilterPopover() {
	const [open, setOpen] = useState(false);
	const {
		attachmentUploaderId,
		attachmentDateRange,
		setAttachmentUploaderId,
		setAttachmentDateRange,
		clearAttachmentFilters,
	} = useFilterStore();

	const users = useQuery(api.users.getAll);

	const hasActiveFilters = attachmentUploaderId || attachmentDateRange;

	const handleClearFilters = () => {
		clearAttachmentFilters();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"relative h-9 px-3",
						hasActiveFilters && "border-primary text-primary",
					)}
				>
					<Filter className="mr-2 h-4 w-4" />
					Фильтры
					<AnimatePresence>
						{hasActiveFilters && (
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								exit={{ scale: 0 }}
								className="-right-1 -top-1 absolute h-2 w-2 rounded-full bg-primary"
							/>
						)}
					</AnimatePresence>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80 p-0"
				align="end"
				onInteractOutside={(e) => {
					if (e.defaultPrevented) {
						e.preventDefault();
					}
				}}
			>
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
				>
					<div className="border-b p-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-sm">Фильтры</h4>
							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearFilters}
									className="h-7 px-2 text-muted-foreground hover:text-foreground"
								>
									<X className="mr-1 h-3 w-3" />
									Сбросить
								</Button>
							)}
						</div>
					</div>

					<div className="space-y-4 p-4">
						{/* Uploader Filter */}
						<div className="space-y-2">
							<label className="font-medium text-muted-foreground text-xs">
								Загрузил
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start text-left"
									>
										{attachmentUploaderId ? (
											<>
												<User className="mr-2 h-4 w-4" />
												<span className="truncate">
													{users?.find((u) => u.id === attachmentUploaderId)
														?.name || "Пользователь"}
												</span>
											</>
										) : (
											<>
												<User className="mr-2 h-4 w-4 text-muted-foreground" />
												<span className="text-muted-foreground">
													Выберите пользователя
												</span>
											</>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[280px] p-2" align="start">
									<div className="space-y-1">
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() => setAttachmentUploaderId(null)}
										>
											<X className="mr-2 h-4 w-4" />
											Все пользователи
										</Button>
										{users?.map((user) => (
											<Button
												key={user.id}
												variant="ghost"
												size="sm"
												className={cn(
													"w-full justify-start",
													attachmentUploaderId === user.id &&
														"bg-muted font-medium",
												)}
												onClick={() => {
													setAttachmentUploaderId(user.id);
												}}
											>
												<User className="mr-2 h-4 w-4" />
												{user.name}
											</Button>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						{/* Date Range Filter */}
						<div className="space-y-2">
							<label className="font-medium text-muted-foreground text-xs">
								Период загрузки
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start text-left"
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{attachmentDateRange?.from ? (
											attachmentDateRange.to ? (
												<>
													{format(attachmentDateRange.from, "d MMM", {
														locale: ru,
													})}{" "}
													-{" "}
													{format(attachmentDateRange.to, "d MMM yyyy", {
														locale: ru,
													})}
												</>
											) : (
												format(attachmentDateRange.from, "d MMM yyyy", {
													locale: ru,
												})
											)
										) : (
											<span className="text-muted-foreground">
												Выберите период
											</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										initialFocus
										mode="range"
										selected={attachmentDateRange}
										onSelect={setAttachmentDateRange}
										locale={ru}
										numberOfMonths={2}
									/>
									{attachmentDateRange && (
										<div className="border-t p-3">
											<Button
												variant="ghost"
												size="sm"
												className="w-full"
												onClick={() => setAttachmentDateRange(undefined)}
											>
												<X className="mr-2 h-4 w-4" />
												Очистить даты
											</Button>
										</div>
									)}
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</motion.div>
			</PopoverContent>
		</Popover>
	);
}
