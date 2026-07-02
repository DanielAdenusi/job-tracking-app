import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import { ToastProvider } from "./components/ToastProvider";
import { AccountSettingsProvider } from "./context/AccountSettingsContext";
import { PageTitle } from "./components/PageTitle";

import App from "./App";
import "./main.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<PageTitle />

			<AuthProvider>
				<AccountSettingsProvider>
					<ToastProvider>
						<App />
					</ToastProvider>
				</AccountSettingsProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
