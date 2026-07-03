import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";

type ConfirmationModalProps = {
	isOpen: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	isProcessing?: boolean;
	tone?: "danger";
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmationModal({
	isOpen,
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	isProcessing = false,
	tone = "danger",
	onConfirm,
	onCancel,
}: ConfirmationModalProps) {
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
	const isProcessingRef = useRef(isProcessing);
	const onCancelRef = useRef(onCancel);

	useEffect(() => {
		isProcessingRef.current = isProcessing;
		onCancelRef.current = onCancel;
	});

	useEffect(() => {
		if (!isOpen) return;

		const dialog = dialogRef.current;
		if (!dialog) return;
		const activeDialog = dialog;

		previouslyFocusedElementRef.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;

		function getFocusableElements() {
			return Array.from(
				activeDialog.querySelectorAll<HTMLElement>(
					[
						"a[href]",
						"button:not([disabled])",
						"textarea:not([disabled])",
						"input:not([disabled])",
						"select:not([disabled])",
						"[tabindex]:not([tabindex='-1'])",
					].join(","),
				),
			).filter(
				(element) =>
					!element.hasAttribute("disabled") &&
					element.getAttribute("aria-hidden") !== "true" &&
					element.offsetParent !== null,
			);
		}

		function focusFirstElement() {
			const firstFocusableElement = getFocusableElements()[0];
			(firstFocusableElement || activeDialog).focus();
		}

		const focusTimer = window.setTimeout(focusFirstElement, 0);

		function handleFocusIn(event: FocusEvent) {
			if (
				event.target instanceof Node &&
				activeDialog.contains(event.target)
			) {
				return;
			}

			focusFirstElement();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape" && !isProcessingRef.current) {
				event.preventDefault();
				onCancelRef.current();
				return;
			}

			if (event.key !== "Tab") return;

			const focusableElements = getFocusableElements();

			if (focusableElements.length === 0) {
				event.preventDefault();
				activeDialog.focus();
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;

			if (event.shiftKey) {
				if (
					activeElement === firstElement ||
					!activeDialog.contains(activeElement)
				) {
					event.preventDefault();
					lastElement.focus();
				}

				return;
			}

			if (activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}

		document.addEventListener("focusin", handleFocusIn);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			window.clearTimeout(focusTimer);
			document.removeEventListener("focusin", handleFocusIn);
			document.removeEventListener("keydown", handleKeyDown);

			const previouslyFocusedElement =
				previouslyFocusedElementRef.current;
			if (
				previouslyFocusedElement &&
				document.contains(previouslyFocusedElement)
			) {
				previouslyFocusedElement.focus();
			}
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const isDanger = tone === "danger";

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/15 px-4 py-6 backdrop-blur-sm">
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirmation-modal-title"
				tabIndex={-1}
				className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
			>
				<div className="flex items-start gap-4">
					<div
						className={[
							"grid h-11 w-11 shrink-0 place-items-center rounded-full",
							isDanger
								? "bg-red-50 text-red-600 ring-1 ring-red-100"
								: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
						].join(" ")}
					>
						<AlertTriangle size={22} strokeWidth={2.4} />
					</div>

					<div className="min-w-0 flex-1">
						<h2
							id="confirmation-modal-title"
							className="text-lg font-black text-slate-950"
						>
							{title}
						</h2>
						<p className="mt-2 text-sm font-medium leading-6 text-slate-500">
							{description}
						</p>
					</div>

					<IconButton
						onClick={onCancel}
						disabled={isProcessing}
						label="Close confirmation"
						className="h-9 w-9 shrink-0"
					>
						<X size={18} strokeWidth={2.5} />
					</IconButton>
				</div>

				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button
						onClick={onCancel}
						disabled={isProcessing}
						variant="secondary"
					>
						{cancelLabel}
					</Button>

					<Button
						onClick={onConfirm}
						disabled={isProcessing}
						variant={isDanger ? "danger" : "primary"}
						className="cursor-pointer"
					>
						{isProcessing ? "Working..." : confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
