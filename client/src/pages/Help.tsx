import {
	BookOpen,
	CheckCircle2,
	Clock3,
	Columns3,
	LifeBuoy,
	ShieldCheck,
} from "lucide-react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNav } from "../components/MarketingNav";
import { ButtonLink } from "../components/ui/Button";

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
] as const;

export function HelpPage() {
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
