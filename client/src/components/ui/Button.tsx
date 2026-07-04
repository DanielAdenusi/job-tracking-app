import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "./classes";
import { Spinner } from "./Surface";

type ButtonTone = "neutral" | "accent" | "danger" | "dangerSoft" | "link";

type ButtonStyleVariant = "primary" | "secondary" | "ghost" | "text";

type ButtonVariant = ButtonStyleVariant | ButtonTone;

type ButtonSize = "sm" | "md" | "lg" | "inline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	tone?: ButtonTone;
	isLoading?: boolean;
	iconPosition?: "start" | "end";
};

type ButtonLinkProps = LinkProps & ButtonProps;

const baseVariantClass = "hover:shadow-sm hover:-translate-y-0.5";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
	primary: `app-accent-button shadow-sm ${baseVariantClass}`,
	secondary: `border ${baseVariantClass}`,
	ghost: `!bg-transparent ${baseVariantClass}`,
	text: `underline decoration-transparent hover:decoration-current`,
	neutral: `border ${baseVariantClass}`,
	accent: `border ${baseVariantClass}`,
	link: `hover:ring-1 ${baseVariantClass}`,
	danger: `border ${baseVariantClass}`,
	dangerSoft: `border ${baseVariantClass}`,
};

export const buttonToneClasses: Record<ButtonTone, string> = {
	neutral:
		"button-neutral bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:ring-slate-200",
	accent: "button-accent app-accent-text hover:bg-slate-50 ",
	link: "button-link text-slate-400 border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200",
	danger: "button-danger text-red-400 border-red-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200",
	dangerSoft:
		"button-danger-soft text-red-400 border-red-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-5 text-sm",
	inline: "text-sm ms-1",
};

const toneVariants = new Set<ButtonVariant>([
	"neutral",
	"accent",
	"danger",
	"dangerSoft",
	"link",
]);

function isButtonTone(variant: ButtonVariant): variant is ButtonTone {
	return toneVariants.has(variant);
}

function resolveButtonClasses({
	variant,
	tone,
}: {
	variant: ButtonVariant;
	tone?: ButtonTone;
}) {
	const resolvedTone = tone ?? (isButtonTone(variant) ? variant : undefined);

	return {
		variantClass: buttonVariantClasses[variant],
		toneClass:
			resolvedTone || variant !== "primary"
				? buttonToneClasses[resolvedTone ?? "neutral"]
				: undefined,
	};
}

export function buttonClassNames({
	className,
	size = "md",
	variant = "secondary",
	tone,
	type,
}: {
	className?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
	tone?: ButtonTone;
	type?: "button" | "submit" | "reset";
}) {
	const { variantClass, toneClass } = resolveButtonClasses({ variant, tone });

	const isTextVariant = variant === "text";
	const isSubmitButton = type === "submit";

	const extraClass = [
		!isTextVariant && "rounded-lg font-bold",
		isSubmitButton && "cursor-pointer",
	]
		.filter(Boolean)
		.join(" ");

	const baseClasses = `inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${extraClass}`;

	const combinedClassName = cn(
		baseClasses,
		variantClass,
		buttonSizeClasses[size],
		!isTextVariant ? toneClass : undefined,
		className,
	);

	return combinedClassName;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			type = "button",
			tone,
			variant = "secondary",
			size = "md",
			icon,
			iconPosition = "start",
			isLoading,
			...props
		},
		ref,
	) => (
		<button
			ref={ref}
			type={type}
			className={buttonClassNames({
				className,
				size,
				variant,
				tone,
				type,
			})}
			{...props}
		>
			{iconPosition === "start" &&
				(isLoading ? <Spinner size="sm" /> : icon)}
			{children}
			{iconPosition === "end" &&
				(isLoading ? <Spinner size="sm" /> : icon)}
		</button>
	),
);

Button.displayName = "Button";

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
	(
		{
			children,
			className,
			tone,
			variant = "secondary",
			size = "md",
			icon,
			iconPosition = "start",
			isLoading,
			...props
		},
		ref,
	) => (
		<Link
			ref={ref}
			className={buttonClassNames({ className, size, variant, tone })}
			{...props}
		>
			{iconPosition === "start" &&
				(isLoading ? <Spinner size="sm" /> : icon)}
			{children}
			{iconPosition === "end" &&
				(isLoading ? <Spinner size="sm" /> : icon)}
		</Link>
	),
);

ButtonLink.displayName = "ButtonLink";
