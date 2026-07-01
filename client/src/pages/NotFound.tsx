import { Link } from "react-router";

export function NotFoundPage() {
	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-950">
			<section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<p className="text-sm font-extrabold uppercase tracking-wide text-blue-600">
					404
				</p>

				<h1 className="mt-2 text-3xl font-extrabold tracking-tight">
					Page not found
				</h1>

				<p className="mt-3 leading-7 text-slate-600">
					The page you are looking for does not exist.
				</p>

				<Link
					to="/dashboard"
					className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
				>
					Go to dashboard
				</Link>
			</section>
		</main>
	);
}
