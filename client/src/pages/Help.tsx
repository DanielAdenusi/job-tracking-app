import {
	BookOpen,
	Bell,
	CheckCircle2,
	Clock3,
	Columns3,
	Download,
	LifeBuoy,
	ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNav } from "../components/MarketingNav";
import { ButtonLink } from "../components/ui/Button";
import { useAuth } from "../auth/useAuth";

const helpSections = [
	{
		title: "Build your tracker",
		description:
			"Add roles with company details, source, salary, notes, and important dates. Start rough, then fill in details as you learn more.",
		icon: BookOpen,
	},
	{
		title: "Use statuses consistently",
		description:
			"Keep each role in one clear stage: wishlist, saved, applied, assessment, interviewing, offer, rejected, or withdrawn.",
		icon: Columns3,
	},
	{
		title: "Plan the next action",
		description:
			"Set follow-up dates and interview times so the dashboard can surface what needs attention.",
		icon: Clock3,
	},
	{
		title: "Secure your account",
		description:
			"Verify your email, keep your password current, and use account deletion or session sign-out from Settings when needed.",
		icon: ShieldCheck,
	},
] as const;

const faqs = [
	{
		question: "Can I use JobMarkr as a table or a board?",
		answer: "Yes. The applications table is best for searching and comparing details. The Kanban board is best for moving roles through your pipeline.",
	},
	{
		question: "What happens when I delete my account?",
		answer: "Your Firebase auth account, saved settings, and tracked applications are permanently removed.",
	},
	{
		question: "Why should I verify my email?",
		answer: "Verification protects sensitive account changes and makes recovery flows more reliable.",
	},
	{
		question: "Can I export my applications?",
		answer: "Yes. Account settings include CSV export for spreadsheets and JSON export for a fuller backup.",
	},
	{
		question: "Where do I manage reminders and notifications?",
		answer: "Open Account settings, then the Notifications tab. From there you can choose reminder types, browser delivery, and the default reminder timing.",
	},
] as const;

