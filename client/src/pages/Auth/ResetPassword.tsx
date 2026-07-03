import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useToast } from "../../components/ToastProvider";
import {
	confirmResetPassword,
	verifyResetPasswordCode,
} from "../../services/authenticationApi";
import {
	AuthField,
	authButtonClassName,
	getAuthErrorMessage,
} from "./sharedAuthUi";

const minimumPasswordLength = 6;

export function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { showToast } = useToast();

	const mode = searchParams.get("mode");
	const oobCode = searchParams.get("oobCode");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState({
		main: false,
		confirm: false,
	});
	const [isVerifyingCode, setIsVerifyingCode] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isComplete, setIsComplete] = useState(false);

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
		let isMounted = true;

		async function verifyCode() {
			if (mode && mode !== "resetPassword") {
				setError("This password reset link is not valid.");
				setIsVerifyingCode(false);
				return;
			}

			if (!oobCode) {
				setError("This password reset link is missing a reset code.");
				setIsVerifyingCode(false);
				return;
			}

			try {
				const resetEmail = await verifyResetPasswordCode(oobCode);

				if (isMounted) {
					setEmail(resetEmail);
					setError(null);
				}
			} catch (err) {
				if (isMounted) {
					setError(
						getAuthErrorMessage(
							err,
							"This password reset link has expired or is invalid.",
						),
					);
				}
			} finally {
				if (isMounted) {
					setIsVerifyingCode(false);
				}
			}
		}

		void verifyCode();

		return () => {
			isMounted = false;
		};
	}, [mode, oobCode]);

	function validateResetForm() {
		if (!passwordHasMinimumLength) {
			return `Use a password with at least ${minimumPasswordLength} characters.`;
		}

		if (!passwordsMatch) {
			return "Password and confirm password must match.";
		}

		return null;
	}

	async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!oobCode) {
			setError("This password reset link is missing a reset code.");
			return;
		}

		const validationError = validateResetForm();

		if (validationError) {
			setError(validationError);
			showToast(validationError, "error");
			return;
		}

		try {
			setError(null);
			setIsSubmitting(true);
			await confirmResetPassword(oobCode, password);
			setIsComplete(true);
			showToast("Your password has been reset.", "success");
			window.setTimeout(() => {
				navigate("/login", { replace: true });
			}, 1200);
		} catch (err) {
			const message = getAuthErrorMessage(
				err,
				"Failed to reset your password.",
			);

			setError(message);
			showToast(message, "error");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isVerifyingCode) {
		return (
			<div className="auth-loading mt-8 rounded-xl border p-5 text-center text-sm font-semibold">
				Checking reset link...
			</div>
		);
	}

	if (error && !email) {
		return (
			<div className="mt-8">
				<div className="auth-alert-error rounded-xl border p-3 text-sm font-semibold">
					{error}
				</div>
				<Link
					to="/forgot-password"
					className="auth-inline-link mt-5 inline-flex text-sm font-bold underline decoration-transparent underline-offset-4 transition hover:decoration-current"
				>
					Request a new reset link
				</Link>
			</div>
		);
	}

	if (isComplete) {
		return (
			<div className="mt-8">
				<div className="auth-alert-success rounded-xl border p-3 text-sm font-semibold">
					Your password has been reset. Taking you back to login...
				</div>
			</div>
		);
	}

	return (
		<form className="mt-8" onSubmit={handlePasswordReset}>
			<p className="auth-subtitle mb-5 text-sm font-semibold">
				Resetting password for{" "}
				<span className="auth-title font-black">{email}</span>
			</p>

			<AuthField
				id="reset-new-password"
				label="New password"
				type={showPassword.main ? "text" : "password"}
				value={password}
				onChange={(event) => {
					setPassword(event.target.value);
					setError(null);
				}}
				placeholder="Create a new password"
				autoComplete="new-password"
				icon={<Lock size={16} strokeWidth={1.9} />}
				minLength={minimumPasswordLength}
				aria-invalid={showPasswordLengthError}
				className={showPasswordLengthError ? "auth-input-invalid" : ""}
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
				id="reset-confirm-password"
				label="Confirm password"
				type={showPassword.confirm ? "text" : "password"}
				value={confirmPassword}
				onChange={(event) => {
					setConfirmPassword(event.target.value);
					setError(null);
				}}
				placeholder="Confirm your new password"
				autoComplete="new-password"
				icon={<Lock size={16} strokeWidth={1.9} />}
				minLength={minimumPasswordLength}
				aria-invalid={showConfirmPasswordError}
				className={showConfirmPasswordError ? "auth-input-invalid" : ""}
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
				disabled={isSubmitting}
				className={`${authButtonClassName} mt-6`}
			>
				{isSubmitting ? "Saving password..." : "Save new password"}
			</button>
		</form>
	);
}
