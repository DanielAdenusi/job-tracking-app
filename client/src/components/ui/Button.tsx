import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "./classes";
import { Spinner } from "./Surface";
import "./Button.css";

type ButtonTone = "neutral" | "accent" | "danger" | "link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "text";

type ButtonSize = "sm" | "md" | "lg" | "inline";

type IconPosition = "start" | "end";

type ButtonAlign = "start" | "center" | "end";

type ButtonType = "button" | "submit" | "reset";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	tone?: ButtonTone;
	isLoading?: boolean;
	iconPosition?: IconPosition;
	align?: ButtonAlign;
};

type ButtonLinkProps = LinkProps & ButtonProps;

const baseVariantClass = "hover:shadow-sm hover:-translate-y-0.5";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
	primary: `button button-primary border shadow-sm ${baseVariantClass}`,
	secondary: `button button-secondary border ${baseVariantClass}`,
	ghost: `button button-ghost ${baseVariantClass}`,
	text: `button button-text underline decoration-transparent hover:decoration-current`,
};

export const buttonToneClasses: Record<ButtonTone, string> = {
	neutral: "button-tone-neutral",
	accent: "button-tone-accent",
	link: "button-tone-link",
	danger: "button-tone-danger",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-11 px-5 text-sm",
	inline: "text-sm ms-1",
};

const buttonAlignClasses: Record<ButtonAlign, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
};

function getDefaultTone(variant: ButtonVariant): ButtonTone {
	if (variant === "primary") return "accent";

	return "neutral";
}

function resolveButtonClasses({
	variant,
	tone,
}: {
	variant: ButtonVariant;
	tone?: ButtonTone;
}) {
	return {
		variantClass: buttonVariantClasses[variant],
		toneClass: buttonToneClasses[tone ?? getDefaultTone(variant)],
	};
}

export function buttonClassNames({
	className,
	size = "md",
	variant = "secondary",
	tone,
	type,
	align,
}: {
	className?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
	tone?: ButtonTone;
	type?: ButtonType;
	align?: ButtonAlign;
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

	const baseClasses = `inline-flex items-center gap-2 transition disabled:cursor-not-allowed ${extraClass}`;

	const combinedClassName = cn(
		baseClasses,
		variantClass,
		buttonAlignClasses[align ?? "center"],
		isTextVariant
			? buttonSizeClasses[size]
					.replace(/(?:^|\s)px-\S+(?=\s|$)/g, "")
					.replace(/\s+/g, " ")
					.trim()
			: buttonSizeClasses[size],
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
			align = "center",
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
				align,
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
			align = "center",
			...props
		},
		ref,
	) => (
		<Link
			ref={ref}
			className={buttonClassNames({
				className,
				size,
				variant,
				tone,
				align,
			})}
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
