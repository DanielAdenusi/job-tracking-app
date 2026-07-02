import type { ReactNode } from "react";
import { cn } from "./classes";

type SurfaceProps = {
	children: ReactNode;
	className?: string;
};

export function Card({ children, className }: SurfaceProps) {
	return (
		<section
			className={cn(
				"rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40",
				className,
			)}
		>
			{children}
		</section>
	);
}

export function EmptyState({ children, className }: SurfaceProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
	return (
		<div className={cn("text-center", className)}>
			<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
			{label && <p className="mt-4 font-bold text-slate-700">{label}</p>}
		</div>
	);
}
