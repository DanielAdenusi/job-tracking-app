import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute() {
	const { user, isAuthLoading } = useAuth();
	const location = useLocation();

	if (isAuthLoading) {
		return (
			<main className="grid min-h-screen place-items-center bg-slate-50 p-5">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
					<p className="mt-4 font-bold text-slate-700">
						Checking session...
					</p>
				</div>
			</main>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
