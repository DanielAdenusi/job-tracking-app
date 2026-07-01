import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";

type LocationState = {
	from?: {
		pathname?: string;
	};
};

export function LoginPage() {
	const { user, isAuthLoading, loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	async function handleGoogleLogin() {
		try {
			setError(null);
			setIsSigningIn(true);
			await loginWithGoogle();
			navigate(redirectTo, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to sign in");
		} finally {
			setIsSigningIn(false);
		}
	}

	if (isAuthLoading) {
		return (
			<main className="grid min-h-screen place-items-center bg-slate-50 p-5">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
					<p className="mt-4 font-bold text-slate-700">Loading...</p>
				</div>
			</main>
		);
	}

	if (user) {
		return <Navigate to={redirectTo} replace />;
	}

	return (
		<>
			{error && (
				<div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			<button
				type="button"
				onClick={handleGoogleLogin}
				disabled={isSigningIn}
				className="mt-6 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:bg-blue-600 cursor-pointer"
			>
				{isSigningIn ? "Signing in..." : "Continue with Google"}
			</button>

			<Link
				to="/forgot-password"
				className="mt-6 text-start text-sm text-slate-500 hover:text-slate-700 transition underline hover:decoration-slate-700"
			>
				Forgot your password?
			</Link>

			<p className="mt-6 text-start text-sm text-slate-500">
				Built as a mobile-first job tracking dashboard.
			</p>
		</>
	);
}
