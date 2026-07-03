import { useEffect } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

type AuthLayoutProps = {
	headerTitle?: string;
	headerSubtitle?: string;
	headerLinkText?: string;
	linkTo?: string;
	redirectAuthenticated?: boolean;
};

type LocationState = {
	from?: {
		pathname?: string;
	};
};

const pipelineItems = [
	{
		role: "Frontend Engineer",
		company: "Nova Labs",
		status: "interview",
		tone: "auth-command-dot-orange",
		tag: "auth-command-tag-orange",
	},
	{
		role: "Product Designer",
		company: "Kestrel & Co",
		status: "applied",
		tone: "auth-command-dot-muted",
		tag: "auth-command-tag-muted",
	},
	{
		role: "UX Researcher",
		company: "Brightpath",
		status: "offer",
		tone: "auth-command-dot-success",
		tag: "auth-command-tag-success",
	},
] as const;

export function AuthLayout({
	headerTitle = "Welcome back",
	headerSubtitle = "Sign in to keep your search on track.",
	headerLinkText = "Start here",
	linkTo = "/signup",
	redirectAuthenticated = true,
}: AuthLayoutProps) {
	const { user } = useAuth();

	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;
	const redirectTo = state?.from?.pathname || "/dashboard";

	useEffect(() => {
		if (redirectAuthenticated && user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectAuthenticated, redirectTo]);

	return (
		<main className="auth-page grid min-h-dvh place-items-center px-5 py-10">
			<section className="auth-card grid w-full max-w-7xl overflow-hidden rounded-[18px] md:grid-cols-[0.92fr_1.08fr]">
				<div className="flex flex-col self-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
					<Link
						to="/"
						className="auth-logo mb-10 inline-flex items-center gap-3 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-offset-4 sm:mb-12"
						aria-label="Go to home page"
					>
						<span className="auth-logo-mark grid h-9 w-9 place-items-center rounded-lg font-mono text-xs font-bold">
							JT
						</span>
						<span className="text-lg font-black tracking-tight">
							JobTracker
						</span>
					</Link>

					<h1 className="auth-title text-3xl font-bold tracking-tight">
						{headerTitle}
					</h1>
					<p className="auth-subtitle mt-2 text-sm font-medium leading-6">
						{headerSubtitle}{" "}
						<Link
							to={linkTo}
							className="auth-inline-link font-bold underline decoration-transparent underline-offset-4 transition hover:decoration-current"
						>
							{headerLinkText}
						</Link>
						.
					</p>

					<Outlet />
				</div>

				<aside className="auth-command-panel flex flex-col px-6 py-9 sm:px-10 sm:py-12 lg:px-12 max-md:hidden">
					<div className="auth-command-eyebrow inline-flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
						<span className="auth-live-dot h-1.5 w-1.5 rounded-full" />
						command center
					</div>

					<h2 className="mt-7 max-w-md text-3xl font-black leading-tight tracking-tight sm:text-[2.05rem]">
						Organize the{" "}
						<span className="auth-command-accent">chaos</span> of
						job hunting.
					</h2>
					<p className="auth-command-copy mt-4 max-w-sm text-sm font-medium leading-6">
						Ditch the messy spreadsheets. Every application,
						interview, and offer sits in one timeline you can
						actually follow.
					</p>

					<div className="relative mt-9">
						<div className="auth-command-rail absolute bottom-2 left-2.25 top-2 w-px" />
						<div className="grid gap-1">
							{pipelineItems.map((item) => (
								<div
									key={`${item.role}-${item.company}`}
									className="relative grid grid-cols-[20px_1fr] gap-4 py-3"
								>
									<span
										className={`relative z-10 mt-1.5 h-2.5 w-2.5 justify-self-center rounded-full ${item.tone}`}
									/>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="auth-command-role text-sm font-semibold">
												{item.role}
											</p>
											<p className="auth-command-company mt-1 text-xs font-medium">
												{item.company}
											</p>
										</div>
										<span
											className={`rounded-md px-2 py-1 font-mono text-[10px] font-semibold tracking-wide ${item.tag}`}
										>
											{item.status}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="auth-readout mt-8 grid grid-cols-[1fr_auto_1fr] items-center border-t pt-6 font-mono">
						<div>
							<span className="block text-2xl font-bold">12</span>
							<span className="auth-readout-label mt-1 block text-[10px] font-medium leading-4">
								applications tracked
							</span>
						</div>
						<div className="auth-readout-divider mx-6 h-8 w-px" />
						<div>
							<span className="block text-2xl font-bold">4</span>
							<span className="auth-readout-label mt-1 block text-[10px] font-medium leading-4">
								in interview stage
							</span>
						</div>
					</div>

					<div className="mt-auto hidden pt-10 md:block">
						<div className="auth-command-pill inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
							<BriefcaseBusiness size={14} strokeWidth={2.25} />
							Built for focused daily check-ins
						</div>
					</div>
				</aside>
			</section>
		</main>
	);
}
