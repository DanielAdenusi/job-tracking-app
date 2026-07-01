import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { listenToAuthChanges } from "./features/auth/authService";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
	const [user, setUser] = useState<User | null>(null);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	useEffect(() => {
		const unsubscribe = listenToAuthChanges((firebaseUser) => {
			setUser(firebaseUser);
			setIsCheckingAuth(false);
		});

		return () => unsubscribe();
	}, []);

	if (isCheckingAuth) {
		return (
			<main className="loadingPage">
				<p>Checking login...</p>
			</main>
		);
	}

	return user ? <DashboardPage /> : <LoginPage />;
}

export default App;
