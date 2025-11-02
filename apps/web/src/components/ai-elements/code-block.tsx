"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import {
	type ComponentProps,
	type HTMLAttributes,
	createContext,
	useContext,
	useState,
} from "react";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
};

type CodeBlockContextType = {
	code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
	code: "",
});

export const CodeBlock = ({
	code,
	language,
	showLineNumbers = false,
	className,
	children,
	...props
}: CodeBlockProps) => {
	const lines = showLineNumbers ? code.split("\n") : [];

	return (
		<CodeBlockContext.Provider value={{ code }}>
			<div
				className={cn(
					"group relative w-full overflow-hidden rounded-md border bg-muted/50 text-foreground",
					className,
				)}
				{...props}
			>
				<div className="relative">
					<pre className="m-0 overflow-x-auto p-4">
						{showLineNumbers ? (
							<code className="font-mono text-sm">
								{lines.map((line, i) => (
									<div key={i} className="table-row">
										<span className="table-cell min-w-10 pr-4 text-right select-none text-muted-foreground">
											{i + 1}
										</span>
										<span className="table-cell">{line}</span>
									</div>
								))}
							</code>
						) : (
							<code className="font-mono text-sm whitespace-pre">{code}</code>
						)}
					</pre>
					{children && (
						<div className="absolute top-2 right-2 flex items-center gap-2">
							{children}
						</div>
					)}
				</div>
			</div>
		</CodeBlockContext.Provider>
	);
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
	onCopy?: () => void;
	onError?: (error: Error) => void;
	timeout?: number;
};

export const CodeBlockCopyButton = ({
	onCopy,
	onError,
	timeout = 2000,
	children,
	className,
	...props
}: CodeBlockCopyButtonProps) => {
	const [isCopied, setIsCopied] = useState(false);
	const { code } = useContext(CodeBlockContext);

	const copyToClipboard = async () => {
		if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
			onError?.(new Error("Clipboard API not available"));
			return;
		}

		try {
			await navigator.clipboard.writeText(code);
			setIsCopied(true);
			onCopy?.();
			setTimeout(() => setIsCopied(false), timeout);
		} catch (error) {
			onError?.(error as Error);
		}
	};

	const Icon = isCopied ? CheckIcon : CopyIcon;

	return (
		<Button
			className={cn("shrink-0", className)}
			onClick={copyToClipboard}
			size="icon"
			variant="ghost"
			{...props}
		>
			{children ?? <Icon size={14} />}
		</Button>
	);
};
