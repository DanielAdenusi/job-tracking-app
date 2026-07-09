import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import {
	AuthDivider,
	AuthField,
	GoogleIcon,
	authButtonClassName,
	getAuthErrorMessage,
	googleButtonClassName,
} from "./sharedAuthUi";
import { useToast } from "../../components/ToastProvider";

type LocationState = {
	from?: {
		pathname?: string;
	};
};

export function LoginPage() {
	const { user, loginWithEmail, loginWithGoogle } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { showToast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	useEffect(() => {
		if (!isSigningInWithGoogle) return;

		const timeout = window.setTimeout(() => {
			setIsSigningInWithGoogle(false);
		}, 30000);
		const handleFocus = () => {
			window.setTimeout(() => {
				setIsSigningInWithGoogle(false);
			}, 1500);
		};

		window.addEventListener("focus", handleFocus);

		return () => {
			window.clearTimeout(timeout);
			window.removeEventListener("focus", handleFocus);
		};
	}, [isSigningInWithGoogle]);

	async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			setError(null);
			setIsSubmitting(true);
			await loginWithEmail(email, password);
			navigate(redirectTo, { replace: true });
		} catch (err) {
			setError(
				getAuthErrorMessage(
					err,
					"Failed to sign in with those details.",
				),
			);
			showToast(
				getAuthErrorMessage(
					err,
					"Failed to sign in with those details.",
				),
				"error",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGoogleLogin() {
		try {
			setError(null);
			setIsSigningInWithGoogle(true);
			const firebaseUser = await loginWithGoogle();

			if (firebaseUser) {
				navigate(redirectTo, { replace: true });
			}
		} catch (err) {
			setError(getAuthErrorMessage(err, "Failed to sign in."));
			showToast(getAuthErrorMessage(err, "Failed to sign in."), "error");
		} finally {
			setIsSigningInWithGoogle(false);
		}
	}

	if (user) {
		return <Navigate to={redirectTo} replace />;
	}

	const isBusy = isSubmitting || isSigningInWithGoogle;

	return (
		<>
			<form className="mt-8" onSubmit={handleEmailLogin}>
				<AuthField
					id="email"
					name="username"
					label="Email"
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="you@example.com"
					autoComplete="username"
					icon={<Mail size={16} strokeWidth={1.9} />}
					required
				/>

				<AuthField
					id="password"
					name="password"
					label="Password"
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="Enter your password"
					autoComplete="current-password"
					icon={<Lock size={16} strokeWidth={1.9} />}
					required
					action={
						<button
							type="button"
							onClick={() => setShowPassword((value) => !value)}
							className="auth-field-action absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md transition"
							aria-label={
								showPassword ? "Hide password" : "Show password"
							}
						>
							{showPassword ? (
								<EyeOff size={16} strokeWidth={1.9} />
							) : (
								<Eye size={16} strokeWidth={1.9} />
							)}
						</button>
					}
				/>

				<div className="mt-1 flex items-center justify-between gap-4">
					<label className="auth-field-label inline-flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							defaultChecked
							className="auth-checkbox h-4 w-4 rounded"
						/>
						Remember me
					</label>
					<Link
						to="/forgot-password"
						className="auth-inline-link text-sm font-bold underline decoration-transparent underline-offset-4 transition hover:decoration-current"
					>
						Forgot password?
					</Link>
				</div>

				{error && (
					<div className="auth-alert-error mt-5 rounded-xl border p-3 text-sm font-semibold">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={isBusy}
					className={`${authButtonClassName} mt-6`}
				>
					{isSubmitting ? "Logging in..." : "Log in"}
				</button>
			</form>

			<AuthDivider />

			<button
				type="button"
				disabled={isBusy}
				onClick={handleGoogleLogin}
				className={googleButtonClassName}
			>
				<GoogleIcon />
				{isSigningInWithGoogle
					? "Opening Google..."
					: "Continue with Google"}
			</button>
		</>
	);
}
