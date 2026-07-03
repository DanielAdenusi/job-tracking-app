import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
	const handleGoBack = () => {
		const canGoBack = window.history.length > 1;
		if (canGoBack) {
			window.history.back();
		} else {
			window.location.href = "/dashboard";
		}
	};

	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-950">
			<section className="w-full max-w-lg rounded-xl p-6 text-center">
				<Button
					variant="ghost"
					icon={<ArrowLeft size={16} />}
					className="my-6 cursor-pointer"
					onClick={handleGoBack}
				>
					Go to dashboard
				</Button>

				<p className="text-8xl font-bold uppercase tracking-wide ">
					404
				</p>

				<h1 className="mt-2 text-md font-medium tracking-tight text-slate-300">
					Page not found
				</h1>
			</section>
		</main>
	);
}
