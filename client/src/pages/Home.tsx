import { useEffect, useState } from "react";
import {
	ArrowRight,
	BriefcaseBusiness,
	CalendarClock,
	Clock3,
	Columns3,
	Download,
	FileText,
	LayoutDashboard,
	Plus,
	Sparkles,
	Star,
	TrendingUp,
	Zap,
} from "lucide-react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNav } from "../components/MarketingNav";
import { ButtonLink } from "../components/ui/Button";
import { APP_NAME } from "../constants/pageTitle";
import { Logo } from "../components/ui/Logo";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
};

const featureCards = [
	{
		title: "Instant clarity",
		description:
			"See every role, deadline, interview, and offer without digging through notes or inboxes.",
		icon: FileText,
	},
	{
		title: "Know what needs action",
		description:
			"Spot follow-ups, stale applications, and priority roles before they slip out of view.",
		icon: Star,
	},
	{
		title: "Always up to date",
		description:
			"Move roles across your pipeline and keep table, dashboard, and board views in sync.",
		icon: TrendingUp,
	},
	{
		title: "Less admin stress",
		description:
			"Keep the operational side of job hunting contained so you can focus on stronger applications.",
		icon: BriefcaseBusiness,
	},
] as const;

const stats = [
	{
		label: "Workspace views",
		value: "2",
		icon: LayoutDashboard,
	},
	{
		label: "Pipeline stages",
		value: "8",
		icon: Columns3,
	},
	{
		label: "Date types",
		value: "4+",
		icon: Clock3,
	},
] as const;

