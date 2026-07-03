import type {
	ApplicationStatus,
	EmploymentType,
	WorkMode,
} from "../constants/applicationOptions";

export type SettingsTab =
	| "settings"
	| "details"
	| "notifications"
	| "defaults"
	| "data";

export type Theme = "system" | "light" | "dark";
export type AccentColour =
	| "brand"
	| "blue"
	| "purple"
	| "green"
	| "orange"
	| "pink";
export type FontSize = "small" | "default" | "large";
export type Density = "comfortable" | "compact";
export type DefaultView = "table" | "kanban";
export type ReminderTiming = "one_hour" | "one_day" | "three_days";
export type Currency = "GBP" | "USD" | "EUR";
export type SalaryPeriod = "yearly" | "hourly";

export type UserSettings = {
	theme: Theme;
	accentColour: AccentColour;
	fontSize: FontSize;
	reducedMotion: boolean;
	highContrast: boolean;
	alwaysShowFocus: boolean;
	largerClickTargets: boolean;
	defaultTableRows: number;
	tableDensity: Density;
	defaultApplicationsView: DefaultView;
	defaultSort: string;
	stickyTableHeader: boolean;
	deadlineRemindersEnabled: boolean;
	followUpRemindersEnabled: boolean;
	interviewRemindersEnabled: boolean;
	browserNotificationsEnabled: boolean;
	weeklySummaryEnabled: boolean;
	marketingUpdatesEnabled: boolean;
	reminderTiming: ReminderTiming;
	defaultApplicationStatus: ApplicationStatus;
	defaultJobType: EmploymentType | "";
	defaultWorkMode: WorkMode | "";
	defaultCurrency: Currency;
	defaultSalaryPeriod: SalaryPeriod;
};

export const settingsStorageKey = "job-tracker:account-settings";
export const tableRowOptions = [10, 25, 50, 100] as const;

export const defaultSettings: UserSettings = {
	theme: "system",
	accentColour: "brand",
	fontSize: "default",
	reducedMotion: false,
	highContrast: false,
	alwaysShowFocus: false,
	largerClickTargets: false,
	defaultTableRows: 10,
	tableDensity: "comfortable",
	defaultApplicationsView: "kanban",
	defaultSort: "newest",
	stickyTableHeader: true,
	deadlineRemindersEnabled: true,
	followUpRemindersEnabled: true,
	interviewRemindersEnabled: true,
	browserNotificationsEnabled: false,
	weeklySummaryEnabled: false,
	marketingUpdatesEnabled: false,
	reminderTiming: "one_day",
	defaultApplicationStatus: "wishlist",
	defaultJobType: "",
	defaultWorkMode: "hybrid",
	defaultCurrency: "GBP",
	defaultSalaryPeriod: "yearly",
};

export function normalizeSettings(
	settings?: Partial<UserSettings> | null,
): UserSettings {
	const defaultTableRows =
		typeof settings?.defaultTableRows === "number" &&
		(tableRowOptions as readonly number[]).includes(
			settings.defaultTableRows,
		)
			? settings.defaultTableRows
			: defaultSettings.defaultTableRows;
	const storedAccent = settings?.accentColour as string | undefined;
	const accentColour: AccentColour =
		storedAccent === "palette" || storedAccent === "teal"
			? "brand"
			: storedAccent === "blue" ||
				  storedAccent === "purple" ||
				  storedAccent === "green" ||
				  storedAccent === "orange" ||
				  storedAccent === "pink"
				? storedAccent
				: defaultSettings.accentColour;

	return {
		...defaultSettings,
		...settings,
		accentColour,
		defaultTableRows,
	};
}

export function loadLocalSettings() {
	try {
		const storedSettings = window.localStorage.getItem(settingsStorageKey);
		if (!storedSettings) return defaultSettings;

		return normalizeSettings(
			JSON.parse(storedSettings) as Partial<UserSettings>,
		);
	} catch {
		return defaultSettings;
	}
}

export function saveLocalSettings(settings: UserSettings) {
	window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

export function clearLocalSettings() {
	window.localStorage.removeItem(settingsStorageKey);
}

export function applyVisualSettings(settings: UserSettings) {
	const root = document.documentElement;
	const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
		.matches
		? "dark"
		: "light";
	const theme = settings.theme === "system" ? systemTheme : settings.theme;

	root.dataset.theme = theme;
	root.dataset.accent = settings.accentColour;
	root.dataset.fontSize = settings.fontSize;
	root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
	root.dataset.contrast = settings.highContrast ? "high" : "default";
	root.dataset.focus = settings.alwaysShowFocus ? "always" : "default";
	root.dataset.targetSize = settings.largerClickTargets ? "large" : "default";
}
