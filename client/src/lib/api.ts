import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
	const user = auth.currentUser;

	if (!user) {
		throw new Error("You must be logged in");
	}

	const token = await user.getIdToken();

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => null);
		throw new Error(error?.message || "API request failed");
	}

	return response.json();
}
