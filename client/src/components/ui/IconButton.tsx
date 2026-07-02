import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./classes";

type IconButtonTone = "neutral" | "primary" | "danger";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	label: string;
	tone?: IconButtonTone;
};

const toneClasses: Record<IconButtonTone, string> = {
	neutral: "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
	primary: "text-slate-400 hover:bg-slate-50 hover:text-blue-600",
	danger: "text-slate-400 hover:bg-red-50 hover:text-red-600",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
	({ children, className, label, tone = "neutral", type = "button", ...props }, ref) => (
		<button
			ref={ref}
			type={type}
			aria-label={label}
			className={cn(
				"grid h-10 w-10 place-items-center rounded-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
				toneClasses[tone],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	),
);

IconButton.displayName = "IconButton";
