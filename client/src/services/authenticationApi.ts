import {
	confirmPasswordReset,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	getRedirectResult,
	onAuthStateChanged,
	verifyPasswordResetCode,
	type User,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

export async function loginWithGoogle() {
	const result = await signInWithPopup(auth, googleProvider);
	return result.user;
}

export async function completeGoogleRedirectLogin() {
	const result = await getRedirectResult(auth);
	return result?.user ?? null;
}

export async function loginWithEmail(email: string, password: string) {
	const result = await signInWithEmailAndPassword(auth, email, password);
	return result.user;
}

export async function signUpWithGoogle() {
	const result = await signInWithPopup(auth, googleProvider);
	return result.user;
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
