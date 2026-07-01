import { loginWithGoogle } from "../features/auth/authService";

type LoginPageProps = {
	error?: string;
};

export default function LoginPage({ error }: LoginPageProps) {
	async function handleLogin() {
		try {
			await loginWithGoogle();
		} catch (error) {
			console.error("Login failed:", error);
		}
	}

	return (
		<main className="authPage">
			<section className="authCard">
				<p className="eyebrow">Job Tracker</p>

				<h1>Track every job application in one place.</h1>

				<p className="muted">
					Save roles, monitor your progress, manage interviews, and
					keep track of follow-ups.
				</p>

				{error && <p className="errorText">{error}</p>}

				<button className="primaryButton" onClick={handleLogin}>
					Continue with Google
				</button>
			</section>
		</main>
	);
}
