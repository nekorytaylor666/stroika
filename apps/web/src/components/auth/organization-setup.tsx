"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { useActiveOrganization, useListOrganizations } from "@/hooks/use-better-auth";
import { api } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Building2, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function OrganizationSetup() {
	const { isAuthenticated } = useConvexAuth();
	const navigate = useNavigate();
	const [inviteCode, setInviteCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [organizationName, setOrganizationName] = useState("");
	const [organizationSlug, setOrganizationSlug] = useState("");
	const [organizationDescription, setOrganizationDescription] = useState("");

	const { data: organizations, isPending: isLoadingOrgs } = useListOrganizations();
	const { data: activeOrg } = useActiveOrganization();
	const acceptInvite = useMutation(api.invites.acceptInvite);
	const joinAsOwner = useMutation(api.quickSetup.joinAsOwner);
	const debugAuth = useQuery(api.debug.checkAuth);

	// If user has organizations, redirect to the active one or first one
	useEffect(() => {
		if (organizations && organizations.length > 0) {
			const orgToUse = activeOrg || organizations[0];
			// Set as active if not already
			if (!activeOrg && organizations[0]) {
				authClient.organization.setActive({
					organizationId: organizations[0].id
				}).then(() => {
					navigate({
						to: "/construction/$orgId/inbox",
						params: { orgId: organizations[0].id },
					});
				});
			} else if (activeOrg) {
				navigate({
					to: "/construction/$orgId/inbox",
					params: { orgId: activeOrg.id },
				});
			}
		}
	}, [organizations, activeOrg, navigate]);

	const handleJoinWithCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteCode.trim()) return;

		setIsJoining(true);
		try {
			const result = await acceptInvite({ inviteCode: inviteCode.trim() });
			if (result.organizationId) {
				navigate({
					to: "/construction/$orgId/inbox",
					params: { orgId: result.organizationId },
				});
			}
		} catch (error) {
			console.error("Failed to join organization:", error);
			alert("Invalid invite code or invite has expired");
		} finally {
			setIsJoining(false);
		}
	};

	const handleQuickSetup = async () => {
		setIsJoining(true);
		try {
			const result = await joinAsOwner();
			console.log("Quick setup result:", result);

			// Force a refresh of organizations query
			window.location.href = `/construction/${result.organizationSlug || "stroycomplex"}/construction-tasks`;
		} catch (error) {
			console.error("Failed to join as owner:", error);
			alert("Failed to setup organization. Please try again.");
		} finally {
			setIsJoining(false);
		}
	};

	const handleCreateOrganization = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!organizationName.trim()) {
			toast.error("Введите название организации");
			return;
		}

		setIsJoining(true);
		try {
			// Generate slug from name if not provided
			const slug = organizationSlug.trim() || 
				organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
			
			// Create organization using Better Auth client
			const result = await authClient.organization.create({
				name: organizationName.trim(),
				slug: slug,
				metadata: {
					description: organizationDescription.trim(),
				}
			});
			
			if (result.error) {
				throw new Error(result.error.message || "Failed to create organization");
			}
			
			// Set the new organization as active
			await authClient.organization.setActive({
				organizationId: result.data.id
			});
			
			toast.success("Организация создана успешно!");
			
			// Navigate to the new organization
			navigate({
				to: "/construction/$orgId/inbox",
				params: { orgId: result.data.id },
			});
		} catch (error) {
			console.error("Failed to create organization:", error);
			toast.error("Не удалось создать организацию. Попробуйте еще раз.");
		} finally {
			setIsJoining(false);
		}
	};

	// Auto-generate slug from name
	const handleNameChange = (value: string) => {
		setOrganizationName(value);
		if (!organizationSlug || organizationSlug === organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
			setOrganizationSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
		}
	};

	if (!isAuthenticated || isLoadingOrgs) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>
						{showCreateForm ? "Создать организацию" : "Добро пожаловать в Stroika"}
					</CardTitle>
					<CardDescription>
						{showCreateForm 
							? "Заполните данные для создания новой организации" 
							: "Присоединитесь к организации или создайте новую"}
					</CardDescription>
					{debugAuth && !showCreateForm && (
						<div className="mt-2 text-gray-500 text-xs">
							Debug: {JSON.stringify(debugAuth, null, 2)}
						</div>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{showCreateForm ? (
						<>
							<form onSubmit={handleCreateOrganization} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="orgName">Название организации*</Label>
									<Input
										id="orgName"
										type="text"
										placeholder="ООО СтройКомплекс"
										value={organizationName}
										onChange={(e) => handleNameChange(e.target.value)}
										disabled={isJoining}
										required
									/>
								</div>
								
								<div className="space-y-2">
									<Label htmlFor="orgSlug">URL идентификатор</Label>
									<Input
										id="orgSlug"
										type="text"
										placeholder="stroycomplex"
										value={organizationSlug}
										onChange={(e) => setOrganizationSlug(e.target.value)}
										disabled={isJoining}
										pattern="[a-z0-9-]+"
										title="Только маленькие буквы, цифры и дефисы"
									/>
									<p className="text-muted-foreground text-xs">
										Будет использоваться в URL: /construction/{organizationSlug || "your-org"}/...
									</p>
								</div>
								
								<div className="space-y-2">
									<Label htmlFor="orgDesc">Описание</Label>
									<Textarea
										id="orgDesc"
										placeholder="Строительная компания полного цикла"
										value={organizationDescription}
										onChange={(e) => setOrganizationDescription(e.target.value)}
										disabled={isJoining}
										rows={3}
									/>
								</div>
								
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={() => setShowCreateForm(false)}
										disabled={isJoining}
									>
										Отмена
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={isJoining || !organizationName.trim()}
									>
										{isJoining ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Создание...
											</>
										) : (
											<>
												<Building2 className="mr-2 h-4 w-4" />
												Создать
											</>
										)}
									</Button>
								</div>
							</form>
						</>
					) : (
						<>
					<form onSubmit={handleJoinWithCode} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="inviteCode">Invite Code</Label>
							<Input
								id="inviteCode"
								type="text"
								placeholder="Введите код приглашения"
								value={inviteCode}
								onChange={(e) => setInviteCode(e.target.value)}
								disabled={isJoining}
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isJoining || !inviteCode.trim()}
						>
							{isJoining ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Joining...
								</>
							) : (
								"Join Organization"
							)}
						</Button>
					</form>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-2 text-muted-foreground">Или</span>
						</div>
					</div>

					<Button
						variant="outline"
						className="w-full"
						onClick={() => setShowCreateForm(true)}
						disabled={isJoining}
					>
						<Plus className="mr-2 h-4 w-4" />
						Создать новую организацию
					</Button>

					<Button
						variant="ghost"
						className="w-full"
						onClick={handleQuickSetup}
						disabled={isJoining}
					>
						{isJoining ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Настройка...
							</>
						) : (
							"Быстрая настройка (Демо)"
						)}
					</Button>

					<p className="text-center text-muted-foreground text-xs">
						Демо коды приглашения: DEMO1234, DEMO5678
					</p>
					</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
