import {
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	type User,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

export async function loginWithGoogle() {
	const result = await signInWithPopup(auth, googleProvider);
	return result.user;
}

export async function signUpWithGoogle() {
	const result = await signInWithPopup(auth, googleProvider);
	return result.user;
}

export async function logout() {
	await signOut(auth);
}

export function listenToAuthChanges(callback: (user: User | null) => void) {
	return onAuthStateChanged(auth, callback);
}
