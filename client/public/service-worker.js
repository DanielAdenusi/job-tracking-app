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

self.addEventListener("push", (event) => {
	const payload = event.data
		? event.data.json()
		: {
				title: "JobMarkr reminder",
				body: "You have an application reminder.",
			};
	const title = payload.title || "JobMarkr reminder";
	const options = {
		body: payload.body,
		icon: payload.icon || "/favicon/favicon-bg-192.png",
		badge: payload.badge || "/favicon/favicon-bg-192.png",
		tag: payload.tag,
		data: {
			url: payload.url || "/dashboard",
			...(payload.data || {}),
		},
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const targetUrl = new URL(
		event.notification.data?.url || "/dashboard",
		self.location.origin,
	).href;

	event.waitUntil(
		self.clients
			.matchAll({
				type: "window",
				includeUncontrolled: true,
			})
			.then((clients) => {
				for (const client of clients) {
					if ("focus" in client) {
						client.navigate(targetUrl);
						return client.focus();
					}
				}

				return self.clients.openWindow(targetUrl);
			}),
	);
});
