import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { useEffect } from "react";

type AuthLayoutProps = {
	headerTitle?: string;
	headerSubtitle?: string;
	headerLinkText?: string;
	linkTo?: string;
};

type LocationState = {
	from?: {
		pathname?: string;
	};
};

export function AuthLayout({
	headerTitle = "Track your job search",
	headerSubtitle = `Don't have an account?`,
	headerLinkText = "Sign up",
	linkTo = "/signup",
}: AuthLayoutProps) {
	const { user } = useAuth();

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-950">
			<section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
				<div className="text-start">
					<div className="grid h-14 w-14 place-items-center rounded-xl bg-blue-600 text-lg font-extrabold text-white">
						JT
					</div>

					<h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
						{headerTitle}
					</h1>

					<p className="mt-3 leading-7 text-slate-400">
						{headerSubtitle}
						<Link
							to={linkTo}
							className="text-sm font-bold text-slate-500 cursor-pointer hover:text-slate-700 transition underline ml-1 hover:decoration-slate-700"
						>
							{headerLinkText}
						</Link>
						.
					</p>
				</div>

				<Outlet />
			</section>
		</main>
	);
}
