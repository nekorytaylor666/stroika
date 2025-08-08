/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:pwa-register/react" {
	import type { Dispatch, SetStateAction } from "react";

	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (
			registration: ServiceWorkerRegistration | undefined,
		) => void;
		onRegisterError?: (error: any) => void;
	}

	export function useRegisterSW(options?: RegisterSWOptions): {
		needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
		offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
		updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
	};
}

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}
