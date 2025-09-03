"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { CalendarIcon, Upload } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AddPaymentModalProps {
	projectId: Id<"constructionProjects">;
	onClose: () => void;
}

export function AddPaymentModal({ projectId, onClose }: AddPaymentModalProps) {
	const [type, setType] = useState<"incoming" | "outgoing">("outgoing");
	const [amount, setAmount] = useState("");
	const [paymentDate, setPaymentDate] = useState<Date>(new Date());
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [counterparty, setCounterparty] = useState("");
	const [counterpartyInn, setCounterpartyInn] = useState("");
	const [purpose, setPurpose] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cash" | "card" | "other">("bank_transfer");
	const [bankAccount, setBankAccount] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	const createPayment = useMutation(api.finance.payments.createPayment);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const addPaymentDocument = useMutation(api.finance.payments.addPaymentDocument);
	
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	
	const handleSubmit = async () => {
		if (!amount || !counterparty || !purpose) {
			return;
		}
		
		setIsSubmitting(true);
		
		try {
			// Create payment
			const { paymentId } = await createPayment({
				projectId,
				type,
				amount: parseFloat(amount),
				paymentDate: format(paymentDate, "yyyy-MM-dd"),
				dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
				counterparty,
				counterpartyInn: counterpartyInn || undefined,
				purpose,
				bankAccount: bankAccount || undefined,
				paymentMethod,
				notes: notes || undefined,
			});
			
			// Upload documents if any
			for (const file of selectedFiles) {
				const uploadUrl = await generateUploadUrl();
				
				// Upload to storage
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});
				
				if (!response.ok) {
					throw new Error("Failed to upload file");
				}
				
				const { storageId } = await response.json();
				
				// Determine document type based on file name
				let documentType: "invoice" | "act" | "contract" | "receipt" | "bank_statement" | "other" = "other";
				const fileName = file.name.toLowerCase();
				
				if (fileName.includes("счет") || fileName.includes("invoice")) {
					documentType = "invoice";
				} else if (fileName.includes("акт") || fileName.includes("act")) {
					documentType = "act";
				} else if (fileName.includes("договор") || fileName.includes("contract")) {
					documentType = "contract";
				} else if (fileName.includes("квитанция") || fileName.includes("receipt")) {
					documentType = "receipt";
				} else if (fileName.includes("выписка") || fileName.includes("statement")) {
					documentType = "bank_statement";
				}
				
				// Attach document to payment
				await addPaymentDocument({
					paymentId,
					documentType,
					storageId,
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type,
				});
			}
			
			onClose();
		} catch (error) {
			console.error("Error creating payment:", error);
		} finally {
			setIsSubmitting(false);
		}
	};
	
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			setSelectedFiles(Array.from(files));
		}
	};
	
	return (
		<Dialog open onOpenChange={() => onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Добавить платеж</DialogTitle>
					<DialogDescription>
						Создайте новый платеж для проекта. Вы можете прикрепить подтверждающие документы.
					</DialogDescription>
				</DialogHeader>
				
				<div className="grid gap-4 py-4">
					{/* Payment Type */}
					<div className="grid gap-2">
						<Label>Тип платежа</Label>
						<Select value={type} onValueChange={(value: any) => setType(value)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="incoming">Входящий платеж</SelectItem>
								<SelectItem value="outgoing">Исходящий платеж</SelectItem>
							</SelectContent>
						</Select>
					</div>
					
					{/* Amount */}
					<div className="grid gap-2">
						<Label>Сумма (₽)</Label>
						<Input
							type="number"
							placeholder="0.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					
					{/* Counterparty */}
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Контрагент</Label>
							<Input
								placeholder="Название организации"
								value={counterparty}
								onChange={(e) => setCounterparty(e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label>ИНН (опционально)</Label>
							<Input
								placeholder="1234567890"
								value={counterpartyInn}
								onChange={(e) => setCounterpartyInn(e.target.value)}
							/>
						</div>
					</div>
					
					{/* Purpose */}
					<div className="grid gap-2">
						<Label>Назначение платежа</Label>
						<Input
							placeholder="За выполненные работы, материалы и т.д."
							value={purpose}
							onChange={(e) => setPurpose(e.target.value)}
						/>
					</div>
					
					{/* Dates */}
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Дата платежа</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"justify-start text-left font-normal",
											!paymentDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{paymentDate ? format(paymentDate, "PPP", { locale: ru }) : "Выберите дату"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={paymentDate}
										onSelect={(date) => date && setPaymentDate(date)}
										initialFocus
										locale={ru}
									/>
								</PopoverContent>
							</Popover>
						</div>
						
						<div className="grid gap-2">
							<Label>Срок оплаты (опционально)</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"justify-start text-left font-normal",
											!dueDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{dueDate ? format(dueDate, "PPP", { locale: ru }) : "Выберите дату"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={dueDate}
										onSelect={setDueDate}
										initialFocus
										locale={ru}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>
					
					{/* Payment Method */}
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Способ оплаты</Label>
							<Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="bank_transfer">Банковский перевод</SelectItem>
									<SelectItem value="cash">Наличные</SelectItem>
									<SelectItem value="card">Карта</SelectItem>
									<SelectItem value="other">Другое</SelectItem>
								</SelectContent>
							</Select>
						</div>
						
						{paymentMethod === "bank_transfer" && (
							<div className="grid gap-2">
								<Label>Номер счета (опционально)</Label>
								<Input
									placeholder="40702810..."
									value={bankAccount}
									onChange={(e) => setBankAccount(e.target.value)}
								/>
							</div>
						)}
					</div>
					
					{/* Notes */}
					<div className="grid gap-2">
						<Label>Примечания (опционально)</Label>
						<Textarea
							placeholder="Дополнительная информация о платеже..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
						/>
					</div>
					
					{/* File Upload */}
					<div className="grid gap-2">
						<Label>Документы</Label>
						<div className="flex items-center gap-2">
							<Input
								type="file"
								multiple
								onChange={handleFileSelect}
								className="hidden"
								id="file-upload"
								accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
							/>
							<Button
								variant="outline"
								onClick={() => document.getElementById("file-upload")?.click()}
								type="button"
							>
								<Upload className="mr-2 h-4 w-4" />
								Загрузить документы
							</Button>
							{selectedFiles.length > 0 && (
								<span className="text-muted-foreground text-sm">
									Выбрано файлов: {selectedFiles.length}
								</span>
							)}
						</div>
						{selectedFiles.length > 0 && (
							<div className="mt-2 space-y-1">
								{selectedFiles.map((file, index) => (
									<div key={index} className="text-sm text-muted-foreground">
										• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Отмена
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting || !amount || !counterparty || !purpose}>
						{isSubmitting ? "Создание..." : "Создать платеж"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}