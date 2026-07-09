import { Navigate, Route, Routes } from "react-router";

import { AppLayout } from "./layout/AppLayout";
import { AuthLayout } from "./layout/AuthLayout";
import { KanbanPage } from "./pages/Kanban";
import { DashboardPage } from "./pages/Dashboard";
import { ApplicationsPage } from "./pages/Applications";
import { UpcomingPage } from "./pages/Upcoming";
import { NewApplicationPage } from "./pages/NewApplication";
import { ApplicationDetailsPage } from "./pages/ApplicationDetails";
import { AccountSettingsPage } from "./pages/AccountSettings";
import { NotFoundPage } from "./pages/NotFound";
import { HomePage } from "./pages/Home";
import { HelpPage } from "./pages/Help";
import { ContactPage } from "./pages/Contact";
import {
	CookiePolicyPage,
	PrivacyPolicyPage,
	TermsOfServicePage,
} from "./pages/Legal";
import { LoginPage } from "./pages/Auth/Login";
import { SignUpPage } from "./pages/Auth/SignUp";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPassword";
import { ResetPasswordPage } from "./pages/Auth/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EditApplicationPage } from "./pages/EditApplication";
import { APP_NAME } from "./constants/pageTitle";

function App() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/help" element={<HelpPage />} />
			<Route path="/contact" element={<ContactPage />} />
			<Route path="/terms" element={<TermsOfServicePage />} />
			<Route path="/privacy" element={<PrivacyPolicyPage />} />
			<Route path="/cookies" element={<CookiePolicyPage />} />

			<Route
				element={
					<AuthLayout
						headerTitle="Welcome back"
						headerSubtitle="Sign in to keep your search on track. New here?"
						headerLinkText="Start here"
						linkTo="/signup"
					/>
				}
			>
				<Route path="/login" element={<LoginPage />} />
			</Route>

			<Route
				element={
					<AuthLayout
						headerTitle="Create your workspace"
						headerSubtitle="Track every role from first save to final answer. Already opened your workspace?"
						headerLinkText="Log in"
						linkTo="/login"
					/>
				}
			>
				<Route path="/signup" element={<SignUpPage />} />
			</Route>

			<Route
				element={
					<AuthLayout
						headerTitle="Need a password reset?"
						headerSubtitle="Enter your email and we will send a reset link. Remembered it?"
						headerLinkText="Log in"
						linkTo="/login"
					/>
				}
			>
				<Route
					path="/forgot-password"
					element={<ForgotPasswordPage />}
				/>
			</Route>

			<Route
				element={
					<AuthLayout
						headerTitle="Choose a new password"
						headerSubtitle={`Create a fresh password for your ${APP_NAME} account. Need another link?`}
						headerLinkText="Start again"
						linkTo="/forgot-password"
						redirectAuthenticated={false}
					/>
				}
			>
				<Route path="/reset-password" element={<ResetPasswordPage />} />
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route
						path="/applications"
						element={<ApplicationsPage />}
					/>
					<Route path="/upcoming" element={<UpcomingPage />} />
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
