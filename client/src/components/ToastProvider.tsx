import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

type Toast = {
	id: number;
	message: string;
	tone: ToastTone;
	state: "visible" | "leaving";
};

type ToastContextValue = {
	showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const dismissToast = useCallback((id: number) => {
		setToasts((current) =>
			current.map((toast) =>
				toast.id === id ? { ...toast, state: "leaving" } : toast,
			),
		);

		window.setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 260);
	}, []);

	const showToast = useCallback(
		(message: string, tone: ToastTone = "info") => {
			const id = Date.now();

			setToasts((current) => [
				...current,
				{ id, message, tone, state: "visible" },
			]);
			window.setTimeout(() => {
				dismissToast(id);
			}, 3200);
		},
		[dismissToast],
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				aria-atomic="true"
				className="fixed left-6/12 -translate-x-6/12 top-4 z-80 grid w-[min(24rem,calc(100vw-2rem))] gap-3 max-md:w-[calc(100vw-2rem)]"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={[
							"relative flex items-center gap-2 overflow-hidden rounded-r-lg border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-800 shadow-lg shadow-slate-50/10",
							toast.state === "leaving"
								? "toast-exit"
								: "toast-enter",
						].join(" ")}
					>
						<span
							className={[
								"absolute left-0 top-0 h-full w-1 rounded-l-xl",
								toast.tone === "success"
									? "bg-emerald-500"
									: toast.tone === "error"
										? "bg-red-500"
										: "bg-slate-500",
							].join(" ")}
						/>

						<span
							className={[
								"rounded-full h-2 w-2 inline-block",
								toast.tone === "success"
									? "bg-emerald-500"
									: toast.tone === "error"
										? "bg-red-500"
										: "bg-slate-500",
							].join(" ")}
						/>

						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast must be used inside ToastProvider");
	}

	return context;
}
