"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

const DrawerContext = React.createContext<{
	direction?: "top" | "right" | "bottom" | "left";
}>({});

interface DrawerProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	direction?: "top" | "right" | "bottom" | "left";
	children: React.ReactNode;
}

function Drawer({
	open = false,
	onOpenChange,
	direction = "bottom",
	children,
}: DrawerProps) {
	return (
		<DrawerContext.Provider value={{ direction }}>
			{open && (
				<>
					<div
						className="fixed inset-0 z-50 bg-black/50"
						onClick={() => onOpenChange?.(false)}
					/>
					{children}
				</>
			)}
		</DrawerContext.Provider>
	);
}

const DrawerContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
	const { direction = "bottom" } = React.useContext(DrawerContext);

	const positionClasses = {
		top: "top-0 left-0 right-0 rounded-b-lg",
		right: "top-0 right-0 bottom-0 w-full max-w-sm rounded-l-lg",
		bottom: "bottom-0 left-0 right-0 rounded-t-lg",
		left: "top-0 left-0 bottom-0 w-full max-w-sm rounded-r-lg",
	};

	return (
		<div
			ref={ref}
			className={cn(
				"fixed z-50 flex flex-col bg-background shadow-lg",
				positionClasses[direction],
				className,
			)}
			{...props}
		>
			<div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
			{children}
		</div>
	);
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
		{...props}
	/>
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h2
		ref={ref}
		className={cn(
			"font-semibold text-lg leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
DrawerDescription.displayName = "DrawerDescription";

const DrawerClose = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
	<button
		ref={ref}
		className={cn(
			"inline-flex items-center justify-center rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
			className,
		)}
		{...props}
	>
		{children}
	</button>
));
DrawerClose.displayName = "DrawerClose";

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
};
