const CACHE_NAME = "jobmarkr-shell-v2";
const APP_SHELL = [
	"/site.webmanifest",
	"/favicon/favicon-bg-192.png",
	"/favicon/favicon-bg-512.png",
	"/favicon/favicon-bg.ico",
	"/favicon/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(APP_SHELL))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => caches.delete(cacheName)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	const requestUrl = new URL(request.url);

	if (
		request.method !== "GET" ||
		!["http:", "https:"].includes(requestUrl.protocol) ||
		requestUrl.origin !== self.location.origin ||
		requestUrl.pathname.startsWith("/api")
	) {
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (!response || response.status !== 200) {
						return response;
					}

					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, responseToCache).catch(() => {
							// Some browser-generated requests cannot be cached.
						});
					});

					return response;
				})
				.catch(() => caches.match(request)),
		);
		return;
	}

	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;

			return fetch(request)
				.then((response) => {
					if (
						!response ||
						response.status !== 200 ||
						response.type === "opaque"
					) {
						return response;
					}

					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, responseToCache).catch(() => {
							// Some browser-generated requests cannot be cached.
						});
					});

					return response;
				})
				.catch(() => Response.error());
		}),
	);
});
