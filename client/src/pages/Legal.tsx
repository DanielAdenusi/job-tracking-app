import { Cookie, FileText, Scale, ShieldCheck } from "lucide-react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNav } from "../components/MarketingNav";
import { APP_NAME } from "../constants/pageTitle";

type LegalSection = {
	title: string;
	body: string;
};

type LegalPageContent = {
	eyebrow: string;
	title: string;
	description: string;
	icon: typeof Scale;
	sections: LegalSection[];
};

const lastUpdated = "4 July 2026";

const legalPages = {
	terms: {
		eyebrow: "Terms of service",
		title: "Terms of service",
		description:
			"The basic rules for using JobMarkr and keeping your job search workspace reliable.",
		icon: FileText,
		sections: [
			{
				title: "Using the service",
				body: `${APP_NAME} helps you save and organise job applications, notes, dates, and account settings. You are responsible for the information you add and for keeping your account details accurate.`,
			},
			{
				title: "Your account",
				body: "You should keep your login details secure and tell us if you think someone else has accessed your account. Account features may depend on a verified email address.",
			},
			{
				title: "Acceptable use",
				body: "Do not use the service to upload unlawful, harmful, abusive, or misleading content, or to interfere with the security, availability, or integrity of the app.",
			},
			{
				title: "Availability and changes",
				body: "We aim to keep the service useful and available, but we may update, pause, or remove features as the product changes. We are not liable for missed opportunities, lost data, or decisions made from information stored in the app.",
			},
			{
				title: "Contact",
				body: "Questions about these terms can be sent through the contact page.",
			},
		],
	},
	privacy: {
		eyebrow: "Privacy policy",
		title: "Privacy policy",
		description:
			"How JobMarkr handles account details and the job search information you choose to store.",
		icon: ShieldCheck,
		sections: [
			{
				title: "Information we collect",
				body: "We collect account information such as your email address and display name, plus the applications, notes, statuses, dates, and settings you add while using the app.",
			},
			{
				title: "How we use information",
				body: "We use your information to provide the app, authenticate your account, save your applications, show dashboard summaries, support exports, and respond to support requests.",
			},
			{
				title: "Authentication and storage",
				body: "Authentication is handled with Firebase. Application and account data is stored by the app backend so it can be shown only to the signed-in account it belongs to.",
			},
			{
				title: "Your choices",
				body: "You can update account settings, export your application data, sign out, or request account deletion from the app. Deleting your account permanently removes your saved workspace data.",
			},
			{
				title: "Support contact",
				body: "For privacy questions or requests, use the contact page and include the email address associated with your account.",
			},
		],
	},
	cookies: {
		eyebrow: "Cookie policy",
		title: "Cookie policy",
		description:
			"What JobMarkr stores in your browser and why the app currently keeps this simple.",
		icon: Cookie,
		sections: [
			{
				title: "Cookies",
				body: "JobMarkr does not currently set advertising, analytics, or marketing cookies. If that changes, this page should be updated before those tools are added.",
			},
			{
				title: "Essential browser storage",
				body: "Firebase authentication and the app may use essential browser storage to keep you signed in, remember local account preferences, and support offline application drafts or cached changes.",
			},
			{
				title: "Managing storage",
				body: "You can clear site data through your browser settings. Clearing site data may sign you out, remove local preferences, or remove unsynced offline changes.",
			},
			{
				title: "Future changes",
				body: "If cookies are added for analytics, preferences, or product improvements, this policy should explain what is used, why it is used, and how users can control it.",
			},
		],
	},
} satisfies Record<string, LegalPageContent>;

function LegalDocumentPage({ content }: { content: LegalPageContent }) {
	const Icon = content.icon;

	return (
		<div className="landing-page min-h-screen bg-(--landing-bg) text-(--landing-text)">
			<MarketingNav />

			<main>
				<section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-6 lg:px-8 lg:pt-24">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-(--landing-accent-ring) bg-(--landing-accent-soft) px-4 py-2 text-sm font-black text-(--landing-accent)">
							<Icon size={16} strokeWidth={2.5} />
							{content.eyebrow}
						</div>

						<h1 className="mt-8 text-5xl font-black leading-tight tracking-normal sm:text-6xl">
							{content.title}
						</h1>
						<p className="mt-6 text-lg font-semibold leading-8 text-(--landing-muted)">
							{content.description}
						</p>
						<p className="mt-5 text-sm font-bold text-(--landing-muted)">
							Last updated: {lastUpdated}
						</p>
					</div>
				</section>

				<section className="border-y border-(--landing-line) bg-(--landing-section) py-16">
					<div className="mx-auto grid max-w-6xl gap-4 px-5 sm:px-6 lg:px-8">
						{content.sections.map((section) => (
							<article
								key={section.title}
								className="rounded-2xl border border-(--landing-line) bg-(--landing-card) p-6 sm:p-8"
							>
								<h2 className="text-2xl font-black">
									{section.title}
								</h2>
								<p className="mt-4 text-sm font-semibold leading-6 text-(--landing-muted)">
									{section.body}
								</p>
							</article>
						))}
					</div>
				</section>

				<section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
					<p className="max-w-3xl text-sm font-semibold leading-6 text-(--landing-muted)">
						This page is intended as product information for users
						and should be reviewed by a qualified legal professional
						before relying on it as formal legal advice.
					</p>
				</section>
			</main>

			<MarketingFooter />
		</div>
	);
}

export function TermsOfServicePage() {
	return <LegalDocumentPage content={legalPages.terms} />;
}

export function PrivacyPolicyPage() {
	return <LegalDocumentPage content={legalPages.privacy} />;
}

export function CookiePolicyPage() {
	return <LegalDocumentPage content={legalPages.cookies} />;
}