function BrowserPreview() {
	return (
		<div className="landing-preview mx-auto mt-14 w-full max-w-6xl overflow-hidden rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-bg) text-left shadow-2xl shadow-black/20">
			<div className="flex h-11 items-center gap-3 border-b border-(--landing-preview-line) bg-(--landing-browser-bar) px-4">
				<div className="flex gap-2">
					<span className="h-2.5 w-2.5 rounded-full bg-red-400" />
					<span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
					<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
				</div>
				<div className="mx-auto hidden h-6 w-80 items-center justify-center rounded-md bg-(--landing-url-bg) text-xs font-bold text-(--landing-muted) sm:flex">
					{APP_NAME}.com/
				</div>
			</div>

			<div className="grid min-h-115 md:grid-cols-[230px_1fr]">
				<aside className="hidden border-r border-(--landing-preview-line) bg-(--landing-preview-card) px-5 py-6 md:block">
					<div className="flex items-center gap-2 text-(--landing-preview-text)">
						<Logo hasTitle />
					</div>

					<nav className="mt-7 grid gap-2 text-sm font-bold">
						{[
							["Dashboard", LayoutDashboard, true],
							["Applications", BriefcaseBusiness, false],
							["Kanban", Columns3, false],
							["Upcoming", CalendarClock, false],
							["Add Application", Plus, false],
						].map(([label, Icon, active]) => {
							const NavIcon = Icon as typeof LayoutDashboard;

							return (
								<div
									key={label as string}
									className={[
										"flex items-center gap-3 rounded-xl px-3 py-2.5",
										active
											? "bg-(--landing-accent-soft) text-(--landing-accent)"
											: "text-(--landing-muted)",
									].join(" ")}
								>
									<NavIcon size={16} strokeWidth={2.4} />
									<span>{label as string}</span>
								</div>
							);
						})}
					</nav>

					<p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-(--landing-muted)">
						Pipeline
					</p>
					<div className="mt-4 grid gap-3 text-sm font-bold text-(--landing-muted)">
						{[
							"Wishlist",
							"Saved",
							"Applied",
							"Interviewing",
							"Offers",
						].map((item) => (
							<div
								key={item}
								className="flex items-center gap-3 px-3"
							>
								<span className="h-2 w-2 rounded-full bg-current opacity-50" />
								{item}
							</div>
						))}
					</div>
				</aside>

				<div className="grid gap-5 p-5 sm:p-6">
					<section className="rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-card) p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-xs font-black uppercase tracking-[0.18em] text-(--landing-accent)">
									Overview
								</p>
								<h2 className="mt-2 text-2xl font-black text-(--landing-preview-text)">
									Your Dashboard
								</h2>
								<p className="mt-2 text-sm font-semibold text-(--landing-muted)">
									Scan your job search activity and jump into
									the next useful view.
								</p>
							</div>
							<div className="hidden rounded-lg border border-(--landing-preview-line) px-3 py-2 text-sm font-black text-(--landing-muted) sm:block">
								View Kanban
							</div>
						</div>
					</section>

					<section className="rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-card) p-5">
						<div>
							<p className="text-sm font-black text-(--landing-muted)">
								Offer success rate
							</p>
							<p className="mt-3 text-5xl font-black text-(--landing-preview-text)">
								21%
							</p>
						</div>
						<div className="mt-6 h-2 rounded-full bg-(--landing-preview-soft)">
							<div className="h-full w-[21%] rounded-full bg-(--landing-accent)" />
						</div>
						<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-(--landing-muted)">
							<span className="inline-flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-(--landing-accent)" />
								3 offers achieved
							</span>
							<span className="inline-flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-slate-400" />
								14 total applications
							</span>
						</div>
					</section>

					<div className="grid gap-5 lg:grid-cols-[1fr_280px]">
						<section className="rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-card) p-5">
							<div className="flex items-center justify-between border-b border-(--landing-preview-line) pb-4">
								<h3 className="font-black text-(--landing-preview-text)">
									Recent applications
								</h3>
								<span className="text-sm font-bold text-(--landing-muted)">
									+ Add application
								</span>
							</div>

							<div className="mt-5 grid gap-3">
								{[
									[
										"Frontend Engineer",
										"BrightLayer",
										"Interviewing",
									],
									[
										"Product Analyst",
										"Northstar Labs",
										"Assessment",
									],
									[
										"Graduate Developer",
										"CloudMint",
										"Applied",
									],
								].map(([role, company, status]) => (
									<div
										key={role}
										className="grid gap-3 rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-soft) p-4 sm:grid-cols-[1fr_auto] sm:items-center"
									>
										<div>
											<p className="font-black text-(--landing-preview-text)">
												{role}
											</p>
											<p className="mt-1 text-sm font-semibold text-(--landing-muted)">
												{company}
											</p>
										</div>
										<span className="w-fit rounded-full bg-(--landing-accent-soft) px-3 py-1 text-xs font-black text-(--landing-accent)">
											{status}
										</span>
									</div>
								))}
							</div>
						</section>

						<section className="rounded-xl border border-(--landing-preview-line) bg-(--landing-preview-card) p-5">
							<h3 className="font-black text-(--landing-preview-text)">
								Overview
							</h3>
							<div className="mt-5 grid gap-4">
								{[
									["Total applications", "14"],
									["Active roles", "9"],
									["Interviews", "3"],
									["Offers", "3"],
								].map(([label, value]) => (
									<div
										key={label}
										className="flex items-center justify-between gap-3"
									>
										<span className="text-sm font-semibold text-(--landing-muted)">
											{label}
										</span>
										<span className="text-lg font-black text-(--landing-preview-text)">
											{value}
										</span>
									</div>
								))}
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}

export function HomePage() {
	const [installPrompt, setInstallPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		function handleBeforeInstallPrompt(event: Event) {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		}

		window.addEventListener(
			"beforeinstallprompt",
			handleBeforeInstallPrompt,
		);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	async function handleInstallApp() {
		if (!installPrompt) return;

		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;

		if (choice.outcome === "accepted") {
			setInstallPrompt(null);
		}
	}

	return (
		<div className="landing-page min-h-screen bg-(--landing-bg) text-(--landing-text)">
			<MarketingNav />

			<main>
				{installPrompt && (
					<section className="border-b border-(--landing-line) bg-(--landing-section) px-5 py-4 sm:px-6 lg:px-8">
						<div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-black text-(--landing-text)">
									Install {APP_NAME} on this device
								</p>
								<p className="mt-1 text-sm font-semibold text-(--landing-muted)">
									Use it like an app and keep reminders,
									offline access, and your tracker close by.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => void handleInstallApp()}
									className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-(--landing-accent) px-4 text-sm font-black text-white shadow-(--landing-accent-shadow) transition hover:-translate-y-0.5"
								>
									<Download size={16} strokeWidth={2.5} />
									Install app
								</button>
								<ButtonLink
									to="/help"
									variant="secondary"
									tone="neutral"
								>
									Manual guide
								</ButtonLink>
							</div>
						</div>
					</section>
				)}

				<section className="mx-auto max-w-7xl px-5 pb-16 pt-20 text-center sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
					<div className="mx-auto inline-flex items-center gap-2 rounded-full border border-(--landing-accent-ring) bg-(--landing-accent-soft) px-4 py-2 text-sm font-extrabold text-(--landing-accent)">
						<Sparkles size={16} strokeWidth={2.5} />
						Built for focused job searches
					</div>

					<h1 className="mx-auto mt-8 max-w-5xl text-5xl font-extrabold leading-[1.03] tracking-normal sm:text-6xl lg:text-7xl">
						Track{" "}
						<span className="text-(--landing-accent)">
							every application
						</span>{" "}
						without losing the thread.
					</h1>

					<p className="mx-auto mt-7 max-w-2xl text-lg font-semibold leading-8 text-(--landing-muted)">
						{APP_NAME} keeps roles, deadlines, interviews, offers,
						and follow-ups in one calm workspace so the next action
						is always obvious.
					</p>

					<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<ButtonLink
							to="/signup"
							variant="primary"
							tone="accent"
							size="lg"
						>
							Start tracking
							<ArrowRight size={17} strokeWidth={2.5} />
						</ButtonLink>
						<ButtonLink
							to="/help"
							variant="secondary"
							tone="neutral"
							size="lg"
						>
							How does it work?
						</ButtonLink>
					</div>

					<BrowserPreview />
				</section>

				<section
					id="how-it-works"
					className="border-y border-(--landing-accent-ring) bg-(--landing-accent) text-white"
				>
					<div className="mx-auto grid max-w-4xl divide-y divide-white/18 px-5 py-7 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
						{stats.map((stat) => {
							const Icon = stat.icon;

							return (
								<div
									key={stat.label}
									className="flex items-center justify-center gap-4 py-4 sm:py-0"
								>
									<Icon
										size={24}
										strokeWidth={2.5}
										className="text-white/78"
									/>
									<div className="max-[640px]:text-center">
										<p className="text-3xl font-black leading-none">
											{stat.value}
										</p>
										<p className="mt-1 text-xs font-bold text-white/78">
											{stat.label}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				<section className="border-b border-(--landing-line) bg-(--landing-section) px-5 py-22 text-center sm:px-6 lg:px-8">
					<p className="text-sm font-black uppercase tracking-[0.18em] text-(--landing-accent)">
						How it helps
					</p>
					<h2 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
						Know where each opportunity stands
					</h2>
					<p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-(--landing-muted)">
						See what is active, what is waiting on you, and what
						needs a follow-up before the week gets noisy.
					</p>
				</section>

				<section className="bg-(--landing-footer) px-5 py-20 sm:px-6 lg:px-8">
					<div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 xl:grid-cols-4">
						{featureCards.map((card) => {
							const Icon = card.icon;

							return (
								<article
									key={card.title}
									className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6 shadow-xl shadow-black/5 hover:-translate-0.5 transition"
								>
									<div className="grid h-12 w-12 place-items-center rounded-xl bg-(--landing-accent) text-white shadow-(--landing-accent-shadow)">
										<Icon size={22} strokeWidth={2.5} />
									</div>
									<h3 className="mt-6 text-lg font-black">
										{card.title}
									</h3>
									<p className="mt-3 text-sm font-semibold leading-6 text-(--landing-muted)">
										{card.description}
									</p>
								</article>
							);
						})}
					</div>
				</section>

				<section className="border-y border-(--landing-line) bg-(--landing-section) px-5 py-22 text-center sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl">
						<div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-(--landing-accent) text-white shadow-(--landing-accent-shadow)">
							<Zap size={26} strokeWidth={2.5} />
						</div>
						<h2 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl">
							Start tracking your applications
						</h2>
						<p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-(--landing-muted)">
							Create an account to save roles, set follow-up
							dates, monitor your pipeline, and never lose track
							of your progress.
						</p>
						<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
							<ButtonLink
								to="/signup"
								variant="primary"
								tone="accent"
								size="lg"
							>
								Get started now
							</ButtonLink>
							<ButtonLink
								to="/help"
								variant="secondary"
								tone="neutral"
								size="lg"
							>
								Learn more
							</ButtonLink>
						</div>
					</div>
				</section>
			</main>

			<MarketingFooter />
		</div>
	);
}
