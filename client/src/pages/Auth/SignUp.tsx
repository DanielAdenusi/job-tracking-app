import { signUpWithGoogle } from "../../services/authenticationApi";

type SignUpPageProps = {
	error?: string;
};

export function SignUpPage({ error }: SignUpPageProps) {
	async function handleSignUp() {
		try {
			await signUpWithGoogle();
		} catch (error) {
			console.error("Sign Up failed:", error);
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

				<button className="primaryButton" onClick={handleSignUp}>
					Continue with Google
				</button>
			</section>
		</main>
	);
}
