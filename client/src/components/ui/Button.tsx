import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./classes";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700",
	secondary:
		"border border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm",
	ghost:
		"bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200",
	danger:
		"bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700",
	dangerSoft:
		"border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			type = "button",
			variant = "secondary",
			size = "md",
			icon,
			...props
		},
		ref,
	) => (
		<button
			ref={ref}
			type={type}
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
				variantClasses[variant],
				sizeClasses[size],
				className,
			)}
			{...props}
		>
			{icon}
			{children}
		</button>
	),
);

Button.displayName = "Button";
