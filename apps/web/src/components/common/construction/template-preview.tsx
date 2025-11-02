"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, FileText } from "lucide-react";

interface TemplatePreviewProps {
	template: any;
	className?: string;
}

export function TemplatePreview({ template, className }: TemplatePreviewProps) {
	if (!template) return null;

	return (
		<Card className={className}>
			<div className="space-y-4 p-4">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<h3 className="flex items-center gap-2 font-medium">
							<FileText className="h-4 w-4" />
							Предпросмотр шаблона
						</h3>
						<p className="text-muted-foreground text-sm">{template.name}</p>
					</div>
					{template.isPublic && (
						<Badge variant="secondary" className="text-xs">
							Публичный
						</Badge>
					)}
				</div>

				<Separator />

				<div className="space-y-3">
					<div>
						<h4 className="mb-1 font-medium text-sm">Основная задача</h4>
						<div className="space-y-2 pl-4">
							<div>
								<span className="text-muted-foreground text-sm">
									Название:{" "}
								</span>
								<span className="text-sm">{template.defaultTitle}</span>
							</div>
							{template.defaultDescription && (
								<div>
									<span className="text-muted-foreground text-sm">
										Описание:{" "}
									</span>
									<span className="text-sm">{template.defaultDescription}</span>
								</div>
							)}
						</div>
					</div>

					{template.subtasksParsed && template.subtasksParsed.length > 0 && (
						<>
							<Separator />
							<div>
								<h4 className="mb-2 font-medium text-sm">
									Подзадачи ({template.subtasksParsed.length})
								</h4>
								<ScrollArea className="h-[200px]">
									<div className="space-y-2">
										{template.subtasksParsed
											.sort((a: any, b: any) => a.order - b.order)
											.map((subtask: any, index: number) => (
												<div
													key={subtask.id}
													className="flex items-start gap-2 pl-4"
												>
													<ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
													<div className="flex-1">
														<p className="text-sm">{subtask.title}</p>
														{subtask.description && (
															<p className="text-muted-foreground text-xs">
																{subtask.description}
															</p>
														)}
													</div>
												</div>
											))}
									</div>
								</ScrollArea>
							</div>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}
