import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useToast } from "../../components/ToastProvider";
import {
	AuthField,
	authButtonClassName,
	getAuthErrorMessage,
} from "./sharedAuthUi";

type LocationState = {
	from?: {
		pathname?: string;
	};
};

export function ForgotPasswordPage() {
	const { user, isAuthLoading, sendPasswordReset } = useAuth();
	const { showToast } = useToast();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	async function handlePasswordReset(
		event: React.SubmitEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		try {
			setIsSubmitting(true);
			await sendPasswordReset(email);
			setSuccessMessage("Check your inbox for a password reset link.");
			showToast("Check your inbox for a password reset link.", "success");
		} catch (err) {
			setError("Failed to send a reset email.");
			showToast(
				getAuthErrorMessage(err, "Failed to send a reset email."),
				"error",
			);
		} finally {
			setIsSubmitting(false);
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

	return (
		<form className="mt-8" onSubmit={handlePasswordReset}>
			<AuthField
				id="reset-email"
				label="Email"
				type="email"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				placeholder="you@example.com"
				autoComplete="email"
				icon={<Mail size={16} strokeWidth={1.9} />}
				required
			/>

			{error && (
				<div className="auth-alert-error mt-5 rounded-xl border p-3 text-sm font-semibold">
					{error}
				</div>
			)}

			{successMessage && (
				<div className="auth-alert-success mt-5 rounded-xl border p-3 text-sm font-semibold">
					{successMessage}
				</div>
			)}

			<button
				type="submit"
				disabled={isSubmitting}
				className={`${authButtonClassName} mt-6`}
			>
				{isSubmitting ? "Sending reset link..." : "Send reset link"}
			</button>
		</form>
	);
}
