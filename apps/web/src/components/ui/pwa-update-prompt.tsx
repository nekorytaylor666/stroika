"use client";

import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./button";

export function PWAUpdatePrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log("PWA Service Worker registered:", r);
		},
		onRegisterError(error) {
			console.error("PWA Service Worker registration error:", error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};

	useEffect(() => {
		if (offlineReady) {
			toast.success("Приложение готово к работе офлайн", {
				duration: 4000,
			});
		}
	}, [offlineReady]);

	useEffect(() => {
		if (needRefresh) {
			const toastId = toast(
				<div className="flex items-center gap-3">
					<RefreshCw className="h-4 w-4" />
					<div className="flex-1">
						<p className="font-medium">Доступно обновление</p>
						<p className="text-muted-foreground text-sm">
							Нажмите для обновления приложения
						</p>
					</div>
				</div>,
				{
					duration: Number.POSITIVE_INFINITY,
					action: {
						label: "Обновить",
						onClick: () => updateServiceWorker(true),
					},
					onDismiss: close,
					onAutoClose: close,
				},
			);

			return () => {
				toast.dismiss(toastId);
			};
		}
	}, [needRefresh, updateServiceWorker]);

	return null;
}

// PWA Install Prompt Hook
export function usePWAInstall() {
	useEffect(() => {
		let deferredPrompt: any;

		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();
			// Stash the event so it can be triggered later
			deferredPrompt = e;

			// Show custom install prompt
			toast(
				<div className="flex items-center gap-3">
					<div className="flex-1">
						<p className="font-medium">Установить Stroika</p>
						<p className="text-muted-foreground text-sm">
							Установите приложение для быстрого доступа
						</p>
					</div>
				</div>,
				{
					duration: 10000,
					action: {
						label: "Установить",
						onClick: async () => {
							if (deferredPrompt) {
								// Show the install prompt
								deferredPrompt.prompt();
								// Wait for the user to respond to the prompt
								const { outcome } = await deferredPrompt.userChoice;
								console.log(`User response to the install prompt: ${outcome}`);
								// Clear the deferred prompt
								deferredPrompt = null;
							}
						},
					},
				},
			);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);
}

