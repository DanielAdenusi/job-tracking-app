import {
	type ReactNode,
	createContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	type User,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

type AuthContextValue = {
	user: User | null;
	isAuthLoading: boolean;
	loginWithGoogle: () => Promise<void>;
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
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			setUser(firebaseUser);
			setIsAuthLoading(false);
		});

		return unsubscribe;
	}, []);

	async function loginWithGoogle() {
		await signInWithPopup(auth, googleProvider);
	}

	async function logout() {
		await signOut(auth);
	}

	const value = useMemo(
		() => ({
			user,
			isAuthLoading,
			loginWithGoogle,
			logout,
		}),
		[user, isAuthLoading],
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
