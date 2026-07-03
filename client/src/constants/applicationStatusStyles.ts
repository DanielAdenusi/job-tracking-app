import type { ApplicationStatus } from "./applicationOptions";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
	wishlist: "Wishlist",
	saved: "Saved",
	applied: "Applied",
	assessment: "Assessment",
	interviewing: "Interviewing",
	offer: "Offer",
	rejected: "Rejected",
	withdrawn: "Withdrawn",
};

export const applicationStatusBadgeClasses: Record<ApplicationStatus, string> =
	{
		wishlist:
			"status-badge status-badge-wishlist bg-sky-100 text-sky-900 ring-sky-300",
		saved: "status-badge status-badge-saved bg-cyan-100 text-cyan-900 ring-cyan-300",
		applied:
			"status-badge status-badge-applied bg-indigo-100 text-indigo-900 ring-indigo-300",
		assessment:
			"status-badge status-badge-assessment bg-violet-100 text-violet-900 ring-violet-300",
		interviewing:
			"status-badge status-badge-interviewing bg-amber-100 text-amber-900 ring-amber-300",
		offer: "status-badge status-badge-offer bg-emerald-100 text-emerald-900 ring-emerald-300",
		rejected:
			"status-badge status-badge-rejected bg-rose-100 text-rose-900 ring-rose-300",
		withdrawn:
			"status-badge status-badge-withdrawn bg-zinc-100 text-zinc-900 ring-zinc-300",
	};

export const applicationStatusColumnClasses: Record<ApplicationStatus, string> =
	{
		wishlist:
			"status-column status-column-wishlist border-sky-200 border-t-4 border-t-sky-400 bg-white",
		saved: "status-column status-column-saved border-cyan-200 border-t-4 border-t-cyan-400 bg-white",
		applied:
			"status-column status-column-applied border-indigo-200 border-t-4 border-t-indigo-400 bg-white",
		assessment:
			"status-column status-column-assessment border-violet-200 border-t-4 border-t-violet-500 bg-white",
		interviewing:
			"status-column status-column-interviewing border-amber-200 border-t-4 border-t-amber-400 bg-white",
		offer: "status-column status-column-offer border-emerald-200 border-t-4 border-t-emerald-400 bg-white",
		rejected:
			"status-column status-column-rejected border-rose-200 border-t-4 border-t-rose-400 bg-white",
		withdrawn:
			"status-column status-column-withdrawn border-zinc-300 border-t-4 border-t-zinc-500 bg-white",
	};
