import { useCallback, useEffect, useRef, useState } from "react";

export function useAnimatedDisclosure(animationMs = 220) {
	const [isOpen, setIsOpen] = useState(false);
	const [isRendered, setIsRendered] = useState(false);
	const closeTimerRef = useRef<number | null>(null);
	const openFrameRef = useRef<number | null>(null);

	const clearTimers = useCallback(() => {
		if (closeTimerRef.current !== null) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}

		if (openFrameRef.current !== null) {
			window.cancelAnimationFrame(openFrameRef.current);
			openFrameRef.current = null;
		}
	}, []);

	const open = useCallback(() => {
		clearTimers();
		setIsRendered(true);
		openFrameRef.current = window.requestAnimationFrame(() => {
			setIsOpen(true);
			openFrameRef.current = null;
		});
	}, [clearTimers]);

	const close = useCallback(() => {
		clearTimers();
		setIsOpen(false);
		closeTimerRef.current = window.setTimeout(() => {
			setIsRendered(false);
			closeTimerRef.current = null;
		}, animationMs);
	}, [animationMs, clearTimers]);

	useEffect(() => clearTimers, [clearTimers]);

	return {
		isOpen,
		isRendered,
		isClosing: isRendered && !isOpen,
		open,
		close,
	};
}
