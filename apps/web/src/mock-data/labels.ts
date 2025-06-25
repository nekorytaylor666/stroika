export interface LabelInterface {
	id: string;
	name: string;
	color: string;
}

export const labels: LabelInterface[] = [
	{ id: "ui", name: "Улучшение UI", color: "purple" },
	{ id: "bug", name: "Ошибка", color: "red" },
	{ id: "feature", name: "Функциональность", color: "green" },
	{ id: "documentation", name: "Документация", color: "blue" },
	{ id: "refactor", name: "Рефакторинг", color: "yellow" },
	{ id: "performance", name: "Производительность", color: "orange" },
	{ id: "design", name: "Дизайн", color: "pink" },
	{ id: "security", name: "Безопасность", color: "gray" },
	{ id: "accessibility", name: "Доступность", color: "indigo" },
	{ id: "testing", name: "Тестирование", color: "teal" },
	{ id: "internationalization", name: "Интернационализация", color: "cyan" },
];
