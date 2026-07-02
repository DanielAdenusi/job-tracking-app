import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "./layout/AppLayout";
import { AuthLayout } from "./layout/AuthLayout";
import { KanbanPage } from "./pages/Kanban";
import { DashboardPage } from "./pages/Dashboard";
import { ApplicationsPage } from "./pages/Applications";
import { NewApplicationPage } from "./pages/NewApplication";
import { ApplicationDetailsPage } from "./pages/ApplicationDetails";
import { AccountSettingsPage } from "./pages/AccountSettings";
import { NotFoundPage } from "./pages/NotFound";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Auth/Login";
import { SignUpPage } from "./pages/Auth/SignUp";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EditApplicationPage } from "./pages/EditApplication";

function App() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />

			<Route
				element={
					<AuthLayout
						headerTitle="Log in to your account"
						headerSubtitle="Don't have an account?"
						headerLinkText="Sign up"
						linkTo="/signup"
					/>
				}
			>
				<Route path="/login" element={<LoginPage />} />
			</Route>

			<Route
				element={
					<AuthLayout
						headerTitle="Sign up to get started"
						headerSubtitle="Already have an account?	"
						headerLinkText="Log in"
						linkTo="/login"
					/>
				}
			>
				<Route path="/signup" element={<SignUpPage />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route
						path="/applications"
						element={<ApplicationsPage />}
					/>
					<Route
						path="/applications/new"
						element={<NewApplicationPage />}
					/>
					<Route
						path="/applications/:id"
						element={<ApplicationDetailsPage />}
					/>
					<Route
						path="/applications/:id/edit"
						element={<EditApplicationPage />}
					/>
					<Route path="/kanban" element={<KanbanPage />} />
					<Route
						path="/account"
						element={<Navigate to="/account/settings" replace />}
					/>
					<Route
						path="/account/:accountTab"
						element={<AccountSettingsPage />}
					/>
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
