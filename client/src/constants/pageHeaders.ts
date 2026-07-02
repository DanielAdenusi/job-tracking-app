export const PAGE_HEADERS = [
	{
		label: "Your Dashboard",
		path: "/dashboard",
	},
	{
		label: "New Application",
		path: "/applications/new",
	},
	{
		label: "View Applications",
		path: "/applications",
	},
	{
		label: "Your Kanban",
		path: "/kanban",
	},
	{
		label: "Your Account",
		path: "/account",
	},
] as const;

export type PageHeader = (typeof PAGE_HEADERS)[number];
