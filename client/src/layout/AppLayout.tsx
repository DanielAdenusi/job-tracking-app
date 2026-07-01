import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const navItems = [
	{
		label: "Dashboard",
		path: "/dashboard",
	},
	{
		label: "Applications",
		path: "/applications",
	},
	{
		label: "Kanban",
		path: "/kanban",
	},
	{
		label: "Add Application",
		path: "/applications/new",
	},
	{
		label: "Settings",
		path: "/settings",
	},
];

export function AppLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		try {
			await logout();
			navigate("/login", { replace: true });
		} catch (err) {
			console.error("Logout failed:", err);
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
			<aside className="border-b border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r">
				<div className="mb-8 flex items-center gap-3">
					<div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 font-extrabold text-white">
						JT
					</div>

					<div>
						<p className="font-extrabold leading-none">
							Job Tracker
						</p>
						<p className="mt-1 text-sm text-slate-500">
							Student job search hub
						</p>
					</div>
				</div>

				<nav
					className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
					aria-label="Main navigation"
				>
					{navItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							className={({ isActive }) =>
								[
									"rounded-2xl px-4 py-3 text-sm font-bold transition",
									isActive
										? "bg-blue-100 text-blue-700"
										: "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
								].join(" ")
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</aside>

			<div className="min-w-0">
				<header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-8">
					<div>
						<p className="text-sm font-bold text-slate-500">
							Progress dashboard
						</p>
						<h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
							Track your job search
						</h1>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="min-w-0 text-sm">
							<p className="truncate font-bold text-slate-800">
								{user?.displayName || "Signed in"}
							</p>
							<p className="truncate text-slate-500">
								{user?.email}
							</p>
						</div>

						<button
							type="button"
							onClick={handleLogout}
							className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
						>
							Sign out
						</button>
					</div>
				</header>

				<main className="p-5 lg:p-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
