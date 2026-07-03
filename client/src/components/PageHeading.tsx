import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PageHeadingItem = {
	label: string;
	icon: LucideIcon;
};

type PageHeadingAction = {
	label: string;
	to?: string;
	icon: LucideIcon;
	variant?: "primary" | "secondary";
};

type PageHeadingProps = {
	eyebrow: string;
	title: string;
	description: string;
	items?: PageHeadingItem[];
	actions?: PageHeadingAction[];
	renderAction?: (action: PageHeadingAction) => ReactNode;
};

export type { PageHeadingAction };

export function PageHeading({
	eyebrow,
	title,
	description,
	actions = [],
	renderAction,
}: PageHeadingProps) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="max-w-2xl">
					<p className="app-accent-text text-xs font-black uppercase tracking-[0.16em]">
						{eyebrow}
					</p>
					<h2 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
						{title}
					</h2>
					<p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
						{description}
					</p>
				</div>

				{actions.length > 0 && renderAction && (
					<div className="flex shrink-0 flex-wrap items-center gap-2">
						{actions.map((action) => renderAction(action))}
					</div>
				)}
			</div>
		</div>
	);
}
