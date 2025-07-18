import { CreateIssueModalProvider } from "@/components/common/issues/create-issue-modal-provider";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
	const height = {
		1: "h-[calc(100svh-40px)] lg:h-[calc(100svh-56px)]",
		2: "h-[calc(100svh-80px)] lg:h-[calc(100svh-96px)]",
	};
	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="h-svh w-full overflow-hidden lg:p-2 bg-background">
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
