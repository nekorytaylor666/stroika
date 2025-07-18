"use client";

import { CheckCircle2, Circle, CircleDot, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	EditableDate,
	EditableNumber,
	EditableSelect,
	EditableText,
	EditableTextarea,
	type EditableUser,
	EditableUserSelect,
	type SelectOption,
} from "./index";

// Example usage of all editable components
export function EditableComponentsExample() {
	// Sample data
	const [projectName, setProjectName] = useState("Жилой комплекс Солнечный");
	const [client, setClient] = useState("ООО Стройинвест");
	const [location, setLocation] = useState("г. Москва, ул. Ленина, 123");
	const [notes, setNotes] = useState(
		"Проект включает строительство 3 корпусов по 25 этажей каждый",
	);
	const [status, setStatus] = useState("in_progress");
	const [priority, setPriority] = useState("high");
	const [contractValue, setContractValue] = useState(150000000);
	const [percentComplete, setPercentComplete] = useState(35);
	const [startDate, setStartDate] = useState("2024-01-15T00:00:00.000Z");
	const [endDate, setEndDate] = useState("2025-06-30T00:00:00.000Z");
	const [leadId, setLeadId] = useState("user1");
	const [teamIds, setTeamIds] = useState(["user2", "user3", "user4"]);

	// Options for selects
	const statusOptions: SelectOption[] = [
		{
			value: "not_started",
			label: "Не начато",
			icon: <Circle className="h-3.5 w-3.5" />,
			color: "#6B7280",
		},
		{
			value: "in_progress",
			label: "В работе",
			icon: <CircleDot className="h-3.5 w-3.5" />,
			color: "#EAB308",
		},
		{
			value: "on_hold",
			label: "Приостановлено",
			icon: <Clock className="h-3.5 w-3.5" />,
			color: "#3B82F6",
		},
		{
			value: "completed",
			label: "завершено",
			icon: <CheckCircle2 className="h-3.5 w-3.5" />,
			color: "#10B981",
		},
	];

	const priorityOptions: SelectOption[] = [
		{ value: "low", label: "Низкий" },
		{ value: "medium", label: "Средний" },
		{ value: "high", label: "Высокий" },
		{ value: "critical", label: "Критический" },
	];

	const projectTypeOptions: SelectOption[] = [
		{ value: "residential", label: "Жилое" },
		{ value: "commercial", label: "Коммерческое" },
		{ value: "industrial", label: "Промышленное" },
		{ value: "infrastructure", label: "Инфраструктура" },
	];

	const users: EditableUser[] = [
		{
			_id: "user1",
			name: "Иван Иванов",
			email: "ivan@example.com",
			avatarUrl: "/avatars/1.jpg",
		},
		{
			_id: "user2",
			name: "Петр Петров",
			email: "petr@example.com",
			avatarUrl: "/avatars/2.jpg",
		},
		{
			_id: "user3",
			name: "Мария Сидорова",
			email: "maria@example.com",
			avatarUrl: "/avatars/3.jpg",
		},
		{
			_id: "user4",
			name: "Елена Козлова",
			email: "elena@example.com",
			avatarUrl: "/avatars/4.jpg",
		},
		{
			_id: "user5",
			name: "Алексей Смирнов",
			email: "alex@example.com",
			avatarUrl: "/avatars/5.jpg",
		},
	];

	// Mock save functions with simulated API calls
	const simulateSave = async (value: any, field: string) => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Simulate random errors for demo
		if (Math.random() > 0.8) {
			throw new Error("Не удалось сохранить изменения");
		}

		toast.success(`${field} успешно обновлено`);
		return value;
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8 p-6">
			<h2 className="mb-6 font-bold text-2xl">
				Примеры редактируемых компонентов
			</h2>

			{/* Text Fields */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Текстовые поля</h3>
				<div className="grid gap-4">
					<div>
						<label className="text-muted-foreground text-sm">
							Название проекта
						</label>
						<EditableText
							value={projectName}
							onSave={async (value) => {
								setProjectName(await simulateSave(value, "Название проекта"));
							}}
							placeholder="Введите название проекта"
							className="font-semibold text-lg"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">Клиент</label>
						<EditableText
							value={client}
							onSave={async (value) => {
								setClient(await simulateSave(value, "Клиент"));
							}}
							placeholder="Введите название клиента"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">
							Местоположение
						</label>
						<EditableText
							value={location}
							onSave={async (value) => {
								setLocation(await simulateSave(value, "Местоположение"));
							}}
							placeholder="Введите адрес"
						/>
					</div>
				</div>
			</div>

			{/* Textarea */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Многострочный текст</h3>
				<div>
					<label className="text-muted-foreground text-sm">Примечания</label>
					<EditableTextarea
						value={notes}
						onSave={async (value) => {
							setNotes(await simulateSave(value, "Примечания"));
						}}
						placeholder="Добавьте примечания к проекту"
						rows={4}
					/>
				</div>
			</div>

			{/* Selects */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Выпадающие списки</h3>
				<div className="grid gap-4 md:grid-cols-3">
					<div>
						<label className="text-muted-foreground text-sm">Статус</label>
						<EditableSelect
							value={status}
							options={statusOptions}
							onSave={async (value) => {
								setStatus(await simulateSave(value, "Статус"));
							}}
							placeholder="Выберите статус"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">Приоритет</label>
						<EditableSelect
							value={priority}
							options={priorityOptions}
							onSave={async (value) => {
								setPriority(await simulateSave(value, "Приоритет"));
							}}
							placeholder="Выберите приоритет"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">Тип проекта</label>
						<EditableSelect
							value="residential"
							options={projectTypeOptions}
							onSave={async (value) => {
								await simulateSave(value, "Тип проекта");
							}}
							placeholder="Выберите тип"
						/>
					</div>
				</div>
			</div>

			{/* Numbers */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Числовые поля</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="text-muted-foreground text-sm">
							Стоимость контракта
						</label>
						<EditableNumber
							value={contractValue}
							onSave={async (value) => {
								setContractValue(
									await simulateSave(value, "Стоимость контракта"),
								);
							}}
							format={(value) =>
								new Intl.NumberFormat("ru-RU", {
									style: "currency",
									currency: "RUB",
									minimumFractionDigits: 0,
								}).format(value)
							}
							min={0}
							step={1000000}
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">
							Процент выполнения
						</label>
						<EditableNumber
							value={percentComplete}
							onSave={async (value) => {
								setPercentComplete(
									await simulateSave(value, "Процент выполнения"),
								);
							}}
							suffix="%"
							min={0}
							max={100}
							step={5}
						/>
					</div>
				</div>
			</div>

			{/* Dates */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Даты</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="text-muted-foreground text-sm">Дата начала</label>
						<EditableDate
							value={startDate}
							onSave={async (value) => {
								setStartDate((await simulateSave(value, "Дата начала")) || "");
							}}
							placeholder="Выберите дату начала"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">
							Дата окончания
						</label>
						<EditableDate
							value={endDate}
							onSave={async (value) => {
								setEndDate((await simulateSave(value, "Дата окончания")) || "");
							}}
							placeholder="Выберите дату окончания"
							minDate={new Date(startDate)}
						/>
					</div>
				</div>
			</div>

			{/* Users */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Выбор пользователей</h3>
				<div className="grid gap-4">
					<div>
						<label className="text-muted-foreground text-sm">
							Руководитель проекта
						</label>
						<EditableUserSelect
							value={leadId}
							users={users}
							onSave={async (value) => {
								setLeadId((await simulateSave(value, "Руководитель")) || "");
							}}
							placeholder="Выберите руководителя"
						/>
					</div>

					<div>
						<label className="text-muted-foreground text-sm">
							Команда проекта
						</label>
						<EditableUserSelect
							value={teamIds}
							users={users}
							onSave={async (value) => {
								setTeamIds((await simulateSave(value, "Команда")) || []);
							}}
							placeholder="Выберите участников команды"
							multiple
						/>
					</div>
				</div>
			</div>

			{/* Disabled Example */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Заблокированные поля</h3>
				<div className="grid gap-4">
					<EditableText
						value="Это поле нельзя редактировать"
						onSave={async () => {}}
						disabled
					/>
				</div>
			</div>
		</div>
	);
}
