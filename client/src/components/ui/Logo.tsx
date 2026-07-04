import type { CSSProperties } from "react";
import { APP_NAME_SPLIT } from "../../constants/pageTitle";
import { cn } from "./classes";

type LogoTone = "accent" | "monochrome" | "white" | "black";
type LogoSize = 16 | 18 | 20 | 24 | 28 | 32 | 36 | 40;
type LogoStrokeWidth = 0.8 | 1 | 1.2 | 1.4 | 1.6 | 1.8 | 2 | 2.2;
type LogoVariant = "fill" | "outline";
type LogoBackground = "none" | "all" | "icon" | "text";

type LogoStyle = CSSProperties & {
	"--logo-background"?: string;
	"--logo-mark"?: string;
	"--logo-check"?: string;
	"--logo-text"?: string;
	"--logo-text-accent"?: string;
};

type LogoProps = {
	size?: LogoSize;
	strokeWidth?: LogoStrokeWidth;
	tone?: LogoTone;
	variant?: LogoVariant;
	background?: LogoBackground;
	backgroundColor?: string;
	markColor?: string;
	checkColor?: string;
	textColor?: string;
	accentTextColor?: string;
	className?: string;
	iconClassName?: string;
	textClassName?: string;
	hasTitle?: boolean;
	hideTitleOnMobile?: boolean;
	style?: LogoStyle;
};

const logoToneClasses: Record<LogoTone, string> = {
	accent: "app-accent-text",
	monochrome: "text-slate-950 dark:text-slate-50",
	white: "text-white",
	black: "text-black",
};

const sizeToStrokeWidth: Record<LogoSize, LogoStrokeWidth> = {
	16: 0.8,
	18: 1,
	20: 1.2,
	24: 1.4,
	28: 1.6,
	32: 1.8,
	36: 2,
	40: 2.2,
};

export function Logo({
	size = 28,
	strokeWidth,
	tone = "accent",
	variant = "fill",
	background = "none",
	backgroundColor = "var(--app-accent, #14aaa0)",
	markColor,
	checkColor,
	textColor,
	accentTextColor,
	className,
	iconClassName,
	textClassName,
	hasTitle = false,
	hideTitleOnMobile = false,
	style,
}: LogoProps) {
	const resolvedStrokeWidth = strokeWidth ?? sizeToStrokeWidth[size];

	const hasBackgroundOnAll = background === "all";
	const hasBackgroundOnIcon = background === "icon";
	const hasBackgroundOnText = background === "text";

	const hasVisibleBackground = hasBackgroundOnAll || hasBackgroundOnIcon;

	const logoStyle: LogoStyle = {
		"--logo-background": backgroundColor,

		"--logo-mark":
			markColor ?? (hasVisibleBackground ? "white" : "currentColor"),

		"--logo-check":
			checkColor ??
			(hasVisibleBackground ? "var(--logo-background)" : "white"),

		"--logo-text":
			textColor ??
			(hasBackgroundOnAll || hasBackgroundOnText
				? "light-dark(rgb(15 23 42), rgb(255, 255, 255))"
				: "light-dark(rgb(30 41 59), rgb(255, 255, 255))"),
		"--logo-text-accent":
			accentTextColor ??
			(hasBackgroundOnAll || hasBackgroundOnText
				? "white"
				: "var(--logo-background)"),

		...style,
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-2",
				hasBackgroundOnAll && "rounded-xl px-3 py-2",
				logoToneClasses[tone],
				className,
			)}
			style={{
				...logoStyle,
				backgroundColor: hasBackgroundOnAll
					? "var(--logo-background)"
					: undefined,
			}}
		>
			<span
				className={cn(
					"inline-flex shrink-0 items-center justify-center",
					hasBackgroundOnIcon && "rounded-lg p-1",
					iconClassName,
				)}
				style={{
					backgroundColor: hasBackgroundOnIcon
						? "var(--logo-background)"
						: undefined,
				}}
			>
				<svg
					aria-hidden="true"
					width={size}
					height={size}
					viewBox="0 0 24 24"
					className="block"
				>
					<path
						d="M6 3H18V21L12 16.5L6 21V3Z"
						fill={variant === "fill" ? "var(--logo-mark)" : "none"}
						stroke={
							variant === "outline"
								? "var(--logo-mark)"
								: undefined
						}
						strokeWidth={
							variant === "outline"
								? resolvedStrokeWidth
								: undefined
						}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>

					<path
						d="M9 11.3L11.1 13.4L15.2 9"
						fill="none"
						stroke="var(--logo-check)"
						strokeWidth={resolvedStrokeWidth}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</span>

			{hasTitle && (
				<span
					className={cn(
						"truncate rounded-lg font-extrabold text-lg tracking-tight",
						hasBackgroundOnText && "px-2 py-1",
						hideTitleOnMobile && "hidden sm:inline",
						textClassName,
					)}
					style={{
						backgroundColor: hasBackgroundOnText
							? "var(--logo-background)"
							: undefined,
						color: "var(--logo-text)",
					}}
				>
					{APP_NAME_SPLIT[0]}
					<span style={{ color: "var(--logo-text-accent)" }}>
						{APP_NAME_SPLIT[1]}
					</span>
				</span>
			)}
		</div>
	);
}

Logo.displayName = "Logo";
