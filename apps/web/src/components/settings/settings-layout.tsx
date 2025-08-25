import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { Bell, Settings, User } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { NotificationSettings } from "./notification-settings";
import { ProfileSettings } from "./profile-settings";

export function SettingsLayout() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-4xl p-6">
				<div className="mb-6">
					<Link to="/">
						<Button variant="ghost" size="sm" className="mb-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Назад
						</Button>
					</Link>
					<h1 className="font-bold text-3xl">Настройки</h1>
					<p className="mt-2 text-muted-foreground">
						Управляйте настройками вашего профиля и уведомлений
					</p>
				</div>

				<Tabs defaultValue="profile" className="space-y-6">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="profile" className="flex items-center gap-2">
							<User className="h-4 w-4" />
							Профиль
						</TabsTrigger>
						<TabsTrigger
							value="notifications"
							className="flex items-center gap-2"
						>
							<Bell className="h-4 w-4" />
							Уведомления
						</TabsTrigger>
					</TabsList>

					<TabsContent value="profile" className="space-y-4">
						<ProfileSettings />
					</TabsContent>

					<TabsContent value="notifications" className="space-y-4">
						<NotificationSettings />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
