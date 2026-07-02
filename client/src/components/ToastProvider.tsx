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
};

type ToastContextValue = {
	showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback(
		(message: string, tone: ToastTone = "info") => {
			const id = Date.now();

			setToasts((current) => [...current, { id, message, tone }]);
			window.setTimeout(() => {
				setToasts((current) =>
					current.filter((toast) => toast.id !== id),
				);
			}, 3200);
		},
		[],
	);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				aria-atomic="true"
				className="fixed right-4 top-4 z-80 grid w-[min(24rem,calc(100vw-2rem))] gap-3"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={[
							"toast-enter relative flex items-center gap-2 overflow-hidden rounded-r-lg border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-800 shadow-lg shadow-slate-50/10",
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
