import { CreateIssueModalProvider } from "@/components/common/issues/create-issue-modal-provider";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MobileNavigation } from "./mobile/mobile-navigation";

interface MainLayoutProps {
	children: React.ReactNode;
	header: React.ReactNode;
	headersNumber?: 1 | 2;
}

export default function MainLayout({
	children,
	header,
	headersNumber = 2,
}: MainLayoutProps) {
	const isMobile = useMobile();

	const height = {
		1: "h-[calc(100svh)] lg:h-[calc(100svh)]",
		2: "h-[calc(100svh)] lg:h-[calc(100svh)]",
	};

	// Mobile layout
	if (isMobile) {
		return (
			<MobileNavigation>
				<div className="flex h-full w-full flex-col items-center justify-start overflow-hidden bg-container">
					{header}
					<div className="w-full flex-1 overflow-auto">{children}</div>
				</div>
			</MobileNavigation>
		);
	}

	// Desktop layout
	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="h-svh w-full overflow-hidden bg-background lg:p-2">
				<div className="flex h-full w-full flex-col items-center justify-start overflow-hidden bg-container lg:rounded-md lg:border">
					{header}
					<div
						className={cn(
							"w-full overflow-auto",
							height[headersNumber as keyof typeof height],
						)}
					>
						{children}
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
