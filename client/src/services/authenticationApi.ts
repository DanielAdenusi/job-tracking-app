import {
	confirmPasswordReset,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signInWithRedirect,
	signOut,
	onAuthStateChanged,
	verifyPasswordResetCode,
	type User,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

function isPopupBlockedError(error: unknown) {
	return (
		error instanceof Error &&
		"code" in error &&
		String(error.code) === "auth/popup-blocked"
	);
}

export async function loginWithGoogle() {
	try {
		const result = await signInWithPopup(auth, googleProvider);
		return result.user;
	} catch (error) {
		if (isPopupBlockedError(error)) {
			await signInWithRedirect(auth, googleProvider);
			return null;
		}

		throw error;
	}
}

export async function loginWithEmail(email: string, password: string) {
	const result = await signInWithEmailAndPassword(auth, email, password);
	return result.user;
}

export async function signUpWithGoogle() {
	try {
		const result = await signInWithPopup(auth, googleProvider);
		return result.user;
	} catch (error) {
		if (isPopupBlockedError(error)) {
			await signInWithRedirect(auth, googleProvider);
			return null;
		}

		throw error;
	}
}

export async function signUpWithEmail(email: string, password: string) {
	const result = await createUserWithEmailAndPassword(auth, email, password);
	return result.user;
}

export async function sendPasswordReset(email: string) {
	await sendPasswordResetEmail(auth, email, {
		url: `${window.location.origin}/reset-password`,
	});
}

export async function verifyResetPasswordCode(code: string) {
	return verifyPasswordResetCode(auth, code);
}

export async function confirmResetPassword(code: string, password: string) {
	await confirmPasswordReset(auth, code, password);
}

export async function logout() {
	await signOut(auth);
}

export function listenToAuthChanges(callback: (user: User | null) => void) {
	return onAuthStateChanged(auth, callback);
}
