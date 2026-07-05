import { useEffect, useState } from "react";
import {
	Link,
	Outlet,
	useLocation,
	useNavigate,
	type LinkProps,
} from "react-router";
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
	Sun,
	Monitor,
	Moon,
	MailCheck,
	RefreshCw,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import type { ApplicationStatus } from "../constants/applicationOptions";
import { PAGE_HEADERS } from "../constants/pageHeaders";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { getApplications } from "../services/applicationsApi";
import { PageHeading } from "../components/PageHeading";
import { useAccountSettings } from "../context/AccountSettingsContext";
import type { Theme } from "../lib/accountSettings";
import { Button, ButtonLink } from "../components/ui/Button";
import { APP_NAME } from "../constants/pageTitle";
import { Logo } from "../components/ui/Logo";
import { useToast } from "../components/ToastProvider";
import { getAuthErrorMessage } from "../pages/Auth/sharedAuthUi";
import { useAnimatedDisclosure } from "../hooks/useAnimatedDisclosure";

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
	"sidebar-item-inactive text-slate-500 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-sm hover:shadow-slate-200/80 hover:ring-1 hover:ring-slate-200/80";
const sidebarItemActive =
	"sidebar-item-active app-accent-surface app-accent-text app-accent-shadow app-accent-ring shadow-sm ring-1";
const sidebarIconInactive =
	"sidebar-icon-inactive text-slate-400 transition-colors";
const sidebarIconActive = "app-accent-text";
const sidebarDangerButton =
	"sidebar-danger-button flex min-h-10 items-center gap-3 rounded-xl px-4 text-left text-sm font-bold text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700 hover:shadow-sm hover:shadow-red-100 hover:ring-1 hover:ring-red-100";

const themeOptions = [
	{ value: "light", label: "Light theme", icon: Sun },
	{ value: "system", label: "System theme", icon: Monitor },
	{ value: "dark", label: "Dark theme", icon: Moon },
] as const satisfies readonly {
	value: Theme;
	label: string;
	icon: LucideIcon;
}[];

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
			.find((item) => pathname.startsWith(item.path))?.label || APP_NAME
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
	target,
	rel,
	onClick,
}: {
	to: string;
	label: string;
	icon?: LucideIcon;
	end?: boolean;
	target?: LinkProps["target"];
	rel?: LinkProps["rel"];
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
			target={target}
			rel={rel}
			onClick={onClick}
			className={[
				sidebarItemBase,
				isActive ? sidebarItemActive : sidebarItemInactive,
			].join(" ")}
		>
			{isActive && (
				<span className="app-accent-bg absolute -left-5 h-6 w-1 rounded-r-full" />
			)}

			{isPipelineSelected && isApplicationLink && (
				<span className="app-accent-bg absolute -left-5 h-6 w-1 rounded-r-full opacity-25" />
			)}

			{Icon && (
				<Icon
					size={18}
					strokeWidth={2.5}
					className={
						isActive ? sidebarIconActive : sidebarIconInactive
					}
				/>
			)}

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
				<span className="app-accent-bg absolute -left-5 h-6 w-1 rounded-r-full" />
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
							? "app-accent-surface app-accent-text"
							: "bg-slate-100 text-slate-500",
					].join(" ")}
				>
					{count}
				</span>
			)}
		</Link>
	);
}

function ThemeSelector() {
	const { settings, saveSettings, isLoadingSettings } = useAccountSettings();
	const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
	const selectedTheme = pendingTheme ?? settings.theme;
	const selectedIndex = themeOptions.findIndex(
		(option) => option.value === selectedTheme,
	);
	const indicatorIndex = Math.max(selectedIndex, 0);

	async function updateTheme(theme: Theme) {
		if (theme === selectedTheme) return;

		setPendingTheme(theme);

		try {
			await saveSettings({
				...settings,
				theme,
			});
		} finally {
			setPendingTheme(null);
		}
	}

	return (
		<div
			className="relative grid grid-cols-3 gap-3 overflow-hidden rounded-full border border-slate-200 p-2 shadow-xs"
			role="radiogroup"
			aria-label="Theme"
		>
			<span
				aria-hidden="true"
				className="app-accent-indicator absolute left-2 top-2 h-8 rounded-full shadow-sm ring-1 transition-transform duration-300 ease-out"
				style={{
					width: "calc((100% - 2.5rem) / 3)",
					transform: `translateX(calc(${indicatorIndex * 100}% + ${
						indicatorIndex * 0.75
					}rem))`,
				}}
			/>

			{themeOptions.map((option) => {
				const Icon = option.icon;
				const isSelected = selectedTheme === option.value;

				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isSelected}
						aria-label={option.label}
						title={option.label}
						disabled={isLoadingSettings || pendingTheme !== null}
						onClick={() => void updateTheme(option.value)}
						className={[
							"theme-selector-option relative z-10 grid h-8 place-items-center rounded-full transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-70",
							isSelected
								? ""
								: "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
						].join(" ")}
					>
						<Icon size={16} strokeWidth={2.25} />
					</button>
				);
			})}
		</div>
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
			<nav className="grid gap-3">
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

				<nav className="mt-3 grid gap-2">
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

			<div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
				<ThemeSelector />

				<nav className="flex flex-col gap-3">
					<SidebarLink
						to="/help"
						target="_blank"
						label="Help"
						icon={CircleHelp}
						onClick={onNavigate}
					/>

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
		<ButtonLink
			to={action.to}
			variant={isPrimary ? "primary" : "secondary"}
			tone="neutral"
		>
			<Icon size={16} strokeWidth={2.5} />
			<span>{action.label}</span>
		</ButtonLink>
	);
}

