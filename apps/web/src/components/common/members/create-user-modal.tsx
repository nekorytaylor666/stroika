import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Id } from "@stroika/backend";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	organizationId: Id<"organizations">;
}

export default function CreateUserModal({
	isOpen,
	onClose,
	organizationId,
}: CreateUserModalProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [selectedRoleId, setSelectedRoleId] = useState<Id<"roles"> | null>(
		null,
	);
	const [selectedTeamIds, setSelectedTeamIds] = useState<Id<"teams">[]>([]);
	const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [generatedPassword, setGeneratedPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Fetch roles
	const roles = useQuery(api.roles.getOrganizationRoles, { organizationId });

	// Fetch teams
	const teams = useQuery(api.teams.list, { organizationId });

	// Mutation to create user
	const createUser = useMutation(api.passwordReset.createUserWithPassword);

	const handleCreateUser = async () => {
		if (!name || !email || !selectedRoleId) {
			toast.error("Пожалуйста, заполните все обязательные поля");
			return;
		}

		setIsLoading(true);

		try {
			const result = await createUser({
				name,
				email,
				roleId: selectedRoleId,
				teamIds: selectedTeamIds,
				sendWelcomeEmail,
			});

			setGeneratedPassword(result.temporaryPassword);
			toast.success("Пользователь успешно создан");

			// If not sending email, show password for manual sharing
			if (!sendWelcomeEmail) {
				setShowPassword(true);
			} else {
				// Reset form and close
				setTimeout(() => {
					handleClose();
				}, 2000);
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при создании пользователя",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyPassword = () => {
		navigator.clipboard.writeText(generatedPassword);
		toast.success("Пароль скопирован в буфер обмена");
	};

	const handleClose = () => {
		setName("");
		setEmail("");
		setSelectedRoleId(null);
		setSelectedTeamIds([]);
		setSendWelcomeEmail(true);
		setShowPassword(false);
		setGeneratedPassword("");
		onClose();
	};

	const toggleTeam = (teamId: Id<"teams">) => {
		setSelectedTeamIds((prev) =>
			prev.includes(teamId)
				? prev.filter((id) => id !== teamId)
				: [...prev, teamId],
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Создать нового пользователя</DialogTitle>
					<DialogDescription>
						Создайте учетную запись для нового члена команды. Временный пароль
						будет сгенерирован автоматически.
					</DialogDescription>
				</DialogHeader>

				{!generatedPassword ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Имя *</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Иван Иванов"
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="ivan@example.com"
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Роль *</Label>
							<Select
								value={selectedRoleId || ""}
								onValueChange={(value) =>
									setSelectedRoleId(value as Id<"roles">)
								}
								disabled={isLoading}
							>
								<SelectTrigger id="role">
									<SelectValue placeholder="Выберите роль" />
								</SelectTrigger>
								<SelectContent>
									{roles?.map((role) => (
										<SelectItem key={role._id} value={role._id}>
											{role.displayName || role.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{teams && teams.length > 0 && (
							<div className="space-y-2">
								<Label>Команды</Label>
								<div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
									{teams.map((team) => (
										<div key={team._id} className="flex items-center space-x-2">
											<Checkbox
												id={team._id}
												checked={selectedTeamIds.includes(team._id)}
												onCheckedChange={() => toggleTeam(team._id)}
												disabled={isLoading}
											/>
											<Label
												htmlFor={team._id}
												className="cursor-pointer font-normal text-sm"
											>
												{team.name}
											</Label>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="flex items-center space-x-2">
							<Checkbox
								id="sendEmail"
								checked={sendWelcomeEmail}
								onCheckedChange={(checked) =>
									setSendWelcomeEmail(checked as boolean)
								}
								disabled={isLoading}
							/>
							<Label
								htmlFor="sendEmail"
								className="cursor-pointer font-normal text-sm"
							>
								Отправить приветственное письмо с паролем
							</Label>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-lg border border-green-200 bg-green-50 p-4">
							<p className="mb-2 font-medium text-green-800 text-sm">
								Пользователь успешно создан!
							</p>
							<p className="text-green-700 text-sm">
								{sendWelcomeEmail
									? `Письмо с инструкциями отправлено на ${email}`
									: "Поделитесь этими данными с новым пользователем:"}
							</p>
						</div>

						{!sendWelcomeEmail && (
							<div className="space-y-3">
								<div className="space-y-1">
									<Label className="text-sm">Email</Label>
									<div className="rounded bg-gray-50 p-2 font-mono text-sm">
										{email}
									</div>
								</div>

								<div className="space-y-1">
									<Label className="text-sm">Временный пароль</Label>
									<div className="flex items-center space-x-2">
										<div className="flex-1 rounded bg-gray-50 p-2 font-mono text-sm">
											{showPassword ? generatedPassword : "••••••••••••"}
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleCopyPassword}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>

								<p className="text-muted-foreground text-xs">
									Пользователь должен будет изменить пароль при первом входе в
									систему.
								</p>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					{!generatedPassword ? (
						<>
							<Button
								variant="outline"
								onClick={handleClose}
								disabled={isLoading}
							>
								Отмена
							</Button>
							<Button onClick={handleCreateUser} disabled={isLoading}>
								{isLoading ? "Создание..." : "Создать пользователя"}
							</Button>
						</>
					) : (
						<Button onClick={handleClose}>Закрыть</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
