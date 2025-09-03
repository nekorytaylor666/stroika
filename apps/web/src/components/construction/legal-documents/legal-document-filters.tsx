import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface LegalDocumentFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	documentTypeFilter: string;
	onDocumentTypeChange: (value: string) => void;
	statusFilter: string;
	onStatusChange: (value: string) => void;
	onClearFilters: () => void;
}

const documentTypes = [
	{ value: "all", label: "Все типы" },
	{ value: "contract", label: "Договор" },
	{ value: "invoice", label: "Счет" },
	{ value: "receipt", label: "Квитанция" },
	{ value: "permit", label: "Разрешение" },
	{ value: "certificate", label: "Сертификат" },
	{ value: "report", label: "Отчет" },
	{ value: "protocol", label: "Протокол" },
	{ value: "other", label: "Другое" },
];

const statuses = [
	{ value: "all", label: "Все статусы" },
	{ value: "draft", label: "Черновик" },
	{ value: "pending_review", label: "На проверке" },
	{ value: "approved", label: "Утвержден" },
	{ value: "rejected", label: "Отклонен" },
	{ value: "expired", label: "Истек" },
];

export function LegalDocumentFilters({
	searchQuery,
	onSearchChange,
	documentTypeFilter,
	onDocumentTypeChange,
	statusFilter,
	onStatusChange,
	onClearFilters,
}: LegalDocumentFiltersProps) {
	const hasActiveFilters =
		searchQuery !== "" ||
		documentTypeFilter !== "all" ||
		statusFilter !== "all";

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row">
				<div className="relative flex-1">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Поиск документов..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					<Select
						value={documentTypeFilter}
						onValueChange={onDocumentTypeChange}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Тип документа" />
						</SelectTrigger>
						<SelectContent>
							{documentTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={onStatusChange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Статус" />
						</SelectTrigger>
						<SelectContent>
							{statuses.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearFilters}
							className="px-3"
						>
							<X className="mr-1 h-4 w-4" />
							Сбросить
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
