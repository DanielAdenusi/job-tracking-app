import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router";
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

const minimumPasswordLength = 6;

export function SignUpPage() {
	const { user, isAuthLoading, loginWithGoogle, signUpWithEmail } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState({
		main: false,
		confirm: false,
	});
	const [error, setError] = useState<string | null>(null);
	const { showToast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";
	const passwordHasMinimumLength =
		password.length >= minimumPasswordLength;
	const confirmPasswordHasValue = confirmPassword.length > 0;
	const passwordsMatch = password === confirmPassword;
	const showPasswordLengthError =
		password.length > 0 && !passwordHasMinimumLength;
	const showConfirmPasswordError =
		confirmPasswordHasValue && !passwordsMatch;
	const showConfirmPasswordSuccess =
		confirmPasswordHasValue && passwordsMatch && passwordHasMinimumLength;

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	function validateSignUpForm() {
		if (!passwordHasMinimumLength) {
			return `Use a password with at least ${minimumPasswordLength} characters.`;
		}

		if (!passwordsMatch) {
			return "Password and confirm password must match.";
		}

		return null;
	}

	async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const validationError = validateSignUpForm();

		if (validationError) {
			setError(validationError);
			showToast(validationError, "error");
			return;
		}

		try {
			setError(null);
			setIsSubmitting(true);
			await signUpWithEmail(email, password);
			navigate(redirectTo, { replace: true });
		} catch (err) {
			const message = getAuthErrorMessage(
				err,
				"Failed to create your account.",
			);

			setError(message);
			showToast(message, "error");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGoogleSignUp() {
		try {
			setError(null);
			setIsSigningInWithGoogle(true);
			await loginWithGoogle();
			navigate(redirectTo, { replace: true });
		} catch (err) {
			const message = getAuthErrorMessage(
				err,
				"Failed to continue with Google.",
			);

			setError(message);
			showToast(message, "error");
		} finally {
			setIsSigningInWithGoogle(false);
		}
	}

	if (isAuthLoading) {
		return (
			<div className="auth-loading mt-8 rounded-xl border p-5 text-center text-sm font-semibold">
				Loading...
			</div>
		);
	}

	if (user) {
		return <Navigate to={redirectTo} replace />;
	}

	const isBusy = isSubmitting || isSigningInWithGoogle;

	return (
		<>
			<form className="mt-8" onSubmit={handleEmailSignUp}>
				<AuthField
					id="signup-email"
					label="Email"
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="you@example.com"
					autoComplete="email"
					icon={<Mail size={16} strokeWidth={1.9} />}
					required
				/>

				<AuthField
					id="signup-password"
					label="Password"
					type={showPassword.main ? "text" : "password"}
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
						setError(null);
					}}
					placeholder="Create a password"
					autoComplete="new-password"
					icon={<Lock size={16} strokeWidth={1.9} />}
					minLength={minimumPasswordLength}
					aria-invalid={showPasswordLengthError}
					className={
						showPasswordLengthError ? "auth-input-invalid" : ""
					}
					required
					action={
						<button
							type="button"
							onClick={() =>
								setShowPassword((value) => ({
									...value,
									main: !value.main,
								}))
							}
							className="auth-field-action absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md transition"
							aria-label={
								showPassword.main
									? "Hide password"
									: "Show password"
							}
						>
							{showPassword.main ? (
								<EyeOff size={16} strokeWidth={1.9} />
							) : (
								<Eye size={16} strokeWidth={1.9} />
							)}
						</button>
					}
				/>
				<p
					className={[
						"-mt-2 mb-4 text-xs font-semibold",
						showPasswordLengthError
							? "auth-validation-error"
							: "auth-validation-muted",
					].join(" ")}
				>
					Use at least {minimumPasswordLength} characters.
				</p>

				<AuthField
					id="signup-password-confirm"
					label="Confirm Password"
					type={showPassword.confirm ? "text" : "password"}
					value={confirmPassword}
					onChange={(event) => {
						setConfirmPassword(event.target.value);
						setError(null);
					}}
					placeholder="Confirm your password"
					autoComplete="new-password"
					icon={<Lock size={16} strokeWidth={1.9} />}
					minLength={minimumPasswordLength}
					aria-invalid={showConfirmPasswordError}
					className={
						showConfirmPasswordError ? "auth-input-invalid" : ""
					}
					required
					action={
						<button
							type="button"
							onClick={() =>
								setShowPassword((value) => ({
									...value,
									confirm: !value.confirm,
								}))
							}
							className="auth-field-action absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md transition"
							aria-label={
								showPassword.confirm
									? "Hide password"
									: "Show password"
							}
						>
							{showPassword.confirm ? (
								<EyeOff size={16} strokeWidth={1.9} />
							) : (
								<Eye size={16} strokeWidth={1.9} />
							)}
						</button>
					}
				/>
				{showConfirmPasswordError && (
					<p className="-mt-2 mb-4 text-xs font-semibold auth-validation-error">
						Passwords do not match.
					</p>
				)}
				{showConfirmPasswordSuccess && (
					<p className="-mt-2 mb-4 text-xs font-semibold auth-validation-success">
						Passwords match.
					</p>
				)}

				{error && (
					<div className="auth-alert-error mt-5 rounded-xl border p-3 text-sm font-semibold">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={isBusy}
					className={`${authButtonClassName} mt-2`}
				>
					{isSubmitting ? "Creating account..." : "Create account"}
				</button>
			</form>

			<AuthDivider />

			<button
				type="button"
				disabled={isBusy}
				onClick={handleGoogleSignUp}
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
