"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
	RiBox3Fill,
	RiLinkedinFill,
	RiThreadsFill,
	RiTwitterXFill,
} from "@remixicon/react";
import { ExternalLink, HelpCircle, Keyboard, Search } from "lucide-react";
import { CircleHelp, Clock, FileText, MessageSquare, Zap } from "lucide-react";
import * as React from "react";

export default function HelpButton() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<SidebarMenuButton className="flex items-center justify-center">
					<CircleHelp size={16} />
					<span>Справка</span>
				</SidebarMenuButton>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Нужна помощь?</DialogTitle>
					<DialogDescription>
						Найдите ответы и узнайте больше о том, как использовать нашу
						платформу.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Поиск справки..."
							className="pl-8"
						/>
					</div>
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Быстрые ссылки</h4>
						<div className="space-y-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start"
							>
								<FileText className="h-4 w-4" />
								Руководство по началу работы
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start"
							>
								<MessageSquare className="h-4 w-4" />
								Связаться с поддержкой
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start"
							>
								<Clock className="h-4 w-4" />
								Что нового
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start"
							>
								<Zap className="h-4 w-4" />
								Горячие клавиши
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
