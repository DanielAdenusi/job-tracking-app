import type { ReactNode } from "react";
import { cn } from "./classes";

type SurfaceProps = {
	children: ReactNode;
	className?: string;
};

type SpinnerSize = "sm" | "md" | "lg";

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

export function Spinner({
	label,
	className,
	size,
}: {
	label?: string;
	className?: string;
	size?: SpinnerSize;
}) {
	const sizeClasses = {
		sm: "h-4 w-4 border-2",
		md: "h-10 w-10 border-4",
		lg: "h-16 w-16 border-4",
	};

	return (
		<div className={cn("text-center", className)}>
			<div
				className={cn(
					"mx-auto animate-spin rounded-full border-slate-200 border-t-blue-600",
					sizeClasses[size ?? "md"],
				)}
			/>
			{label && <p className="mt-2 font-bold text-slate-700">{label}</p>}
		</div>
	);
}
