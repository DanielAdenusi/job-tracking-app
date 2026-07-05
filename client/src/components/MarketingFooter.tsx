import { Logo } from "./ui/Logo";
import { ButtonLink } from "./ui/Button";

export function MarketingFooter() {
	return (
		<footer className="border-t border-(--landing-line) bg-(--landing-footer)">
			<div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-5">
					<Logo hasTitle size={32} />

					<p className="max-w-md text-sm font-semibold leading-6 text-(--landing-muted)">
						A focused workspace for tracking applications,
						deadlines, interviews, and outcomes.
					</p>
				</div>

				<div className="mt-10 border-t border-(--landing-line) pt-10">
					<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<p className="font-black text-(--landing-text)">
								Product
							</p>
							<div className="mt-5 grid text-sm font-semibold text-(--landing-muted)">
								<ButtonLink
									variant="text"
									align="start"
									to="/help"
								>
									How it works
								</ButtonLink>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Support
							</p>
							<div className="mt-5 grid text-sm font-semibold text-(--landing-muted)">
								<ButtonLink
									variant="text"
									align="start"
									to="/contact"
								>
									Contact us
								</ButtonLink>
								<ButtonLink
									variant="text"
									align="start"
									to="/help"
								>
									FAQ
								</ButtonLink>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Workspace
							</p>
							<div className="mt-5 grid text-sm font-semibold text-(--landing-muted)">
								<ButtonLink
									variant="text"
									align="start"
									to="/login"
								>
									Log in
								</ButtonLink>
								<ButtonLink
									variant="text"
									align="start"
									to="/signup"
								>
									Sign up
								</ButtonLink>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Legal
							</p>
							<div className="mt-5 grid text-sm font-semibold text-(--landing-muted)">
								<ButtonLink
									variant="text"
									align="start"
									to="/terms"
								>
									Terms of service
								</ButtonLink>
								<ButtonLink
									variant="text"
									align="start"
									to="/privacy"
								>
									Privacy policy
								</ButtonLink>
								<ButtonLink
									variant="text"
									align="start"
									to="/cookies"
								>
									Cookie policy
								</ButtonLink>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-10 border-t border-(--landing-line) pt-8 text-center text-sm font-semibold text-(--landing-muted)">
					Making job search admin calmer.
				</div>
			</div>
		</footer>
	);
}
