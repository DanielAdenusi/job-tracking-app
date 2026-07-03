import {
	type ReactNode,
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { type User } from "firebase/auth";
import {
	completeGoogleRedirectLogin,
	listenToAuthChanges,
	loginWithEmail,
	loginWithGoogle,
	logout,
	sendPasswordReset,
	signUpWithEmail,
} from "../services/authenticationApi";

type AuthContextValue = {
	user: User | null;
	isAuthLoading: boolean;
	loginWithEmail: (email: string, password: string) => Promise<void>;
	loginWithGoogle: () => Promise<User | null>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	sendPasswordReset: (email: string) => Promise<void>;
	logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
	children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);

	useEffect(() => {
		void completeGoogleRedirectLogin();

		const unsubscribe = listenToAuthChanges((firebaseUser) => {
			setUser(firebaseUser);
			setIsAuthLoading(false);
		});

		return unsubscribe;
	}, []);

	const handleLoginWithEmail = useCallback(
		async (email: string, password: string) => {
			await loginWithEmail(email, password);
		},
		[],
	);

	const handleLoginWithGoogle = useCallback(async () => {
		return loginWithGoogle();
	}, []);

	const handleSignUpWithEmail = useCallback(
		async (email: string, password: string) => {
			await signUpWithEmail(email, password);
		},
		[],
	);

	const handleSendPasswordReset = useCallback(async (email: string) => {
		await sendPasswordReset(email);
	}, []);

	const handleLogout = useCallback(async () => {
		await logout();
	}, []);

	const value = useMemo(
		() => ({
			user,
			isAuthLoading,
			loginWithEmail: handleLoginWithEmail,
			loginWithGoogle: handleLoginWithGoogle,
			signUpWithEmail: handleSignUpWithEmail,
			sendPasswordReset: handleSendPasswordReset,
			logout: handleLogout,
		}),
		[
			user,
			isAuthLoading,
			handleLoginWithEmail,
			handleLoginWithGoogle,
			handleSignUpWithEmail,
			handleSendPasswordReset,
			handleLogout,
		],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
