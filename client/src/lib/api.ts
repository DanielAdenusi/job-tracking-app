import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL;

type ApiFetchOptions = RequestInit & {
	requireAuth?: boolean;
};

async function getRequestHeaders(
	headers: HeadersInit | undefined,
	body: BodyInit | null | undefined,
	requireAuth: boolean,
	forceRefreshToken = false,
) {
	const requestHeaders = new Headers(headers);

	if (!(body instanceof FormData)) {
		requestHeaders.set("Content-Type", "application/json");
	}

	if (requireAuth) {
		const user = auth.currentUser;

		if (!user) {
			throw new Error("You must be logged in to perform this action.");
		}

		const token = await user.getIdToken(forceRefreshToken);

		requestHeaders.set("Authorization", `Bearer ${token}`);
	}

	return requestHeaders;
}

export async function apiFetch<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	const { requireAuth = true, headers, ...fetchOptions } = options;

	let response = await fetch(`${API_URL}${path}`, {
		...fetchOptions,
		headers: await getRequestHeaders(
			headers,
			fetchOptions.body,
			requireAuth,
		),
	});

	if (requireAuth && response.status === 401) {
		response = await fetch(`${API_URL}${path}`, {
			...fetchOptions,
			headers: await getRequestHeaders(
				headers,
				fetchOptions.body,
				requireAuth,
				true,
			),
		});
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		const authDetails = data?.authError
			? [
					data.authError.code,
					data.authError.message,
					data.authError.tokenProjectId
						? `token project: ${data.authError.tokenProjectId}`
						: null,
					data.authError.configuredProjectId
						? `server project: ${data.authError.configuredProjectId}`
						: null,
				]
					.filter(Boolean)
					.join(" | ")
			: null;

		const message = [
			data?.message || `Request failed with status ${response.status}`,
			authDetails,
		]
			.filter(Boolean)
			.join(": ");

		throw new Error(message);
	}

	return data as T;
}
