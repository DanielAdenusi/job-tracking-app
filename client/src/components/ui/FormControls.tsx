import {
	forwardRef,
	type InputHTMLAttributes,
	type LabelHTMLAttributes,
	type ReactNode,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "./classes";

type FieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
	label?: string;
	required?: boolean;
	description?: string;
	error?: string;
	children: ReactNode;
};

export function Field({
	children,
	className,
	description,
	error,
	label,
	required,
	...props
}: FieldProps) {
	return (
		<label className={cn("grid gap-2", className)} {...props}>
			{label && (
				<span className="text-sm font-bold text-slate-700">
					{label}{" "}
					{required && <span className="text-red-600">*</span>}
				</span>
			)}
			{description && (
				<p className="text-xs font-medium leading-5 text-slate-500">
					{description}
				</p>
			)}
			{children}
			{error && (
				<span className="text-sm font-semibold text-red-600">
					{error}
				</span>
			)}
		</label>
	);
}

const controlClasses =
	"h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

export const TextInput = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
	<input ref={ref} className={cn(controlClasses, className)} {...props} />
));

TextInput.displayName = "TextInput";

type SearchInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "value" | "onChange"
> & {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	({ className, onChange, onClear, value, ...props }, ref) => (
		<span className="relative block w-full">
			<Search
				aria-hidden="true"
				size={17}
				strokeWidth={2.25}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
			/>
			<input
				ref={ref}
				type="text"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className={cn(controlClasses, "pl-10 pr-10", className)}
				{...props}
			/>
			{value && (
				<button
					type="button"
					onClick={onClear ?? (() => onChange(""))}
					aria-label="Clear search"
					className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
				>
					<X size={16} strokeWidth={2.6} />
				</button>
			)}
		</span>
	),
);

SearchInput.displayName = "SearchInput";

export const Select = forwardRef<
	HTMLSelectElement,
	SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
	<span className="relative block w-full">
		<select
			ref={ref}
			className={cn(
				controlClasses,
				"appearance-none px-3 pr-10",
				className,
			)}
			{...props}
		>
			{children}
		</select>
		<ChevronsUpDown
			aria-hidden="true"
			size={16}
			strokeWidth={2.4}
			className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
		/>
	</span>
));

Select.displayName = "Select";

export const Textarea = forwardRef<
	HTMLTextAreaElement,
	TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<textarea
		ref={ref}
		className={cn(
			"min-h-32 resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
));

Textarea.displayName = "Textarea";

type CheckboxProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	className?: string;
};

export function Checkbox({
	checked,
	className,
	label,
	onChange,
}: CheckboxProps) {
	return (
		<label
			className={cn(
				"inline-flex items-center gap-3 text-sm font-semibold text-slate-600",
				className,
			)}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
			/>
			{label}
		</label>
	);
}

type ToggleProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
};

export function Toggle({ checked, label, onChange }: ToggleProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"inline-flex h-6 w-12 shrink-0 items-center rounded-full p-1 transition",
				checked ? "bg-blue-600" : "bg-slate-300",
			)}
		>
			<span className="sr-only">{label}</span>
			<span
				className={cn(
					"grid h-4 w-4 place-items-center rounded-full bg-white text-blue-600 shadow-sm transition",
					checked ? "translate-x-6" : "translate-x-0",
				)}
			>
				{checked && <Check size={13} strokeWidth={3} />}
			</span>
		</button>
	);
}

type SegmentedControlProps<T extends string> = {
	value: T;
	options: { label: string; value: T }[];
	onChange: (value: T) => void;
	className?: string;
};

export function SegmentedControl<T extends string>({
	className,
	onChange,
	options,
	value,
}: SegmentedControlProps<T>) {
	return (
		<div
			className={cn(
				"inline-flex w-full rounded-lg bg-slate-100 p-1 md:w-auto",
				className,
			)}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					className={cn(
						"h-9 flex-1 rounded-md px-3 text-sm font-bold transition md:flex-none",
						value === option.value
							? "bg-white text-blue-700 shadow-sm"
							: "text-slate-500 hover:text-slate-950",
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
