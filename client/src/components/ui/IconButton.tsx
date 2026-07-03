import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./classes";
import { Link, type LinkProps } from "react-router";

type IconButtonTone = "neutral" | "accent" | "danger" | "dangerSoft" | "link";

type IconButtonVariant = "primary" | "secondary" | "ghost";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	label: string;
	tone?: IconButtonTone;
	variant?: IconButtonVariant;
};

type IconButtonLinkProps = LinkProps & IconButtonProps;

const variantClasses: Record<IconButtonVariant, string> = {
	primary: "app-accent-button shadow-sm hover:-translate-y-0.5",
	secondary: "border hover:-translate-y-0.5 hover:shadow-sm",
	ghost: "hover:-translate-y-0.5 hover:shadow-sm",
};

const toneClasses: Record<IconButtonTone, string> = {
	neutral:
		"icon-button-neutral text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600 hover:ring-slate-200",
	accent: "icon-button-accent app-accent-text hover:bg-slate-50 ",
	link: "icon-button-link text-blue-400 border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200",
	danger: "icon-button-danger text-red-400 border-red-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200",
	dangerSoft:
		"icon-button-danger-soft text-red-400 border-red-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
	(
		{
			children,
			className,
			label,
			tone = "neutral",
			variant = "ghost",
			type = "button",
			...props
		},
		ref,
	) => (
		<button
			ref={ref}
			type={type}
			aria-label={label}
			className={cn(
				"grid h-10 w-10 min-w-10 shrink-0 place-items-center rounded-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
				toneClasses[tone],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	),
);

IconButton.displayName = "IconButton";

export const IconButtonLink = forwardRef<
	HTMLAnchorElement,
	IconButtonLinkProps
>(
	(
		{
			children,
			className,
			label,
			tone = "neutral",
			variant = "ghost",
			type = "button",
			...props
		},
		ref,
	) => (
		<Link
			ref={ref}
			className={cn(
				"grid h-10 w-10 min-w-10 shrink-0 place-items-center rounded-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
				toneClasses[tone],
				variantClasses[variant],
				className,
			)}
			aria-label={label}
			{...props}
		>
			{children}
		</Link>
	),
);

IconButtonLink.displayName = "IconButtonLink";