export function HelpPage() {
	const { user } = useAuth();
	const location = useLocation();

	useEffect(() => {
		if (!location.hash) return;

		const target = document.getElementById(location.hash.slice(1));
		if (!target) return;

		const scrollTimer = window.setTimeout(() => {
			const header = document.querySelector<HTMLElement>(".landing-nav");
			const headerOffset = (header?.offsetHeight ?? 80) + 32;
			const targetTop =
				target.getBoundingClientRect().top + window.scrollY;

			window.scrollTo({
				top: Math.max(targetTop - headerOffset, 0),
				behavior: "smooth",
			});
		}, 0);

		return () => window.clearTimeout(scrollTimer);
	}, [location.hash]);

	return (
		<div className="landing-page min-h-screen bg-(--landing-bg) text-(--landing-text)">
			<MarketingNav />

			<main>
				<section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-(--landing-accent-ring) bg-(--landing-accent-soft) px-4 py-2 text-sm font-black text-(--landing-accent)">
							<LifeBuoy size={16} strokeWidth={2.5} />
							Help center
						</div>

						<h1 className="mt-8 text-5xl font-black leading-tight tracking-normal sm:text-6xl">
							Get the most out of{" "}
							<span className="text-(--landing-accent)">
								JobMarkr
							</span>
							.
						</h1>
						<p className="mt-6 text-lg font-semibold leading-8 text-(--landing-muted)">
							A quick guide to tracking roles, keeping your
							pipeline clean, and protecting your account.
						</p>
					</div>

					<div className="mt-12 grid gap-4 md:grid-cols-2">
						{helpSections.map((section) => {
							const Icon = section.icon;

							return (
								<article
									key={section.title}
									className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6"
								>
									<div className="grid h-11 w-11 place-items-center rounded-lg bg-(--landing-accent-soft) text-(--landing-accent)">
										<Icon size={22} strokeWidth={2.5} />
									</div>
									<h2 className="mt-5 text-xl font-black">
										{section.title}
									</h2>
									<p className="mt-3 text-sm font-semibold leading-6 text-(--landing-muted)">
										{section.description}
									</p>
								</article>
							);
						})}
					</div>
				</section>

				<section className="border-y border-(--landing-line) bg-(--landing-section) py-16">
					<div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
						<div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
							<div>
								<p className="text-sm font-black uppercase tracking-[0.18em] text-(--landing-accent)">
									FAQ
								</p>
								<h2 className="mt-4 text-4xl font-black leading-tight">
									Answers for common setup questions.
								</h2>
							</div>

							<div className="grid gap-4">
								{faqs.map((faq) => (
									<article
										key={faq.question}
										className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6"
									>
										<h3 className="font-black">
											{faq.question}
										</h3>
										<p className="mt-3 text-sm font-semibold leading-6 text-(--landing-muted)">
											{faq.answer}
										</p>
									</article>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
					<div className="grid gap-5 lg:grid-cols-2">
						<article
							id="install"
							className="scroll-mt-32 rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6 sm:p-8"
						>
							<div className="grid h-12 w-12 place-items-center rounded-xl bg-(--landing-accent-soft) text-(--landing-accent)">
								<Download size={24} strokeWidth={2.5} />
							</div>
							<h2 className="mt-6 text-2xl font-black">
								Install JobMarkr as an app
							</h2>
							<p className="mt-3 text-sm font-semibold leading-6 text-(--landing-muted)">
								If your browser supports installation, the home
								page can show an install prompt. You can also
								install it manually from your browser.
							</p>
							<ol className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-(--landing-muted)">
								<li>
									<span className="font-black text-(--landing-text)">
										1.
									</span>{" "}
									Open JobMarkr in Chrome, Edge, or another
									PWA-capable browser.
								</li>
								<li>
									<span className="font-black text-(--landing-text)">
										2.
									</span>{" "}
									Use the browser menu or address-bar install
									icon and choose Install app.
								</li>
								<li>
									<span className="font-black text-(--landing-text)">
										3.
									</span>{" "}
									Open the installed app and enable
									notifications so reminders can work.
								</li>
							</ol>
						</article>

						<article className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6 sm:p-8">
							<div className="grid h-12 w-12 place-items-center rounded-xl bg-(--landing-accent-soft) text-(--landing-accent)">
								<Bell size={24} strokeWidth={2.5} />
							</div>
							<h2 className="mt-6 text-2xl font-black">
								Notification options
							</h2>
							<p className="mt-3 text-sm font-semibold leading-6 text-(--landing-muted)">
								Notifications power follow-up, deadline,
								assessment, interview, and offer reminders. You
								can choose which reminder types are active and
								how far ahead they fire.
							</p>
							<div className="mt-6">
								<ButtonLink
									to={
										user
											? "/account/notifications"
											: "/login"
									}
									variant="primary"
									tone="accent"
								>
									{user
										? "Open notification settings"
										: "Log in to manage notifications"}
								</ButtonLink>
							</div>
						</article>
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
					<div className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6 sm:p-8">
						<div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
							<div>
								<div className="flex items-center gap-3">
									<CheckCircle2
										size={24}
										strokeWidth={2.5}
										className="text-(--landing-accent)"
									/>
									<h2 className="text-2xl font-black">
										Still need help?
									</h2>
								</div>
								<p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-(--landing-muted)">
									Send a support message with the page you
									were on and what you expected to happen.
								</p>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row">
								<ButtonLink
									to="/dashboard"
									variant="primary"
									tone="accent"
								>
									Open dashboard
								</ButtonLink>
								<ButtonLink to="/contact" variant="secondary">
									Contact support
								</ButtonLink>
							</div>
						</div>
					</div>
				</section>
			</main>

			<MarketingFooter />
		</div>
	);
}
