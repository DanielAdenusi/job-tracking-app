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

	const showToast = useCallback((message: string, tone: ToastTone = "info") => {
		const id = Date.now();

		setToasts((current) => [...current, { id, message, tone }]);
		window.setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 3200);
	}, []);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				aria-atomic="true"
				className="fixed right-4 top-4 z-[80] grid w-[min(24rem,calc(100vw-2rem))] gap-3"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={[
							"rounded-xl border bg-white px-4 py-3 text-sm font-bold shadow-lg shadow-slate-950/10",
							toast.tone === "success"
								? "border-emerald-200 text-emerald-700"
								: toast.tone === "error"
									? "border-red-200 text-red-700"
									: "border-slate-200 text-slate-700",
						].join(" ")}
					>
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
