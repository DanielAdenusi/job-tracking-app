import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { useAccountSettings } from "../context/AccountSettingsContext";
import { Logo } from "./ui/Logo";
import { ButtonLink } from "./ui/Button";
import { useAnimatedDisclosure } from "../hooks/useAnimatedDisclosure";

function OpenAppOrAuthSkeleton() {
	return (
		<div className="hidden sm:flex items-center gap-2 sm:gap-3">
			<div className="hidden animate-pulse rounded-lg bg-slate-200 h-10 w-10 sm:block sm:h-10 sm:w-20" />
		</div>
	);
}

export function MarketingNav() {
	const { user, isAuthLoading } = useAuth();
	const { settings, saveSettings, isLoadingSettings } = useAccountSettings();
	const {
		isOpen: isMenuOpen,
		isRendered: isMenuRendered,
		isClosing: isMenuClosing,
		open: openMenu,
		close: closeMenu,
	} = useAnimatedDisclosure();
	const [isDark, setIsDark] = useState(() => {
		if (settings.theme === "dark") return true;
		if (settings.theme === "light") return false;

		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	useEffect(() => {
		if (settings.theme !== "system") {
			setIsDark(settings.theme === "dark");
			return;
		}

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const updateResolvedTheme = () => setIsDark(mediaQuery.matches);

		updateResolvedTheme();
		mediaQuery.addEventListener("change", updateResolvedTheme);

		return () => {
			mediaQuery.removeEventListener("change", updateResolvedTheme);
		};
	}, [settings.theme]);

	useEffect(() => {
		if (!isMenuRendered) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.documentElement.classList.add("marketing-menu-open");

		return () => {
			document.body.style.overflow = originalOverflow;
			document.documentElement.classList.remove("marketing-menu-open");
		};
	}, [isMenuRendered]);

	async function toggleTheme() {
		await saveSettings({
			...settings,
			theme: isDark ? "light" : "dark",
		});
	}

	return (
		<header className="landing-nav sticky top-0 z-30 border-b border-(--landing-line) bg-(--landing-nav-bg) backdrop-blur-xl">
			<div className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
				<ButtonLink
					to="/"
					className="flex items-center gap-3 rounded-lg h-12"
					aria-label="JobMarkr home"
					variant="ghost"
				>
					<Logo size={32} hasTitle hideTitleOnMobile />
				</ButtonLink>

				<nav className="hidden items-center gap-8 text-sm font-bold text-(--landing-muted) md:flex">
					<Link
						to="/help"
						className="transition hover:text-(--landing-text)"
					>
						How it works
					</Link>
					<Link
						to="/contact"
						className="transition hover:text-(--landing-text)"
					>
						Contact
					</Link>
				</nav>

				<div className="flex items-center gap-2 sm:gap-3">
					<button
						type="button"
						onClick={() => void toggleTheme()}
						disabled={isLoadingSettings}
						className="grid h-10 w-10 place-items-center rounded-lg border border-(--landing-line) bg-(--landing-control) text-(--landing-text) transition hover:-translate-y-0.5 hover:border-(--landing-accent) disabled:cursor-not-allowed disabled:opacity-60 max-sm:hidden"
						aria-label={isDark ? "Use light mode" : "Use dark mode"}
						title={isDark ? "Use light mode" : "Use dark mode"}
					>
						{isDark ? (
							<Sun size={18} strokeWidth={2.4} />
						) : (
							<Moon size={18} strokeWidth={2.4} />
						)}
					</button>

					{isAuthLoading ? (
						<OpenAppOrAuthSkeleton />
					) : user ? (
						<ButtonLink
							to="/dashboard"
							variant="primary"
							tone="accent"
						>
							Open app
						</ButtonLink>
					) : (
						<div className="sm:flex sm:items-center sm:gap-2">
							<ButtonLink
								to="/login"
								variant="secondary"
								tone="accent"
								className="hidden text-(--landing-text) md:inline-flex"
							>
								Log in
							</ButtonLink>
							<ButtonLink
								to="/signup"
								variant="primary"
								tone="accent"
								className="hidden! sm:inline-flex!"
							>
								Sign up
							</ButtonLink>
						</div>
					)}

					<button
						type="button"
						onClick={openMenu}
						className="grid h-10 w-10 place-items-center rounded-lg border border-(--landing-line) bg-(--landing-control) text-(--landing-text) transition hover:-translate-y-0.5 hover:border-(--landing-accent) md:hidden"
						aria-label="Open menu"
						aria-expanded={isMenuOpen}
					>
						<Menu size={20} strokeWidth={2.5} />
					</button>
				</div>
			</div>

			{isMenuRendered && (
				<div
					className={[
						"marketing-menu-overlay fixed inset-0 z-50 h-screen w-screen md:hidden",
						isMenuOpen
							? "marketing-menu-overlay-open"
							: "marketing-menu-overlay-closed",
					].join(" ")}
				>
					<div
						aria-hidden="true"
						className="marketing-menu-backdrop absolute inset-0"
					/>
					<button
						type="button"
						aria-label="Close menu"
						onClick={closeMenu}
						className="absolute inset-0"
					/>

					<aside
						className={[
							"marketing-menu-panel absolute right-2 top-2 flex h-[calc(100svh-1rem)] w-[min(304px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-(--landing-line) bg-(--landing-card) text-(--landing-text) shadow-2xl shadow-black/35",
							isMenuClosing ? "pointer-events-none" : "",
						].join(" ")}
					>
						<div className="flex h-20 items-center justify-between border-b border-(--landing-line) px-5">
							<Link
								to="/"
								onClick={closeMenu}
								className="flex items-center gap-3"
							>
								<Logo size={36} hasTitle />
							</Link>

							<button
								type="button"
								onClick={closeMenu}
								aria-label="Close menu"
								className="grid h-10 w-10 place-items-center rounded-lg text-(--landing-muted) transition hover:bg-(--landing-control) hover:text-(--landing-text)"
							>
								<X size={22} strokeWidth={2.5} />
							</button>
						</div>

						<nav className="grid gap-6 px-6 py-8 text-xl font-black">
							<Link to="/help" onClick={closeMenu}>
								How it works
							</Link>
							<Link to="/contact" onClick={closeMenu}>
								Contact
							</Link>
						</nav>

						<div className="mt-auto grid gap-3 border-t border-(--landing-line) p-5">
							<button
								type="button"
								onClick={() => void toggleTheme()}
								disabled={isLoadingSettings}
								className="inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-40 rounded-lg font-bold border hover:shadow-sm hover:-translate-y-0.5 h-10 px-4 text-sm hover:bg-slate-50 border-(--landing-line) bg-(--landing-control) text-(--landing-text) hover:border-(--landing-accent)"
								aria-label={
									isDark ? "Use light mode" : "Use dark mode"
								}
								title={
									isDark ? "Use light mode" : "Use dark mode"
								}
							>
								{isDark ? (
									<Sun size={18} strokeWidth={2.4} />
								) : (
									<Moon size={18} strokeWidth={2.4} />
								)}

								{isDark ? "Light mode" : "Dark mode"}
							</button>

							{user ? (
								<ButtonLink
									to="/dashboard"
									variant="primary"
									tone="accent"
									onClick={closeMenu}
								>
									Open app
								</ButtonLink>
							) : (
								<>
									<ButtonLink
										to="/login"
										variant="secondary"
										tone="accent"
										onClick={closeMenu}
									>
										Log in
									</ButtonLink>
									<ButtonLink
										to="/signup"
										variant="primary"
										tone="accent"
										onClick={closeMenu}
									>
										Sign up
									</ButtonLink>
								</>
							)}
						</div>
					</aside>
				</div>
			)}
		</header>
	);
}
