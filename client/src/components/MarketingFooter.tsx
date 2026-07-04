import { Link } from "react-router";
import { Logo } from "./ui/Logo";

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
							<div className="mt-5 grid gap-3 text-sm font-semibold text-(--landing-muted)">
								<Link to="/help">How it works</Link>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Support
							</p>
							<div className="mt-5 grid gap-3 text-sm font-semibold text-(--landing-muted)">
								<Link to="/contact">Contact us</Link>
								<Link to="/help">FAQ</Link>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Workspace
							</p>
							<div className="mt-5 grid gap-3 text-sm font-semibold text-(--landing-muted)">
								<Link to="/login">Log in</Link>
								<Link to="/signup">Sign up</Link>
							</div>
						</div>

						<div>
							<p className="font-black text-(--landing-text)">
								Legal
							</p>
							<div className="mt-5 grid gap-3 text-sm font-semibold text-(--landing-muted)">
								<Link to="/terms">Terms of service</Link>
								<Link to="/privacy">Privacy policy</Link>
								<Link to="/cookies">Cookie policy</Link>
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
