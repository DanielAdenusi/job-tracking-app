import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
	LayoutDashboard,
	BriefcaseBusiness,
	Columns3,
	Plus,
	Bookmark,
	Send,
	ClipboardList,
	MessageSquareText,
	Trophy,
	LogOut,
	CircleHelp,
	Menu,
	X,
	UserCircle,
	type LucideIcon,
	User2,
	ArrowLeft,
	Heart,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import type { ApplicationStatus } from "../constants/applicationOptions";
import { PAGE_HEADERS } from "../constants/pageHeaders";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { getApplications } from "../services/applicationsApi";
import { PageHeading } from "../components/PageHeading";

const mainNavItems = [
	{
		label: "Dashboard",
		path: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Applications",
		path: "/applications",
		icon: BriefcaseBusiness,
		end: true,
	},
	{
		label: "Kanban",
		path: "/kanban",
		icon: Columns3,
	},
	{
		label: "Add Application",
		path: "/applications/new",
		icon: Plus,
	},
];

const pipelineItems = [
	{
		label: "Wishlist",
		status: "wishlist",
		icon: Heart,
	},
	{
		label: "Saved",
		status: "saved",
		icon: Bookmark,
	},
	{
		label: "Applied",
		status: "applied",
		icon: Send,
	},
	{
		label: "Assessment",
		status: "assessment",
		icon: ClipboardList,
	},
	{
		label: "Interviewing",
		status: "interviewing",
		icon: MessageSquareText,
	},
	{
		label: "Offers",
		status: "offer",
		icon: Trophy,
	},
] as const satisfies readonly {
	label: string;
	status: ApplicationStatus;
	icon: LucideIcon;
}[];

const sidebarItemBase =
	"group relative flex min-h-10 items-center gap-3 rounded-xl px-4 text-sm font-bold transition duration-200 ease-out";
const sidebarItemInactive =
	"text-slate-500 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80";
const sidebarItemActive =
	"bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 ring-1 ring-blue-100";
const sidebarIconInactive =
	"text-slate-400 transition-colors group-hover:text-blue-600";
const sidebarIconActive = "text-blue-700";
const sidebarDangerButton =
	"flex min-h-10 items-center gap-3 rounded-xl px-4 text-left text-sm font-bold text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700 hover:shadow-sm hover:shadow-red-100 hover:ring-1 hover:ring-red-100";

type HeaderAction = {
	label: string;
	to: string;
	icon: LucideIcon;
	variant?: "primary" | "secondary";
};

type HeaderMeta = {
	label: string;
	description: string;
	eyebrow: string;
	actions: HeaderAction[];
	chips: string[];
};

