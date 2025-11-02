"use client";

import { cn } from "@/lib/utils";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type ResponseProps = {
	children: string;
	className?: string;
};

export const Response = memo(
	({ className, children, ...props }: ResponseProps) => (
		<ReactMarkdown
			className={cn(
				"size-full prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				className,
			)}
			remarkPlugins={[remarkGfm, remarkBreaks]}
			{...props}
		>
			{children}
		</ReactMarkdown>
	),
	(prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = "Response";
