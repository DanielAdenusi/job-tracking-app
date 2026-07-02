import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import { useAuth } from "../auth/useAuth";
import {
	applyVisualSettings,
	defaultSettings,
	loadLocalSettings,
	saveLocalSettings,
	type UserSettings,
} from "../lib/accountSettings";
import {
	getUserSettings,
	updateUserSettings,
} from "../services/userSettingsApi";

type AccountSettingsContextValue = {
	settings: UserSettings;
	isLoadingSettings: boolean;
	saveSettings: (settings: UserSettings) => Promise<UserSettings>;
	resetSettings: () => Promise<UserSettings>;
};

const AccountSettingsContext =
	createContext<AccountSettingsContextValue | null>(null);

export function AccountSettingsProvider({ children }: { children: ReactNode }) {
	const { user, isAuthLoading } = useAuth();
	const [settings, setSettings] = useState<UserSettings>(loadLocalSettings);
	const [isLoadingSettings, setIsLoadingSettings] = useState(false);

	useEffect(() => {
		applyVisualSettings(settings);
		saveLocalSettings(settings);
	}, [settings]);

	useEffect(() => {
		if (isAuthLoading || !user) return;

		let isMounted = true;

		async function loadSettings() {
			try {
				setIsLoadingSettings(true);
				const nextSettings = await getUserSettings();

				if (isMounted) {
					setSettings(nextSettings);
				}
			} catch {
				if (isMounted) {
					setSettings(loadLocalSettings());
				}
			} finally {
				if (isMounted) {
					setIsLoadingSettings(false);
				}
			}
		}

		void loadSettings();

		return () => {
			isMounted = false;
		};
	}, [isAuthLoading, user]);

	const saveSettings = useCallback(async (nextSettings: UserSettings) => {
		const savedSettings = await updateUserSettings(nextSettings);

		setSettings(savedSettings);

		return savedSettings;
	}, []);

	const resetSettings = useCallback(async () => {
		const savedSettings = await updateUserSettings(defaultSettings);

		setSettings(savedSettings);

		return savedSettings;
	}, []);

	const value = useMemo(
		() => ({
			settings,
			isLoadingSettings,
			saveSettings,
			resetSettings,
		}),
		[settings, isLoadingSettings, saveSettings, resetSettings],
	);

	return (
		<AccountSettingsContext.Provider value={value}>
			{children}
		</AccountSettingsContext.Provider>
	);
}

export function useAccountSettings() {
	const context = useContext(AccountSettingsContext);

	if (!context) {
		throw new Error(
			"useAccountSettings must be used inside AccountSettingsProvider",
		);
	}

	return context;
}