function formatStatus(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function getCurrentPageLabel(pathname: string) {
	if (pathname.includes("/edit")) {
		return "Edit Application";
	}

	if (/^\/applications\/[^/]+$/.test(pathname)) {
		return "Application Details";
	}

	return (
		[...PAGE_HEADERS]
			.sort((a, b) => b.path.length - a.path.length)
			.find((item) => pathname.startsWith(item.path))?.label ||
		"Job Tracker"
	);
}

function getHeaderMeta(pathname: string, search: string): HeaderMeta {
	const searchParams = new URLSearchParams(search);
	const status = searchParams.get("status");
	const currentPage = getCurrentPageLabel(pathname);
	const statusChip = status ? [`Filtered by ${formatStatus(status)}`] : [];

	if (pathname === "/dashboard") {
		return {
			label: currentPage,
			eyebrow: "Overview",
			description:
				"Scan your job search activity and jump into the next useful view.",
			chips: ["Live workspace"],
			actions: [
				{
					label: "View Kanban",
					to: "/kanban",
					icon: Columns3,
					variant: "secondary",
				},
			],
		};
	}

	if (pathname === "/applications") {
		return {
			label: currentPage,
			eyebrow: status ? "Pipeline filter" : "Applications",
			description: status
				? `Review roles currently marked as ${formatStatus(status).toLowerCase()}.`
				: "Search, filter, and update every role in your tracker.",
			chips: statusChip,
			actions: [
				{
					label: "Board View",
					to: "/kanban",
					icon: Columns3,
					variant: "secondary",
				},
			],
		};
	}

	if (pathname === "/applications/new") {
		return {
			label: currentPage,
			eyebrow: "Capture a role",
			description:
				"Add a role to your tracker so you can monitor progress, follow-ups, interviews, and outcomes.",
			chips: ["Drafting"],
			actions: [
				{
					label: "Back to applications",
					to: "/applications",
					icon: ArrowLeft,
					variant: "secondary",
				},
			],
		};
	}

	if (pathname.includes("/edit")) {
		return {
			label: currentPage,
			eyebrow: "Update record",
			description:
				"Keep this role accurate as the process moves forward.",
			chips: ["Editing"],
			actions: [
				{
					label: "Back to details",
					to: "/applications/" + pathname.split("/")[2],
					icon: ArrowLeft,
					variant: "secondary",
				},
			],
		};
	}

	if (/^\/applications\/[^/]+$/.test(pathname)) {
		return {
			label: currentPage,
			eyebrow: "Role record",
			description:
				"Review the saved role details and decide the next action.",
			chips: ["Saved record"],
			actions: [
				{
					label: "Back",
					to: "/applications",
					icon: ArrowLeft,
					variant: "secondary",
				},
			],
		};
	}

	if (pathname === "/kanban") {
		return {
			label: currentPage,
			eyebrow: "Pipeline board",
			description:
				"Move applications through your job search pipeline and keep track of what stage each role is currently in.",
			chips: ["Drag cards"],
			actions: [
				{
					label: "List view",
					to: "/applications",
					icon: BriefcaseBusiness,
					variant: "secondary",
				},
			],
		};
	}

	if (pathname === "/account" || pathname.startsWith("/account/")) {
		return {
			label: currentPage,
			eyebrow: "Account",
			description:
				"Manage your account settings and job tracking preferences.",
			chips: ["Protected"],
			actions: [
				{
					label: "Dashboard",
					to: "/dashboard",
					icon: LayoutDashboard,
					variant: "secondary",
				},
			],
		};
	}

	return {
		label: currentPage,
		eyebrow: "Workspace",
		description: "Keep your job search organized.",
		chips: [],
		actions: [
			{
				label: "Add application",
				to: "/applications/new",
				icon: Plus,
				variant: "primary",
			},
		],
	};
}

function SidebarLink({
	to,
	label,
	icon: Icon,
	end,
	onClick,
}: {
	to: string;
	label: string;
	icon: LucideIcon;
	end?: boolean;
	onClick?: () => void;
}) {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const isApplicationLink = to === "/applications";
	const isAccountLink = to === "/account/settings";
	const isPipelineSelected =
		location.pathname === "/applications" && searchParams.has("status");
	const isActive = isApplicationLink
		? location.pathname === to && !isPipelineSelected
		: isAccountLink
			? location.pathname === "/account" ||
				location.pathname.startsWith("/account/")
			: end
				? location.pathname === to
				: location.pathname === to ||
					location.pathname.startsWith(`${to}/`);

	return (
		<Link
			to={to}
			onClick={onClick}
			className={[
				sidebarItemBase,
				isActive ? sidebarItemActive : sidebarItemInactive,
			].join(" ")}
		>
			{isActive && (
				<span className="absolute -left-5 h-6 w-1 rounded-r-full bg-blue-600" />
			)}

			{isPipelineSelected && isApplicationLink && (
				<span className="absolute -left-5 h-6 w-1 rounded-r-full bg-blue-600 opacity-25" />
			)}

			<Icon
				size={18}
				strokeWidth={2.5}
				className={isActive ? sidebarIconActive : sidebarIconInactive}
			/>

			<span className="truncate">{label}</span>
		</Link>
	);
}

function PipelineLink({
	status,
	label,
	icon: Icon,
	count,
	onClick,
}: {
	status: ApplicationStatus;
	label: string;
	icon: LucideIcon;
	count: number;
	onClick?: () => void;
}) {
	const location = useLocation();

	const searchParams = new URLSearchParams(location.search);

	const isActive =
		location.pathname === "/applications" &&
		searchParams.get("status") === status;

	return (
		<Link
			to={`/applications?status=${status}`}
			onClick={onClick}
			className={[
				sidebarItemBase,
				isActive ? sidebarItemActive : sidebarItemInactive,
			].join(" ")}
		>
			{isActive && (
				<span className="absolute -left-5 h-6 w-1 rounded-r-full bg-blue-600" />
			)}

			<Icon
				size={18}
				strokeWidth={2.5}
				className={isActive ? sidebarIconActive : sidebarIconInactive}
			/>

			<span className="truncate">{label}</span>

			{count > 0 && (
				<span
					className={[
						"ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black",
						isActive
							? "bg-blue-100 text-blue-700"
							: "bg-slate-100 text-slate-500",
					].join(" ")}
				>
					{count}
				</span>
			)}
		</Link>
	);
}

function SidebarNavigation({
	pipelineCounts,
	onNavigate,
}: {
	pipelineCounts: Record<ApplicationStatus, number>;
	onNavigate?: () => void;
}) {
	return (
		<>
			<nav className="grid gap-1">
				{mainNavItems.map((item) => (
					<SidebarLink
						key={item.path}
						to={item.path}
						label={item.label}
						icon={item.icon}
						end={item.end}
						onClick={onNavigate}
					/>
				))}
			</nav>

			<div className="mt-8">
				<p className="pe-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
					Pipeline
				</p>

				<nav className="mt-3 grid gap-1">
					{pipelineItems.map((item) => (
						<PipelineLink
							key={item.status}
							status={item.status}
							label={item.label}
							icon={item.icon}
							count={pipelineCounts[item.status]}
							onClick={onNavigate}
						/>
					))}
				</nav>
			</div>

			<div aria-hidden="true" className="mt-8 flex-1"></div>

			<div className="flex flex-col gap-1 border-t border-slate-200 pt-8">
				<nav className="flex flex-col gap-1">
					<button
						type="button"
						className={`${sidebarItemBase} ${sidebarItemInactive} w-full`}
					>
						<CircleHelp
							size={18}
							strokeWidth={2.5}
							className={sidebarIconInactive}
						/>
						Help
					</button>

					<span className="max-lg:hidden relative">
						<SidebarLink
							to="/account/settings"
							label="Account"
							icon={User2}
							onClick={onNavigate}
						/>
					</span>
				</nav>
			</div>
		</>
	);
}

function HeaderActionLink({ action }: { action: HeaderAction }) {
	const Icon = action.icon;
	const isPrimary = action.variant === "primary";

	return (
		<Link
			to={action.to}
			className={[
				"inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition",
				isPrimary
					? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25"
					: "border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm hover:shadow-slate-200",
			].join(" ")}
		>
			<Icon size={16} strokeWidth={2.5} />
			<span>{action.label}</span>
		</Link>
	);
}

export function AppLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [pipelineCounts, setPipelineCounts] = useState<
		Record<ApplicationStatus, number>
	>({
		wishlist: 0,
		saved: 0,
		applied: 0,
		assessment: 0,
		interviewing: 0,
		offer: 0,
		rejected: 0,
		withdrawn: 0,
	});
	const header = getHeaderMeta(location.pathname, location.search);
	const isApplicationDetailsPage = /^\/applications\/[^/]+$/.test(
		location.pathname,
	);
	const isKanbanPage = location.pathname === "/kanban";
	const contentWidthClass = isKanbanPage ? "" : "max-w-[1680px]";

	useEffect(() => {
		if (!isMobileNavOpen) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isMobileNavOpen]);

	useEffect(() => {
		let isActive = true;

		async function loadPipelineCounts() {
			try {
				const data = await getApplications();

				if (!isActive) return;

				setPipelineCounts({
					wishlist: data.filter((item) => item.status === "wishlist")
						.length,
					saved: data.filter((item) => item.status === "saved")
						.length,
					applied: data.filter((item) => item.status === "applied")
						.length,
					assessment: data.filter(
						(item) => item.status === "assessment",
					).length,
					interviewing: data.filter(
						(item) => item.status === "interviewing",
					).length,
					offer: data.filter((item) => item.status === "offer")
						.length,
					rejected: data.filter((item) => item.status === "rejected")
						.length,
					withdrawn: data.filter(
						(item) => item.status === "withdrawn",
					).length,
				});
			} catch {
				if (!isActive) return;
			}
		}

		loadPipelineCounts();

		window.addEventListener("applications:changed", loadPipelineCounts);

		return () => {
			isActive = false;
			window.removeEventListener(
				"applications:changed",
				loadPipelineCounts,
			);
		};
	}, [user?.uid]);

	async function confirmLogout() {
		try {
			setIsLoggingOut(true);
			await logout();
			navigate("/login", { replace: true });
		} finally {
			setIsLoggingOut(false);
			setIsLogoutModalOpen(false);
		}
	}

	return (
		<div className="app-shell min-h-screen bg-slate-50 text-slate-950 lg:grid lg:max-h-screen lg:grid-cols-[256px_1fr] lg:overflow-hidden">
			<header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:hidden">
				<button
					type="button"
					onClick={() => setIsMobileNavOpen(true)}
					aria-label="Open navigation"
					className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm hover:ring-1 hover:ring-slate-200"
				>
					<Menu size={24} strokeWidth={2} />
				</button>

				<div className="min-w-0 px-3 text-center">
					<p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
						{header.eyebrow}
					</p>
					<h1 className="truncate text-lg font-black text-slate-950">
						{header.label}
					</h1>
				</div>

				<Link
					to="/account"
					className="grid h-10 w-10 place-items-center rounded-full text-slate-500"
				>
					{user?.photoURL ? (
						<img
							src={user.photoURL}
							alt=""
							className="h-8 w-8 rounded-full object-cover"
						/>
					) : (
						<UserCircle size={24} strokeWidth={2.5} />
					)}
				</Link>
			</header>

			{isMobileNavOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<button
						type="button"
						aria-label="Close navigation"
						className="absolute inset-0 bg-black/55"
						onClick={() => setIsMobileNavOpen(false)}
					/>

					<aside className="relative flex h-full w-[min(296px,82vw)] flex-col border-r border-slate-200 bg-white shadow-2xl">
						<div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
							<div className="flex min-w-0 items-center gap-3">
								<div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">
									JT
								</div>

								<div className="min-w-0">
									<p className="truncate text-sm font-black text-slate-950">
										Job Tracker
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setIsMobileNavOpen(false)}
								aria-label="Close navigation"
								className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm hover:ring-1 hover:ring-slate-200"
							>
								<X size={22} strokeWidth={2.5} />
							</button>
						</div>

						<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
							<SidebarNavigation
								pipelineCounts={pipelineCounts}
								onNavigate={() => setIsMobileNavOpen(false)}
							/>
						</div>

						<div className="border-t border-slate-200 px-4 py-4">
							<button
								type="button"
								onClick={() => setIsLogoutModalOpen(true)}
								className={`${sidebarDangerButton} w-full`}
							>
								<LogOut size={18} strokeWidth={2.5} />
								Logout
							</button>
						</div>
					</aside>
				</div>
			)}

			<aside className="hidden min-h-screen max-h-screen flex-col border-r border-slate-200 bg-white lg:flex">
				<div className="flex h-20 flex-col justify-center border-b border-slate-200 px-5">
					<span className="relative">
						<Link
							to="/"
							className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-2 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80"
						>
							<div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-lg font-black text-white">
								JT
							</div>

							<div className="min-w-0">
								<p className="truncate text-base font-black text-slate-950">
									JobTracker
								</p>
							</div>
						</Link>
					</span>
				</div>

				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
					<SidebarNavigation pipelineCounts={pipelineCounts} />
				</div>

				<div className="border-t border-slate-200 px-4 py-4">
					<button
						type="button"
						onClick={() => setIsLogoutModalOpen(true)}
						className={`${sidebarDangerButton} w-full`}
					>
						<LogOut size={18} strokeWidth={2.5} />
						Logout
					</button>
				</div>
			</aside>

			<div
				className={[
					"min-h-[calc(100vh-5rem)] min-w-0 bg-slate-50 lg:min-h-screen lg:max-h-screen",
					isKanbanPage
						? "overflow-hidden lg:flex lg:flex-col"
						: "overflow-y-auto",
				].join(" ")}
			>
				{!isApplicationDetailsPage && (
					<header
						className={[
							"mx-auto hidden w-full shrink-0 px-6 pb-6 pt-8 lg:block xl:px-10",
							contentWidthClass,
						].join(" ")}
					>
						<PageHeading
							eyebrow={header.eyebrow}
							title={header.label}
							description={header.description}
							actions={header.actions}
							renderAction={(action) => (
								<HeaderActionLink
									key={`${action.to}-${action.label}`}
									action={action as HeaderAction}
								/>
							)}
						/>
					</header>
				)}

				<main
					className={[
						"mx-auto w-full px-6 pb-10 pt-3 lg:px-6 xl:px-10",
						contentWidthClass,
						isApplicationDetailsPage ? "lg:pt-8" : "lg:pt-0",
						isKanbanPage
							? "h-[calc(100svh-5rem)] min-h-0 overflow-hidden pb-6 lg:h-auto lg:flex-1 lg:pb-6"
							: "lg:pb-12",
					].join(" ")}
				>
					<Outlet />
				</main>
			</div>

			<ConfirmationModal
				isOpen={isLogoutModalOpen}
				title="Log out of JobTracker?"
				description="You will need to sign in again before you can view or update your applications."
				confirmLabel="Log out"
				isProcessing={isLoggingOut}
				onCancel={() => setIsLogoutModalOpen(false)}
				onConfirm={confirmLogout}
			/>
		</div>
	);
}
