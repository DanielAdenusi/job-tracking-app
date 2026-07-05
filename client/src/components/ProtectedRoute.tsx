import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute() {
	const { user, isAuthLoading } = useAuth();
	const location = useLocation();

	if (isAuthLoading) {
		return <Outlet />;
	}

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
