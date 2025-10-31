"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { AIAgentSidebar } from "./ai-agent-sidebar-new";
import { AIAgentToggleButton } from "./ai-agent-toggle-button";

interface AIAgentContextType {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export function useAIAgent() {
	const context = useContext(AIAgentContext);
	if (!context) {
		throw new Error("useAIAgent must be used within AIAgentProvider");
	}
	return context;
}

interface AIAgentProviderProps {
	children: ReactNode;
}

export function AIAgentProvider({ children }: AIAgentProviderProps) {
	const [isOpen, setIsOpen] = useState(false);

	const open = () => setIsOpen(true);
	const close = () => setIsOpen(false);
	const toggle = () => setIsOpen((prev) => !prev);

	return (
		<AIAgentContext.Provider value={{ isOpen, open, close, toggle }}>
			{children}
			<AIAgentSidebar isOpen={isOpen} onClose={close} />
			<AIAgentToggleButton onClick={toggle} isOpen={isOpen} />
		</AIAgentContext.Provider>
	);
}