export function AppLayout() {
	const { user, logout, sendVerificationEmail, refreshUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const { showToast } = useToast();
	const {
		isOpen: isMobileNavOpen,
		isRendered: isMobileNavRendered,
		isClosing: isMobileNavClosing,
		open: openMobileNav,
		close: closeMobileNav,
	} = useAnimatedDisclosure();
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [isRefreshingVerification, setIsRefreshingVerification] =
		useState(false);
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
		if (!isMobileNavRendered) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isMobileNavRendered]);

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

	async function handleSendVerificationEmail() {
		try {
			setIsSendingVerification(true);
			await sendVerificationEmail();
			showToast("Verification email sent.", "success");
		} catch (error) {
			showToast(
				getAuthErrorMessage(
					error,
					"Could not send verification email.",
				),
				"error",
			);
		} finally {
			setIsSendingVerification(false);
		}
	}

	async function handleRefreshVerification() {
		try {
			setIsRefreshingVerification(true);
			await refreshUser();
			showToast("Verification status refreshed.", "success");
		} catch (error) {
			showToast(
				getAuthErrorMessage(error, "Could not refresh your account."),
				"error",
			);
		} finally {
			setIsRefreshingVerification(false);
		}
	}

	const isAccountPage =
		location.pathname === "/account" ||
		location.pathname.startsWith("/account/");
	const isMobile = window.innerWidth < 1024;

	return (
		<div className="app-shell min-h-screen bg-slate-50 text-slate-950 lg:grid lg:max-h-screen lg:grid-cols-[256px_1fr] lg:overflow-hidden">
			<header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:hidden">
				<button
					type="button"
					onClick={openMobileNav}
					aria-label="Open navigation"
					aria-expanded={isMobileNavOpen}
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

				<ButtonLink
					variant="ghost"
					tone="neutral"
					to="/account"
					size="sm"
					className="grid place-items-center p-0! rounded-full"
				>
					{user?.photoURL ? (
						<img
							src={user.photoURL}
							alt=""
							className={`h-8 w-8 object-cover rounded-full ${isMobile && isAccountPage ? "app-accent-ring ring-3 shadow-sm" : ""}`}
						/>
					) : (
						<UserCircle
							size={32}
							strokeWidth={2}
							className={`${isMobile && isAccountPage ? "app-accent-text" : ""}`}
						/>
					)}
				</ButtonLink>
			</header>

			{isMobileNavRendered && (
				<div
					className={[
						"app-mobile-nav-overlay fixed inset-0 z-40 lg:hidden",
						isMobileNavOpen
							? "app-mobile-nav-overlay-open"
							: "app-mobile-nav-overlay-closed",
					].join(" ")}
				>
					<button
						type="button"
						aria-label="Close navigation"
						className="app-mobile-nav-backdrop absolute inset-0 bg-black/55"
						onClick={closeMobileNav}
					/>

					<aside
						className={[
							"app-mobile-nav-panel relative flex h-full w-[min(296px,82vw)] flex-col border-r border-slate-200 bg-white shadow-2xl",
							isMobileNavClosing ? "pointer-events-none" : "",
						].join(" ")}
					>
						<div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
							<ButtonLink
								variant="ghost"
								to={"/"}
								className="flex items-center gap-2"
							>
								<Logo hasTitle size={24} />
							</ButtonLink>

							<Button
								variant="ghost"
								type="button"
								onClick={closeMobileNav}
								aria-label="Close navigation"
								className="p-0"
								icon={<X size={22} strokeWidth={2.5} />}
							></Button>
						</div>

						<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
							<SidebarNavigation
								pipelineCounts={pipelineCounts}
								onNavigate={closeMobileNav}
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
							to={"/"}
							className={[
								sidebarItemBase.replace("gap-3", "gap-2"),
								sidebarItemInactive.replace(
									"hover:-translate-y-0.5",
									"",
								),
								"py-2",
							].join(" ")}
						>
							<Logo hasTitle />
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
				{user?.email && !user.emailVerified && (
					<div className="border-b border-(--verification-banner-border) bg-(--verification-banner-bg) px-6 py-3 text-(--verification-banner-text) lg:px-10">
						<div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex min-w-0 items-start gap-3">
								<MailCheck
									size={20}
									strokeWidth={2.5}
									className="mt-0.5 shrink-0 text-(--verification-banner-icon)"
								/>
								<div className="min-w-0">
									<p className="text-sm font-black">
										Verify your email to secure this
										account.
									</p>
									<p className="mt-0.5 text-sm font-medium leading-5 text-(--verification-banner-muted)">
										We use verification for sensitive
										account changes and recovery.
									</p>
								</div>
							</div>
							<div className="flex shrink-0 flex-wrap gap-2">
								<Button
									variant="primary"
									size="sm"
									isLoading={isSendingVerification}
									disabled={isSendingVerification}
									onClick={() =>
										void handleSendVerificationEmail()
									}
								>
									Send link
								</Button>
								<Button
									variant="secondary"
									size="sm"
									isLoading={isRefreshingVerification}
									disabled={isRefreshingVerification}
									onClick={() =>
										void handleRefreshVerification()
									}
								>
									<RefreshCw size={15} strokeWidth={2.4} />
									Refresh
								</Button>
							</div>
						</div>
					</div>
				)}

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
				title={`Log out of ${APP_NAME}?`}
				description="You will need to sign in again before you can view or update your applications."
				confirmLabel="Log out"
				isProcessing={isLoggingOut}
				onCancel={() => setIsLogoutModalOpen(false)}
				onConfirm={confirmLogout}
			/>
		</div>
	);
}
