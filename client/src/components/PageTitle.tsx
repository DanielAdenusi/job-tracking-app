import { useLayoutEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { APP_NAME } from "../constants/pageTitle";

const pageTitles = [
	{ path: "/dashboard", title: "Dashboard" },
	{ path: "/applications", title: "Applications" },
	{ path: "/applications/new", title: "Add Application" },
	{ path: "/applications/:id", title: "Application Details" },
	{ path: "/kanban", title: "Kanban" },
	{ path: "/account", title: "Account" },
	{ path: "/account/*", title: "Account" },
];

export function PageTitle() {
	const location = useLocation();

	useLayoutEffect(() => {
		const currentPage = pageTitles.find((page) =>
			matchPath({ path: page.path, end: true }, location.pathname),
		);

		const isHomePage = location.pathname === "/";

		const title = currentPage
			? `${currentPage.title} - ${APP_NAME}`
			: isHomePage
				? `${APP_NAME} — Job Tracking App`
				: APP_NAME;

		document.title = title;
	}, [location.pathname]);

	return null;
}
