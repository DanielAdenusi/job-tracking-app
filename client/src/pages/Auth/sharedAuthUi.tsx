import { type InputHTMLAttributes, type ReactNode } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	id: string;
	label: string;
	icon: ReactNode;
	action?: ReactNode;
};

export const authButtonClassName =
	"auth-primary-button h-[46px] w-full rounded-[9px] px-5 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const googleButtonClassName =
	"auth-google-button inline-flex h-11 w-full items-center justify-center gap-3 rounded-[9px] border-[1.5px] px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export function AuthField({
	id,
	label,
	icon,
	action,
	className,
	...props
}: AuthFieldProps) {
	return (
		<div className="mb-4.5">
			<label
				htmlFor={id}
				className="auth-field-label mb-2 block text-[12.5px] font-semibold"
			>
				{label}
			</label>
			<div className="relative">
				<span className="auth-field-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
					{icon}
				</span>
				<input
					id={id}
					className={`auth-input h-11 w-full rounded-[9px] border-[1.5px] px-3.5 pl-10 text-sm font-medium outline-none transition ${
						action ? "pr-11" : ""
					} ${className ?? ""}`}
					{...props}
				/>
				{action}
			</div>
		</div>
	);
}

export function AuthDivider() {
	return (
		<div className="my-6 flex items-center gap-3">
			<span className="auth-divider-line h-px flex-1" />
			<span className="auth-divider-text text-xs font-medium">
				or continue with
			</span>
			<span className="auth-divider-line h-px flex-1" />
		</div>
	);
}

export function GoogleIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
			/>
			<path
				fill="#34A853"
				d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
			/>
			<path
				fill="#FBBC05"
				d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
			/>
			<path
				fill="#EA4335"
				d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
			/>
		</svg>
	);
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
	if (!(error instanceof Error)) {
		return fallback;
	}

	const code = "code" in error ? String(error.code) : "";

	switch (code) {
		case "auth/email-already-in-use":
			return "An account already exists for that email address.";
		case "auth/invalid-email":
			return "Enter a valid email address.";
		case "auth/invalid-credential":
		case "auth/user-not-found":
		case "auth/wrong-password":
			return "The email or password is incorrect.";
		case "auth/weak-password":
			return "Use a password with at least 6 characters.";
		case "auth/too-many-requests":
			return "Too many attempts. Wait a moment, then try again.";
		case "auth/popup-closed-by-user":
			return "The Google sign-in window was closed before finishing.";
		case "auth/popup-blocked":
			return "Your browser blocked the Google sign-in window. Allow popups for this site, then try again.";
		case "auth/network-request-failed":
			return "Check your connection, then try again.";
		default:
			return error.message || fallback;
	}
}
